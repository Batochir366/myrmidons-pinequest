# -*- coding: utf-8 -*-
# @Time : 20-6-9 下午3:06
# @Author : zhuying
# @Company : Minivision
# @File : test.py
# @Software : PyCharm

import os
import cv2
import numpy as np
import argparse
import warnings
import time

from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name
warnings.filterwarnings('ignore')


SAMPLE_IMAGE_PATH = "./images/sample/"


# 因为安卓端APK获取的视频流宽高比为3:4,为了与之一致，所以将宽高比限制为3:4
def check_image(image):
    height, width, channel = image.shape
    if width/height != 3/4:
        print("Image is not appropriate!!!\nHeight/Width should be 4/3.")
        return False
    else:
        return True


def test(image, model_dir, device_id):
    """
    Test function for anti-spoofing detection
    Args:
        image: OpenCV image (numpy array)
        model_dir: Path to model directory
        device_id: Device ID for PyTorch
    Returns:
        int: 1 for real face, 0 for fake face
    """
    try:
        model_test = AntiSpoofPredict(device_id)
        image_cropper = CropImage()
        image = cv2.resize(image, (int(image.shape[0]*3/4), image.shape[0]))
        result = check_image(image)
        if result is False:
            print("Image aspect ratio is not 3:4")
            return 
            
        image_bbox = model_test.get_bbox(image)
        prediction = np.zeros((1, 3))
        test_speed = 0
        
        # Check if model directory exists
        if not os.path.exists(model_dir):
            print(f"Model directory {model_dir} not found")
            return 0
            
        # sum the prediction from single model's result
        model_files = os.listdir(model_dir)
        if not model_files:
            print("No model files found in directory")
            return 0
            
        for model_name in model_files:
            if not model_name.endswith('.pth'):
                continue
                
            try:
                h_input, w_input, model_type, scale = parse_model_name(model_name)
                param = {
                    "org_img": image,
                    "bbox": image_bbox,
                    "scale": scale,
                    "out_w": w_input,
                    "out_h": h_input,
                    "crop": True,
                }
                if scale is None:
                    param["crop"] = False
                img = image_cropper.crop(**param)
                start = time.time()
                prediction += model_test.predict(img, os.path.join(model_dir, model_name))
                test_speed += time.time()-start
            except Exception as e:
                print(f"Error processing model {model_name}: {e}")
                continue

        # draw result of prediction
        label = np.argmax(prediction)
        value = prediction[0][label]/2
        
        if label == 1:
            print(f"Real Face detected. Score: {value:.2f}")
        else:
            print(f"Fake Face detected. Score: {value:.2f}")
            
        print(f"Prediction cost {test_speed:.2f} s")
        return label
        
    except Exception as e:
        print(f"Error in anti-spoofing test: {e}")
        return 0


if __name__ == "__main__":
    desc = "test"
    parser = argparse.ArgumentParser(description=desc)
    parser.add_argument(
        "--device_id",
        type=int,
        default=0,
        help="which gpu id, [0/1/2/3]")
    parser.add_argument(
        "--model_dir",
        type=str,
        default="./resources/anti_spoof_models",
        help="model_lib used to test")
    parser.add_argument(
        "--image_name",
        type=str,
        default="image_F1.jpg",
        help="image used to test")
    args = parser.parse_args()
    test(args.image_name, args.model_dir, args.device_id)
