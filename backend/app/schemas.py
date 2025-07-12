from pydantic import BaseModel, EmailStr
from datetime import datetime

class ViolationOut(BaseModel):
    label: str
    confidence: float
    timestamp: datetime
    person_id: str
    image_id: str
    user_id: str

    class Config:
        from_attributes = True  # For Pydantic v2, replaces orm_mode

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr    
    role: str = "user"  # default role

class UserOut(BaseModel):
    id: str
    username: str
    role: str
    email: EmailStr 

    class Config:
        orm_mode = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str