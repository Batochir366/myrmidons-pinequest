FROM python:3.9-slim

WORKDIR /app

# Install only essential dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-all-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    && rm -rf /var/lib/apt/lists/*


# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU version first
RUN pip install --no-cache-dir torch==2.0.1+cpu torchvision==0.15.2+cpu --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Try to install face-recognition (may fail, but app will work without it)
RUN pip install --no-cache-dir face-recognition==1.3.0 || echo "Face recognition installation failed, continuing without it"

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p db

# Use gunicorn directly with fixed port 8080
CMD gunicorn --bind 0.0.0.0:8080 --workers 1 --timeout 60 --preload app:app