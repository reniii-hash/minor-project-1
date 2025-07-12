from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.security import pwd_context

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import crud
from app.database import SessionLocal

SECRET_KEY = "your-very-secret-key"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    print("Verifying:", plain_password, hashed_password)
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"Password verify result: {result}")
        return result
    except Exception as e:
        print(f"Password verify error: {e}")
        return False

def authenticate_user(db: Session, identifier: str, password: str):
    identifier = identifier.strip()
    # Try by username
    user = crud.get_user_by_username(db, identifier)
    if not user:
        # Try by email
        user = crud.get_user_by_email(db, identifier)
        if not user:
            print(f"User '{identifier}' not found.")
            return None
    print(f"Found user: {user.username}, verifying password...")
    if not verify_password(password, user.hashed_password):
        print("Password does not match.")
        return None
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user=Depends(get_current_user)):
    # You can add extra checks like is_active here if needed
    return current_user

async def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user