// src/services/malariaClassifier.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const logger = require('../config/logger');

// Path to models directory
const MODELS_DIR = path.join(__dirname, '../../models/cnn');

// Model configurations based on Java implementation
const MODEL_CONFIGS = {
  thin: {
    inputWidth: 64,    // From CameraActivity.java
    inputHeight: 64,   // From CameraActivity.java
    threshold: 0.5     // Threshold for positive classification
  },
  thick: {
    inputWidth: 32,    // From CameraActivity.java
    inputHeight: 32,   // From CameraActivity.java
    threshold: 0.5     // Threshold for positive classification
  }
};

/**
 * Preprocess an image patch for malaria classification
 * This extracts the green channel and resizes to model input size
 * @param {string} imagePath - Path to image patch
 * @param {Object} config - Model configuration (thin or thick)
 * @returns {Promise<Buffer>} Processed image data
 */
async function preprocessPatch(imagePath, config) {
  try {
    // Extract green channel (as in Java implementation)
    return await sharp(imagePath)
      .resize(config.inputWidth, config.inputHeight, {
        fit: 'fill',
        position: 'center'
      })
      .removeAlpha()
      .extractChannel(1) // Green channel (0=red, 1=green, 2=blue)
      .toBuffer();
  } catch (error) {
    logger.error(`Error preprocessing patch: ${error.message}`);
    throw error;
  }
}

/**
 * Calculate texture features from an image patch
 * This is used for more sophisticated classification in absence of real CNN models
 * @param {Buffer} buffer - Preprocessed image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Features extracted from the image
 */
function calculateTextureFeatures(buffer, width, height) {
  // Calculate mean intensity
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i];
  }
  const mean = sum / buffer.length;
  
  // Calculate variance (texture measure)
  let variance = 0;
  for (let i = 0; i < buffer.length; i++) {
    variance += Math.pow(buffer[i] - mean, 2);
  }
  variance /= buffer.length;
  
  // Calculate edge strength (approximation)
  let edgeStrength = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // Simple Sobel approximation
      const dx = Math.abs(buffer[idx + 1] - buffer[idx - 1]);
      const dy = Math.abs(buffer[idx + width] - buffer[idx - width]);
      edgeStrength += (dx + dy);
    }
  }
  edgeStrength /= (width * height);
  
  // Calculate contrast (max - min)
  let min = 255;
  let max = 0;
  for (let i = 0; i < buffer.length; i++) {
    min = Math.min(min, buffer[i]);
    max = Math.max(max, buffer[i]);
  }
  const contrast = max - min;
  
  // Return features
  return {
    mean,
    variance,
    edgeStrength,
    contrast
  };
}

/**
 * Simulate malaria classification using texture features
 * @param {Object} features - Texture features
 * @param {string} type - 'thin' or 'thick'
 * @returns {number} Classification probability
 */
function classifyWithFeatures(features, type) {
  // Parasites typically have:
  // 1. Higher contrast within the patch
  // 2. Higher edge strength (due to parasite borders)
  // 3. Higher texture variance
  
  // Normalize features to [0,1] range (approximate)
  const normalizedVariance = Math.min(1, features.variance / 1000);
  const normalizedEdgeStrength = Math.min(1, features.edgeStrength / 50);
  const normalizedContrast = Math.min(1, features.contrast / 128);
  
  // Different weighting for thin vs thick smears
  if (type === 'thin') {
    // For thin smears, parasites appear as compact dark structures within RBCs
    return 0.3 * normalizedVariance + 
           0.3 * normalizedEdgeStrength + 
           0.4 * normalizedContrast;
  } else {
    // For thick smears, parasite detection relies more on texture and contrast
    return 0.2 * normalizedVariance + 
           0.5 * normalizedEdgeStrength + 
           0.3 * normalizedContrast;
  }
}

/**
 * Classify a single image patch
 * This follows the approach in TensorFlowClassifier.java
 * @param {string} imagePath - Path to image patch
 * @param {string} type - 'thin' or 'thick'
 * @returns {Promise<Object>} Classification result
 */
async function classifyPatch(imagePath, type) {
  try {
    // Get model configuration
    const config = MODEL_CONFIGS[type];
    if (!config) {
      throw new Error(`Unknown model type: ${type}`);
    }
    
    // Preprocess patch (green channel extraction + resize)
    const processedBuffer = await preprocessPatch(imagePath, config);
    
    // In a real implementation, we would use TensorFlow.js to run inference
    // In this simplified version, we use texture features as a proxy
    const features = calculateTextureFeatures(processedBuffer, config.inputWidth, config.inputHeight);
    
    // Get classification probability
    const probability = classifyWithFeatures(features, type);
    
    // Log result (for debugging)
    logger.debug(`Classified ${type} smear patch: probability ${probability.toFixed(4)}`);
    
    // Return classification result
    return {
      probability,
      isInfected: probability > config.threshold
    };
  } catch (error) {
    logger.error(`Error classifying patch: ${error.message}`);
    throw error;
  }
}

/**
 * Classify multiple patches
 * @param {Array<string>} patchPaths - Array of patch paths
 * @param {string} type - 'thin' or 'thick'
 * @returns {Promise<Object>} Classification results
 */
async function classifyPatches(patchPaths, type) {
  try {
    logger.info(`Classifying ${patchPaths.length} ${type} smear patches`);
    
    let infectedCount = 0;
    const results = [];
    
    // Process patches in batches to avoid memory issues
    const batchSize = 10;
    
    for (let i = 0; i < patchPaths.length; i += batchSize) {
      const batch = patchPaths.slice(i, i + batchSize);
      
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
      
      logger.debug(`Processed ${i + batch.length}/${patchPaths.length} patches`);
    }
    
    logger.info(`Classification complete: ${infectedCount}/${patchPaths.length} infected patches (${(infectedCount / patchPaths.length * 100).toFixed(2)}%)`);
    
    // Return overall results
    return {
      totalPatches: patchPaths.length,
      infectedPatches: infectedCount,
      infectionRate: infectedCount / patchPaths.length,
      results
    };
  } catch (error) {
    logger.error(`Error classifying patches: ${error.message}`);
    throw error;
  }
}

module.exports = {
  classifyPatch,
  classifyPatches
};