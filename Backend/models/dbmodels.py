from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from database.database import Base

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True)

    hashed_password = Column(String)
    email_verified = Column(Boolean, default=False, nullable=False)


class RagSession(Base):
    """Metadata for a user's latest, short-lived RAG collection.

    Resume and repository text are stored only in Chroma. This table keeps
    enough metadata to expire that collection after a period of inactivity.
    """

    __tablename__ = "rag_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True, nullable=False)
    collection_name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_accessed_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AccountToken(Base):
    """One-time account token metadata; raw tokens are never stored."""

    __tablename__ = "account_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    purpose = Column(String, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
