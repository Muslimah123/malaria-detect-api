// src/services/yoloIntegration.js
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const logger = require('../config/logger');
const { 
  Sample, 
  SampleImage, 
  InitialAnalysis,
  DetailedAnalysis,
  DetectionResult
} = require('../models');
const { sequelize } = require('../config/database');

/**
 * Send an image to the external YOLOv10 API for detailed analysis
 * @param {string} imageId - The ID of the image to analyze
 * @param {string} initialAnalysisId - The ID of the initial analysis result
 * @returns {Object} The detailed analysis results
 */
async function sendToYoloApi(imageId, initialAnalysisId) {
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();
    
    // Get required data
    const image = await SampleImage.findByPk(imageId, { transaction });
    if (!image) {
      throw new Error('Image not found');
    }
    
    const initialAnalysis = await InitialAnalysis.findByPk(initialAnalysisId, { transaction });
    if (!initialAnalysis) {
      throw new Error('Initial analysis not found');
    }
    
    const sample = await Sample.findByPk(image.sampleId, { transaction });
    if (!sample) {
      throw new Error('Sample not found');
    }
    
    // Update sample status
    await sample.update({ status: 'processing' }, { transaction });
    
    // Get image file path
    const imageUrl = image.imageUrl;
    const filename = path.basename(imageUrl);
    const imagePath = path.join(__dirname, '../../uploads/original', filename);
    
    // Record start time
    const startTime = Date.now();
    
    // In a real implementation, send to external API
    // For this demonstration, we'll simulate the API call
    
    /* 
    // Real implementation would use code like this:
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('image_type', image.imageType);
    formData.append('initial_result', initialAnalysis.isPositive ? 'positive' : 'negative');
    
    const response = await axios.post(process.env.YOLO_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.YOLO_API_KEY}`
      }
    });
    
    const responseData = response.data;
    */
    
    // Simulate API response
    const simulatedResponse = simulateYoloApiResponse(image.imageType);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Create detailed analysis record
    const detailedAnalysis = await DetailedAnalysis.create({
      sampleId: image.sampleId,
      imageId,
      initialAnalysisId,
      parasiteDetected: simulatedResponse.detected,
      species: simulatedResponse.species,
      confidence: simulatedResponse.confidence,
      parasiteDensity: simulatedResponse.density,
      processingTime,
      externalApiId: `sim-${Date.now()}`,
      modelVersion: 'YOLOv10-sim-1.0'
    }, { transaction });
    
    // Create detection results
    if (simulatedResponse.detections && simulatedResponse.detections.length > 0) {
      for (const detection of simulatedResponse.detections) {
        await DetectionResult.create({
          detailedAnalysisId: detailedAnalysis.id,
          className: detection.class,
          xCoord: detection.bbox.x,
          yCoord: detection.bbox.y,
          width: detection.bbox.width,
          height: detection.bbox.height,
          confidence: detection.confidence
        }, { transaction });
      }
    }
    
    // Update sample status
    await sample.update({ status: 'completed' }, { transaction });
    
    // Commit transaction
    await transaction.commit();
    
    return detailedAnalysis;
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    
    logger.error('Error sending to YOLO API:', error);
    throw error;
  }
}

/**
 * Simulate a response from the YOLOv10 API
 * @param {string} imageType - The type of image ('thin' or 'thick')
 * @returns {Object} A simulated API response
 */
function simulateYoloApiResponse(imageType) {
  // Randomly determine if parasites are detected (70% chance)
  const detected = Math.random() < 0.7;
  
  if (!detected) {
    return {
      detected: false,
      species: 'none',
      confidence: 0.95,
      density: 0,
      detections: []
    };
  }
  
  // If detected, generate detailed response
  const species = ['p_falciparum', 'p_vivax', 'p_malariae', 'p_ovale'][Math.floor(Math.random() * 4)];
  const confidence = 0.7 + Math.random() * 0.25; // 0.7-0.95
  const density = Math.floor(Math.random() * 10000) + 100; // 100-10100 parasites/µL
  
  // Generate random detections
  const numDetections = Math.floor(Math.random() * 20) + 1; // 1-20 detections
  const detections = [];
  
  const parasiteStages = ['ring', 'trophozoite', 'schizont', 'gametocyte'];
  
  for (let i = 0; i < numDetections; i++) {
    const parasiteClass = parasiteStages[Math.floor(Math.random() * parasiteStages.length)];
    
    detections.push({
      class: parasiteClass,
      confidence: 0.6 + Math.random() * 0.35, // 0.6-0.95
      bbox: {
        x: Math.floor(Math.random() * 1800),
        y: Math.floor(Math.random() * 1200),
        width: Math.floor(Math.random() * 50) + 20,
        height: Math.floor(Math.random() * 50) + 20
      }
    });
  }
  
  return {
    detected,
    species,
    confidence,
    density,
    detections
  };
}

module.exports = {
  sendToYoloApi
};