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
        """Check if image has correct 3:4 aspect ratio"""
        height, width = image.shape[:2]
        ratio = width / height
        expected_ratio = 3 / 4
        tolerance = 0.1  # Increased tolerance
        return abs(ratio - expected_ratio) < tolerance

    def prepare_image_for_detection(self, image: np.ndarray) -> np.ndarray:
        """Prepare image for anti-spoof detection - resize to 3:4 ratio"""
        height, width = image.shape[:2]
        
        # Resize image to have 3:4 width:height ratio like the working version
        new_width = int(height * 3 / 4)
        resized_image = cv2.resize(image, (new_width, height))
        
        return resized_image

    def _pre_check_spoof(self, image: np.ndarray) -> Tuple[bool, float, str]:
        """Pre-check for obvious spoofs before running ML models"""
        try:
            # Check image size
            height, width = image.shape[:2]
            if width < 200 or height < 200:
                return False, 0.1, "Image too small for reliable detection"
            
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Check for screen artifacts (horizontal lines)
            horizontal_edges = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            horizontal_lines = np.sum(np.abs(horizontal_edges) > 50)
            if horizontal_lines > gray.shape[0] * 0.1:
                return False, 0.1, "Screen refresh lines detected"
            
            # Check for pixelation (compressed images)
            resized = cv2.resize(gray, (gray.shape[1]//4, gray.shape[0]//4))
            upscaled = cv2.resize(resized, (gray.shape[1], gray.shape[0]))
            mse = np.mean((gray.astype(float) - upscaled.astype(float)) ** 2)
            if mse < 100:
                return False, 0.2, "Pixelation detected - possible screen capture"
            
            # Check for color diversity (photos have less color variation)
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            unique_colors = len(np.unique(hsv.reshape(-1, hsv.shape[2]), axis=0))
            total_pixels = hsv.shape[0] * hsv.shape[1]
            color_diversity = unique_colors / total_pixels
            if color_diversity < 0.01:
                return False, 0.3, "Low color diversity - possible compressed image"
            
            # Check for sharpness (photos are usually too sharp)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            if laplacian_var > 1000:
                return False, 0.2, "Image too sharp - possible photo"
            
            # Check for lighting uniformity (photos have more uniform lighting)
            mean_brightness = np.mean(gray)
            std_brightness = np.std(gray)
            lighting_uniformity = std_brightness / mean_brightness if mean_brightness > 0 else 0
            if lighting_uniformity < 0.3:
                return False, 0.3, "Uniform lighting - possible photo"
            
            return True, 0.8, "Pre-check passed"
            
        except Exception as e:
            print(f"Pre-check error: {e}")
            return True, 0.5, f"Pre-check failed: {str(e)}"

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
        
        # First run pre-checks for obvious spoofs
        pre_check_result = self._pre_check_spoof(image)
        if not pre_check_result[0]:
            return pre_check_result
        
        try:
            # Prepare image with correct aspect ratio (like working version)
            prepared_image = self.prepare_image_for_detection(image)
            
            # Check aspect ratio
            if not self.check_image_aspect_ratio(prepared_image):
                print(f"Image aspect ratio check failed. Image shape: {prepared_image.shape}")
                return False, 0.0, "Image aspect ratio is not 3:4"
            
            # Get face bounding box
            image_bbox = self.model_test.get_bbox(prepared_image)
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
            
            # Process each model (exactly like working version)
            for model_name in model_files:
                try:
                    h_input, w_input, model_type, scale = parse_model_name(model_name)
                    param = {
                        "org_img": prepared_image,
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
            
            # Get final prediction (exactly like working version)
            label = np.argmax(prediction)
            confidence = prediction[0][label] / 2
            
            # Much stricter result determination
            # Require higher confidence for real faces
            is_real = label == 1 and confidence > 0.6  # Increased threshold
            
            if is_real:
                message = f"Real face detected (score: {confidence:.2f})"
            else:
                message = f"Бодит хүн биш байна,Хуурах гэж оролдох хэрэггүй шүү"
            
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