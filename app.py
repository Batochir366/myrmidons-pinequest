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
            "https://myrmidons-pinequest-frontend-delta.vercel.app",  
            "https://myrmidons-pinequest-production.up.railway.app"
        ]
    }
})

# Use environment variable for MongoDB connection with SSL configuration
mongodb_uri = os.environ.get('MONGODB_URI', "mongodb+srv://gbataa366_db_user:sXM3AMhScmviCN7c@kidsaving.dtylnys.mongodb.net/PineQuest").strip()

# Configure MongoDB client with SSL settings for Railway
try:
    mongo_client = MongoClient(
        mongodb_uri,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000,
        w='majority'
    )
    # Test the connection
    mongo_client.admin.command('ping')
    print("✅ MongoDB connected successfully")
    db = mongo_client["face_verification_db"]

    if 'teachers' not in db.list_collection_names():
        db.create_collection("teachers")
    if 'users' not in db.list_collection_names():
        db.create_collection("users")
    if 'logs' not in db.list_collection_names():
        db.create_collection("logs")

    users_collection = db["users"]
    logs_collection = db["logs"]
    teachers_collection = db["teachers"]


except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("Using fallback: No database connection")
    mongo_client = None
    db = None
    users_collection = None
    logs_collection = None
    teachers_collection = None

# Import face recognition libraries
import cv2
import face_recognition
FACE_RECOGNITION_AVAILABLE = True
print("✅ Face recognition libraries loaded successfully")

def recognize_face(frame, filter_student_ids=None):
    name = "unknown_person"
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_encodings = face_recognition.face_encodings(rgb_frame)
    
    if not face_encodings:
        return "no_persons_found", None

    encoding = face_encodings[0]
    best_match_user = None
    best_match_distance = 0.45

    users = []
    if users_collection is not None:
        try:
            if filter_student_ids:
                users = list(users_collection.find({
                    "studentId": { "$in": filter_student_ids }
                }))
            else:
                users = list(users_collection.find())
        except Exception as e:
            print(f"Database error during user fetch: {e}")
    else:
        print("User collection not available")

    # Compare input face encoding with each user's stored encoding
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

    if best_match_user is None:
        return "unknown_person", None

    return name, best_match_user

def recognize_teacher_face(frame):
    name = "unknown_teacher"
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_encodings = face_recognition.face_encodings(rgb_frame)
    if not face_encodings:
        return "no_persons_found", None

    encoding = face_encodings[0]
    best_match_teacher = None
    best_match_distance = 0.45

    if teachers_collection is not None:
        try:
            teachers = list(teachers_collection.find())
        except Exception as e:
            print(f"Database error during teacher fetch: {e}")
            teachers = []
    else:
        print("Teachers collection is None")
        teachers = []

    for teacher in teachers:
        try:
            if 'embedding' not in teacher:
                continue
            stored_encoding = np.array(teacher['embedding'])
            distance = face_recognition.face_distance([stored_encoding], encoding)[0]

            if distance < best_match_distance:
                best_match_distance = distance
                best_match_teacher = teacher
                name = teacher.get('teacherName', 'unknown_teacher')
        except Exception as e:
            print(f"Error processing teacher record: {e}")
            continue

    return name, best_match_teacher

def is_spoof(image):
    """
    Run the anti-spoofing test on the given image.
    Returns True if the image is genuine (not spoofed), False otherwise.
    """
    try:
        label = test(
            image=image,
            model_dir="Silent_Face_Anti_Spoofing/resources/anti_spoof_models",
            device_id=0
        )
        return label == 1
    except Exception as e:
        print("Anti-spoofing test failed:", e)
        return False

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

@app.route('/student/attend', methods=['POST'])
def attend_class():
    try:
        data = request.get_json()
        studentId = data.get('studentId')
        image_base64 = data.get('image_base64')
        classroom_students = data.get('classroom_students')  # List of studentIds

        if not studentId or not image_base64 or not classroom_students:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        if studentId not in classroom_students:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Student is not part of this classroom"
            }), 403

        # Decode the base64 image
        try:
            header, encoded = image_base64.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception:
            return jsonify({"success": False, "message": "Invalid image encoding"}), 400

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if not is_spoof(frame):
            return jsonify({"success": False, "message": "Spoof detected. Please provide a genuine image."}), 403
        # Perform face recognition, filtered to classroom students
        name, matched_user = recognize_face(frame, filter_student_ids=classroom_students)

        if name in ['unknown_person', 'no_persons_found', 'face_recognition_disabled']:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Face not recognized"
            }), 401

        if matched_user['studentId'] != studentId:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Face does not match provided student ID"
            }), 403

        # Return success
        return jsonify({
            "success": True,
            "verified": True,
            "studentId": matched_user['studentId'],
            "name": matched_user['name'],
            "message": f"Welcome, {matched_user['name']}!"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500


@app.route('/student/join', methods=['POST'])
def join_class():
    try:
        data = request.get_json()
        studentId = data.get('studentId')
        image_base64 = data.get('image_base64')

        if not studentId or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Decode base64 image
        try:
            header, encoded = image_base64.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception:
            return jsonify({"success": False, "message": "Invalid image encoding"}), 400

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if not is_spoof(frame):
            return jsonify({"success": False, "message": "Spoof detected. Please provide a genuine image."}), 403
        # Run recognition against all users
        name, matched_user = recognize_face(frame)

        if name in ['unknown_person', 'no_persons_found', 'face_recognition_disabled']:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Face not recognized"
            }), 401

        if matched_user['studentId'] != studentId:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Face does not match the provided student ID"
            }), 403

        # Check if student has already joined
        if logs_collection:
            try:
                existing = logs_collection.find_one({
                    "studentId": studentId,
                    "action": "joined"
                })

                if existing:
                    return jsonify({
                        "success": True,
                        "alreadyJoined": True,
                        "studentId": matched_user['studentId'],
                        "name": matched_user['name'],
                        "message": f"{matched_user['name']} has already joined the classroom"
                    })
                
                # Log the join action
                logs_collection.insert_one({
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "timestamp": datetime.datetime.now(),
                    "action": "joined"
                })

            except Exception as e:
                print(f"Error checking or logging join: {e}")
                return jsonify({
                    "success": False,
                    "message": "Database error while processing join"
                }), 500

        return jsonify({
            "success": True,
            "verified": True,
            "studentId": matched_user['studentId'],
            "name": matched_user['name'],
            "message": f"{matched_user['name']} has successfully joined the classroom"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500


@app.route('/student/register', methods=['POST'])
def register():
    try:
        print("Register endpoint called")
        if not FACE_RECOGNITION_AVAILABLE:
            print("Face recognition not available")
            return jsonify({
                "success": False,
                "message": "Face recognition is not available. Please contact administrator."
            }), 503

        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"success": False, "message": "Invalid or missing JSON data"}), 400

        studentId = data.get('studentId')
        studentName = data.get('studentName')
        classrooms = data.get('Classrooms', [])
        image_base64 = data.get('image_base64')

        if not studentId or not studentName or not image_base64:
            print("Missing fields in request")
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Check if studentId already exists
        if users_collection is not None:
            try:
                existing_user = users_collection.find_one({"studentId": studentId})
                if existing_user:
                    print("User already exists:", studentId)
                    return jsonify({"success": False, "message": "User already exists"}), 409
            except Exception as e:
                print(f"Database error during user check: {e}")
                return jsonify({"success": False, "message": "Database connection error"}), 500

        # Decode and prepare the image
        if ',' not in image_base64:
            print("Invalid image format, missing comma")
            return jsonify({"success": False, "message": "Invalid image format"}), 400

        try:
            header, encoded = image_base64.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Error decoding image: {e}")
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if frame is None:
            print("Failed to decode image into frame")
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if not is_spoof(frame):
            return jsonify({"success": False, "message": "Spoof detected. Please provide a genuine image."}), 403
 
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_encodings = face_recognition.face_encodings(rgb_frame)
        except Exception as e:
            print(f"Error during face encoding: {e}")
            return jsonify({"success": False, "message": "Face recognition failed"}), 500

        if not face_encodings:
            print("No face detected in image")
            return jsonify({"success": False, "message": "No face detected in image"}), 400

        new_face_encoding = face_encodings[0]

        # Check for duplicate face (regardless of studentId)
        if users_collection is not None:
            try:
                all_users = list(users_collection.find())
                for user in all_users:
                    try:
                        existing_encoding = np.array(user['embedding'])
                        distance = face_recognition.face_distance([existing_encoding], new_face_encoding)[0]
                        if distance < 0.45:
                            print(f"Duplicate face detected. Matches with studentId: {user['studentId']}")
                            return jsonify({
                                "success": False,
                                "message": f"Face already registered under studentId {user['studentId']}. Duplicate registration not allowed."
                            }), 409
                    except Exception as inner_e:
                        print(f"Error comparing face for user {user.get('studentId', 'unknown')}: {inner_e}")
                        continue
            except Exception as e:
                print(f"Error checking duplicate faces: {e}")
                return jsonify({"success": False, "message": "Error checking duplicate faces"}), 500

        # Save user
        user_data = {
            "studentId": studentId,
            "name": studentName,
            "Classrooms": [],
            "embedding": new_face_encoding.tolist(),
            "created_at": datetime.datetime.now()
        }

        if users_collection is not None:
            try:
                result = users_collection.insert_one(user_data)
                if not result.inserted_id:
                    print(f"User {studentName} save returned no inserted_id")
                    return jsonify({"success": False, "message": "Failed to save user to database"}), 500
            except Exception as e:
                print(f"Database error during user save: {e}")
                return jsonify({"success": False, "message": "Failed to save user to database"}), 500
        else:
            print(f"No database connection, user {studentName} not saved")
            return jsonify({"success": False, "message": "Database not connected"}), 500

        print(f"✅ User {studentName} registered successfully")
        return jsonify({
            "success": True,
            "message": f"User {studentName} registered successfully!"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500

    
@app.route('/teacher/register', methods=['POST'])
def register_teacher():
    try:
        data = request.get_json(force=True, silent=True)
        teacherName = data.get("teacherName")
        classrooms = data.get("Classrooms", [])
        image_base64 = data.get("image_base64")

        if not teacherName or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        if ',' not in image_base64:
            return jsonify({"success": False, "message": "Invalid image format"}), 400
        try:
            header, encoded = image_base64.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Image decoding error: {e}")
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400
        if not is_spoof(frame):
            return jsonify({"success": False, "message": "Spoof detected. Please provide a genuine image."}), 403
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_encodings = face_recognition.face_encodings(rgb_frame)

        if not face_encodings:
            return jsonify({"success": False, "message": "No face detected in image"}), 400

        new_face_encoding = face_encodings[0]

        if teachers_collection.find_one({"teacherName": teacherName}):
            return jsonify({"success": False, "message": "Teacher already exists"}), 409

        try:
            existing_teachers = list(teachers_collection.find())
            for teacher in existing_teachers:
                existing_encoding = np.array(teacher['embedding'])
                distance = face_recognition.face_distance([existing_encoding], new_face_encoding)[0]
                if distance < 0.45: 
                    print(f"Duplicate face detected for teacher: {teacher['teacherName']}")
                    return jsonify({
                        "success": False,
                        "message": f"Face already registered under teacher {teacher['teacherName']}. Duplicate not allowed."
                    }), 409
        except Exception as e:
            print(f"Error during face duplication check: {e}")
            return jsonify({"success": False, "message": "Face duplication check failed"}), 500
        now = datetime.datetime.utcnow()
        teacher_data = {
            "teacherName": teacherName,
            "embedding": new_face_encoding.tolist(),
            "Classrooms": [],
            "attendanceHistory": [],
            "createdAt": now,
            "updatedAt": now
        }

        result = teachers_collection.insert_one(teacher_data)
        if not result.inserted_id:
            return jsonify({"success": False, "message": "Failed to save teacher"}), 500

        return jsonify({
            "success": True,
            "message": f"Teacher {teacherName} registered successfully!"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500

@app.route('/teacher/login', methods=['POST'])
def login_teacher():
    try:
        data = request.get_json()
        teacherName = data.get("teacherName")
        image_base64 = data.get("image_base64")

        if not teacherName or not image_base64:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400
        if not is_spoof(frame):
            return jsonify({"success": False, "message": "Spoof detected. Please provide a genuine image."}), 403
        name, matched_teacher = recognize_teacher_face(frame)

        if name in ['unknown_teacher', 'no_persons_found']:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Unknown face or no face found"
            }), 401

        if matched_teacher['teacherName'] != teacherName:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Face does not match provided teacher name"
            }), 403

        return jsonify({
            "success": True,
            "verified": True,
            "teacherId": str(matched_teacher['_id']), 
            "teacherName": matched_teacher['teacherName'],
            "message": f"Welcome, {matched_teacher['teacherName']}!"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500

    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port, debug=False)