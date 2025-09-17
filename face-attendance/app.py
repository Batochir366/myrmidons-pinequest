from flask import Flask, request, jsonify
import os
import datetime
from pymongo import MongoClient
import numpy as np
import base64
from flask_cors import CORS
import traceback

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'FACE')

port = 8080

CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://myrmidons-pinequest-backend.vercel.app",  
            "https://myrmidons-pinequest-production.up.railway.app"
        ]
    }
})

# Use environment variable for MongoDB connection with SSL configuration
mongodb_uri = os.environ.get('MONGODB_URI', "mongodb+srv://gbataa366_db_user:sXM3AMhScmviCN7c@kidsaving.dtylnys.mongodb.net/PineQuest")

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

# Import face recognition libraries
import cv2
import face_recognition
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

    if users_collection is not None:
        try:
            users = list(users_collection.find())
        except Exception as e:
            print(f"Database error during user fetch: {e}")
            users = []
    else:
        users = []

    # Compare with all users in database
    for user in users:
        try:
            stored_encoding = np.array(user['embedding'])
            distance = face_recognition.face_distance([stored_encoding], encoding)[0]
            
            if distance < best_match_distance:
                best_match_distance = distance
                best_match_user = user
                name = user['name']
        except Exception as e:
            print(f"Error processing user {user.get('name', 'unknown')}: {e}")
            continue

    return name, best_match_user

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

        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        name, matched_user = recognize_face(frame)
        if name in ['unknown_person', 'no_persons_found', 'face_recognition_disabled']:
            return jsonify({
                "success": False, 
                "verified": False,
                "message": "Unknown user or face recognition disabled. Please register or contact administrator."
            }), 401

        if matched_user['studentId'] != studentId:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Student ID does not match the recognized face"
            }), 403

        # Only log if database is available
        if logs_collection is not None:
            try:
                log_entry = {
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "timestamp": datetime.datetime.now(),
                    "action": "in"
                }
                logs_collection.insert_one(log_entry)
            except Exception as e:
                print(f"Failed to log entry: {e}")

        return jsonify({
            "success": True,
            "verified": True,
            "studentId": matched_user['studentId'],
            "name": matched_user['name'],
            "message": f"Welcome back, {matched_user['name']}!"
        })

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

        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        name, matched_user = recognize_face(frame)
        if name in ['unknown_person', 'no_persons_found', 'face_recognition_disabled']:
            return jsonify({
                "success": False, 
                "verified": False,
                "message": "Unknown user or face recognition disabled. Please register or contact administrator."
            }), 401

        if matched_user['studentId'] != studentId:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Student ID does not match the recognized face"
            }), 403

        # Only log if database is available
        if logs_collection is not None:
            try:
                log_entry = {
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "timestamp": datetime.datetime.now(),
                    "action": "out"
                }
                logs_collection.insert_one(log_entry)
            except Exception as e:
                print(f"Failed to log entry: {e}")

        return jsonify({
            "success": True,
            "verified": True,
            "studentId": matched_user['studentId'],
            "name": matched_user['name'],
            "message": f"Goodbye, {matched_user['name']}!"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500

@app.route('/register', methods=['POST'])
def register():
    try:
        print("Register endpoint called")
        if not FACE_RECOGNITION_AVAILABLE:
            print("Face recognition not available")
            return jsonify({
                "success": False, 
                "message": "Face recognition is not available. Please contact administrator."
            }), 503

        data = request.get_json()
        print("Data received:", data)
        studentId = data.get('studentId')
        name = data.get('name')
        image_base64 = data.get('image_base64')

        if not studentId or not name or not image_base64:
            print("Missing fields in request")
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Check if user already exists (with MongoDB fallback)
        if users_collection is not None:
            try:
                existing_user = users_collection.find_one({"studentId": studentId})
                if existing_user:
                    print("User already exists:", studentId)
                    return jsonify({"success": False, "message": "User already exists"}), 409
            except Exception as e:
                print(f"Database error during user check: {e}")
                return jsonify({"success": False, "message": "Database connection error"}), 500
        else:
            print("Warning: No database connection, skipping user existence check")

        if ',' not in image_base64:
            print("Invalid image format, missing comma")
            return jsonify({"success": False, "message": "Invalid image format"}), 400

        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            print("Failed to decode image")
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_encodings = face_recognition.face_encodings(rgb_frame)
        print("Number of faces found:", len(face_encodings))

        if not face_encodings:
            print("No face detected in image")
            return jsonify({"success": False, "message": "No face detected in image"}), 400

        user_data = {
            "studentId": studentId,
            "name": name,
            "embedding": face_encodings[0].tolist(),
            "created_at": datetime.datetime.now()
        }
        
        # Save user data (with improved error handling)
        if users_collection is not None:
            try:
                result = users_collection.insert_one(user_data)
                if result.inserted_id:
                    print(f"✅ User {name} saved to database with ID: {result.inserted_id}")
                else:
                    print(f"⚠️ User {name} save returned no inserted_id")
                    return jsonify({"success": False, "message": "Failed to save user to database"}), 500
            except Exception as e:
                print(f"❌ Database error during user save: {e}")
                print(f"❌ Exception type: {type(e).__name__}")
                print(f"❌ Exception details: {str(e)}")
                
                # Check if the user was actually saved despite the exception
                try:
                    saved_user = users_collection.find_one({"studentId": studentId})
                    if saved_user:
                        print(f"🔄 User {name} was actually saved successfully despite the exception")
                    else:
                        print(f"❌ User {name} was not saved to database")
                        return jsonify({"success": False, "message": "Failed to save user to database"}), 500
                except Exception as verify_error:
                    print(f"❌ Could not verify if user was saved: {verify_error}")
                    return jsonify({"success": False, "message": "Database verification failed"}), 500
        else:
            print(f"⚠️ No database connection, user {name} not saved")
        
        print(f"User {name} registered successfully")

        return jsonify({
            "success": True,
            "message": f"User {name} registered successfully!"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port, debug=False)