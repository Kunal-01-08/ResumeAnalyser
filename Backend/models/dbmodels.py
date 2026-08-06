from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from database.database import Base

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True)

    hashed_password = Column(String)


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
