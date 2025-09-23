#!/bin/bash

# Start script for Railway deployment
echo "Starting Face Attendance Service on Railway..."

# Get port from environment variable or use default
PORT=${PORT:-8080}
echo "Using port: $PORT"

# Start the application using the port from environment
exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 30 --preload --max-requests 1000 --max-requests-jitter 100 app:app
