#!/usr/bin/env python3
"""
Test script to verify face recognition installation
"""

def test_face_recognition():
    """Test if face recognition libraries can be imported"""
    print("Testing face recognition installation...")
    
    try:
        import cv2
        print("✅ OpenCV imported successfully")
    except ImportError as e:
        print(f"❌ OpenCV import failed: {e}")
        return False
    
    try:
        import face_recognition
        print("✅ face_recognition imported successfully")
    except ImportError as e:
        print(f"❌ face_recognition import failed: {e}")
        return False
    
    try:
        from Silent_Face_Anti_Spoofing.test import test
        print("✅ Anti-spoofing test module imported successfully")
    except ImportError as e:
        print(f"❌ Anti-spoofing import failed: {e}")
        return False
    
    print("\n🎉 All face recognition libraries working!")
    return True

if __name__ == "__main__":
    success = test_face_recognition()
    if success:
        print("✅ Face recognition is ready!")
    else:
        print("❌ Face recognition needs fixing")
