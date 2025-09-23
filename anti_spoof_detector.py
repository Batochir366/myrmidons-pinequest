# -*- coding: utf-8 -*-
"""
Anti-Spoof Detection Module
Integrates Silent Face Anti-Spoofing with Flask app
"""

import os
import cv2
import numpy as np
import time
import warnings
from typing import Tuple, Optional

# Suppress warnings
warnings.filterwarnings('ignore')

try:
    from Silent_Face_Anti_Spoofing.src.anti_spoof_predict import AntiSpoofPredict
    from Silent_Face_Anti_Spoofing.src.generate_patches import CropImage
    from Silent_Face_Anti_Spoofing.src.utility import parse_model_name
    ANTI_SPOOF_AVAILABLE = True
    print("✅ Anti-spoof detection libraries loaded successfully")
except ImportError as e:
    print(f"⚠️ Anti-spoof detection not available: {e}")
    ANTI_SPOOF_AVAILABLE = False

class AntiSpoofDetector:
    """Anti-spoof detection using Silent Face Anti-Spoofing models"""
    
    def __init__(self, model_dir: str = "./Silent_Face_Anti_Spoofing/resources/anti_spoof_models", device_id: int = 0):
        self.model_dir = model_dir
        self.device_id = device_id
        self.model_test = None
        self.image_cropper = None
        self.initialized = False
        
        if ANTI_SPOOF_AVAILABLE:
            self._initialize()
    
    def _initialize(self):
        """Initialize the anti-spoof detection models"""
        try:
            if not os.path.exists(self.model_dir):
                print(f"⚠️ Model directory {self.model_dir} not found")
                return
                
            self.model_test = AntiSpoofPredict(self.device_id)
            self.image_cropper = CropImage()
            self.initialized = True
            print("✅ Anti-spoof detection initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize anti-spoof detection: {e}")
            self.initialized = False
    
    def check_image_aspect_ratio(self, image: np.ndarray) -> bool:
        height, width, _ = image.shape
        ratio = width / height
        expected_ratio = 3 / 4
        tolerance = 0.05  
        return abs(ratio - expected_ratio) < tolerance

    def resize_image_for_detection(self, image: np.ndarray) -> np.ndarray:
        height, width = image.shape[:2]
        desired_ratio = 3 / 4
        current_ratio = width / height

        # Center crop to nearest 3:4 aspect ratio
        if current_ratio > desired_ratio:
            # Too wide, crop width
            new_width = int(height * desired_ratio)
            x_offset = (width - new_width) // 2
            image = image[:, x_offset:x_offset + new_width]
        elif current_ratio < desired_ratio:
            # Too tall, crop height
            new_height = int(width / desired_ratio)
            y_offset = (height - new_height) // 2
            image = image[y_offset:y_offset + new_height, :]

        return image

    def detect_spoof(self, image: np.ndarray) -> Tuple[bool, float, str]:
        """
        Detect if the image is a spoof (fake) or real face
        
        Args:
            image: OpenCV image (numpy array)
            
        Returns:
            Tuple[bool, float, str]: (is_real, confidence, message)
                - is_real: True if real face, False if spoof
                - confidence: Confidence score (0-1)
                - message: Human readable message
        """
        if not self.initialized or not ANTI_SPOOF_AVAILABLE:
            return True, 0.5, "Anti-spoof detection not available"
        
        try:
            # Resize image to correct aspect ratio
            resized_image = self.resize_image_for_detection(image)
            
            # Check aspect ratio
            if not self.check_image_aspect_ratio(resized_image):
                return False, 0.0, "Invalid image aspect ratio"
            
            # Get face bounding box
            image_bbox = self.model_test.get_bbox(resized_image)
            if image_bbox is None:
                return False, 0.0, "No face detected"
            
            # Initialize prediction
            prediction = np.zeros((1, 3))
            test_speed = 0
            
            # Check if model directory exists and has models
            if not os.path.exists(self.model_dir):
                return True, 0.5, "Model directory not found"
            
            model_files = [f for f in os.listdir(self.model_dir) if f.endswith('.pth')]
            if not model_files:
                return True, 0.5, "No model files found"
            
            # Process each model
            for model_name in model_files:
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
                    start = time.time()
                    prediction += self.model_test.predict(img, os.path.join(self.model_dir, model_name))
                    test_speed += time.time() - start
                except Exception as e:
                    print(f"Error processing model {model_name}: {e}")
                    continue
            
            # Get final prediction
            label = np.argmax(prediction)
            confidence = prediction[0][label] / 2
            
            # Determine result
            is_real = label == 1
            if is_real:
                message = f"Real face detected (confidence: {confidence:.2f})"
            else:
                message = f"Fake face detected (confidence: {confidence:.2f})"
            
            print(f"Anti-spoof detection: {message}, Speed: {test_speed:.2f}s")
            return is_real, confidence, message
            
        except Exception as e:
            print(f"Error in anti-spoof detection: {e}")
            return True, 0.5, f"Detection error: {str(e)}"
    
    def is_available(self) -> bool:
        """Check if anti-spoof detection is available"""
        return self.initialized and ANTI_SPOOF_AVAILABLE

# Global instance
anti_spoof_detector = AntiSpoofDetector()

def check_face_liveness(image: np.ndarray) -> Tuple[bool, float, str]:
    """
    Check if a face image is live (real) or spoofed
    
    Args:
        image: OpenCV image (numpy array)
        
    Returns:
        Tuple[bool, float, str]: (is_live, confidence, message)
    """
    return anti_spoof_detector.detect_spoof(image)

def is_anti_spoof_available() -> bool:
    """Check if anti-spoof detection is available"""
    return anti_spoof_detector.is_available()