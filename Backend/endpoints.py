import asyncio
from contextlib import asynccontextmanager, suppress
from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
import pdfplumber
import io
from services.services import sectionTagger, getSections, getContext, chain, chain2, chain3, chain4, chain5, chain6
from dotenv import load_dotenv
from models.responseSchema import ResponseSchema
from models.comparisonResponseSchema import ComparisonResponseSchema
from models.resumeOutlineSchema import OutlineSchema
from models.githubAnalysisSchema import GithubResponseSchema
from models.combinedAnalysisSchema import CombinedResponseSchema
from services.services import chunkDocument
from services.authservices import (
    create_access_token,
    create_password_reset_token,
    get_current_user,
    hash_password,
    hash_password_reset_token,
    normalize_and_validate_email,
    validate_password,
    verify_password,
)
from services.emailservices import (
    email_is_configured,
    send_email_verification_email,
    send_password_reset_email,
)
from langchain_classic.vectorstores import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings
from database.database import engine, Base, SessionLocal, get_db
from models.dbmodels import AccountToken, RagSession, User
from sqlalchemy.orm import Session
import base64
import requests
import os
load_dotenv()

Base.metadata.create_all(bind=engine)

CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")


def positive_integer_setting(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
        return value if value > 0 else default
    except ValueError:
        return default


# Production defaults: expire inactive context after 30 minutes and clean it every 5 minutes.
RAG_SESSION_TTL_SECONDS = positive_integer_setting("RAG_SESSION_TTL_SECONDS", 1800)
RAG_CLEANUP_INTERVAL_SECONDS = positive_integer_setting("RAG_CLEANUP_INTERVAL_SECONDS", 300)
# Expired password-reset and verification tokens do not need to be retained.
TOKEN_CLEANUP_INTERVAL_SECONDS = positive_integer_setting(
    "TOKEN_CLEANUP_INTERVAL_SECONDS", 86400
)
PASSWORD_RESET_TOKEN_TTL_MINUTES = positive_integer_setting(
    "PASSWORD_RESET_TOKEN_TTL_MINUTES", 15
)
PASSWORD_RESET_URL = os.getenv(
    "PASSWORD_RESET_URL", "http://localhost:5173/reset-password"
)
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = positive_integer_setting(
    "EMAIL_VERIFICATION_TOKEN_TTL_MINUTES", 15
)
EMAIL_VERIFICATION_URL = os.getenv(
    "EMAIL_VERIFICATION_URL", "http://localhost:5173/verify-email"
)


def create_email_verification_token(user_id: int, db: Session) -> str:
    """Replace outstanding verification links and return a new raw token."""
    raw_token = create_password_reset_token()
    db.query(AccountToken).filter(
        AccountToken.user_id == user_id,
        AccountToken.purpose == "email_verification",
        AccountToken.used_at.is_(None),
    ).delete(synchronize_session=False)
    db.add(AccountToken(
        user_id=user_id,
        token_hash=hash_password_reset_token(raw_token),
        purpose="email_verification",
        expires_at=datetime.utcnow() + timedelta(
            minutes=EMAIL_VERIFICATION_TOKEN_TTL_MINUTES
        ),
    ))
    return raw_token


def rag_collection_name(user_id: int) -> str:
    """Keep one replaceable RAG collection per user."""
    return f"user_{user_id}"


def rag_session_expired(session: RagSession) -> bool:
    cutoff = datetime.utcnow() - timedelta(seconds=RAG_SESSION_TTL_SECONDS)
    return session.last_accessed_at < cutoff


def delete_rag_collection(collection_name: str) -> None:
    """Delete an expired/replaced collection without loading the embedding model."""
    store = Chroma(
        collection_name=collection_name,
        persist_directory=CHROMA_PERSIST_DIRECTORY,
    )
    store.delete_collection()


def remove_rag_session(session: RagSession, db: Session) -> None:
    """Only remove metadata after the vector collection has been removed."""
    delete_rag_collection(session.collection_name)
    db.delete(session)
    db.commit()


def cleanup_expired_rag_sessions() -> None:
    """Purge inactive RAG collections; failures are retained for a later retry."""
    db = SessionLocal()
    try:
        sessions = db.query(RagSession).all()
        for session in sessions:
            if not rag_session_expired(session):
                continue
            try:
                remove_rag_session(session, db)
            except Exception as error:
                db.rollback()
                print(f"Unable to remove expired RAG collection {session.collection_name}: {error}")
    finally:
        db.close()


def cleanup_expired_account_tokens() -> None:
    """Remove expired password-reset and email-verification tokens."""
    db = SessionLocal()
    try:
        deleted_count = db.query(AccountToken).filter(
            AccountToken.expires_at < datetime.utcnow()
        ).delete(synchronize_session=False)
        db.commit()
        if deleted_count:
            print(f"Removed {deleted_count} expired account token(s).")
    except Exception as error:
        db.rollback()
        print(f"Unable to remove expired account tokens: {error}")
    finally:
        db.close()


async def rag_cleanup_worker() -> None:
    while True:
        cleanup_expired_rag_sessions()
        await asyncio.sleep(RAG_CLEANUP_INTERVAL_SECONDS)


async def token_cleanup_worker() -> None:
    while True:
        await asyncio.sleep(TOKEN_CLEANUP_INTERVAL_SECONDS)
        cleanup_expired_account_tokens()


@asynccontextmanager
async def lifespan(_: FastAPI):
    cleanup_expired_rag_sessions()
    cleanup_expired_account_tokens()
    rag_cleanup_task = asyncio.create_task(rag_cleanup_worker())
    token_cleanup_task = asyncio.create_task(token_cleanup_worker())
    try:
        yield
    finally:
        for task in (rag_cleanup_task, token_cleanup_task):
            task.cancel()
        for task in (rag_cleanup_task, token_cleanup_task):
            with suppress(asyncio.CancelledError):
                await task

githubToken = os.getenv("GITHUB_TOKEN")

app=FastAPI(lifespan=lifespan)

# CORS origins must not include a trailing slash. Keep local development
# origins and add any deployed frontend URLs configured in the environment.
frontend_urls = list(
    dict.fromkeys(
        origin.strip().rstrip("/")
        for origin in [
            "http://localhost:5173",
            "http://localhost:3000",
            *os.getenv("FRONTEND_URLS", "").split(","),
        ]
        if origin.strip()
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("CORS ALLOWED ORIGINS:", frontend_urls)
print("A. endpoints.py loaded")


@app.get("/health")
def health_check():
    return {"status": "ok"}

embeddings=None
def getembeddings():
    global embeddings

    if embeddings is None:
        print("B. loading embeddings")

        embeddings = FastEmbedEmbeddings()


        print("C. embeddings loaded")

    return embeddings
async def extract_resume(file: UploadFile):
    content = await file.read()

    with pdfplumber.open(io.BytesIO(content)) as pdf:
        resume = "\n".join(
            [page.extract_text() or "" for page in pdf.pages]
        ).strip()

    return resume

@app.post("/signup")
async def signup(email:str=Form(...),password:str=Form(...),db: Session = Depends(get_db)):
    try:
        email = normalize_and_validate_email(email)
        validate_password(password)
        if not email_is_configured():
            raise HTTPException(
                status_code=503,
                detail="Account verification email is temporarily unavailable.",
            )
        existing_user=db.query(User).filter(User.email==email).first()  
        if(existing_user):
            raise HTTPException(
                status_code=400,
                detail="User already exists, try logging in..."
            )  
        

        hshpswd=hash_password(password)
        new_user = User(
            email=email,
            hashed_password=hshpswd,
            email_verified=False,
        )
        db.add(new_user)
        db.flush()

        raw_token = create_email_verification_token(new_user.id, db)

        try:
            verification_url = f"{EMAIL_VERIFICATION_URL}?token={raw_token}"
            send_email_verification_email(new_user.email, verification_url)
            db.commit()
        except Exception as error:
            db.rollback()
            raise HTTPException(
                status_code=503,
                detail="Account verification email is temporarily unavailable.",
            ) from error

        return {"message":"Account created. Verify your email before logging in."}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )
  
@app.post("/login")
def login(email:str=Form(...),password:str=Form(...),db:Session=Depends(get_db)):
    try:
        email = normalize_and_validate_email(email)
        existing_user=db.query(User).filter(User.email==email).first()  
        if(not existing_user):
            raise HTTPException(
                status_code=404,
                detail="User does not exist, create user first..."
            )  
        

        valid_pswrd=verify_password(password,existing_user.hashed_password)
        if(not valid_pswrd):
            raise HTTPException(
            status_code=401,
            detail="Incorrect password"
        )

        if not existing_user.email_verified:
            raise HTTPException(
                status_code=403,
                detail="Verify your email before logging in.",
            )
        
        token=create_access_token({"sub":existing_user.email})

        return {
            "message":"User logged in successfully...",
            "access_token":token,
            "token_type":"bearer"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )


@app.post("/verify-email")
def verify_email(token: str = Form(...), db: Session = Depends(get_db)):
    verification_token = db.query(AccountToken).filter(
        AccountToken.token_hash == hash_password_reset_token(token),
        AccountToken.purpose == "email_verification",
        AccountToken.used_at.is_(None),
        AccountToken.expires_at > datetime.utcnow(),
    ).first()

    if not verification_token:
        raise HTTPException(
            status_code=400,
            detail="This email verification link is invalid or has expired.",
        )

    user = db.query(User).filter(User.id == verification_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=400,
            detail="This email verification link is invalid or has expired.",
        )

    try:
        user.email_verified = True
        verification_token.used_at = datetime.utcnow()
        db.query(AccountToken).filter(
            AccountToken.user_id == user.id,
            AccountToken.purpose == "email_verification",
            AccountToken.id != verification_token.id,
        ).delete(synchronize_session=False)
        db.commit()
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to verify email.") from error

    return {"message": "Email verified. You can now log in."}


@app.post("/resend-verification")
def resend_verification(email: str = Form(...), db: Session = Depends(get_db)):
    try:
        email = normalize_and_validate_email(email)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    if not email_is_configured():
        raise HTTPException(
            status_code=503,
            detail="Account verification email is temporarily unavailable.",
        )

    user = db.query(User).filter(User.email == email).first()
    if user and not user.email_verified:
        try:
            raw_token = create_email_verification_token(user.id, db)
            verification_url = f"{EMAIL_VERIFICATION_URL}?token={raw_token}"
            send_email_verification_email(user.email, verification_url)
            db.commit()
        except Exception as error:
            db.rollback()
            raise HTTPException(
                status_code=503,
                detail="Account verification email is temporarily unavailable.",
            ) from error

    return {
        "message": "If an unverified account exists for this email, a verification link has been sent."
    }

@app.post("/forgot-password")
def forgot_password(email: str = Form(...), db: Session = Depends(get_db)):
    """Issue a one-time reset link without exposing whether an email exists."""
    try:
        email = normalize_and_validate_email(email)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    if not email_is_configured():
        raise HTTPException(
            status_code=503,
            detail="Password reset email is temporarily unavailable.",
        )

    user = db.query(User).filter(User.email == email).first()
    if user:
        raw_token = create_password_reset_token()
        reset_token = AccountToken(
            user_id=user.id,
            token_hash=hash_password_reset_token(raw_token),
            purpose="password_reset",
            expires_at=datetime.utcnow() + timedelta(
                minutes=PASSWORD_RESET_TOKEN_TTL_MINUTES
            ),
        )

        try:
            # Only the newest reset link remains valid for this account.
            db.query(AccountToken).filter(
                AccountToken.user_id == user.id,
                AccountToken.purpose == "password_reset",
                AccountToken.used_at.is_(None),
            ).delete(synchronize_session=False)
            db.add(reset_token)
            db.commit()
            send_password_reset_email(user.email, f"{PASSWORD_RESET_URL}?token={raw_token}")
        except Exception:
            db.rollback()
            db.query(AccountToken).filter(
                AccountToken.token_hash == reset_token.token_hash,
                AccountToken.purpose == "password_reset",
            ).delete(synchronize_session=False)
            db.commit()
            raise HTTPException(
                status_code=503,
                detail="Password reset email is temporarily unavailable.",
            )

    return {
        "message": "If an account exists for this email, a password reset link has been sent."
    }


@app.post("/reset-password")
def reset_password(
    token: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        validate_password(password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    reset_token = db.query(AccountToken).filter(
        AccountToken.token_hash == hash_password_reset_token(token),
        AccountToken.purpose == "password_reset",
        AccountToken.used_at.is_(None),
        AccountToken.expires_at > datetime.utcnow(),
    ).first()

    if not reset_token:
        raise HTTPException(
            status_code=400,
            detail="This password reset link is invalid or has expired.",
        )

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=400,
            detail="This password reset link is invalid or has expired.",
        )

    try:
        user.hashed_password = hash_password(password)
        reset_token.used_at = datetime.utcnow()
        db.query(AccountToken).filter(
            AccountToken.user_id == user.id,
            AccountToken.purpose == "password_reset",
            AccountToken.id != reset_token.id,
        ).delete(synchronize_session=False)
        db.commit()
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to reset password.") from error

    return {"message": "Password reset successfully. You can now log in."}


@app.post("/resume/analyse")
async def resumeAnalysis(file:UploadFile=File(...), user= Depends(get_current_user)):
    try:
        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=415,
                detail="Only pdf files are allowed"
            )
        resume=await extract_resume(file)
        if not resume:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded"
            )
        try:
            response=await chain.ainvoke({"resume":resume})
        except:
            response=await chain.ainvoke({"resume":resume})

        return {
            "Response":response,
            "Resume":resume
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )

@app.post("/resume/query",response_model=ResponseSchema)
async def queryResponse(query:str=Form(...),resume:str=Form(...), user= Depends(get_current_user)):
    try:
        if not query.strip():
            raise HTTPException(
                status_code=400,
                detail="Query can not be empty"
            )
        sections=sectionTagger(resume)
        contextSections=getSections(query)
        context=getContext(contextSections,sections)
        if not context or not context.strip():
            context=resume
        try:
            response=await chain2.ainvoke({"prompt":query,"context":context})
        except:
            response=await chain2.ainvoke({"prompt":query,"context":context})

        return response
    except HTTPException as e:
        raise e
        
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )

@app.post("/resume/compare",response_model=ComparisonResponseSchema)
async def comparisonResponse(file1:UploadFile=File(...),file2:UploadFile=File(...), user= Depends(get_current_user)):
    try:
        if file1.content_type != "application/pdf" or file2.content_type!="application/pdf" :
                return {"error": "Only PDF files allowed"}
        resume1=await extract_resume(file1)
        if not resume1:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded"
            )
        resume2=await extract_resume(file2)
        if not resume2:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded"
            )
        if resume1.strip()==resume2.strip():
            raise HTTPException(
                status_code=400,
                detail="Identical resumes uploaded"
            )
        try:
            response=await chain3.ainvoke({"resume1":resume1,"resume2":resume2})
        except:
            response=await chain3.ainvoke({"resume1":resume1,"resume2":resume2})

        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )
    
@app.post("/resume/outline",response_model=OutlineSchema)
async def giveOutline(
    role: str = Form(...),
    experience: str = Form(...),
    targetCompany: str = Form(""),
    employmentType: str = Form(""),
    preferredTechStack: str = Form(""),
    country: str = Form(""),
    misc: str = Form(""),
    jd: str = Form(""), user= Depends(get_current_user)
):
    try:
        try:
            response = await chain4.ainvoke({
            "role": role,
            "experience": experience,
            "targetCompany": targetCompany,
            "employmentType": employmentType,
            "preferredTechStack": preferredTechStack,
            "country": country,
            "misc": misc,
            "jd": jd
        })
        except:
            response = await chain4.ainvoke({
            "role": role,
            "experience": experience,
            "targetCompany": targetCompany,
            "employmentType": employmentType,
            "preferredTechStack": preferredTechStack,
            "country": country,
            "misc": misc,
            "jd": jd
        })

        return response
    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )
    
@app.post("/github/analyse", response_model=GithubResponseSchema)
async def githubAnalysis(githubUrl:str=Form(...), user= Depends(get_current_user)):
    try:
        headers = {
    "Authorization": f"Bearer {githubToken}",
    "Accept": "application/vnd.github+json"
}
        username = githubUrl.rstrip("/").split("/")[-1].split("?")[0]
        url = f"https://api.github.com/users/{username}/repos"
        user_url = f"https://api.github.com/users/{username}"

        user_response = requests.get(user_url,headers=headers)

        if user_response.status_code != 200:
                raise HTTPException(
                status_code=user_response.status_code,
                detail=user_response.json()["message"]
                )

        user_data = user_response.json()
        response_api = requests.get(url,headers=headers)

        if response_api.status_code != 200:
                raise HTTPException(
                    status_code=response_api.status_code,
                    detail=response_api.json()["message"]
                )

        repos = response_api.json()
        repos = [repo for repo in repos if not repo["fork"]]
        repos.sort(
        key=lambda x: x["stargazers_count"],
        reverse=True
        )
        repos_summary=[]
        for repo in repos[:10]:
            summary = f"""
            Repository: {repo["name"]}
            Description: {repo["description"] or "No description provided"}
            Primary Language: {repo["language"] or "Not specified"}
            Stars: {repo["stargazers_count"]}
            """
            repos_summary.append(summary)
        repos_summary = "\n\n".join(repos_summary)
        try:
            llm_response=await chain5.ainvoke({"repos_summary":repos_summary})
        except:
            llm_response=await chain5.ainvoke({"repos_summary":repos_summary})

        res={
            "profile": {
                "name": user_data["name"] ,
                "avatar": user_data["avatar_url"],
                "followers": user_data["followers"],
                "publicRepos": user_data["public_repos"],
                "bio": user_data["bio"]
            },
            "analysis": llm_response
        }
        return res 
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )
    
@app.post("/combined/analysis", response_model=CombinedResponseSchema)
async def combinedAnalysis(
    file: UploadFile = File(...),
    githubUrl: str = Form(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
        try:
            global embeddings
            headers = {
    "Authorization": f"Bearer {githubToken}",
    "Accept": "application/vnd.github+json"
}
            if file.content_type != "application/pdf":
                raise HTTPException(
                    status_code=415,
                    detail="Only pdf files are allowed"
                )
            resume=await extract_resume(file)
            if not resume:
                raise HTTPException(
                    status_code=400,
                    detail="Empty file uploaded"
                )
            resume_doc=chunkDocument(resume,source="resume")
            username = githubUrl.rstrip("/").split("/")[-1].split("?")[0]
            url = f"https://api.github.com/users/{username}/repos"
            user_url = f"https://api.github.com/users/{username}"

            user_response = requests.get(user_url,headers=headers)

            if user_response.status_code != 200:
                raise HTTPException(
                status_code=user_response.status_code,
                detail=user_response.json()["message"]
                )

            user_data = user_response.json()
            response_api = requests.get(url,headers=headers)

            if response_api.status_code != 200:
                raise HTTPException(
                    status_code=response_api.status_code,
                    detail=response_api.json()["message"]
                )

            repos = response_api.json()
            repos = [repo for repo in repos if not repo["fork"]]
            repos.sort(
            key=lambda x: x["stargazers_count"],
            reverse=True
            )
            repos_summary=[]
            github_doc=[]
            for repo in repos[:10]:
                readme_url = f"https://api.github.com/repos/{username}/{repo['name']}/readme"
                readme_response = requests.get(readme_url,headers=headers)
                readme_content = ""

                if readme_response.status_code == 200:

                    readme_json = readme_response.json()

                    encoded_content = readme_json["content"]

                    readme_content = base64.b64decode(
                        encoded_content
                    ).decode("utf-8")
              
                summary = f"""
                Repository: {repo["name"]}
                Description: {repo["description"] or "No description provided"}
                Primary Language: {repo["language"] or "Not specified"}
                Stars: {repo["stargazers_count"]}
                """

                repos_summary.append(summary)

                expanded_summary = f"""
Repository: {repo["name"]}

Description:
{repo["description"] or "No description provided"}

Primary Language:
{repo["language"] or "Not specified"}

Stars:
{repo["stargazers_count"]}

README:
{readme_content[:3000]}
"""
                github_doc.extend(chunkDocument(expanded_summary,source="github",name=repo["name"]))
            repos_summary = "\n\n".join(repos_summary)

            combined_context=f"""
***Resume***
{resume}
***Github***
{repos_summary}

"""
            
            if(embeddings is None):
                getembeddings()
            documents = resume_doc + github_doc

            print("D: creating chroma")
            collection_name = rag_collection_name(user.id)
            previous_session = db.query(RagSession).filter(
                RagSession.user_id == user.id
            ).first()

            # A new analysis deliberately replaces the user's previous context.
            if previous_session:
                remove_rag_session(previous_session, db)
            else:
                # Remove a collection created by versions deployed before RAG
                # session metadata was introduced.
                try:
                    delete_rag_collection(collection_name)
                except Exception:
                    pass

            vectorstore = Chroma(
                collection_name=collection_name,
                persist_directory=CHROMA_PERSIST_DIRECTORY,
                embedding_function=embeddings,
            )

            try:
                vectorstore.add_documents(documents)
                now = datetime.utcnow()
                db.add(RagSession(
                    user_id=user.id,
                    collection_name=collection_name,
                    created_at=now,
                    last_accessed_at=now,
                ))
                db.commit()
            except Exception:
                db.rollback()
                try:
                    delete_rag_collection(collection_name)
                except Exception as cleanup_error:
                    print(f"Unable to remove incomplete RAG collection {collection_name}: {cleanup_error}")
                raise
            
            
            try:
                llm_response = await chain6.ainvoke({
                         "combined_context": combined_context
            })
            except:
                llm_response = await chain6.ainvoke({
                         "combined_context": combined_context
            })

            return {
    "profile": {
        "name": user_data["name"],
        "avatar": user_data["avatar_url"],
        "followers": user_data["followers"],
        "publicRepos": user_data["public_repos"],
        "bio": user_data["bio"]
    },
    "analysis": llm_response
}

        except HTTPException as e:
            raise e

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )

@app.post("/combined/query", response_model=ResponseSchema)
async def combinedQueryResponse(
    query: str = Form(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query can not be empty")

        session = db.query(RagSession).filter(
            RagSession.user_id == user.id
        ).first()
        if not session:
            raise HTTPException(
                status_code=404,
                detail="No active analysis found. Upload a resume and GitHub profile first.",
            )

        if rag_session_expired(session):
            remove_rag_session(session, db)
            raise HTTPException(
                status_code=410,
                detail="Your analysis expired after inactivity. Upload a resume and GitHub profile again.",
            )

        # This is a sliding expiry: active conversations keep their context.
        session.last_accessed_at = datetime.utcnow()
        db.commit()

        if embeddings is None:
            getembeddings()

        vectorstore = Chroma(
            collection_name=session.collection_name,
            persist_directory=CHROMA_PERSIST_DIRECTORY,
            embedding_function=embeddings,
        )

        retriever = vectorstore.as_retriever()
        docs = retriever.invoke(query)
        if not docs:
            raise HTTPException(
            status_code=400,
            detail="No analysis data available"
            )
        context = "\n\n".join([
    f"""
SOURCE: {doc.metadata.get("source")}

NAME: {doc.metadata.get("name")}

CONTENT:
{doc.page_content}
"""
    for doc in docs
])
        try:
            response=await chain2.ainvoke({"prompt":query,"context":context})
        except:
            response=await chain2.ainvoke({"prompt":query,"context":context})

        return response
        
    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )
    
