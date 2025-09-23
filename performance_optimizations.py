# -*- coding: utf-8 -*-
"""
Performance Optimizations for Railway Deployment
"""

import os
import cv2
import numpy as np
import time
from functools import lru_cache
import threading

# Global caches for performance
_face_cascade_cache = None
_face_encodings_cache = {}

def get_face_cascade():
    """Get cached face cascade classifier"""
    global _face_cascade_cache
    if _face_cascade_cache is None:
        _face_cascade_cache = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    return _face_cascade_cache

@lru_cache(maxsize=100)
def cached_face_encoding(image_hash: str, student_id: str):
    """Cache face encodings to avoid recomputation"""
    # This is a placeholder - actual implementation would store/retrieve encodings
    return None

def optimize_image_for_processing(image: np.ndarray, max_size: int = 640) -> np.ndarray:
    """
    Optimize image size for faster processing
    
    Args:
        image: Input image
        max_size: Maximum dimension size
        
    Returns:
        Optimized image
    """
    height, width = image.shape[:2]
    
    # Resize if image is too large
    if max(height, width) > max_size:
        if height > width:
            new_height = max_size
            new_width = int(width * max_size / height)
        else:
            new_width = max_size
            new_height = int(height * max_size / width)
        
        image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    
    return image

def fast_face_detection(image: np.ndarray) -> bool:
    """
    Fast face detection using OpenCV Haar cascades
    
    Args:
        image: Input image
        
    Returns:
        True if face detected, False otherwise
    """
    try:
        # Convert to grayscale for faster processing
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Use cached face cascade
        face_cascade = get_face_cascade()
        faces = face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(50, 50))
        
        return len(faces) > 0
    except Exception as e:
        print(f"Fast face detection error: {e}")
        return False

def preprocess_image_fast(image: np.ndarray) -> np.ndarray:
    """
    Fast image preprocessing for face recognition
    
    Args:
        image: Input image
        
    Returns:
        Preprocessed image
    """
    try:
        # Optimize image size
        optimized = optimize_image_for_processing(image, max_size=640)
        
        # Convert to RGB for face_recognition
        rgb_image = cv2.cvtColor(optimized, cv2.COLOR_BGR2RGB)
        
        return rgb_image
    except Exception as e:
        print(f"Image preprocessing error: {e}")
        return image

def validate_image_quality(image: np.ndarray) -> Tuple[bool, str]:
    """
    Quick image quality validation
    
    Args:
        image: Input image
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
    """
    try:
        height, width = image.shape[:2]
        
        # Check minimum size
        if width < 100 or height < 100:
            return False, "Image too small"
        
        # Check aspect ratio
        aspect_ratio = width / height
        if aspect_ratio < 0.5 or aspect_ratio > 2.0:
            return False, "Invalid aspect ratio"
        
        # Check for basic face presence
        if not fast_face_detection(image):
            return False, "No face detected"
        
        return True, "Image quality OK"
        
    except Exception as e:
        return False, f"Validation error: {str(e)}"

def create_performance_monitor():
    """Create a simple performance monitor"""
    class PerformanceMonitor:
        def __init__(self):
            self.request_times = []
            self.max_requests = 100
        
        def log_request(self, duration: float):
            self.request_times.append(duration)
            if len(self.request_times) > self.max_requests:
                self.request_times.pop(0)
        
        def get_average_time(self) -> float:
            if not self.request_times:
                return 0.0
            return sum(self.request_times) / len(self.request_times)
        
        def get_stats(self) -> dict:
            if not self.request_times:
                return {"average": 0.0, "min": 0.0, "max": 0.0, "count": 0}
            
            return {
                "average": sum(self.request_times) / len(self.request_times),
                "min": min(self.request_times),
                "max": max(self.request_times),
                "count": len(self.request_times)
            }
    
    return PerformanceMonitor()

# Global performance monitor
performance_monitor = create_performance_monitor()

def time_request(func):
    """Decorator to time request processing"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start_time
            performance_monitor.log_request(duration)
            print(f"Request processed in {duration:.2f}s")
    return wrapper
