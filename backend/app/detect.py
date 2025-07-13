from ultralytics import YOLO
import cv2
import uuid
import time
from app.database import SessionLocal
from app import crud
from datetime import datetime

# Load your trained YOLO model
model = YOLO('C:\\Users\\ACER\\OneDrive\\Desktop\\backend12new\\my_yolov8_model3\\weights\\best.pt')

COLOR_MAP = {
    'Helmet': (0, 255, 0),
    'Vest': (0, 255, 0),
    'NoHelmet': (0, 0, 255),
    'NoVest': (0, 0, 255),
    'Person': (255, 255, 0)
}

violation_labels = ["NoHelmet", "NoVest"]

def detect_ppe(image_path: str):
    frame = cv2.imread(image_path)
    return _detect_logic(frame)

def detect_from_webcam(user_id=None, save_violations_to_db=True):
    cap = cv2.VideoCapture(0)
    db = SessionLocal() if save_violations_to_db else None

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.resize(frame, (640, 480))

           
            annotated, violations = _detect_logic(frame)

            if save_violations_to_db and user_id:
                for v in violations:
                    v.setdefault("timestamp", datetime.utcnow())
                    v.setdefault("image_id", "N/A")
                    crud.create_violation(db, v, user_id)
                if not violations:
                    crud.create_violation(db, {
                        "label": "GoodToGo",
                        "confidence": 1.0,
                        "timestamp": datetime.utcnow(),
                        "person_id": "N/A",
                        "image_id": "N/A"
                    }, user_id)

            cv2.imshow('Webcam', annotated)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            time.sleep(4)
    finally:
        cap.release()
        cv2.destroyAllWindows()
        if db:
            db.close()

def _detect_logic(frame, save_image_path=None):
    results = model(frame)

    violations = []
    pred_img = frame.copy()
    occupied_regions = []

    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        cls_name = model.names[cls_id]
        conf = float(box.conf[0])

        if cls_name == 'Person':
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])
        color = COLOR_MAP.get(cls_name, (255, 255, 255))
        label = f"{cls_name} {conf:.2f}"

        cv2.rectangle(pred_img, (x1, y1), (x2, y2), color, 2)
        text_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        text_w, text_h = text_size
        y_text = y1 - 10 if y1 - 10 > text_h else y1 + text_h + 10
        x_text = max(0, min(x1, pred_img.shape[1] - text_w))

        for (ox1, oy1, ox2, oy2) in occupied_regions:
            if (x_text < ox2 and x_text + text_w > ox1) and (y_text < oy2 and y_text + text_h > oy1):
                y_text = oy2 + 5

        occupied_regions.append((x_text, y_text, x_text + text_w, y_text + text_h))
        cv2.putText(pred_img, label, (x_text, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        if cls_name in violation_labels:
            violations.append({
                "label": cls_name,
                "confidence": f"{conf:.2f}",
                "person_id": str(uuid.uuid4())
            })

    if save_image_path:
        cv2.imwrite(save_image_path, pred_img)

    return pred_img, violations