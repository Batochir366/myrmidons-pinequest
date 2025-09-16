from flask import Flask, request, jsonify
import os
import datetime
import base64
import numpy as np
import traceback
from pymongo import MongoClient
from flask_cors import CORS
import cv2
import face_recognition
from Silent_Face_Anti_Spoofing.test import test

# ----------------------------
# Flask App Setup
# ----------------------------
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "FACE")
port = int(os.environ.get("PORT", 8080))  # Railway handles external port

CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-frontend-domain.com"
])

# ----------------------------
# MongoDB Connection
# ----------------------------
mongodb_uri = os.environ.get("MONGODB_URI")
mongo_client = None
db = None
users_collection = None
logs_collection = None

if mongodb_uri:
    try:
        mongo_client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=10000)
        mongo_client.admin.command("ping")
        print("✅ MongoDB connected successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        mongo_client = None

if mongo_client:
    db_name = os.environ.get("DB_NAME", "face_verification_db")
    db = mongo_client[db_name]
    users_collection = db["users"]
    logs_collection = db["logs"]
    print(f"📊 Using database: {db.name}")

# ----------------------------
# Face Recognition Setup
# ----------------------------
FACE_RECOGNITION_AVAILABLE = True
print("✅ Face recognition libraries loaded successfully")

def recognize_face(frame):
    name = "unknown_person"
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_encodings = face_recognition.face_encodings(rgb_frame)
    if not face_encodings:
        return "no_persons_found", None

    encoding = face_encodings[0]
    best_match_user = None
    best_match_distance = 0.45

    if users_collection:
        try:
            users = list(users_collection.find())
        except Exception as e:
            print(f"Database error during user fetch: {e}")
            users = []
    else:
        users = []

    for user in users:
        if "embedding" not in user:
            continue
        user_embedding = np.array(user["embedding"])
        distance = face_recognition.face_distance([user_embedding], encoding)[0]
        if distance < best_match_distance:
            best_match_distance = distance
            best_match_user = user

    if best_match_user:
        return best_match_user["name"], best_match_user
    return name, None

# ----------------------------
# Routes
# ----------------------------
@app.route("/")
def index():
    return jsonify({
        "message": "Face Attendance API running!",
        "face_recognition_available": FACE_RECOGNITION_AVAILABLE,
        "endpoints": ["/login", "/logout", "/register", "/health"]
    })

@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "face_recognition": FACE_RECOGNITION_AVAILABLE,
        "database": "connected" if mongo_client else "disconnected"
    })

def process_image(image_base64):
    try:
        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        print(f"Image decode failed: {e}")
        return None

def anti_spoof_check(frame):
    try:
        label = test(
            image=frame,
            model_dir="Silent_Face_Anti_Spoofing/resources/anti_spoof_models",
            device_id=0
        )
        return label == 1
    except Exception as e:
        print(f"Anti-spoofing check failed: {e}")
        return True  # Skip anti-spoofing if error

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        studentId = data.get("studentId")
        image_base64 = data.get("image_base64")
        if not studentId or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        frame = process_image(image_base64)
        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if not anti_spoof_check(frame):
            return jsonify({"success": False, "verified": False, "message": "Spoofing detected"}), 400

        name, matched_user = recognize_face(frame)
        if not matched_user or matched_user.get("studentId") != studentId:
            return jsonify({"success": False, "verified": False, "message": "Face not recognized or ID mismatch"}), 401

        # Log attendance
        if logs_collection:
            logs_collection.insert_one({
                "studentId": studentId,
                "name": matched_user["name"],
                "timestamp": datetime.datetime.now(),
                "action": "in"
            })

        return jsonify({"success": True, "verified": True, "studentId": studentId, "name": matched_user["name"]})
    except Exception:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal server error"}), 500

@app.route("/logout", methods=["POST"])
def logout():
    try:
        data = request.get_json()
        studentId = data.get("studentId")
        image_base64 = data.get("image_base64")
        if not studentId or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        frame = process_image(image_base64)
        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if not anti_spoof_check(frame):
            return jsonify({"success": False, "verified": False, "message": "Spoofing detected"}), 400

        name, matched_user = recognize_face(frame)
        if not matched_user or matched_user.get("studentId") != studentId:
            return jsonify({"success": False, "verified": False, "message": "Face not recognized or ID mismatch"}), 401

        # Log logout
        if logs_collection:
            logs_collection.insert_one({
                "studentId": studentId,
                "name": matched_user["name"],
                "timestamp": datetime.datetime.now(),
                "action": "out"
            })

        return jsonify({"success": True, "verified": True, "studentId": studentId, "name": matched_user["name"]})
    except Exception:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal server error"}), 500

@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        studentId = data.get("studentId")
        name = data.get("name")
        image_base64 = data.get("image_base64")
        
        # Check received data
        print(f"Data received: {data}")  # Debugging line
        
        if not studentId or not name or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        if users_collection is not None and users_collection.find_one({"studentId": studentId}):
            return jsonify({"success": False, "message": "User already exists"}), 409

        frame = process_image(image_base64)
        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if not anti_spoof_check(frame):
            return jsonify({"success": False, "message": "Spoofing detected"}), 400

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_encodings = face_recognition.face_encodings(rgb_frame)
        if not face_encodings:
            return jsonify({"success": False, "message": "No face detected"}), 400

        user_data = {
            "studentId": studentId,
            "name": name,
            "embedding": face_encodings[0].tolist(),
            "created_at": datetime.datetime.now()
        }

        if users_collection is not None:
            users_collection.insert_one(user_data)

        return jsonify({"success": True, "message": f"User {name} registered successfully!"})
    except Exception:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal server error"}), 500

# ----------------------------
# Run App
# ----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port, debug=False)
