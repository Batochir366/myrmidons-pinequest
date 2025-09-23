# Multi-stage build for optimized production image
FROM python:3.9-slim as builder

# Install build dependencies
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

# Set build optimizations
ENV CMAKE_BUILD_TYPE=Release
ENV CMAKE_POLICY_VERSION_MINIMUM=3.5
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU version (optimized for Railway)
RUN pip install --no-cache-dir torch==2.0.1+cpu torchvision==0.15.2+cpu --index-url https://download.pytorch.org/whl/cpu

# Install dlib with optimizations
RUN pip install --no-cache-dir dlib==19.24.2

# Install face-recognition
RUN pip install --no-cache-dir face-recognition==1.3.0

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.9-slim as production

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libopenblas0 \
    liblapack0 \
    libjpeg62-turbo \
    libpng16-16 \
    libtiff5 \
    libavcodec58 \
    libavformat58 \
    libswscale5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p db Silent_Face_Anti_Spoofing/resources/anti_spoof_models Silent_Face_Anti_Spoofing/resources/detection_model \
    && chown -R appuser:appuser /app

# Set environment variables for optimization
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV OMP_NUM_THREADS=2
ENV MKL_NUM_THREADS=2
ENV OPENBLAS_NUM_THREADS=2
ENV NUMEXPR_NUM_THREADS=2
ENV VECLIB_MAXIMUM_THREADS=2
ENV NUMBA_NUM_THREADS=2

# Performance optimizations
ENV PYTHONHASHSEED=random
ENV PYTHONIOENCODING=utf-8

# Expose the port
EXPOSE 8080

# Make start script executable
RUN chmod +x start.sh

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use optimized gunicorn configuration
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 --worker-class gevent --worker-connections 1000 --timeout 60 --keep-alive 2 --max-requests 1000 --max-requests-jitter 100 --preload --log-level info app:app
