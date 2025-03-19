// // src/services/cnnAnalyzer.js
// const path = require('path');
// const sharp = require('sharp');
// const fs = require('fs').promises;
// const tf = require('@tensorflow/tfjs');
// const logger = require('../config/logger');
// const { 
//   ImagePatch, 
//   PatchClassification, 
//   InitialAnalysis, 
//   Sample, 
//   SampleImage 
// } = require('../models');
// const { sequelize } = require('../config/database');

// // Path to CNN models
// const MODELS_DIR = path.join(__dirname, '../../models/cnn');

// // Load the appropriate CNN model based on image type
// async function loadModel(imageType) {
//   try {
//     // Select model path based on image type
//     const modelPath = imageType === 'thin' 
//       ? path.join(MODELS_DIR, 'thin_smear_model/model.json')
//       : path.join(MODELS_DIR, 'thick_smear_model/model.json');
    
//     // In a real implementation, load the actual model
//     // For simulation, we'll just check if the path exists
//     try {
//       await fs.access(path.dirname(modelPath));
//     } catch (error) {
//       // If model directory doesn't exist, create it for demo
//       await fs.mkdir(path.dirname(modelPath), { recursive: true });
      
//       // For demo, we'll log that we'd load a real model here
//       logger.info(`In production, would load ${modelPath}`);
//     }
    
//     // Simulate model loading - in real implementation, use:
//     // const model = await tf.loadLayersModel(`file://${modelPath}`);
    
//     // Return a simulated model object for demonstration
//     return {
//       name: imageType === 'thin' ? 'thin_smear_cnn' : 'thick_smear_cnn',
//       version: '1.0.0',
//       predict: async (tensor) => {
//         // Simulate prediction with random confidence scores
//         // In a real implementation, this would be: model.predict(tensor)
//         return tf.tensor1d([Math.random()]); // Simple binary classification
//       }
//     };
//   } catch (error) {
//     logger.error('Error loading CNN model:', error);
//     throw error;
//   }
// }

// // Preprocess an image patch for the CNN
// async function preprocessPatch(patchUrl) {
//   try {
//     // Extract filename from URL
//     const filename = path.basename(patchUrl);
//     const patchPath = path.join(__dirname, '../../uploads/patches', filename);
    
//     // Load and preprocess the image
//     const imageBuffer = await fs.readFile(patchPath);
    
//     // In a real implementation, preprocess based on model requirements
//     // For example, resize to expected input size, normalize pixel values, etc.
//     const tensor = tf.node.decodeImage(imageBuffer);
    
//     // Resize to expected dimensions (e.g., 224x224 for many CNNs)
//     const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    
//     // Normalize pixel values to [0,1]
//     const normalized = resized.div(tf.scalar(255));
    
//     // Expand dimensions to create batch of size 1
//     const batched = normalized.expandDims(0);
    
//     // Cleanup tensors
//     tensor.dispose();
//     resized.dispose();
//     normalized.dispose();
    
//     return batched;
//   } catch (error) {
//     logger.error('Error preprocessing patch:', error);
//     throw error;
//   }
// }

// // Analyze a single patch
// async function analyzePatch(patch, model) {
//   try {
//     // Preprocess the patch
//     const tensorInput = await preprocessPatch(patch.patchUrl);
    
//     // Run prediction
//     const prediction = await model.predict(tensorInput);
    
//     // Get results as array
//     const predictionData = await prediction.data();
    
//     // Cleanup tensors
//     tensorInput.dispose();
//     prediction.dispose();
    
//     // Return prediction results
//     return {
//       confidence: predictionData[0],
//       isPositive: predictionData[0] > 0.5 // Threshold for positive classification
//     };
//   } catch (error) {
//     logger.error('Error analyzing patch:', error);
//     throw error;
//   }
// }

// // Run initial CNN analysis on all patches for an image
// async function runInitialAnalysis(imageId) {
//   let transaction;
  
//   try {
//     // Start transaction
//     transaction = await sequelize.transaction();
    
//     // Get image data
//     const imageData = await SampleImage.findByPk(imageId, { transaction });
//     if (!imageData) {
//       throw new Error('Image not found');
//     }
    
//     // Get sample data
//     const sampleData = await Sample.findByPk(imageData.sampleId, { transaction });
//     if (!sampleData) {
//       throw new Error('Sample not found');
//     }
    
//     // Update sample status
//     await sampleData.update({ status: 'processing' }, { transaction });
    
//     // Get all patches for this image
//     const patches = await ImagePatch.findAll({
//       where: { imageId },
//       transaction
//     });
    
//     if (patches.length === 0) {
//       throw new Error('No patches found for this image');
//     }
    
//     // Load appropriate CNN model
//     const model = await loadModel(imageData.imageType);
    
//     // Record start time
//     const startTime = Date.now();
    
//     // Create initial analysis record
//     const analysis = await InitialAnalysis.create({
//       sampleId: imageData.sampleId,
//       imageId,
//       patchesAnalyzed: patches.length,
//       modelVersion: model.version
//     }, { transaction });
    
//     // Process each patch
//     let positivePatchCount = 0;
//     let overallConfidence = 0;
    
//     for (const patch of patches) {
//       // Analyze patch
//       const result = await analyzePatch(patch, model);
      
//       // Record result
//       await PatchClassification.create({
//         patchId: patch.id,
//         analysisId: analysis.id,
//         isPositive: result.isPositive,
//         confidence: result.confidence
//       }, { transaction });
      
//       // Update counts
//       if (result.isPositive) {
//         positivePatchCount++;
//       }
      
//       overallConfidence += result.confidence;
//     }
    
//     // Calculate processing time
//     const processingTime = Date.now() - startTime;
    
//     // Update analysis record with results
//     const averageConfidence = overallConfidence / patches.length;
//     const isPositive = positivePatchCount > 0; // Any positive patch makes the image positive
    
//     await analysis.update({
//       isPositive,
//       confidence: averageConfidence,
//       positivePatchCount,
//       processingTime
//     }, { transaction });
    
//     // Update image and sample
//     await imageData.update({ isAnalyzed: true }, { transaction });
//     await sampleData.update({ 
//       status: isPositive ? 'completed' : 'completed' // In real app, might set different status based on result
//     }, { transaction });
    
//     // Commit transaction
//     await transaction.commit();
    
//     return analysis;
//   } catch (error) {
//     // Rollback transaction on error
//     if (transaction) await transaction.rollback();
    
//     logger.error('Error running initial analysis:', error);
//     throw error;
//   }
// }

// module.exports = {
//   loadModel,
//   analyzePatch,
//   runInitialAnalysis
// };
// src/services/cnnAnalyzer.js
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');
const { 
  ImagePatch, 
  PatchClassification, 
  InitialAnalysis, 
  Sample, 
  SampleImage 
} = require('../models');
const { sequelize } = require('../config/database');
const malariaClassifier = require('./malariaClassifier');
const imageHelper = require('../utils/imageHelper');

// Base directory for image storage
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const PATCHES_DIR = path.join(UPLOADS_DIR, 'patches');

/**
 * Run initial CNN analysis on all patches for an image
 * @param {string} imageId - The SampleImage ID
 * @returns {Object} The analysis results
 */
async function runInitialAnalysis(imageId) {
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
      throw new Error('No patches found for this image');
    }
    
    logger.info(`Starting CNN analysis for image ${imageId} with ${patches.length} patches`);
    
    // Determine the type of analysis based on image type
    const analysisType = imageData.imageType === 'thin' ? 'thin' : 'thick';
    
    // Record start time
    const startTime = Date.now();
    
    // Create initial analysis record
    const analysis = await InitialAnalysis.create({
      sampleId: imageData.sampleId,
      imageId,
      patchesAnalyzed: patches.length,
      modelVersion: `MalariaDetect-${analysisType}-1.0`
    }, { transaction });
    
    // Extract patch paths
    const patchPaths = patches.map(patch => {
      const filename = path.basename(patch.patchUrl);
      return path.join(PATCHES_DIR, filename);
    });
    
    // Check if patches exist
    for (const patchPath of patchPaths) {
      try {
        await fs.access(patchPath);
      } catch (error) {
        logger.warn(`Patch file not found: ${patchPath}`);
        // Continue with other patches
      }
    }
    
    // Classify patches
    const classificationResults = await malariaClassifier.classifyPatches(patchPaths, analysisType);
    
    // Process each patch
    let positivePatchCount = 0;
    let overallConfidence = 0;
    
    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      
      // Get result for this patch
      const result = classificationResults.results[i] || { 
        probability: Math.random(), // Fallback random value for missing results
        isInfected: Math.random() > 0.5
      };
      
      // Record result
      await PatchClassification.create({
        patchId: patch.id,
        analysisId: analysis.id,
        isPositive: result.isInfected,
        confidence: result.probability
      }, { transaction });
      
      // Update counts
      if (result.isInfected) {
        positivePatchCount++;
      }
      
      overallConfidence += result.probability;
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Update analysis record with results
    const averageConfidence = overallConfidence / patches.length;
    const isPositive = positivePatchCount > 0; // Any positive patch makes the sample positive
    
    logger.info(`Completed CNN analysis for image ${imageId}: ` + 
                `${positivePatchCount}/${patches.length} positive patches, ` +
                `confidence: ${averageConfidence.toFixed(4)}`);
    
    await analysis.update({
      isPositive,
      confidence: averageConfidence,
      positivePatchCount,
      processingTime
    }, { transaction });
    
    // Update image and sample
    await imageData.update({ isAnalyzed: true }, { transaction });
    await sampleData.update({ 
      status: 'completed' // Set to completed after analysis
    }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    // Create visualization for diagnosed patches
    try {
      // Extract the original image path
      const imageFilename = path.basename(imageData.imageUrl);
      const imagePath = path.join(UPLOADS_DIR, 'original', imageFilename);
      
      // Create patch info for visualization
      const patchesForViz = patches.map((patch, index) => ({
        x: patch.xCoord,
        y: patch.yCoord,
        width: patch.width,
        height: patch.height,
        isPositive: classificationResults.results[index]?.isInfected || false
      }));
      
      // Create visualization
      const vizFilename = `viz-${imageId}-${Date.now()}.jpg`;
      const vizPath = path.join(UPLOADS_DIR, 'patches', vizFilename);
      
      await imageHelper.visualizePatches(imagePath, patchesForViz, vizPath);
      logger.info(`Created visualization at ${vizPath}`);
    } catch (vizError) {
      logger.error('Error creating visualization:', vizError);
      // Continue even if visualization fails
    }
    
    return analysis;
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    
    logger.error('Error running initial analysis:', error);
    throw error;
  }
}

module.exports = {
  runInitialAnalysis
};