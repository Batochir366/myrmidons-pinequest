#!/bin/bash

# Start script for face-attendance service
echo "Starting Face Attendance Service..."

# Check if required directories exist
mkdir -p db
mkdir -p Silent_Face_Anti_Spoofing/resources/anti_spoof_models
mkdir -p Silent_Face_Anti_Spoofing/resources/detection_model

# Set environment variables if not set
export PORT=${PORT:-5000}
export SECRET_KEY=${SECRET_KEY:-"default_secret_key_change_in_production"}

# Check if MongoDB URI is set
if [ -z "$MONGODB_URI" ]; then
    echo "Warning: MONGODB_URI not set. Using default connection."
fi

# Start the application
echo "Starting Flask application on port $PORT"
python app.py
