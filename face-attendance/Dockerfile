FROM python:3.11.9-slim

WORKDIR /app

# Install system dependencies including dlib requirements
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake=3.25.1-1 \
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

# Install a compatible version of dlib
RUN pip install --no-cache-dir dlib==19.22.1 --verbose

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