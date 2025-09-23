#!/bin/bash

# Optimized start script for Railway deployment
echo "🚀 Starting Face Attendance Service on Railway..."

# Get port from environment variable or use default
PORT=${PORT:-8080}
echo "📡 Using port: $PORT"

# Set performance optimizations
export PYTHONHASHSEED=random
export PYTHONIOENCODING=utf-8
export OMP_NUM_THREADS=2
export MKL_NUM_THREADS=2

# Calculate optimal worker count (2 workers for Railway)
WORKERS=${WORKERS:-2}
echo "👥 Using $WORKERS workers"

# Start the application with optimized settings
exec gunicorn \
    --bind 0.0.0.0:$PORT \
    --workers $WORKERS \
    --worker-class gevent \
    --worker-connections 1000 \
    --timeout 60 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    app:app
