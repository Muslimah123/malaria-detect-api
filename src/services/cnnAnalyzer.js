// src/services/cnnAnalyzer.js
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');
const { 
  ImagePatch, 
  PatchClassification, 
  InitialAnalysis, 
  Sample, 
  SampleImage 
} = require('../models');
const { sequelize } = require('../config/database');
const tensorflowClassifier = require('./tensorflowClassifier');
const imageHelper = require('../utils/imageHelper');

// Base directory for image storage
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const PATCHES_DIR = path.join(UPLOADS_DIR, 'patches');

/**
 * Run initial CNN analysis on all patches for an image
 * @param {string} imageId - The SampleImage ID
 * @returns {Promise<Object>} The analysis results
 */
async function runInitialAnalysis(imageId) {
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Get image data
    const imageData = await SampleImage.findByPk(imageId, { transaction });
    if (!imageData) {
      throw new Error(`Image not found with id ${imageId}`);
    }
    
    // Get sample data
    const sampleData = await Sample.findByPk(imageData.sampleId, { transaction });
    if (!sampleData) {
      throw new Error(`Sample not found with id ${imageData.sampleId}`);
    }
    
    // Update sample status
    await sampleData.update({ status: 'processing' }, { transaction });
    
    // Get all patches for this image
    const patches = await ImagePatch.findAll({
      where: { imageId },
      transaction
    });
    
    if (patches.length === 0) {
      throw new Error(`No patches found for image ${imageId}`);
    }
    
    logger.info(`Starting CNN analysis for image ${imageId} with ${patches.length} patches`);
    
    // Determine analysis type based on image type
    const analysisType = imageData.imageType === 'thin' ? 'thin' : 'thick';
    
    // Record start time
    const startTime = Date.now();
    
    // Create initial analysis record
    const analysis = await InitialAnalysis.create({
      sampleId: imageData.sampleId,
      imageId,
      patchesAnalyzed: patches.length,
      modelVersion: `TensorFlow-${analysisType}-1.0.0`
    }, { transaction });
    
    // Extract patch paths
    const patchPaths = patches.map(patch => {
      const filename = path.basename(patch.patchUrl);
      return path.join(PATCHES_DIR, filename);
    });
    
    // Check if patch files exist
    for (const patchPath of patchPaths) {
      try {
        await fs.promises.access(patchPath);
      } catch (error) {
        logger.warn(`Patch file not found: ${patchPath}`);
        // Continue with other patches
      }
    }
    
    // Classify patches using TensorFlow.js
    const classificationResults = await tensorflowClassifier.classifyPatches(patchPaths, analysisType);
    
    // Process each patch
    let positivePatchCount = 0;
    
    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      
      // Get result for this patch
      const result = classificationResults.results[i] || { 
        probability: 0,
        isInfected: false
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
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Update analysis record with results
    const isPositive = positivePatchCount > 0; // Any positive patch makes the sample positive
    
    logger.info(`Completed CNN analysis for image ${imageId}: ${positivePatchCount}/${patches.length} positive patches, confidence: ${classificationResults.averageConfidence.toFixed(4)}`);
    
    await analysis.update({
      isPositive,
      confidence: classificationResults.averageConfidence,
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
    
    // Create visualization with positive patches highlighted
    try {
      // Extract the original image path
      const imageFilename = path.basename(imageData.imageUrl);
      const imagePath = path.join(UPLOADS_DIR, 'original', imageFilename);
      
      // Prepare patches with classification results
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
    
    // Clean up TensorFlow resources
    tensorflowClassifier.cleanupModels();
    
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