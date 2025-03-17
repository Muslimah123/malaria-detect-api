// src/utils/opencvHelper.js
const cv = require('@u4/opencv4nodejs');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Verifies that OpenCV is properly installed and configured
 * @returns {boolean} True if OpenCV is properly configured
 */
function verifyOpenCV() {
  try {
    // Check version
    const version = cv.getBuildInformation();
    logger.info(`OpenCV Version: ${cv.version.major}.${cv.version.minor}.${cv.version.revision}`);
    
    // Check basic functionality
    const mat = new cv.Mat(100, 100, cv.CV_8UC3, [0, 0, 0]);
    mat.drawCircle(new cv.Point(50, 50), 30, new cv.Vec3(255, 255, 255), 2);
    mat.delete();
    
    return true;
  } catch (error) {
    logger.error('OpenCV verification failed:', error);
    return false;
  }
}

/**
 * Creates required directories for image processing
 */
function createDirectories() {
  const dirs = [
    path.join(__dirname, '../../uploads/original'),
    path.join(__dirname, '../../uploads/thumbnails'),
    path.join(__dirname, '../../uploads/patches'),
    path.join(__dirname, '../../models/cnn/thick_smear_model'),
    path.join(__dirname, '../../models/cnn/thin_smear_model')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }
}

/**
 * Helper function to save a Mat to an image file
 * @param {Mat} mat - OpenCV Mat object
 * @param {string} filePath - Path to save the image
 * @returns {Promise<boolean>} True if successful
 */
async function saveMat(mat, filePath) {
  try {
    await cv.imwriteAsync(filePath, mat);
    return true;
  } catch (error) {
    logger.error(`Error saving image to ${filePath}:`, error);
    return false;
  }
}

/**
 * Helper function to load an image as a Mat
 * @param {string} filePath - Path to the image
 * @returns {Promise<Mat>} OpenCV Mat object
 */
async function loadImage(filePath) {
  try {
    return await cv.imreadAsync(filePath);
  } catch (error) {
    logger.error(`Error loading image from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Visualizes and saves the segmentation result for debugging
 * @param {string} originalPath - Path to original image
 * @param {Mat} segmentationMask - Segmentation mask
 * @param {string} outputPath - Path to save visualization
 */
async function visualizeSegmentation(originalPath, segmentationMask, outputPath) {
  try {
    // Load original image
    const original = await loadImage(originalPath);
    
    // Create visualization
    const visualization = original.copy();
    
    // Convert mask to 3 channels for overlay
    const mask3C = new cv.Mat();
    cv.cvtColor(segmentationMask, mask3C, cv.COLOR_GRAY2BGR);
    
    // Create colored overlay
    const red = new cv.Vec3(0, 0, 255);
    const overlay = mask3C.bitwiseNot().mul(new cv.Mat(mask3C.rows, mask3C.cols, cv.CV_8UC3, red));
    
    // Blend with original
    const alpha = 0.3;
    cv.addWeighted(visualization, 1 - alpha, overlay, alpha, 0, visualization);
    
    // Save visualization
    await saveMat(visualization, outputPath);
    
    // Clean up
    original.delete();
    visualization.delete();
    mask3C.delete();
    overlay.delete();
  } catch (error) {
    logger.error('Error creating visualization:', error);
  }
}

module.exports = {
  verifyOpenCV,
  createDirectories,
  saveMat,
  loadImage,
  visualizeSegmentation
};

// Initialize OpenCV on module load
createDirectories();
const opencvReady = verifyOpenCV();
if (!opencvReady) {
  logger.error('OpenCV initialization failed. Image processing may not work correctly.');
} else {
  logger.info('OpenCV initialized successfully.');
}
