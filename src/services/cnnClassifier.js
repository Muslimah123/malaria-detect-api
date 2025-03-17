// src/services/cnnClassifier.js
const tf = require('@tensorflow/tfjs');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const logger = require('../config/logger');
const { ImagePatch, PatchClassification, InitialAnalysis, Sample, SampleImage } = require('../models');
const { sequelize } = require('../config/database');

// Path to CNN models
const MODELS_DIR = path.join(__dirname, '../../models/cnn');
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Cache for loaded models
const modelCache = {
  thin: null,
  thick: null
};

/**
 * Load the appropriate pretrained CNN model based on image type
 * @param {string} imageType - 'thin' or 'thick'
 * @returns {Object} The loaded TensorFlow model
 */
async function loadModel(imageType) {
  try {
    // Check if model is already loaded
    if (modelCache[imageType]) {
      return modelCache[imageType];
    }
    
    // Select model path based on image type
    const modelPath = imageType === 'thin' 
      ? path.join(MODELS_DIR, 'thin_smear_model/model.json')
      : path.join(MODELS_DIR, 'thick_smear_model/model.json');
    
    // Check if model exists
    try {
      await fs.promises.access(modelPath);
    } catch (error) {
      throw new Error(`Model not found at ${modelPath}. Please ensure the pretrained models are in place.`);
    }
    
    // Load model
    logger.info(`Loading ${imageType} smear CNN model from ${modelPath}`);
    const model = await tf.loadLayersModel(`file://${modelPath}`);
    
    // Warm up the model with a dummy prediction
    const dummyInput = tf.zeros([1, 224, 224, 3]);
    model.predict(dummyInput);
    dummyInput.dispose();
    
    // Cache the model
    modelCache[imageType] = {
      model,
      name: imageType === 'thin' ? 'MobileNetV2_thin_smear' : 'EfficientNetB0_thick_smear',
      version: '1.0.0',
      inputShape: [224, 224, 3]
    };
    
    return modelCache[imageType];
  } catch (error) {
    logger.error('Error loading CNN model:', error);
    throw error;
  }
}

/**
 * Preprocess an image patch for the CNN
 * @param {string} patchUrl - URL of the patch
 * @param {Object} modelInfo - Model information with input shape
 * @returns {Object} Tensor ready for prediction
 */
async function preprocessPatch(patchUrl, modelInfo) {
  try {
    // Extract filename from URL
    const filename = path.basename(patchUrl);
    const patchPath = path.join(UPLOADS_DIR, 'patches', filename);
    
    // Check if file exists
    await fs.promises.access(patchPath);
    
    // Process the image with sharp
    const { data, info } = await sharp(patchPath)
      .resize({
        width: modelInfo.inputShape[1],
        height: modelInfo.inputShape[0],
        fit: 'fill'
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Convert raw data to tensor
    const tensor = tf.tensor3d(
      new Uint8Array(data),
      [info.height, info.width, info.channels]
    );
    
    // Preprocess: normalize to [0,1] and expand dims for batch
    const normalized = tensor.toFloat().div(tf.scalar(255));
    const batched = normalized.expandDims(0);
    
    // Clean up the original tensor
    tensor.dispose();
    normalized.dispose();
    
    return batched;
  } catch (error) {
    logger.error('Error preprocessing patch:', error);
    throw error;
  }
}

/**
 * Analyze a single patch
 * @param {Object} patch - The image patch object
 * @param {Object} modelInfo - Model information
 * @returns {Object} Analysis results
 */
async function analyzePatch(patch, modelInfo) {
  let tensorInput = null;
  
  try {
    // Preprocess the patch
    tensorInput = await preprocessPatch(patch.patchUrl, modelInfo);
    
    // Run prediction
    const prediction = modelInfo.model.predict(tensorInput);
    
    // Get results as array
    const predictionData = await prediction.data();
    
    // Cleanup tensors
    tensorInput.dispose();
    prediction.dispose();
    
    // Return prediction results
    // For binary classification, index 0 is negative, index 1 is positive
    const positiveScore = predictionData.length > 1 ? predictionData[1] : predictionData[0];
    
    return {
      confidence: positiveScore,
      isPositive: positiveScore > 0.5 // Threshold for positive classification
    };
  } catch (error) {
    logger.error('Error analyzing patch:', error);
    
    // Clean up tensors in case of error
    if (tensorInput) tensorInput.dispose();
    
    throw error;
  }
}

/**
 * Run CNN analysis on all patches for an image
 * @param {string} imageId - The SampleImage ID
 * @returns {Object} The analysis results
 */
async function runAnalysis(imageId) {
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Get image data
    const imageData = await SampleImage.findByPk(imageId, { transaction });
    if (!imageData) {
      throw new Error('Image not found');
    }
    
    // Get sample data
    const sampleData = await Sample.findByPk(imageData.sampleId, { transaction });
    if (!sampleData) {
      throw new Error('Sample not found');
    }
    
    // Update sample status
    await sampleData.update({ status: 'processing' }, { transaction });
    
    // Get all patches for this image
    const patches = await ImagePatch.findAll({
      where: { imageId },
      transaction
    });
    
    if (patches.length === 0) {
      throw new Error('No patches found for this image. Run image processing first.');
    }
    
    // Load appropriate CNN model
    const modelInfo = await loadModel(imageData.imageType);
    
    // Record start time
    const startTime = Date.now();
    
    // Create initial analysis record
    const analysis = await InitialAnalysis.create({
      sampleId: imageData.sampleId,
      imageId,
      patchesAnalyzed: patches.length,
      modelVersion: modelInfo.version
    }, { transaction });
    
    // Process each patch
    let positivePatchCount = 0;
    let totalConfidence = 0;
    
    // Process patches in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < patches.length; i += batchSize) {
      const batchPatches = patches.slice(i, i + batchSize);
      
      // Process patches in parallel
      const batchResults = await Promise.all(
        batchPatches.map(patch => analyzePatch(patch, modelInfo))
      );
      
      // Record results for each patch in the batch
      for (let j = 0; j < batchPatches.length; j++) {
        const patch = batchPatches[j];
        const result = batchResults[j];
        
        await PatchClassification.create({
          patchId: patch.id,
          analysisId: analysis.id,
          isPositive: result.isPositive,
          confidence: result.confidence
        }, { transaction });
        
        // Update counts
        if (result.isPositive) {
          positivePatchCount++;
        }
        
        totalConfidence += result.confidence;
      }
      
      // Force garbage collection to free memory
      if (global.gc) {
        global.gc();
      }
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Update analysis record with results
    const averageConfidence = totalConfidence / patches.length;
    
    // A sample is considered positive if it has at least one positive patch
    // The threshold can be adjusted based on your requirements
    const isPositive = positivePatchCount > 0;
    
    await analysis.update({
      isPositive,
      confidence: averageConfidence,
      positivePatchCount,
      processingTime
    }, { transaction });
    
    // Update image and sample
    await imageData.update({ isAnalyzed: true }, { transaction });
    await sampleData.update({ 
      status: 'completed'
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    logger.info(`Completed initial analysis for image ${imageId} (ID: ${analysis.id})`);
    logger.info(`Analysis results: ${positivePatchCount}/${patches.length} positive patches, confidence: ${averageConfidence.toFixed(4)}`);
    
    return analysis;
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    
    logger.error('Error running initial analysis:', error);
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
    
    logger.info('Cleaned up CNN models');
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
  analyzePatch,
  runAnalysis,
  cleanupModels
};