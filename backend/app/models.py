from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)  # UUID string
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="user")  # Default role is 'user'
    violations = relationship("Violation", back_populates="user")

class Violation(Base):
    __tablename__ = "violations"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    label = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    person_id = Column(String, nullable=False)
    image_id = Column(String, nullable=False)
    user_id = Column(String, ForeignKey("users.id"))
    user = relationship("User", back_populates="violations")
