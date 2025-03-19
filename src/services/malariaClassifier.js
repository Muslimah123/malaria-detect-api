// // src/services/malariaClassifier.js
// const tf = require('@tensorflow/tfjs-node');
// const path = require('path');
// const fs = require('fs');
// const sharp = require('sharp');
// const logger = require('../config/logger');

// // Path to TensorFlow models
// const MODELS_DIR = path.join(__dirname, '../../models/cnn');

// // Model configurations based on Java implementation
// const MODEL_CONFIGS = {
//   thin: {
//     path: path.join(MODELS_DIR, 'thin_smear_model/model.json'),
//     inputWidth: 64,    // From CameraActivity.java
//     inputHeight: 64,   // From CameraActivity.java
//     inputName: 'input',
//     outputName: 'output',
//     inputChannels: 1,  // Grayscale as in Java code
//     threshold: 0.5     // Threshold for positive classification, from thin.java
//   },
//   thick: {
//     path: path.join(MODELS_DIR, 'thick_smear_model/model.json'),
//     inputWidth: 32,    // From CameraActivity.java
//     inputHeight: 32,   // From CameraActivity.java
//     inputName: 'input',
//     outputName: 'output',
//     inputChannels: 1,  // Grayscale as in Java code
//     threshold: 0.5     // Threshold for positive classification, from thick.java
//   }
// };

// // Cache for loaded models
// const modelCache = {
//   thin: null,
//   thick: null
// };

// /**
//  * Load a model for malaria detection
//  * @param {string} type - 'thin' or 'thick'
//  * @returns {Object} The TensorFlow.js model
//  */
// async function loadModel(type) {
//   try {
//     // Check if model is already loaded
//     if (modelCache[type]) {
//       return modelCache[type];
//     }
    
//     const config = MODEL_CONFIGS[type];
//     if (!config) {
//       throw new Error(`Unknown model type: ${type}`);
//     }
    
//     // Check if model file exists
//     try {
//       await fs.promises.access(config.path);
//     } catch (error) {
//       logger.warn(`Model file not found at ${config.path}. Using dummy model for testing.`);
//       // For testing purposes, create a dummy model that outputs random probabilities
//       return createDummyModel(type, config);
//     }
    
//     // Load model
//     logger.info(`Loading ${type} smear model from ${config.path}`);
//     const model = await tf.loadLayersModel(`file://${config.path}`);
    
//     // Warm up the model with a dummy prediction
//     const dummyInput = tf.zeros([1, config.inputHeight, config.inputWidth, config.inputChannels]);
//     const warmupPrediction = model.predict(dummyInput);
//     warmupPrediction.dataSync(); // Force execution
//     warmupPrediction.dispose();
//     dummyInput.dispose();
    
//     // Cache the model
//     modelCache[type] = {
//       model,
//       config
//     };
    
//     logger.info(`Successfully loaded ${type} smear model`);
//     return modelCache[type];
//   } catch (error) {
//     logger.error(`Error loading ${type} smear model:`, error);
    
//     // For testing and development, return a dummy model
//     return createDummyModel(type, MODEL_CONFIGS[type]);
//   }
// }

// /**
//  * Create a dummy model for testing (when real model is unavailable)
//  * @param {string} type - Model type ('thin' or 'thick')
//  * @param {Object} config - Model configuration 
//  * @returns {Object} A dummy model object for testing
//  */
// function createDummyModel(type, config) {
//   logger.warn(`Creating dummy ${type} model for testing`);
  
//   // Create a simple model that returns random values
//   const dummyModel = {
//     model: {
//       predict: (input) => {
//         input.dispose(); // Clean up the input tensor
//         // Return a synthetic prediction (random value between 0 and 1)
//         // In real malaria detection, this would be the probability of infection
//         return tf.tensor1d([Math.random()]);
//       }
//     },
//     config
//   };
  
//   // Cache it
//   modelCache[type] = dummyModel;
//   return dummyModel;
// }

// /**
//  * Preprocess an image patch for the model, similar to Java implementation
//  * @param {Buffer|string} imageData - Image data or path
//  * @param {Object} config - Model configuration
//  * @returns {tf.Tensor} Preprocessed tensor
//  */
// async function preprocessImage(imageData, config) {
//   try {
//     // Prepare Sharp instance
//     let sharpInstance;
    
//     if (typeof imageData === 'string') {
//       // If image path is provided
//       sharpInstance = sharp(imageData);
//     } else {
//       // If image buffer is provided
//       sharpInstance = sharp(imageData);
//     }
    
//     // Get image metadata
//     const metadata = await sharpInstance.metadata();
    
//     // Extract the green channel for processing (as in Java code)
//     // This is important as the green channel has the best contrast for malaria parasites
//     const { data, info } = await sharpInstance
//       .resize(config.inputWidth, config.inputHeight, {
//         fit: 'fill',
//         position: 'center'
//       })
//       .removeAlpha()
//       .extractChannel(1) // Extract green channel (0=red, 1=green, 2=blue)
//       .raw()
//       .toBuffer({ resolveWithObject: true });
    
//     // Convert raw data to tensor
//     const tensor = tf.tensor3d(
//       new Uint8Array(data),
//       [info.height, info.width, 1] // 1 channel (grayscale)
//     );
    
//     // Normalize to [0,1] range (required by the model)
//     const normalized = tensor.div(255.0);
    
//     // Add batch dimension for model input
//     const batched = normalized.expandDims(0);
    
//     // Clean up intermediate tensors
//     tensor.dispose();
//     normalized.dispose();
    
//     return batched;
//   } catch (error) {
//     logger.error('Error preprocessing image:', error);
//     throw error;
//   }
// }

// /**
//  * Classify a single image patch (RBC or parasite candidate)
//  * This is equivalent to the recognize() method in Java
//  * @param {Buffer|string} imageData - Image data or path
//  * @param {string} type - 'thin' or 'thick'
//  * @returns {Object} Classification result with probability and boolean
//  */
// async function classifyPatch(imageData, type) {
//   let inputTensor = null;
  
//   try {
//     // Load model
//     const { model, config } = await loadModel(type);
    
//     // Preprocess image
//     inputTensor = await preprocessImage(imageData, config);
    
//     // Run prediction
//     const prediction = model.predict(inputTensor);
    
//     // Get result as float
//     const resultArray = await prediction.data();
//     const probability = resultArray[0];
    
//     // Clean up tensors
//     inputTensor.dispose();
//     prediction.dispose();
    
//     // Return classification result
//     return {
//       probability,
//       isInfected: probability > config.threshold
//     };
//   } catch (error) {
//     logger.error(`Error classifying ${type} smear image:`, error);
    
//     // Clean up tensors in case of error
//     if (inputTensor) inputTensor.dispose();
    
//     throw error;
//   }
// }

// /**
//  * Classify multiple patches and get the infection rate
//  * @param {Array<Buffer|string>} patches - Array of image patches or paths
//  * @param {string} type - 'thin' or 'thick'
//  * @returns {Object} Classification results
//  */
// async function classifyPatches(patches, type) {
//   try {
//     logger.info(`Classifying ${patches.length} ${type} smear patches`);
    
//     let infectedCount = 0;
//     const results = [];
    
//     // Process patches in batches to avoid memory issues
//     const batchSize = 10;
//     for (let i = 0; i < patches.length; i += batchSize) {
//       const batch = patches.slice(i, i + batchSize);
      
//       // Process each patch in the batch
//       const batchPromises = batch.map(patch => classifyPatch(patch, type));
//       const batchResults = await Promise.all(batchPromises);
      
//       // Count infected patches
//       for (const result of batchResults) {
//         if (result.isInfected) {
//           infectedCount++;
//         }
//         results.push(result);
//       }
      
//       // Force garbage collection if available
//       if (global.gc) {
//         global.gc();
//       }
      
//       logger.debug(`Processed ${i + batch.length}/${patches.length} patches`);
//     }
    
//     logger.info(`Classification complete: ${infectedCount}/${patches.length} infected patches (${(infectedCount / patches.length * 100).toFixed(2)}%)`);
    
//     // Return overall results
//     return {
//       totalPatches: patches.length,
//       infectedPatches: infectedCount,
//       infectionRate: infectedCount / patches.length,
//       results
//     };
//   } catch (error) {
//     logger.error(`Error classifying ${type} smear patches:`, error);
//     throw error;
//   }
// }

// /**
//  * Clean up models and release resources
//  */
// function cleanupModels() {
//   try {
//     // Dispose of all loaded models
//     Object.keys(modelCache).forEach(key => {
//       if (modelCache[key] && modelCache[key].model && modelCache[key].model.dispose) {
//         modelCache[key].model.dispose();
//         modelCache[key] = null;
//       }
//     });
    
//     // Force garbage collection
//     if (global.gc) {
//       global.gc();
//     }
    
//     logger.info('Cleaned up malaria classification models');
//   } catch (error) {
//     logger.error('Error cleaning up models:', error);
//   }
// }

// // Handle process exit to clean up resources
// process.on('SIGINT', () => {
//   cleanupModels();
//   process.exit(0);
// });

// process.on('SIGTERM', () => {
//   cleanupModels();
//   process.exit(0);
// });

// module.exports = {
//   classifyPatch,
//   classifyPatches,
//   loadModel,
//   cleanupModels
// };

// src/services/simpleMalariaClassifier.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const logger = require('../config/logger');

// Path to models directory (for future use)
const MODELS_DIR = path.join(__dirname, '../../models/cnn');

// Model configurations based on Java implementation
const MODEL_CONFIGS = {
  thin: {
    inputWidth: 64,    // From CameraActivity.java
    inputHeight: 64,   // From CameraActivity.java
    threshold: 0.5     // Threshold for positive classification, from thin.java
  },
  thick: {
    inputWidth: 32,    // From CameraActivity.java
    inputHeight: 32,   // From CameraActivity.java
    threshold: 0.5     // Threshold for positive classification, from thick.java
  }
};

/**
 * Simulate preprocessing an image patch
 * @param {Buffer|string} imageData - Image data or path
 * @param {Object} config - Model configuration
 * @returns {Promise<Buffer>} Processed image data
 */
async function preprocessImage(imageData, config) {
  try {
    // Load image
    let sharpInstance;
    
    if (typeof imageData === 'string') {
      // If image path is provided
      sharpInstance = sharp(imageData);
    } else {
      // If image buffer is provided
      sharpInstance = sharp(imageData);
    }
    
    // Process image similar to the Java code - resize and extract green channel
    return await sharpInstance
      .resize(config.inputWidth, config.inputHeight, {
        fit: 'fill',
        position: 'center'
      })
      .removeAlpha()
      .extractChannel(1) // Green channel like in Java
      .toBuffer();
      
  } catch (error) {
    logger.error('Error preprocessing image:', error);
    throw error;
  }
}

/**
 * Simulate classification of a single image patch
 * This is a simplified version that doesn't use TensorFlow
 * @param {Buffer|string} imageData - Image data or path
 * @param {string} type - 'thin' or 'thick'
 * @returns {Promise<Object>} Classification result with probability and boolean
 */
async function classifyPatch(imageData, type) {
  try {
    // Get model config
    const config = MODEL_CONFIGS[type];
    if (!config) {
      throw new Error(`Unknown model type: ${type}`);
    }
    
    // Preprocess image (we'll use the data for analysis)
    const processedData = await preprocessImage(imageData, config);
    
    // Simple image analysis for demonstration
    // Calculate average brightness of the patch
    const pixelSum = Array.from(processedData).reduce((sum, pixel) => sum + pixel, 0);
    const avgBrightness = pixelSum / processedData.length;
    
    // Normalize to [0,1]
    const normalizedBrightness = avgBrightness / 255;
    
    // Invert (darker areas more likely to be parasites)
    const darknessFactor = 1 - normalizedBrightness;
    
    // Add some randomness to simulate more varied model behavior
    // But make it somewhat meaningful - parasites are often darker regions
    const randomFactor = Math.random() * 0.5; 
    
    // Combined score with more weight on darkness (like real models would do)
    let probability = darknessFactor * 0.7 + randomFactor * 0.3;
    
    // Ensure we're in [0,1] range
    probability = Math.max(0, Math.min(1, probability));
    
    // Log the result
    logger.debug(`Classified ${type} smear patch: probability ${probability.toFixed(4)}`);
    
    // Return classification result
    return {
      probability,
      isInfected: probability > config.threshold
    };
  } catch (error) {
    logger.error(`Error classifying ${type} smear image:`, error);
    throw error;
  }
}

/**
 * Simulate classification of multiple patches
 * @param {Array<Buffer|string>} patches - Array of image patches or paths
 * @param {string} type - 'thin' or 'thick'
 * @returns {Promise<Object>} Classification results
 */
async function classifyPatches(patches, type) {
  try {
    logger.info(`Classifying ${patches.length} ${type} smear patches`);
    
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
      
      logger.debug(`Processed ${i + batch.length}/${patches.length} patches`);
    }
    
    logger.info(`Classification complete: ${infectedCount}/${patches.length} infected patches (${(infectedCount / patches.length * 100).toFixed(2)}%)`);
    
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

module.exports = {
  classifyPatch,
  classifyPatches
};