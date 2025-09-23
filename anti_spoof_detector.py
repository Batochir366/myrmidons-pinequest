# -*- coding: utf-8 -*-
"""
Anti-Spoof Detection Module
Integrates Silent Face Anti-Spoofing with a Python/Flask app
"""

import os
import cv2
import numpy as np
import warnings
from typing import Tuple

# Suppress warnings
warnings.filterwarnings("ignore")

# Try importing Silent Face Anti-Spoofing libraries
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
    """
    Anti-spoof detection using Silent Face Anti-Spoofing models.
    Provides methods to initialize models, prepare images, and detect spoofing.
    """

    def __init__(
        self,
        model_dir: str = "./Silent_Face_Anti_Spoofing/resources/anti_spoof_models",
        device_id: int = 0,
    ):
        self.model_dir = model_dir
        self.device_id = device_id
        self.model_test = None
        self.image_cropper = None
        self.initialized = False

        if ANTI_SPOOF_AVAILABLE:
            self._initialize()

    def _initialize(self):
        """Initialize the anti-spoof detection models."""
        try:
            print(f"📁 Checking model directory: {self.model_dir}")
            if not os.path.exists(self.model_dir):
                print(f"⚠️ Model directory {self.model_dir} not found")
                return
                
            files = os.listdir(self.model_dir)
            print(f"📄 Files in model directory: {files}")
            
            # Check for both .onnx and .pth files
            model_files = [f for f in files if f.endswith(('.onnx', '.pth'))]
            print(f"🔍 Model files found: {model_files}")
            
            if not model_files:
                print("❌ No model files (.onnx or .pth) found!")
                return

            self.model_test = AntiSpoofPredict(self.device_id)
            self.image_cropper = CropImage()
            self.initialized = True
            print("✅ Anti-spoof detection initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize anti-spoof detection: {e}")
            self.initialized = False

    def check_image_aspect_ratio(self, image: np.ndarray) -> bool:
        """Check if the image has the correct 3:4 aspect ratio."""
        height, width = image.shape[:2]
        ratio = width / height
        expected_ratio = 3 / 4
        tolerance = 0.1
        return abs(ratio - expected_ratio) < tolerance

    def prepare_image_for_detection(self, image: np.ndarray) -> np.ndarray:
        """Resize the image to maintain a 3:4 width:height ratio."""
        height, width = image.shape[:2]
        new_width = int(height * 3 / 4)
        resized_image = cv2.resize(image, (new_width, height))
        return resized_image

    def detect_spoof(self, image: np.ndarray) -> Tuple[bool, float, str]:
        """
        Detect if a face image is real or spoofed.

        Args:
            image (np.ndarray): OpenCV image.

        Returns:
            Tuple[bool, float, str]: (is_real, confidence, message)
        """
        if not self.is_available():
            print("⚠️ Anti-spoof detection not available, allowing access")
            return True, 0.5, "Anti-spoof detection not available - access granted"

        try:
            prepared_image = self.prepare_image_for_detection(image)

            if not self.check_image_aspect_ratio(prepared_image):
                print("⚠️ Image aspect ratio not 3:4, allowing access")
                return True, 0.6, "Image aspect ratio warning - access granted"

            # Get face bounding box
            image_bbox = self.model_test.get_bbox(prepared_image)
            if image_bbox is None:
                print("⚠️ No face detected, denying access")
                return False, 0.0, "No face detected"

            # Load model files (both .onnx and .pth supported)
            model_files = [
                f for f in os.listdir(self.model_dir) 
                if f.endswith((".onnx", ".pth"))
            ]
            if not model_files:
                print(f"⚠️ No model files found in {self.model_dir}")
                print("Available files:", os.listdir(self.model_dir) if os.path.exists(self.model_dir) else "Directory not found")
                # In production, you might want to allow access when models are missing
                return True, 0.5, "No model files found - access granted"

            prediction = None

            # Process each model
            for model_name in model_files:
                try:
                    h_input, w_input, model_type, scale = parse_model_name(model_name)
                    param = {
                        "org_img": prepared_image,
                        "bbox": image_bbox,
                        "scale": scale,
                        "out_w": w_input,
                        "out_h": h_input,
                        "crop": self.image_cropper,
                    }
                    result, test_speed = self.model_test.predict(
                        os.path.join(self.model_dir, model_name), param
                    )
                    prediction = result if prediction is None else prediction + result
                    print(f"✅ Processed model {model_name} successfully")
                except Exception as e:
                    print(f"❌ Error processing model {model_name}: {e}")
                    continue

            if prediction is None:
                print("⚠️ No successful model predictions, allowing access")
                return True, 0.5, "Model prediction failed - access granted"

            label = np.argmax(prediction)
            confidence = prediction[0][label] / 2
            is_real = label == 1
            message = (
                f"Real face detected (score: {confidence:.2f})"
                if is_real
                else "Бодит хүн биш байна, Хуурах гэж оролдох хэрэггүй шүү"
            )

            print(f"✅ Anti-spoof detection: {message}")
            return is_real, confidence, message

        except Exception as e:
            print(f"❌ Error in anti-spoof detection: {e}")
            # In case of errors, allow access (you can change this based on security requirements)
            return True, 0.5, f"Detection error - access granted: {str(e)}"

    def is_available(self) -> bool:
        """Check if anti-spoof detection is available."""
        return self.initialized and ANTI_SPOOF_AVAILABLE


# Global instance
anti_spoof_detector = AntiSpoofDetector()


def check_face_liveness(image: np.ndarray) -> Tuple[bool, float, str]:
    """
    Check if a face image is live (real) or spoofed.

    Args:
        image (np.ndarray): OpenCV image.

    Returns:
        Tuple[bool, float, str]: (is_live, confidence, message)
    """
    return anti_spoof_detector.detect_spoof(image)


def is_anti_spoof_available() -> bool:
    """Check if anti-spoof detection is available."""
    return anti_spoof_detector.is_available()