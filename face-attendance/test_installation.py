#!/usr/bin/env python3
"""
Test script to verify face-attendance installation
"""

import sys
import os

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    
    try:
        import flask
        print("✓ Flask imported successfully")
    except ImportError as e:
        print(f"✗ Flask import failed: {e}")
        return False
    
    try:
        import cv2
        print("✓ OpenCV imported successfully")
    except ImportError as e:
        print(f"✗ OpenCV import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✓ NumPy imported successfully")
    except ImportError as e:
        print(f"✗ NumPy import failed: {e}")
        return False
    
    try:
        import torch
        print(f"✓ PyTorch imported successfully (version: {torch.__version__})")
        print(f"  CUDA available: {torch.cuda.is_available()}")
    except ImportError as e:
        print(f"✗ PyTorch import failed: {e}")
        return False
    
    try:
        import face_recognition
        print("✓ face_recognition imported successfully")
    except ImportError as e:
        print(f"✗ face_recognition import failed: {e}")
        return False
    
    try:
        from pymongo import MongoClient
        print("✓ PyMongo imported successfully")
    except ImportError as e:
        print(f"✗ PyMongo import failed: {e}")
        return False
    
    return True

def test_anti_spoofing():
    """Test anti-spoofing module"""
    print("\nTesting anti-spoofing module...")
    
    try:
        from Silent_Face_Anti_Spoofing.test import test
        print("✓ Anti-spoofing test module imported successfully")
        
        # Check if model files exist
        model_dir = "Silent_Face_Anti_Spoofing/resources/anti_spoof_models"
        if os.path.exists(model_dir):
            model_files = [f for f in os.listdir(model_dir) if f.endswith('.pth')]
            print(f"✓ Found {len(model_files)} model files")
        else:
            print("⚠ Model directory not found")
            
    except ImportError as e:
        print(f"✗ Anti-spoofing import failed: {e}")
        return False
    
    return True

def test_app():
    """Test Flask app initialization"""
    print("\nTesting Flask app...")
    
    try:
        from app import app, FACE_RECOGNITION_AVAILABLE
        print(f"✓ Flask app created successfully")
        print(f"  Face recognition available: {FACE_RECOGNITION_AVAILABLE}")
        
        # Test health endpoint
        with app.test_client() as client:
            response = client.get('/health')
            if response.status_code == 200:
                print("✓ Health endpoint working")
            else:
                print(f"⚠ Health endpoint returned status {response.status_code}")
                
    except Exception as e:
        print(f"✗ Flask app test failed: {e}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("Face Attendance Installation Test")
    print("=" * 40)
    
    success = True
    
    # Test imports
    if not test_imports():
        success = False
    
    # Test anti-spoofing
    if not test_anti_spoofing():
        success = False
    
    # Test app
    if not test_app():
        success = False
    
    print("\n" + "=" * 40)
    if success:
        print("✓ All tests passed! Installation looks good.")
        return 0
    else:
        print("✗ Some tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
