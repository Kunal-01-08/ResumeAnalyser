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
from services.authservices import hash_password, verify_password, create_access_token, get_current_user
from langchain_classic.vectorstores import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings
from database.database import engine, Base, get_db
from models.dbmodels import User
from sqlalchemy.orm import Session
import base64
import requests
import os
load_dotenv()

Base.metadata.create_all(bind=engine)

frontend_urls = [
    "http://localhost:5173",
    "http://localhost:3000",
    *[
        url.strip()
        for url in os.getenv("FRONTEND_URLS", "").split(",")
        if url.strip()
    ]
]

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("CORS ALLOWED ORIGINS:", frontend_urls)
print("A. endpoints.py loaded")

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
        existing_user=db.query(User).filter(User.email==email).first()  
        if(existing_user):
            raise HTTPException(
                status_code=400,
                detail="User already exists, try logging in..."
            )  
        

        hshpswd=hash_password(password)
        new_user = User(
        email=email,
        hashed_password=hshpswd
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return{"message":"User added successfully, you can login now..."}
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
        
        token=create_access_token({"sub":existing_user.email})

        return {
            "message":"User logged in successfully...",
            "access_token":token,
            "token_type":"bearer"
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
                status_code=500,
                detail=str(e)
            )

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
        username = githubUrl.rstrip("/").split("/")[-1].split("?")[0]
        url = f"https://api.github.com/users/{username}/repos"
        user_url = f"https://api.github.com/users/{username}"

        user_response = requests.get(user_url)

        if user_response.status_code != 200:
            raise HTTPException(
            status_code=404,
            detail="Invalid GitHub profile"
            )

        user_data = user_response.json()
        response_api = requests.get(url)

        if response_api.status_code != 200:
            raise HTTPException(
                status_code=404,
                detail="Invalid github profile"
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
async def combinedAnalysis(file:UploadFile=File(...), githubUrl:str=Form(...), user= Depends(get_current_user)):
        try:
            global embeddings
             
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

            user_response = requests.get(user_url)

            if user_response.status_code != 200:
                raise HTTPException(
                status_code=user_response.status_code,
                detail=user_response.json()["message"]
                )

            user_data = user_response.json()
            response_api = requests.get(url)

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
                readme_response = requests.get(readme_url)
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
            try:

                old_store = Chroma(
        collection_name=f"user_{user.id}",
        persist_directory="./chroma_db",
        embedding_function=embeddings
    )

                old_store.delete_collection()

            except:
                pass


            vectorstore = Chroma(
    collection_name=f"user_{user.id}",
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

            vectorstore.add_documents(documents)
            
            
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
async def combinedQueryResponse(query:str=Form(...), user= Depends(get_current_user)):
    try:
        vectorstore = Chroma(
        collection_name=f"user_{user.id}",
        persist_directory="./chroma_db",
        embedding_function=embeddings
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
    
