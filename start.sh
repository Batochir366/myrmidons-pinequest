#!/bin/bash

# Start script for Railway deployment
echo "Starting Face Attendance Service on Railway..."

# Use Railway's dynamic PORT (do not force)
echo "Using port: $PORT"

# Start the application using the provided $PORT
exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 60 --preload app:app
