FROM python:3.11.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgtk-3-dev \
    libboost-all-dev \
    libblas-dev \
    liblapack-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libatlas-base-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install pre-compiled versions to avoid compilation issues
RUN pip install --no-cache-dir \
    --extra-index-url https://pypi.nvidia.com \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    numpy==1.24.4 \
    torch==2.1.0 torchvision==0.16.0

# Install dlib from a pre-compiled wheel for Python 3.11
RUN pip install --no-cache-dir \
    https://github.com/ageitgey/face_recognition_models/releases/download/0.3.0/face_recognition_models-0.3.0.tar.gz \
    https://github.com/ageitgey/face_recognition/releases/download/1.3.0/face_recognition-1.3.0-py2.py3-none-any.whl

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p db

# Expose the port that Render will use
EXPOSE 5000

# Use gunicorn to serve the app
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 30 app:app