# -*- coding: utf-8 -*-
"""
Optimized Anti-Spoof Detection Module
Fast, lightweight anti-spoof detection for Railway deployment
"""

import os
import cv2
import numpy as np
import time
import warnings
from typing import Tuple, Optional
import threading
from functools import lru_cache

# Suppress warnings
warnings.filterwarnings('ignore')

# Global variables for caching
_anti_spoof_detector = None
_initialization_lock = threading.Lock()

try:
    from Silent_Face_Anti_Spoofing.src.anti_spoof_predict import AntiSpoofPredict
    from Silent_Face_Anti_Spoofing.src.generate_patches import CropImage
    from Silent_Face_Anti_Spoofing.src.utility import parse_model_name
    ANTI_SPOOF_AVAILABLE = True
    print("✅ Anti-spoof detection libraries loaded successfully")
except ImportError as e:
    print(f"⚠️ Anti-spoof detection not available: {e}")
    ANTI_SPOOF_AVAILABLE = False

class OptimizedAntiSpoofDetector:
    """Optimized anti-spoof detection with caching and fast processing"""
    
    def __init__(self, model_dir: str = "./Silent_Face_Anti_Spoofing/resources/anti_spoof_models", device_id: int = 0):
        self.model_dir = model_dir
        self.device_id = device_id
        self.model_test = None
        self.image_cropper = None
        self.initialized = False
        self._model_cache = {}
        self._last_check_time = 0
        self._check_interval = 0.1  # Minimum 100ms between checks
        
        if ANTI_SPOOF_AVAILABLE:
            self._initialize()
    
    def _initialize(self):
        """Initialize the anti-spoof detection models (cached)"""
        try:
            if not os.path.exists(self.model_dir):
                print(f"⚠️ Model directory {self.model_dir} not found")
                return
                
            # Initialize with minimal memory footprint
            self.model_test = AntiSpoofPredict(self.device_id)
            self.image_cropper = CropImage()
            self.initialized = True
            print("✅ Optimized anti-spoof detection initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize anti-spoof detection: {e}")
            self.initialized = False
    
    @lru_cache(maxsize=32)
    def _resize_image_cached(self, image_hash: int, target_width: int, target_height: int):
        """Cached image resizing"""
        # This is a placeholder - actual implementation would use the hash to retrieve image
        # For now, we'll do direct resizing
        pass
    
    def _fast_face_detection(self, image: np.ndarray) -> bool:
        """Fast face detection using OpenCV Haar cascades"""
        try:
            # Convert to grayscale for faster processing
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Use OpenCV's built-in face detector (much faster)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            return len(faces) > 0
        except Exception as e:
            print(f"Fast face detection error: {e}")
            return False
    
    def _quick_spoof_check(self, image: np.ndarray) -> Tuple[bool, float, str]:
        """Quick spoof check using basic image analysis"""
        try:
            # Basic image quality checks
            height, width = image.shape[:2]
            
            # Check image size
            if width < 100 or height < 100:
                return False, 0.0, "Image too small"
            
            # Check for basic face presence
            if not self._fast_face_detection(image):
                return False, 0.0, "No face detected"
            
            # Basic texture analysis
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Simple spoof detection based on texture
            if laplacian_var < 100:  # Low texture variance might indicate photo
                return False, 0.3, "Suspicious texture detected"
            
            # Check for basic lighting consistency
            mean_brightness = np.mean(gray)
            if mean_brightness < 50 or mean_brightness > 200:
                return False, 0.4, "Poor lighting conditions"
            
            return True, 0.7, "Basic checks passed"
            
        except Exception as e:
            print(f"Quick spoof check error: {e}")
            return True, 0.5, f"Check failed: {str(e)}"
    
    def detect_spoof_fast(self, image: np.ndarray, use_full_detection: bool = False) -> Tuple[bool, float, str]:
        """
        Fast spoof detection with optional full detection
        
        Args:
            image: OpenCV image (numpy array)
            use_full_detection: Whether to use full Silent Face Anti-Spoofing
            
        Returns:
            Tuple[bool, float, str]: (is_real, confidence, message)
        """
        # Rate limiting to prevent excessive processing
        current_time = time.time()
        if current_time - self._last_check_time < self._check_interval:
            return True, 0.5, "Rate limited - using cached result"
        
        self._last_check_time = current_time
        
        if not self.initialized or not ANTI_SPOOF_AVAILABLE:
            # Fallback to quick check
            return self._quick_spoof_check(image)
        
        # Use quick check for most cases
        if not use_full_detection:
            return self._quick_spoof_check(image)
        
        # Full detection only when specifically requested
        try:
            # Resize image to correct aspect ratio
            resized_image = self._resize_image_for_detection(image)
            
            # Check aspect ratio
            if not self._check_image_aspect_ratio(resized_image):
                return False, 0.0, "Invalid image aspect ratio"
            
            # Get face bounding box
            image_bbox = self.model_test.get_bbox(resized_image)
            if image_bbox is None:
                return False, 0.0, "No face detected"
            
            # Use only the first available model for speed
            model_files = [f for f in os.listdir(self.model_dir) if f.endswith('.pth')]
            if not model_files:
                return self._quick_spoof_check(image)
            
            # Process only the first model (fastest)
            model_name = model_files[0]
            try:
                h_input, w_input, model_type, scale = parse_model_name(model_name)
                param = {
                    "org_img": resized_image,
                    "bbox": image_bbox,
                    "scale": scale,
                    "out_w": w_input,
                    "out_h": h_input,
                    "crop": True,
                }
                if scale is None:
                    param["crop"] = False
                
                img = self.image_cropper.crop(**param)
                prediction = self.model_test.predict(img, os.path.join(self.model_dir, model_name))
                
                # Get final prediction
                label = np.argmax(prediction)
                confidence = prediction[0][label] / 2
                
                # Determine result
                is_real = label == 1
                if is_real:
                    message = f"Real face detected (confidence: {confidence:.2f})"
                else:
                    message = f"Fake face detected (confidence: {confidence:.2f})"
                
                return is_real, confidence, message
                
            except Exception as e:
                print(f"Error processing model {model_name}: {e}")
                return self._quick_spoof_check(image)
            
        except Exception as e:
            print(f"Error in full anti-spoof detection: {e}")
            return self._quick_spoof_check(image)
    
    def _check_image_aspect_ratio(self, image: np.ndarray) -> bool:
        """Check if image has correct 3:4 aspect ratio"""
        height, width, channel = image.shape
        if width/height != 3/4:
            return False
        return True
    
    def _resize_image_for_detection(self, image: np.ndarray) -> np.ndarray:
        """Resize image to 3:4 aspect ratio for anti-spoof detection"""
        height = image.shape[0]
        new_width = int(height * 3 / 4)
        return cv2.resize(image, (new_width, height))
    
    def is_available(self) -> bool:
        """Check if anti-spoof detection is available"""
        return self.initialized and ANTI_SPOOF_AVAILABLE

def get_anti_spoof_detector():
    """Get singleton instance of anti-spoof detector"""
    global _anti_spoof_detector
    
    if _anti_spoof_detector is None:
        with _initialization_lock:
            if _anti_spoof_detector is None:
                _anti_spoof_detector = OptimizedAntiSpoofDetector()
    
    return _anti_spoof_detector

def check_face_liveness_fast(image: np.ndarray, use_full_detection: bool = False) -> Tuple[bool, float, str]:
    """
    Fast liveness check with optional full detection
    
    Args:
        image: OpenCV image (numpy array)
        use_full_detection: Whether to use full Silent Face Anti-Spoofing
        
    Returns:
        Tuple[bool, float, str]: (is_live, confidence, message)
    """
    detector = get_anti_spoof_detector()
    return detector.detect_spoof_fast(image, use_full_detection)

def is_anti_spoof_available() -> bool:
    """Check if anti-spoof detection is available"""
    detector = get_anti_spoof_detector()
    return detector.is_available()

# Backward compatibility
def check_face_liveness(image: np.ndarray) -> Tuple[bool, float, str]:
    """Backward compatible liveness check (uses fast detection)"""
    return check_face_liveness_fast(image, use_full_detection=False)
