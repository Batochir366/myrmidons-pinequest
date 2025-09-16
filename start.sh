#!/bin/bash

# Start script for Railway deployment
echo "Starting Face Attendance Service on Railway..."

# Set default port if not provided
if [ -z "$PORT" ]; then
    export PORT=5000
fi

# Validate port number
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    echo "Invalid PORT: $PORT. Using default port 5000."
    export PORT=5000
fi

echo "Using port: $PORT"

# Start the application
exec gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 60 --preload app:app
