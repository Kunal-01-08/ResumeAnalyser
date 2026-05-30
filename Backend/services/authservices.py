from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import os
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
from database.database import get_db
from models.dbmodels import User
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = "HS256"


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password:str):

    return pwd_context.hash(password)

def verify_password(
    plain_password,
    hashed_password
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )

def create_access_token(data:dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(days=1)

    to_encode.update({"exp": expire})
    print(SECRET_KEY)
    print(type(SECRET_KEY))
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid authentication credentials"
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        raise credentials_exception

    return user