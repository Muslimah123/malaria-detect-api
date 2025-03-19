// src/services/tensorflowClassifier.js
const tf = require('@tensorflow/tfjs-node');  // Use TensorFlow.js with Node.js backend
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const logger = require('../config/logger');

// Path to models directory
const MODELS_DIR = path.join(__dirname, '../../models/cnn');

// Model configurations
const MODEL_CONFIGS = {
  thin: {
    modelPath: path.join(MODELS_DIR, 'thin_smear_model/model.json'),
    inputWidth: 64,
    inputHeight: 64,
    inputChannels: 1,  // Grayscale (green channel)
    threshold: 0.5     // Threshold for positive classification
  },
  thick: {
    modelPath: path.join(MODELS_DIR, 'thick_smear_model/model.json'),
    inputWidth: 32,
    inputHeight: 32,
    inputChannels: 1,  // Grayscale (green channel)
    threshold: 0.5     // Threshold for positive classification
  }
};

// Cache for loaded models
const modelCache = {
  thin: null,
  thick: null
};

/**
 * Load a TensorFlow.js model for malaria classification
 * @param {string} type - 'thin' or 'thick'
 * @returns {Promise<tf.LayersModel>} Loaded TensorFlow.js model
 */
async function loadModel(type) {
  try {
    // Check if model is already loaded
    if (modelCache[type]) {
      logger.debug(`Using cached ${type} smear model`);
      return modelCache[type];
    }
    
    const config = MODEL_CONFIGS[type];
    if (!config) {
      throw new Error(`Unknown model type: ${type}`);
    }
    
    // Check if model file exists
    if (!fs.existsSync(config.modelPath)) {
      throw new Error(`Model file not found: ${config.modelPath}`);
    }
    
    // Load model
    logger.info(`Loading ${type} smear model from ${config.modelPath}`);
    const model = await tf.loadLayersModel(`file://${config.modelPath}`);
    
    // Warm up the model with a dummy prediction
    const dummyInput = tf.zeros([1, config.inputHeight, config.inputWidth, config.inputChannels]);
    model.predict(dummyInput);
    dummyInput.dispose();
    
    // Cache the model
    modelCache[type] = model;
    
    return model;
  } catch (error) {
    logger.error(`Error loading ${type} smear model:`, error);
    throw error;
  }
}

/**
 * Preprocess an image patch for CNN input
 * @param {string} imagePath - Path to image patch
 * @param {Object} config - Model configuration
 * @returns {Promise<tf.Tensor4D>} Preprocessed tensor ready for model input
 */
async function preprocessImage(imagePath, config) {
  try {
    // Extract green channel and resize to model input dimensions (as in Java code)
    const { data, info } = await sharp(imagePath)
      .resize(config.inputWidth, config.inputHeight, {
        fit: 'fill',
        position: 'center'
      })
      .removeAlpha()
      .extractChannel(1) // Green channel (0=red, 1=green, 2=blue)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Convert raw data to tensor
    const tensor = tf.tensor3d(
      new Uint8Array(data),
      [info.height, info.width, 1] // 1 channel (grayscale)
    );
    
    // Normalize to [0,1] range (required by the model)
    const normalized = tensor.div(255.0);
    
    // Add batch dimension for model input
    const batched = normalized.expandDims(0);
    
    // Clean up intermediate tensors
    tensor.dispose();
    normalized.dispose();
    
    return batched;
  } catch (error) {
    logger.error('Error preprocessing image:', error);
    throw error;
  }
}

/**
 * Classify a single image patch for malaria detection
 * @param {string} imagePath - Path to image patch
 * @param {string} type - 'thin' or 'thick'
 * @returns {Promise<Object>} Classification result with probability and boolean
 */
async function classifyPatch(imagePath, type) {
  let inputTensor = null;
  
  try {
    // Get model configuration
    const config = MODEL_CONFIGS[type];
    if (!config) {
      throw new Error(`Unknown model type: ${type}`);
    }
    
    // Load model
    const model = await loadModel(type);
    
    // Preprocess image
    inputTensor = await preprocessImage(imagePath, config);
    
    // Run inference
    const prediction = model.predict(inputTensor);
    
    // Get result as float
    const resultArray = await prediction.data();
    const probability = resultArray[0];
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();
    
    // Log result
    logger.debug(`Classified ${type} smear patch: probability ${probability.toFixed(4)}`);
    
    // Return classification result
    return {
      probability,
      isInfected: probability > config.threshold
    };
  } catch (error) {
    logger.error(`Error classifying ${type} smear patch:`, error);
    
    // Clean up tensors in case of error
    if (inputTensor) inputTensor.dispose();
    
    // Return default result for error case
    return {
      probability: 0,
      isInfected: false,
      error: error.message
    };
  }
}

/**
 * Classify multiple patches and calculate overall statistics
 * @param {Array<string>} patchPaths - Array of patch file paths
 * @param {string} type - 'thin' or 'thick'
 * @returns {Promise<Object>} Classification results with statistics
 */
async function classifyPatches(patchPaths, type) {
  try {
    logger.info(`Classifying ${patchPaths.length} ${type} smear patches using TensorFlow.js`);
    
    let infectedCount = 0;
    const results = [];
    let totalConfidence = 0;
    
    // Process patches in batches to prevent memory issues
    const batchSize = 10;
    
    for (let i = 0; i < patchPaths.length; i += batchSize) {
      const batch = patchPaths.slice(i, i + batchSize);
      
      // Process each patch in the batch
      const batchPromises = batch.map(patch => classifyPatch(patch, type));
      const batchResults = await Promise.all(batchPromises);
      
      // Count infected patches and collect results
      for (const result of batchResults) {
        if (result.isInfected) {
          infectedCount++;
        }
        totalConfidence += result.probability;
        results.push(result);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      logger.debug(`Processed ${i + batch.length}/${patchPaths.length} patches`);
    }
    
    // Calculate overall statistics
    const infectionRate = infectedCount / patchPaths.length;
    const averageConfidence = totalConfidence / patchPaths.length;
    
    logger.info(`Classification complete: ${infectedCount}/${patchPaths.length} infected patches (${(infectionRate * 100).toFixed(2)}%)`);
    
    // Return comprehensive results
    return {
      totalPatches: patchPaths.length,
      infectedPatches: infectedCount,
      infectionRate,
      averageConfidence,
      results
    };
  } catch (error) {
    logger.error(`Error classifying ${type} smear patches:`, error);
    throw error;
  }
}

/**
 * Clean up models and release resources
 */
function cleanupModels() {
  try {
    // Dispose of all loaded models
    Object.keys(modelCache).forEach(key => {
      if (modelCache[key]) {
        modelCache[key].dispose();
        modelCache[key] = null;
      }
    });
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    logger.info('Cleaned up TensorFlow.js models');
  } catch (error) {
    logger.error('Error cleaning up models:', error);
  }
}

// Handle process exit to clean up resources
process.on('SIGINT', () => {
  cleanupModels();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanupModels();
  process.exit(0);
});

module.exports = {
  loadModel,
  classifyPatch,
  classifyPatches,
  cleanupModels
};