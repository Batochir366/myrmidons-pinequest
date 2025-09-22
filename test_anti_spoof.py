#!/usr/bin/env python3
"""
Test script for anti-spoof detection
"""

import cv2
import numpy as np
import sys
import os

# Add current directory to path
sys.path.append('.')

try:
    from anti_spoof_detector import check_face_liveness, is_anti_spoof_available
    print("✅ Anti-spoof detection module imported successfully")
except ImportError as e:
    print(f"❌ Failed to import anti-spoof detection: {e}")
    sys.exit(1)

def create_test_image():
    """Create a simple test image with a face-like pattern"""
    # Create a 300x400 image (3:4 aspect ratio)
    img = np.zeros((400, 300, 3), dtype=np.uint8)
    
    # Fill with skin tone
    img[:] = (180, 150, 120)  # BGR format
    
    # Draw simple face features
    # Eyes
    cv2.circle(img, (120, 150), 15, (0, 0, 0), -1)  # Left eye
    cv2.circle(img, (180, 150), 15, (0, 0, 0), -1)  # Right eye
    
    # Nose
    cv2.circle(img, (150, 200), 8, (100, 100, 100), -1)
    
    # Mouth
    cv2.ellipse(img, (150, 250), (30, 15), 0, 0, 180, (0, 0, 0), 2)
    
    return img

def test_anti_spoof():
    """Test the anti-spoof detection"""
    print("🧪 Testing Anti-Spoof Detection...")
    
    # Check if anti-spoof is available
    if not is_anti_spoof_available():
        print("❌ Anti-spoof detection is not available")
        return False
    
    print("✅ Anti-spoof detection is available")
    
    # Create test image
    test_image = create_test_image()
    print(f"📸 Created test image: {test_image.shape}")
    
    # Test liveness detection
    try:
        is_live, confidence, message = check_face_liveness(test_image)
        print(f"🔍 Liveness check result:")
        print(f"   - Is Live: {is_live}")
        print(f"   - Confidence: {confidence:.2f}")
        print(f"   - Message: {message}")
        
        if is_live:
            print("✅ Test passed: Face detected as live")
        else:
            print("⚠️ Test result: Face detected as spoof")
            
        return True
        
    except Exception as e:
        print(f"❌ Error during liveness detection: {e}")
        return False

def test_with_real_image(image_path):
    """Test with a real image file"""
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return False
    
    print(f"📸 Testing with real image: {image_path}")
    
    # Load image
    img = cv2.imread(image_path)
    if img is None:
        print("❌ Failed to load image")
        return False
    
    print(f"📸 Loaded image: {img.shape}")
    
    # Test liveness detection
    try:
        is_live, confidence, message = check_face_liveness(img)
        print(f"🔍 Liveness check result:")
        print(f"   - Is Live: {is_live}")
        print(f"   - Confidence: {confidence:.2f}")
        print(f"   - Message: {message}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during liveness detection: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Anti-Spoof Detection Test")
    print("=" * 50)
    
    # Test 1: Check availability
    print("\n1. Checking availability...")
    if not is_anti_spoof_available():
        print("❌ Anti-spoof detection is not available")
        print("💡 Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    
    # Test 2: Test with synthetic image
    print("\n2. Testing with synthetic image...")
    success1 = test_anti_spoof()
    
    # Test 3: Test with real image if provided
    if len(sys.argv) > 1:
        print(f"\n3. Testing with real image: {sys.argv[1]}")
        success2 = test_with_real_image(sys.argv[1])
    else:
        print("\n3. Skipping real image test (no image provided)")
        print("💡 Usage: python test_anti_spoof.py <image_path>")
        success2 = True
    
    # Summary
    print("\n" + "=" * 50)
    if success1 and success2:
        print("🎉 All tests passed!")
    else:
        print("❌ Some tests failed")
        sys.exit(1)
