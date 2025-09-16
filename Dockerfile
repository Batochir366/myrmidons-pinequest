FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for face recognition and dlib
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    pkg-config \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Verify cmake installation
RUN cmake --version

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU version first
RUN pip install --no-cache-dir torch==2.0.1+cpu torchvision==0.15.2+cpu --index-url https://download.pytorch.org/whl/cpu

# Install dlib and face-recognition with build optimizations
ENV CMAKE_BUILD_TYPE=Release
ENV CMAKE_POLICY_VERSION_MINIMUM=3.5

# Install dlib with proper cmake configuration
RUN pip install --no-cache-dir dlib==19.24.2

# Install face-recognition
RUN pip install --no-cache-dir face-recognition==1.3.0

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p db
RUN mkdir -p Silent_Face_Anti_Spoofing/resources/anti_spoof_models
RUN mkdir -p Silent_Face_Anti_Spoofing/resources/detection_model

# Expose the port
EXPOSE 8080

# Use gunicorn directly with fixed port 8080
CMD gunicorn --bind 0.0.0.0:8080 --workers 1 --timeout 60 --preload app:app