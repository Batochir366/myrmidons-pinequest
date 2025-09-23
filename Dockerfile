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
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU version first (optimized for Railway)
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

# Create necessary directories FIRST
RUN mkdir -p db
RUN mkdir -p Silent_Face_Anti_Spoofing/resources/anti_spoof_models
RUN mkdir -p Silent_Face_Anti_Spoofing/resources/detection_model

# Download anti-spoof models (if you have the actual model files locally, copy them instead)
WORKDIR /app/Silent_Face_Anti_Spoofing/resources/anti_spoof_models

# Option 1: If you have models locally, copy them (recommended)
# COPY ./models/*.onnx ./

# Option 2: Download from a working URL (replace with actual URLs)
# These URLs are likely incorrect - you need to find the real download links
# RUN wget -O "2.7_80x80_MiniFASNetV2.onnx" "https://actual-model-url.com/model1.onnx" || echo "Model 1 download failed"
# RUN wget -O "4_0_0_80x80_MiniFASNetV1SE.onnx" "https://actual-model-url.com/model2.onnx" || echo "Model 2 download failed"

# Download actual PyTorch models from the repository
RUN wget -O "2.7_80x80_MiniFASNetV2.pth" "https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/raw/master/resources/anti_spoof_models/2.7_80x80_MiniFASNetV2.pth" || echo "Model 1 download failed"
RUN wget -O "4_0_0_80x80_MiniFASNetV1SE.pth" "https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/raw/master/resources/anti_spoof_models/4_0_0_80x80_MiniFASNetV1SE.pth" || echo "Model 2 download failed"

WORKDIR /app

# Set environment variables for optimization
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

# Expose the port
EXPOSE 8080

# Make start script executable (if it exists)
RUN chmod +x start.sh || echo "start.sh not found"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use gunicorn with optimized settings for Railway
CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 30 --preload --max-requests 1000 --max-requests-jitter 100 app:app