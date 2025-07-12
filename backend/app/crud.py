
from sqlalchemy.orm import Session
from app import models
from app.security import pwd_context
import uuid
from datetime import datetime

# User CRUD
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: dict):
    db_user = models.User(
        id=str(uuid.uuid4()),
        username=user['username'],
        email=user['email'],
        hashed_password=pwd_context.hash(user['password']),
        role=user.get('role', 'user'),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session):
    return db.query(models.User).all()

def delete_user(db: Session, user_id: str):
    db.query(models.User).filter(models.User.id == user_id).delete()
    db.commit()

def update_user_role(db: Session, user_id: str, new_role: str):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.role = new_role
        db.commit()
        db.refresh(user)
    return user

# Violation CRUD
def create_violation(db: Session, violation: dict, user_id: str):
    db_violation = models.Violation(
        id=str(uuid.uuid4()),
        label=violation['label'],
        confidence=float(violation['confidence']),
        timestamp=violation.get('timestamp') or datetime.utcnow(),
        person_id=violation['person_id'],
        image_id=violation['image_id'],
        user_id=user_id
    )
    db.add(db_violation)
    db.commit()
    db.refresh(db_violation)
    return db_violation

def get_violations_by_user(db: Session, user_id: str):
    return (
        db.query(models.Violation)
        .filter(models.Violation.user_id == user_id)
        .order_by(models.Violation.timestamp.desc())
        .all()
    )

def create_fixed_admin_if_not_exists(db: Session):
    fixed_admin_username = "admin"
    fixed_admin_password = "adminpassword"
    fixed_admin_email = "admin@example.com"

    existing_admin = db.query(models.User).filter(models.User.username == fixed_admin_username).first()
    if not existing_admin:
        db_admin = models.User(
            id=str(uuid.uuid4()),
            username=fixed_admin_username,
            email=fixed_admin_email,
            hashed_password=pwd_context.hash(fixed_admin_password),
            role="admin"
        )
        db.add(db_admin)
        db.commit()
        db.refresh(db_admin)

