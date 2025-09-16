#!/bin/bash

# Start script for Railway deployment
echo "Starting Face Attendance Service on Railway..."

# Force PORT to be 5000 (Railway will handle port mapping)
export PORT=5000

echo "Using port: $PORT"

# Start the application
exec gunicorn --bind 0.0.0.0:5000 --workers 1 --timeout 60 --preload app:app
