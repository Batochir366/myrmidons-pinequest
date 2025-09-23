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

# Create necessary directories FIRST
RUN mkdir -p db
RUN mkdir -p Silent_Face_Anti_Spoofing/resources/anti_spoof_models
RUN mkdir -p Silent_Face_Anti_Spoofing/resources/detection_model

# Copy application code
COPY . .

# Copy local model files (put your .pth files in a 'models' folder in your project)
COPY models/*.pth Silent_Face_Anti_Spoofing/resources/anti_spoof_models/

# List copied models for verification
RUN ls -la Silent_Face_Anti_Spoofing/resources/anti_spoof_models/

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