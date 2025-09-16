from flask import Flask, render_template, Response, request, redirect, url_for, flash, jsonify
import cv2
import face_recognition
import pickle
import os
import datetime
from Silent_Face_Anti_Spoofing.test import test
from pymongo import MongoClient
import bson
import numpy as np
import base64
from flask_cors import CORS
import traceback

app = Flask(__name__)
app.secret_key = 'FACE'

CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
mongo_client = MongoClient("mongodb+srv://gbataa366_db_user:sXM3AMhScmviCN7c@kidsaving.dtylnys.mongodb.net/PineQuest")

# Select DB and collections
db = mongo_client["face_verification_db"]
users_collection = db["users"]
logs_collection = db["logs"]

db_dir = './db'
if not os.path.exists(db_dir):
    os.mkdir(db_dir)

log_path = './log.txt'

# ✅ Move VideoCapture inside function scope to avoid global locking issues
def get_camera_frame():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not start camera.")
    success, frame = cap.read()
    cap.release()
    if not success:
        return None
    return frame

def gen_frames():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open camera for streaming.")
    while True:
        success, frame = cap.read()
        if not success:
            break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    cap.release()

def recognize_face(frame):
    name = 'unknown_person'
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_encodings = face_recognition.face_encodings(rgb_frame)

    if not face_encodings:
        return 'no_persons_found', None

    encoding = face_encodings[0]
    best_match_user = None
    best_match_distance = 0.45  # Using same tolerance as original working code

    # Get all users from database
    users = list(users_collection.find())
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
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

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

        # Anti-spoofing check using same logic as original
        label = test(
            image=frame,
            model_dir="Silent_Face_Anti_Spoofing/resources/anti_spoof_models",
            device_id=0
        )

        if label == 1:
            name, matched_user = recognize_face(frame)
            if name in ['unknown_person', 'no_persons_found']:
                return jsonify({
                    "success": False, 
                    "verified": False,
                    "message": "Unknown user. Please register new user or try again."
                }), 401
            else:
                # Check if the matched user's studentId matches the submitted one
                if matched_user['studentId'] != studentId:
                    return jsonify({
                        "success": False,
                        "verified": False,
                        "message": "Student ID does not match the recognized face"
                    }), 403

                # Log the login
                log_entry = {
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "timestamp": datetime.datetime.now(),
                    "action": "in"
                }
                logs_collection.insert_one(log_entry)

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

        # Anti-spoofing check
        label = test(
            image=frame,
            model_dir="Silent_Face_Anti_Spoofing/resources/anti_spoof_models",
            device_id=0
        )

        if label == 1:
            name, matched_user = recognize_face(frame)
            if name in ['unknown_person', 'no_persons_found']:
                return jsonify({
                    "success": False,
                    "verified": False,
                    "message": "Unknown user. Please register new user or try again."
                }), 401
            else:
                # Check if the matched user's studentId matches the submitted one
                if matched_user['studentId'] != studentId:
                    return jsonify({
                        "success": False,
                        "verified": False,
                        "message": "Student ID does not match the recognized face"
                    }), 403

                # Log the logout
                log_entry = {
                    "studentId": matched_user['studentId'],
                    "name": matched_user['name'],
                    "timestamp": datetime.datetime.now(),
                    "action": "out"
                }
                logs_collection.insert_one(log_entry)

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

        # Clean the inputs
        studentId = studentId.strip()
        name = name.strip()

        # Decode base64 image
        header, encoded = image_base64.split(",", 1)
        image_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"success": False, "message": "Failed to decode image"}), 400

        # Convert to RGB for face_recognition
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(rgb_frame)

        if len(encodings) == 0:
            return jsonify({"success": False, "message": "No face detected. Please try again."}), 400

        new_embedding = encodings[0]

        # ✅ Check for existing face using same logic as original
        users = list(users_collection.find())
        for user in users:
            if 'embedding' not in user:
                continue
            
            existing_embedding = np.array(user['embedding'])
            distance = face_recognition.face_distance([existing_embedding], new_embedding)[0]
            if distance < 0.45:
                return jsonify({"success": False, "message": "Face already registered with another user."}), 400

        # ✅ Check for existing studentId
        existing_user = users_collection.find_one({"studentId": studentId})
        if existing_user:
            return jsonify({"success": False, "message": "Student ID already exists."}), 400

        # ✅ Save new user to database
        user_data = {
            "studentId": studentId,
            "name": name,
            "embedding": new_embedding.tolist(),
            "created_at": datetime.datetime.now()
        }
        users_collection.insert_one(user_data)

        return jsonify({"success": True, "message": f'User "{name}" was registered successfully!'})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": "Internal Server Error"}), 500

if __name__ == '__main__':
    app.run(debug=True)