#!/bin/bash

# Start script for Railway deployment
echo "Starting Face Attendance Service on Railway..."

# Use fixed port 8080 (Railway will handle port mapping)
echo "Using port: 8080"

# Start the application using fixed port 8080
exec gunicorn --bind 0.0.0.0:8080 --workers 1 --timeout 60 --preload app:app
