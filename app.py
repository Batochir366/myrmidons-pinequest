from flask import Flask, request, jsonify
import os
from pymongo import MongoClient
import numpy as np
import base64
from flask_cors import CORS
import traceback
import datetime
from math import radians, cos, sin, sqrt, atan2

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'FACE')

port = 8080

CORS(app, 
     supports_credentials=True,
     origins=[
         "http://localhost:3000",
         "http://127.0.0.1:3000",
         "https://myrmidons-pinequest-frontend-delta.vercel.app",
         "https://myrmidons-pinequest-production.up.railway.app"
     ])
# Use environment variable for MongoDB connection with SSL configuration
mongodb_uri = os.environ.get('MONGODB_URI', "mongodb+srv://tinderpinecone:FFpZdNZp1ifDSumn@tindermongodb.ukfwlma.mongodb.net/face_verification_db").strip()

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
    best_match_distance = 0.6

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
    best_match_distance = 0.6

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

def recognize_classroom_face(frame, classroom_students):
    """
    Recognize face against ONLY the provided classroom students
    No database queries - uses the student data directly from frontend
    """
    name = "unknown_person"
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_encodings = face_recognition.face_encodings(rgb_frame)
    
    if not face_encodings:
        return "no_persons_found", None

    encoding = face_encodings[0]
    best_match_user = None
    best_match_distance = 0.6

    # Work directly with the classroom students data (no database query)
    for student in classroom_students:
        try:
            if not isinstance(student, dict) or 'embedding' not in student:
                continue
                
            stored_encoding = np.array(student['embedding'])
            distance = face_recognition.face_distance([stored_encoding], encoding)[0]
            
            if distance < best_match_distance:
                best_match_distance = distance
                best_match_user = student
                name = student.get('name', student.get('studentId', 'unknown'))
        except Exception as e:
            print(f"Error processing student {student.get('studentId', 'unknown')}: {e}")
            continue

    if best_match_user is None:
        return "unknown_person", None

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


@app.route('/student/attend', methods=['POST', 'OPTIONS'])
def attend_class():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.get_json()
        studentId = data.get('studentId')
        image_base64 = data.get('image_base64')
        classroom_students = data.get('classroom_students') 
        
        longitude = data.get('longitude')
        latitude = data.get('latitude')

        # Check for required fields
        if not all([studentId, image_base64, latitude, longitude]) or not classroom_students:
            return jsonify({"success": False, "message": "Байршлын мэдээллийн зөвшөөрлийг өгнө үү"}), 400

        # Extract student IDs for membership check
        student_ids = [student.get('studentId') for student in classroom_students if isinstance(student, dict)]
        
        # Check if student is part of the classroom
        if studentId not in student_ids:
            return jsonify({
                "success": False,
                "verified": False,
                "message": f"Та ангид байхгүй байна. Та эхлээд ангидаа элсээрэй"
            }), 403

        # Location check
        teacher_lat = 47.91417544200054
        teacher_lon = 106.91655931106844

        def haversine(lat1, lon1, lat2, lon2):
            R = 6371000
            try:
                phi1, phi2 = radians(lat1), radians(lat2)
                delta_phi = radians(lat2 - lat1)
                delta_lambda = radians(lon2 - lon1)
                a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
                c = 2 * atan2(sqrt(a), sqrt(1 - a))
                return R * c
            except Exception:
                return float('inf')

        distance = haversine(teacher_lat, teacher_lon, latitude, longitude)
        if distance > 100:
            return jsonify({
                "success": False,
                "verified": False,
                "message": f"Та одоогоор ангидаа байхгүй байна. Сургуульдаа яваарай"
            }), 403
       # 1. Decode image
        try:
            header, encoded = image_base64.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400
        # 2. Face Recognition
        name, matched_user = recognize_classroom_face(frame, classroom_students)
        # 3. No recognizable face in frame
        if name in ['unknown_person', 'no_persons_found'] or not matched_user:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Ангийн сурагчдын дунд царай танигдаагүй байна"
            }), 401
        # 4. Face mismatch
        if matched_user.get('studentId') != studentId:
            recognized_id = matched_user.get('studentId')
            return jsonify({
                "success": False,
                "verified": False,
                "message": f"Таны бүртгүүлсэн царай болон дугаар таарахгүй байна"
            }), 403
        # 5. Success
        return jsonify({
            "success": True,
            "verified": True,
            "message": "Student verified successfully",
            "studentId": studentId,
            "name": matched_user.get('name', name),
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Internal Server Error: {str(e)}"}), 500


@app.route('/student/join', methods=['POST', 'OPTIONS'])
def student_join():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        # Extract data from the request
        data = request.json
        studentId = data.get('studentId')
        image_base64 = data.get('image_base64')

        # Check if the necessary data (studentId, image_base64) is provided
        if not studentId:
            return jsonify({
                "success": False,
                "message": "Missing studentId"
            }), 400
            
        if not image_base64:
            return jsonify({
                "success": False,
                "message": "Missing face image for verification"
            }), 400

        # Check if student exists in the database
        existing = users_collection.find_one({"studentId": studentId})
        if not existing:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Та хараахан бүртгүүлээгүй байна"
            }), 404

        # Decode the face image from base64
        try:
            header, encoded = image_base64.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Image decoding error: {e}")
            return jsonify({"success": False, "message": f"Failed to decode image: {str(e)}"}), 400

        if frame is None:
            return jsonify({"success": False, "message": "Decoded image is empty or invalid"}), 400

        # Attempt to verify the face
        name, matched_user = recognize_face(frame, filter_student_ids=[studentId])

        # If no face is detected or recognized, handle the failure
        if name == 'no_persons_found':
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Өгөгдсөн зурагнаас царай олдсонгүй"
            }), 400
        elif name == 'unknown_person':
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Царайг таньсангүй"
            }), 401

        # If face is detected, but the user does not match, handle the mismatch
        if not matched_user or matched_user.get('studentId') != studentId:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Илэрсэн царай нь өгсөн оюутны дугаартай таарахгүй байна"
            }), 403

        # If the face matches, return success
        return jsonify({
            "success": True,
            "verified": True,
            "message": f"Та ангидаа амжилттай элслээ",
            "name": matched_user.get('name', name)
        })

    except Exception as e:
        print(f"General error: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500




@app.route('/student/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        print("Register endpoint called")
        if not FACE_RECOGNITION_AVAILABLE:
            print("Face recognition not available")
            return jsonify({
                "success": False,
                "message": "Царай таних боломжгүй. Админтай холбогдоно уу."
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
                    return jsonify({"success": False, "message": "Өгөгдсөн ID-тай хэрэглэгч аль хэдийн байна"}), 409
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
 
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            face_encodings = face_recognition.face_encodings(rgb_frame)
        except Exception as e:
            print(f"Error during face encoding: {e}")
            return jsonify({"success": False, "message": "Face recognition failed"}), 500

        if not face_encodings:
            print("No face detected in image")
            return jsonify({"success": False, "message": "Зураг дээр ямар ч царай илэрсэнгүй"}), 400

        new_face_encoding = face_encodings[0]

        # Check for duplicate face (find closest match)
        if users_collection is not None:
            try:
                all_users = list(users_collection.find())
                closest_match = None
                min_distance = float('inf')
        
                for user in all_users:
                    try:
                        existing_encoding = np.array(user['embedding'])
                        distance = face_recognition.face_distance([existing_encoding], new_face_encoding)[0]
                        if distance < 0.6 and distance < min_distance:
                            min_distance = distance
                            closest_match = user
                    except Exception as inner_e:
                        print(f"Error comparing face for user {user.get('studentId', 'unknown')}: {inner_e}")
                        continue
        
                if closest_match:
                    print(f"Duplicate face detected. Closest match with studentId: {closest_match['studentId']} (distance: {min_distance})")
                    return jsonify({
                        "success": False,
                        "message": f"Таны царайг {closest_match['studentId']} дор аль хэдийн бүртгүүлсэн байна."
                    }), 409
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

        print(f"User {studentName} registered successfully")
        return jsonify({
            "success": True,
            "message": f"Хэрэглэгч {studentName} та амжилттай бүртгүүллээ!"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500


@app.route('/teacher/register', methods=['POST','OPTIONS'])
def register_teacher():
    if request.method == 'OPTIONS':
        return '', 204
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

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_encodings = face_recognition.face_encodings(rgb_frame)

        if not face_encodings:
            return jsonify({"success": False, "message": "Зураг дээр ямар ч царай илэрсэнгүй"}), 400

        new_face_encoding = face_encodings[0]

        # Check if teacher name already exists
        if teachers_collection.find_one({"teacherName": teacherName}):
            return jsonify({"success": False, "message": "Багшийн нэр аль хэдийн бүртгэгдсэн байна"}), 409

        try:
            existing_teachers = list(teachers_collection.find())
            closest_match = None
            min_distance = float('inf')
            
            for teacher in existing_teachers:
                try:
                    existing_encoding = np.array(teacher['embedding'])
                    distance = face_recognition.face_distance([existing_encoding], new_face_encoding)[0]
                    if distance < 0.6 and distance < min_distance:
                        min_distance = distance
                        closest_match = teacher
                except Exception as inner_e:
                    print(f"Error comparing face for teacher {teacher.get('teacherName', 'unknown')}: {inner_e}")
                    continue
            
            if closest_match:
                print(f"Duplicate face detected. Closest match with teacher: {closest_match['teacherName']} (distance: {min_distance})")
                return jsonify({
                    "success": False,
                    "message": f"{closest_match['teacherName']} багшийн нэрээр царай бүртгэлтэй байна. Давхар бүртгэл хийх боломжгүй."
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
            "message": f"{teacherName} та багшаар амжилттай бүртгүүллээ!"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500 


@app.route('/teacher/login', methods=['POST', 'OPTIONS'])
def login_teacher():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.get_json()
        teacherName = data.get("teacherName")
        image_base64 = data.get("image_base64")

        if not teacherName or not image_base64:
            print(f"❌ Missing fields - teacherName: {bool(teacherName)}, image: {bool(image_base64)}")
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Decode image
        try:
            header, encoded = image_base64.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"❌ Image decoding error: {e}")
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        if frame is None:
            print("❌ Frame is None after decoding")
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        # Face recognition
        print("👤 Running face recognition...")
        name, matched_teacher = recognize_teacher_face(frame)
        print(f"👤 Face recognition result - name: {name}, matched_teacher: {bool(matched_teacher)}")

        if name in ['unknown_teacher', 'no_persons_found']:
            print(f"❌ Face not recognized - returning 401")
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Ийм царай олдсонгүй"
            }), 401

        # Check teacher name match
        print(f"🔍 Checking teacher name match: provided={teacherName}, matched={matched_teacher.get('teacherName', 'None')}")
        if matched_teacher['teacherName'] != teacherName:
            print(f"❌ Teacher name mismatch - returning 403")
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Царай нь заасан багшийн нэртэй таарахгүй байна"
            }), 403

        print(f"✅ Login successful for {teacherName}")
        return jsonify({
            "success": True,
            "verified": True,
            "teacherId": str(matched_teacher['_id']), 
            "teacherName": matched_teacher['teacherName'],
            "message": f"Тавтай морил, {matched_teacher['teacherName']}!"
        })

    except Exception as e:
        print(f"❌ Exception in teacher login: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500


def recognize_teacher_face(frame):
    name = "unknown_teacher"
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_encodings = face_recognition.face_encodings(rgb_frame)
    
    print(f"🔍 Face encodings found: {len(face_encodings)}")
    
    if not face_encodings:
        print("❌ No face encodings found")
        return "no_persons_found", None

    encoding = face_encodings[0]
    best_match_teacher = None
    best_match_distance = 0.6 

    if teachers_collection is not None:
        try:
            teachers = list(teachers_collection.find())
            print(f"🔍 Found {len(teachers)} teachers in database")
        except Exception as e:
            print(f"❌ Database error during teacher fetch: {e}")
            teachers = []
    else:
        print("❌ Teachers collection is None")
        teachers = []

    for i, teacher in enumerate(teachers):
        try:
            if 'embedding' not in teacher:
                print(f"⚠️ Teacher {i} has no embedding")
                continue
                
            stored_encoding = np.array(teacher['embedding'])
            distance = face_recognition.face_distance([stored_encoding], encoding)[0]
            print(f"🔍 Teacher {teacher.get('teacherName', 'unknown')} - Distance: {distance:.4f}")

            if distance < best_match_distance:
                best_match_distance = distance
                best_match_teacher = teacher
                name = teacher.get('teacherName', 'unknown_teacher')
                print(f"✅ New best match: {name} with distance {distance:.4f}")
                
        except Exception as e:
            print(f"❌ Error processing teacher record {i}: {e}")
            continue

    print(f"🔍 Final result - name: {name}, distance: {best_match_distance:.4f}")
    return name, best_match_teacher

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port, debug=False)