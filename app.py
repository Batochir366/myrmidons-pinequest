from flask import Flask, render_template, Response, request, redirect, url_for, flash, jsonify
import os
import datetime
from pymongo import MongoClient
import numpy as np
import base64
from flask_cors import CORS
import traceback

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'FACE')

# Use fixed port 8080 (Railway will handle port mapping)
port = 8080

CORS(app, origins=[
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://your-frontend-domain.com"  # Replace with your actual frontend URL
])

# Use environment variable for MongoDB connection with SSL configuration
mongodb_uri = os.environ.get('MONGODB_URI', "mongodb+srv://gbataa366_db_user:sXM3AMhScmviCN7c@kidsaving.dtylnys.mongodb.net/")

# Configure MongoDB client with SSL settings for Railway
try:
    mongo_client = MongoClient(
        mongodb_uri,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000
    )
    # Test the connection
    mongo_client.admin.command('ping')
    print("✅ MongoDB connected successfully")
    db = mongo_client["face_verification_db"]
    users_collection = db["users"]
    logs_collection = db["logs"]
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("Using fallback: No database connection")
    mongo_client = None
    db = None
    users_collection = None
    logs_collection = None
 
db_dir = './db'
if not os.path.exists(db_dir):
    os.mkdir(db_dir)
 
log_path = './log.txt'

# Import face recognition libraries
import cv2
import face_recognition
from Silent_Face_Anti_Spoofing.test import test
FACE_RECOGNITION_AVAILABLE = True
print("✅ Face recognition libraries loaded successfully")

def recognize_face(frame):
        
    name = 'unknown_person'
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_encodings = face_recognition.face_encodings(rgb_frame)

    if not face_encodings:
        return 'no_persons_found', None

    encoding = face_encodings[0]
    best_match_user = None
    best_match_distance = 0.45

    # Get users from database (with fallback)
    if users_collection:
        try:
            users = list(users_collection.find())
        except Exception as e:
            print(f"Database error during user fetch: {e}")
            return 'face_recognition_disabled', None
    else:
        print("No database connection, returning face_recognition_disabled")
        return 'face_recognition_disabled', None
    
    for user in users:
        if 'embedding' not in user:
            continue
        
        user_embedding = np.array(user['embedding'])
        distance = face_recognition.face_distance([user_embedding], encoding)[0]
        
        if distance < best_match_distance:
            best_match_distance = distance
            best_match_user = user

    if best_match_user:
        return best_match_user['name'], best_match_user
    else:
        return name, None

@app.route('/')
def index():
    return jsonify({
        "message": "Face Attendance API is running!",
        "face_recognition_available": FACE_RECOGNITION_AVAILABLE,
        "endpoints": ["/login", "/logout", "/register", "/health"]
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "face_recognition": FACE_RECOGNITION_AVAILABLE,
        "database": "connected" if mongo_client else "disconnected"
    })

@app.route('/login', methods=['POST'])
def login():
    try:

        data = request.get_json()
        studentId = data.get('studentId')
        image_base64 = data.get('image_base64')

        if not studentId or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Decode base64 image
        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        # Anti-spoofing check (with fallback)
        try:
            label = test(
                image=frame,
                model_dir="Silent_Face_Anti_Spoofing/resources/anti_spoof_models",
                device_id=0
            )
        except Exception as e:
            print(f"Anti-spoofing check failed: {e}")
            label = 1  # Skip anti-spoofing for now

        if label == 1:
            name, matched_user = recognize_face(frame)
            if name in ['unknown_person', 'no_persons_found', 'face_recognition_disabled']:
                return jsonify({
                    "success": False, 
                    "verified": False,
                    "message": "Unknown user or face recognition disabled. Please register or contact administrator."
                }), 401
            else:
                # Check if the matched user's studentId matches the submitted one
                if matched_user['studentId'] != studentId:
                    return jsonify({
                        "success": False,
                        "verified": False,
                        "message": "Student ID does not match the recognized face"
                    }), 403

                # Log the login (with MongoDB fallback)
                log_entry = {
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "timestamp": datetime.datetime.now(),
                    "action": "in"
                }
                if logs_collection:
                    try:
                        logs_collection.insert_one(log_entry)
                        print(f"✅ Login logged for {matched_user['name']}")
                    except Exception as e:
                        print(f"❌ Database error during login log: {e}")
                else:
                    print(f"⚠️ No database connection, login not logged")

                return jsonify({
                    "success": True,
                    "verified": True,
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "message": f"Welcome back, {matched_user['name']}!"
                })
        else:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Spoofing Detected. Access Denied."
            }), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500

@app.route('/logout', methods=['POST'])
def logout():
    try:

        data = request.get_json()
        studentId = data.get('studentId')
        image_base64 = data.get('image_base64')

        if not studentId or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Decode base64 image
        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        # Anti-spoofing check (with fallback)
        try:
            label = test(
                image=frame,
                model_dir="Silent_Face_Anti_Spoofing/resources/anti_spoof_models",
                device_id=0
            )
        except Exception as e:
            print(f"Anti-spoofing check failed: {e}")
            label = 1  # Skip anti-spoofing for now

        if label == 1:
            name, matched_user = recognize_face(frame)
            if name in ['unknown_person', 'no_persons_found', 'face_recognition_disabled']:
                return jsonify({
                    "success": False, 
                    "verified": False,
                    "message": "Unknown user or face recognition disabled. Please register or contact administrator."
                }), 401
            else:
                # Check if the matched user's studentId matches the submitted one
                if matched_user['studentId'] != studentId:
                    return jsonify({
                        "success": False,
                        "verified": False,
                        "message": "Student ID does not match the recognized face"
                    }), 403

                # Log the logout (with MongoDB fallback)
                log_entry = {
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "timestamp": datetime.datetime.now(),
                    "action": "out"
                }
                if logs_collection:
                    try:
                        logs_collection.insert_one(log_entry)
                        print(f"✅ Logout logged for {matched_user['name']}")
                    except Exception as e:
                        print(f"❌ Database error during logout log: {e}")
                else:
                    print(f"⚠️ No database connection, logout not logged")

                return jsonify({
                    "success": True,
                    "verified": True,
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "message": f"Goodbye, {matched_user['name']}!"
                })
        else:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Spoofing Detected. Access Denied."
            }), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500

@app.route('/register', methods=['POST'])
def register():
    try:

        data = request.get_json()
        studentId = data.get('studentId')
        name = data.get('name')
        image_base64 = data.get('image_base64')

        if not studentId or not name or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Check if user already exists (with MongoDB fallback)
        if users_collection:
            try:
                existing_user = users_collection.find_one({"studentId": studentId})
                if existing_user:
                    return jsonify({"success": False, "message": "User already exists"}), 409
            except Exception as e:
                print(f"Database error during user check: {e}")
                return jsonify({"success": False, "message": "Database connection error"}), 500
        else:
            print("Warning: No database connection, skipping user existence check")

        # Decode base64 image
        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        # Anti-spoofing check (with fallback)
        try:
            label = test(
                image=frame,
                model_dir="Silent_Face_Anti_Spoofing/resources/anti_spoof_models",
                device_id=0
            )
        except Exception as e:
            print(f"Anti-spoofing check failed: {e}")
            label = 1  # Skip anti-spoofing for now

        if label == 1:
            # Get face encoding
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_encodings = face_recognition.face_encodings(rgb_frame)

            if not face_encodings:
                return jsonify({"success": False, "message": "No face detected in image"}), 400

            # Save user data (with MongoDB fallback)
            user_data = {
                "studentId": studentId,
                "name": name,
                "embedding": face_encodings[0].tolist(),
                "created_at": datetime.datetime.now()
            }
            
            if users_collection:
                try:
                    users_collection.insert_one(user_data)
                    print(f"✅ User {name} saved to database")
                except Exception as e:
                    print(f"❌ Database error during user save: {e}")
                    return jsonify({"success": False, "message": "Failed to save user to database"}), 500
            else:
                print(f"⚠️ No database connection, user {name} not saved")

            return jsonify({
                "success": True,
                "message": f"User {name} registered successfully!"
            })
        else:
            return jsonify({
                "success": False,
                "message": "Spoofing Detected. Registration Denied."
            }), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port, debug=False)