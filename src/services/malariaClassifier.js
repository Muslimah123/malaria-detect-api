// src/services/malariaClassifier.js
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const logger = require('../config/logger');

// Path to models - matching exactly the Malaria Screener models
const MODELS_DIR = path.join(__dirname, '../../models/cnn');

// Model configurations - based on the code you shared
const MODEL_CONFIGS = {
  thin: {
    path: path.join(MODELS_DIR, 'thin_smear_model/model.json'),
    inputWidth: 64,    // From CameraActivity.java
    inputHeight: 64,   // From CameraActivity.java
    inputName: 'input',
    outputName: 'output',
    inputChannels: 1,  // Assuming grayscale input; adjust if RGB
    threshold: 0.5     // Threshold for positive classification, from thin.java
  },
  thick: {
    path: path.join(MODELS_DIR, 'thick_smear_model/model.json'),
    inputWidth: 32,    // From CameraActivity.java
    inputHeight: 32,   // From CameraActivity.java
    inputName: 'input',
    outputName: 'output',
    inputChannels: 1,  // Assuming grayscale input; adjust if RGB
    threshold: 0.5     // Threshold for positive classification, from thick.java
  }
};

// Cache for loaded models
const modelCache = {
  thin: null,
  thick: null
};

/**
 * Load a model for malaria detection
 * @param {string} type - 'thin' or 'thick'
 * @returns {Object} The TensorFlow.js model
 */
async function loadModel(type) {
  try {
    // Check if model is already loaded
    if (modelCache[type]) {
      return modelCache[type];
    }
    
    const config = MODEL_CONFIGS[type];
    if (!config) {
      throw new Error(`Unknown model type: ${type}`);
    }
    
    // Check if model file exists
    if (!fs.existsSync(config.path)) {
      throw new Error(`Model file not found: ${config.path}`);
    }
    
    // Load model
    logger.info(`Loading ${type} smear model from ${config.path}`);
    const model = await tf.loadGraphModel(`file://${config.path}`);
    
    // Warm up the model with a dummy input
    const dummyInput = tf.zeros([1, config.inputHeight, config.inputWidth, config.inputChannels]);
    model.predict(dummyInput);
    dummyInput.dispose();
    
    // Cache the model
    modelCache[type] = {
      model,
      config
    };
    
    return modelCache[type];
  } catch (error) {
    logger.error(`Error loading ${type} smear model:`, error);
    throw error;
  }
}

/**
 * Preprocess an image patch for the model
 * @param {Buffer|string} imageData - Image data or path
 * @param {Object} config - Model configuration
 * @returns {tf.Tensor} Preprocessed tensor
 */
async function preprocessImage(imageData, config) {
  try {
    // Load and preprocess the image
    let processedImageBuffer;
    
    if (typeof imageData === 'string') {
      // If image path is provided
      processedImageBuffer = await sharp(imageData)
        .resize(config.inputWidth, config.inputHeight)
        .grayscale()  // Convert to grayscale if input is grayscale
        .raw()
        .toBuffer();
    } else {
      // If image buffer is provided
      processedImageBuffer = await sharp(imageData)
        .resize(config.inputWidth, config.inputHeight)
        .grayscale()  // Convert to grayscale if input is grayscale
        .raw()
        .toBuffer();
    }
    
    // Convert to tensor
    const tensor = tf.tensor3d(
      new Uint8Array(processedImageBuffer),
      [config.inputHeight, config.inputWidth, config.inputChannels]
    );
    
    // Normalize to [0,1] range
    const normalized = tensor.div(255.0);
    
    // Add batch dimension
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
 * Classify a single image patch
 * @param {Buffer|string} imageData - Image data or path
 * @param {string} type - 'thin' or 'thick'
 * @returns {Object} Classification result with probability and boolean
 */
async function classifyPatch(imageData, type) {
  let inputTensor = null;
  
  try {
    // Load model
    const { model, config } = await loadModel(type);
    
    // Preprocess image
    inputTensor = await preprocessImage(imageData, config);
    
    // Run prediction
    const prediction = model.predict(inputTensor);
    
    // Get result as float
    const resultArray = await prediction.data();
    const probability = resultArray[0];
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();
    
    // Return classification result
    return {
      probability,
      isInfected: probability > config.threshold
    };
  } catch (error) {
    logger.error(`Error classifying ${type} smear image:`, error);
    
    // Clean up tensors in case of error
    if (inputTensor) inputTensor.dispose();
    
    throw error;
  }
}

/**
 * Classify multiple patches and get the infection rate
 * @param {Array<Buffer|string>} patches - Array of image patches or paths
 * @param {string} type - 'thin' or 'thick'
 * @returns {Object} Classification results
 */
async function classifyPatches(patches, type) {
  try {
    let infectedCount = 0;
    const results = [];
    
    // Process patches in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < patches.length; i += batchSize) {
      const batch = patches.slice(i, i + batchSize);
      
      // Process each patch in the batch
      const batchPromises = batch.map(patch => classifyPatch(patch, type));
      const batchResults = await Promise.all(batchPromises);
      
      // Count infected patches
      for (const result of batchResults) {
        if (result.isInfected) {
          infectedCount++;
        }
        results.push(result);
      }
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
    }
    
    // Return overall results
    return {
      totalPatches: patches.length,
      infectedPatches: infectedCount,
      infectionRate: infectedCount / patches.length,
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
      if (modelCache[key] && modelCache[key].model) {
        modelCache[key].model.dispose();
        modelCache[key] = null;
      }
    });
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    logger.info('Cleaned up malaria classification models');
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
  classifyPatch,
  classifyPatches,
  loadModel,
  cleanupModels
};