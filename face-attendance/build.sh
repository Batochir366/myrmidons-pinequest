#!/bin/bash

# Update pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Create necessary directories
mkdir -p db
mkdir -p Silent_Face_Anti_Spoofing/resources/anti_spoof_models

echo "Build completed successfully!"