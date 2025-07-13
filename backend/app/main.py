from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from app import detect, crud, schemas
from app.auth import get_current_active_user, get_current_admin, authenticate_user, create_access_token
from app.database import SessionLocal, engine
import cv2
import base64
import uuid
import os
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from app import models
import shutil
from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import csv
from io import StringIO
from app.database import Base, engine

#Create tables
Base.metadata.create_all(bind=engine)

#safely create the fixed admin
crud.create_fixed_admin_if_not_exists(SessionLocal())


api = FastAPI()

#origins=["http://localhost:3000",
 #   "http://127.0.0.1:3000"]
origins=["*"]
api.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@api.post("/detect/")
async def detect_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    image_id = str(uuid.uuid4())
    file_path = os.path.join(upload_dir, f"{image_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Read image for detection
    frame = cv2.imread(file_path)
    annotated, violations = detect._detect_logic(frame)

    if violations:
        for v in violations:
            v.setdefault("timestamp", datetime.utcnow())
            v.setdefault("image_id", image_id)
            crud.create_violation(db, v, current_user.id)
    else:
        # Save "GoodToGo" if no violations
        crud.create_violation(db, {
            "label": "GoodToGo",
            "confidence": 1.0,
            "timestamp": datetime(),
            "person_id": "N/A",
            "image_id": image_id,
            
        }, current_user.id)

    # Encode annotated image to base64 for frontend
    _, buffer = cv2.imencode('.jpg', annotated)
    annotated_image_base64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "annotated_image_base64": annotated_image_base64,
        "violations": violations
    }

# --- ADMIN ENDPOINTS ---


@api.get("/admin/users")
def list_users(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    return crud.get_all_users(db)

@api.delete("/admin/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    crud.delete_user(db, user_id)
    return {"detail": "User deleted"}

@api.put("/admin/users/{user_id}/role")
def update_user_role(
    user_id: str,
    new_role: str,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    user = crud.update_user_role(db, user_id, new_role)
    db.commit()  # <-- Make sure to commit the transaction!
    return {"detail": "Role updated", "user": user.username if user else None}

# For admin: get violations for any user
@api.get("/admin/violations/{user_id}", response_model=list[schemas.ViolationOut])
def get_user_violations_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    return crud.get_violations_by_user(db, user_id)

@api.get("/admin/summary")
def admin_summary(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    users = crud.get_all_users(db)
    summary = []
    for user in users:
        violations = crud.get_violations_by_user(db, user.id)
        good_count = sum(1 for v in violations if v.label == "GoodToGo")
        violation_count = sum(1 for v in violations if v.label != "GoodToGo")
        summary.append({
            "id": user.id,                
            "username": user.username,
            "role": user.role,  
            "email": user.email,         
            "good_count": good_count,
            "violation_count": violation_count
        })
    return summary

@api.get("/admin/export")
def export_user_summary(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    users = crud.get_all_users(db)
    output = StringIO()
    writer = csv.writer(output)

    # CSV Header
    writer.writerow(["Username", "Email", "Role", "Good Count", "Violation Count"])

    for user in users:
        if user.role != "admin":  # ✅ Skip admin users
            violations = crud.get_violations_by_user(db, user.id)
            good_count = sum(1 for v in violations if v.label == "GoodToGo")
            violation_count = sum(1 for v in violations if v.label != "GoodToGo")
            writer.writerow([user.username, user.email, user.role, good_count, violation_count])

    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=user_ppe_summary.csv"
    })

@api.get("/user/dashboard")
def user_dashboard(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.get_violations_by_user(db, current_user.id)

@api.post("/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot sign up as admin")
    db_user = crud.create_user(db, user.dict())
    return {"detail": "User created successfully", "user": db_user.username}

@api.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username/email or password")
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role  
    }

# For user: get their own violations
@api.get("/user/violations", response_model=list[schemas.ViolationOut])
def get_user_violations(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.get_violations_by_user(db, current_user.id)

@api.get("/user/me")
def get_current_user_details(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_username(db, current_user.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": user.username,
        "email": user.email,
        "role": user.role
    }