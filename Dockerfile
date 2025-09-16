FROM python:3.9

WORKDIR /app

# Install system dependencies for face recognition
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
    libopenblas-dev \
    libx11-dev \
    libxext-dev \
    libxrender-dev \
    libxtst-dev \
    libxi-dev \
    libxrandr-dev \
    libxss-dev \
    libgconf-2-4 \
    libxss1 \
    libgconf2-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libatlas-base-dev \
    gfortran \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU version first
RUN pip install --no-cache-dir torch==2.0.1+cpu torchvision==0.15.2+cpu --index-url https://download.pytorch.org/whl/cpu

# Install dlib with CMake policy fix
RUN CMAKE_POLICY_VERSION_MINIMUM=3.5 pip install --no-cache-dir dlib==19.24.2

# Install face-recognition
RUN pip install --no-cache-dir face-recognition==1.3.0

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p db

# Expose the port that Railway will use
EXPOSE 5000

# Use gunicorn to serve the app
CMD gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --timeout 60 --preload app:app
