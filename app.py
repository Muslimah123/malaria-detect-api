# # python_server/app.py
# import os
# import numpy as np
# import tensorflow as tf
# import cv2
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import logging
# import base64
# from io import BytesIO
# from PIL import Image

# app = Flask(__name__)
# CORS(app)

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Model paths
# MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pretrained')
# THIN_MODEL_PATH = os.path.join(MODELS_DIR, 'malaria_thinsmear_44_retrainSudan_20P_4000C_separate.pb')
# THICK_MODEL_PATH = os.path.join(MODELS_DIR, 'ThickSmearModel.h5.pb')

# # Cache for loaded models
# models = {
#     'thin': None,
#     'thick': None
# }

# def load_model(model_type):
#     """Load a TensorFlow model from .pb file"""
#     if models[model_type] is not None:
#         return models[model_type]
    
#     try:
#         model_path = THIN_MODEL_PATH if model_type == 'thin' else THICK_MODEL_PATH
#         logger.info(f"Loading {model_type} model from {model_path}")
        
#         # Load the TensorFlow model
#         with tf.Graph().as_default() as graph:
#             with tf.compat.v1.Session(graph=graph) as sess:
#                 # Load the protobuf file
#                 with tf.io.gfile.GFile(model_path, 'rb') as f:
#                     graph_def = tf.compat.v1.GraphDef()
#                     graph_def.ParseFromString(f.read())
#                     tf.import_graph_def(graph_def, name='')
                
#                 # Get input and output tensors
#                 input_tensor = graph.get_tensor_by_name('input:0')
#                 output_tensor = graph.get_tensor_by_name('output:0')
                
#                 # Store model components
#                 models[model_type] = {
#                     'session': sess,
#                     'graph': graph,
#                     'input': input_tensor,
#                     'output': output_tensor
#                 }
                
#                 logger.info(f"{model_type} model loaded successfully")
#                 return models[model_type]
#     except Exception as e:
#         logger.error(f"Error loading {model_type} model: {str(e)}")
#         raise

# def preprocess_image(image_data, model_type):
#     """Preprocess image for model input"""
#     # Convert to OpenCV format
#     nparr = np.frombuffer(image_data, np.uint8)
#     img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
#     # Extract green channel (as in Java implementation)
#     green_channel = img[:, :, 1]
    
#     # Resize based on model type
#     input_size = (64, 64) if model_type == 'thin' else (32, 32)
#     resized = cv2.resize(green_channel, input_size, interpolation=cv2.INTER_AREA)
    
#     # Normalize to [0,1]
#     normalized = resized.astype(np.float32) / 255.0
    
#     # Add batch and channel dimensions
#     return np.expand_dims(np.expand_dims(normalized, axis=0), axis=-1)

# def run_inference(image_data, model_type):
#     """Run inference on preprocessed image"""
#     try:
#         # Load model
#         model = load_model(model_type)
        
#         # Preprocess image
#         input_tensor = preprocess_image(image_data, model_type)
        
#         # Run inference
#         prediction = model['session'].run(
#             model['output'], 
#             {model['input']: input_tensor}
#         )
        
#         # Get probability
#         probability = float(prediction[0][0])
        
#         return {
#             'probability': probability,
#             'isInfected': probability > 0.5
#         }
#     except Exception as e:
#         logger.error(f"Error running inference: {str(e)}")
#         raise

# @app.route('/classify', methods=['POST'])
# def classify_image():
#     """API endpoint to classify a malaria image"""
#     try:
#         # Get request data
#         data = request.json
#         if not data or 'image' not in data or 'modelType' not in data:
#             return jsonify({
#                 'error': 'Missing required fields: image and modelType'
#             }), 400
        
#         # Get model type
#         model_type = data['modelType'].lower()
#         if model_type not in ['thin', 'thick']:
#             return jsonify({
#                 'error': 'modelType must be either "thin" or "thick"'
#             }), 400
        
#         # Decode base64 image
#         image_data = base64.b64decode(data['image'])
        
#         # Run inference
#         result = run_inference(image_data, model_type)
        
#         return jsonify(result)
    
#     except Exception as e:
#         logger.error(f"Error processing request: {str(e)}")
#         return jsonify({
#             'error': str(e)
#         }), 500

# @app.route('/classify-batch', methods=['POST'])
# def classify_batch():
#     """API endpoint to classify multiple images"""
#     try:
#         # Get request data
#         data = request.json
#         if not data or 'images' not in data or 'modelType' not in data:
#             return jsonify({
#                 'error': 'Missing required fields: images and modelType'
#             }), 400
        
#         # Get model type
#         model_type = data['modelType'].lower()
#         if model_type not in ['thin', 'thick']:
#             return jsonify({
#                 'error': 'modelType must be either "thin" or "thick"'
#             }), 400
        
#         # Process each image
#         results = []
#         for image_data in data['images']:
#             try:
#                 # Decode base64 image
#                 image_bytes = base64.b64decode(image_data)
                
#                 # Run inference
#                 result = run_inference(image_bytes, model_type)
#                 results.append(result)
#             except Exception as e:
#                 logger.error(f"Error processing image: {str(e)}")
#                 results.append({
#                     'error': str(e),
#                     'probability': 0,
#                     'isInfected': False
#                 })
        
#         # Calculate statistics
#         total_patches = len(results)
#         infected_patches = sum(1 for r in results if r.get('isInfected', False))
#         infection_rate = infected_patches / total_patches if total_patches > 0 else 0
#         avg_confidence = sum(r.get('probability', 0) for r in results) / total_patches if total_patches > 0 else 0
        
#         return jsonify({
#             'results': results,
#             'totalPatches': total_patches,
#             'infectedPatches': infected_patches,
#             'infectionRate': infection_rate,
#             'averageConfidence': avg_confidence
#         })
    
#     except Exception as e:
#         logger.error(f"Error processing batch request: {str(e)}")
#         return jsonify({
#             'error': str(e)
#         }), 500

# @app.route('/health', methods=['GET'])
# def health_check():
#     """API endpoint to check server health"""
#     return jsonify({
#         'status': 'healthy',
#         'modelStatus': {
#             'thin': 'loaded' if models['thin'] is not None else 'not loaded',
#             'thick': 'loaded' if models['thick'] is not None else 'not loaded'
#         }
#     })

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5500)







"""
Malaria Detection Inference API

This Flask application loads the pre-trained malaria detection models
and provides API endpoints for performing inference on image patches.
"""

import os
import sys
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up model paths
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'pretrained')
THIN_MODEL_PATH = os.path.join(MODELS_DIR, 'malaria_thinsmear_44_retrainSudan_20P_4000C_separate.pb')
THICK_MODEL_PATH = os.path.join(MODELS_DIR, 'ThickSmearModel.h5.pb')

# Global variables to store loaded models
thin_model = None
thick_model = None

def load_models():
    """Load both thin and thick smear models"""
    global thin_model, thick_model
    
    try:
        # Load thin smear model
        logger.info(f"Loading thin smear model from: {THIN_MODEL_PATH}")
        thin_model = tf.saved_model.load(THIN_MODEL_PATH)
        logger.info("Thin smear model loaded successfully")
        
        # Load thick smear model
        logger.info(f"Loading thick smear model from: {THICK_MODEL_PATH}")
        thick_model = tf.saved_model.load(THICK_MODEL_PATH)
        logger.info("Thick smear model loaded successfully")
        
        # Print signatures for debugging
        logger.info(f"Thin model signatures: {list(thin_model.signatures.keys())}")
        logger.info(f"Thick model signatures: {list(thick_model.signatures.keys())}")
        
        return True
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        return False

def preprocess_image(image_data, is_thin=True):
    """
    Preprocess image data for model input
    
    Args:
        image_data: PIL Image or numpy array
        is_thin: True for thin smear model, False for thick smear model
    
    Returns:
        Preprocessed numpy array ready for model input
    """
    try:
        # Convert to numpy array if it's a PIL Image
        if isinstance(image_data, Image.Image):
            img_array = np.array(image_data)
        else:
            img_array = image_data
            
        # Extract green channel (index 1 in RGB)
        if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
            green_channel = img_array[:, :, 1]
        else:
            # If grayscale, use as is
            green_channel = img_array
            
        # Resize to expected dimensions
        if is_thin:
            # Thin smear model expects 64x64
            target_size = (64, 64)
        else:
            # Thick smear model expects 32x32
            target_size = (32, 32)
            
        # Resize using PIL for better quality
        img_pil = Image.fromarray(green_channel)
        img_resized = img_pil.resize(target_size, Image.BILINEAR)
        img_array = np.array(img_resized)
        
        # Normalize to [0, 1]
        img_array = img_array.astype(np.float32) / 255.0
        
        # Add batch and channel dimensions
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        img_array = np.expand_dims(img_array, axis=-1)  # Add channel dimension
        
        return img_array
    
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise

def run_inference(preprocessed_image, is_thin=True):
    """
    Run inference on a preprocessed image
    
    Args:
        preprocessed_image: Preprocessed numpy array
        is_thin: True for thin smear model, False for thick smear model
    
    Returns:
        Dictionary with prediction results
    """
    try:
        model = thin_model if is_thin else thick_model
        
        if model is None:
            raise ValueError(f"{'Thin' if is_thin else 'Thick'} smear model not loaded")
        
        # Get the serving signature
        serving_fn = model.signatures['serving_default']
        
        # Convert to TensorFlow tensor
        input_tensor = tf.convert_to_tensor(preprocessed_image, dtype=tf.float32)
        
        # Get input tensor name from model signature
        input_name = list(serving_fn.structured_input_signature[1].keys())[0]
        
        # Run inference
        results = serving_fn(**{input_name: input_tensor})
        
        # Get output tensor 
        output_name = list(results.keys())[0]
        prediction = results[output_name].numpy()
        
        # Extract probability value
        probability = float(prediction[0][0])
        
        # Apply threshold
        threshold = 0.5
        is_infected = probability > threshold
        
        return {
            "probability": probability,
            "isInfected": bool(is_infected)
        }
    
    except Exception as e:
        logger.error(f"Error during inference: {str(e)}")
        return {
            "probability": 0.0,
            "isInfected": False,
            "error": str(e)
        }

@app.route('/status', methods=['GET'])
def status():
    """API status endpoint"""
    return jsonify({
        "status": "online",
        "models_loaded": {
            "thin_smear": thin_model is not None,
            "thick_smear": thick_model is not None
        }
    })

@app.route('/classify', methods=['POST'])
def classify_patch():
    """
    Classify a single image patch
    
    Expects JSON with:
    - image_base64: Base64 encoded image
    - type: 'thin' or 'thick'
    
    Returns:
    - probability: Float between 0 and 1
    - isInfected: Boolean
    """
    try:
        # Check if models are loaded
        if thin_model is None or thick_model is None:
            return jsonify({
                "error": "Models not loaded"
            }), 500
        
        # Parse request
        data = request.json
        if not data:
            return jsonify({
                "error": "No data provided"
            }), 400
        
        image_base64 = data.get('image_base64')
        smear_type = data.get('type', 'thin')
        
        if not image_base64:
            return jsonify({
                "error": "No image provided"
            }), 400
        
        # Decode image
        try:
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            return jsonify({
                "error": f"Invalid image data: {str(e)}"
            }), 400
        
        # Preprocess image
        is_thin = smear_type.lower() == 'thin'
        preprocessed_image = preprocess_image(image, is_thin)
        
        # Run inference
        result = run_inference(preprocessed_image, is_thin)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in classify_patch: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/batch-classify', methods=['POST'])
def batch_classify():
    """
    Classify multiple image patches
    
    Expects JSON with:
    - images: Array of objects with:
      - image_base64: Base64 encoded image
      - patch_id: Unique identifier for the patch
    - type: 'thin' or 'thick'
    
    Returns:
    - results: Array of classification results
    - summary: Summary statistics
    """
    try:
        # Check if models are loaded
        if thin_model is None or thick_model is None:
            return jsonify({
                "error": "Models not loaded"
            }), 500
        
        # Parse request
        data = request.json
        if not data:
            return jsonify({
                "error": "No data provided"
            }), 400
        
        images = data.get('images', [])
        smear_type = data.get('type', 'thin')
        
        if not images:
            return jsonify({
                "error": "No images provided"
            }), 400
        
        # Process each image
        is_thin = smear_type.lower() == 'thin'
        results = []
        
        for img_data in images:
            patch_id = img_data.get('patch_id', '')
            image_base64 = img_data.get('image_base64', '')
            
            if not image_base64:
                results.append({
                    "patch_id": patch_id,
                    "probability": 0.0,
                    "isInfected": False,
                    "error": "No image data provided"
                })
                continue
            
            try:
                # Decode image
                image_data = base64.b64decode(image_base64)
                image = Image.open(io.BytesIO(image_data))
                
                # Preprocess image
                preprocessed_image = preprocess_image(image, is_thin)
                
                # Run inference
                result = run_inference(preprocessed_image, is_thin)
                result["patch_id"] = patch_id
                
                results.append(result)
            except Exception as e:
                results.append({
                    "patch_id": patch_id,
                    "probability": 0.0,
                    "isInfected": False,
                    "error": str(e)
                })
        
        # Calculate summary statistics
        total_patches = len(results)
        infected_patches = sum(1 for r in results if r.get('isInfected', False))
        average_probability = sum(r.get('probability', 0) for r in results) / total_patches if total_patches > 0 else 0
        
        return jsonify({
            "results": results,
            "summary": {
                "totalPatches": total_patches,
                "infectedPatches": infected_patches,
                "infectionRate": infected_patches / total_patches if total_patches > 0 else 0,
                "averageProbability": average_probability
            }
        })
    
    except Exception as e:
        logger.error(f"Error in batch_classify: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Load models before starting the server
    if load_models():
        logger.info("Models loaded successfully, starting server")
        app.run(host='0.0.0.0', port=5005, debug=False)
    else:
        logger.error("Failed to load models, exiting")
        sys.exit(1)