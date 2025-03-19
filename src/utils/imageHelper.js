// src/utils/imageHelper.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const logger = require('../config/logger');

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
 * Helper function to save an image to a file
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} filePath - Path to save the image
 * @returns {Promise<boolean>} True if successful
 */
async function saveImage(imageBuffer, filePath) {
  try {
    await fs.promises.writeFile(filePath, imageBuffer);
    return true;
  } catch (error) {
    logger.error(`Error saving image to ${filePath}:`, error);
    return false;
  }
}

/**
 * Helper function to load an image as a buffer
 * @param {string} filePath - Path to the image
 * @returns {Promise<Buffer>} Image buffer
 */
async function loadImage(filePath) {
  try {
    return await fs.promises.readFile(filePath);
  } catch (error) {
    logger.error(`Error loading image from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Creates a thumbnail version of an image
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save thumbnail
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {Promise<Object>} Metadata of processed image
 */
async function createThumbnail(inputPath, outputPath, width = 300, height = 300) {
  try {
    const metadata = await sharp(inputPath)
      .resize(width, height, { fit: 'inside' })
      .toFile(outputPath);
    
    return metadata;
  } catch (error) {
    logger.error(`Error creating thumbnail for ${inputPath}:`, error);
    throw error;
  }
}

/**
 * Extract patches from an image using a grid approach (for thick smears)
 * @param {string} inputPath - Path to input image 
 * @param {string} outputDir - Directory to save patches
 * @param {string} prefix - Prefix for patch filenames
 * @param {number} patchSize - Size of patches (square)
 * @param {number} overlap - Overlap between patches
 * @param {number} maxPatches - Maximum number of patches to extract
 * @returns {Promise<Array>} Array of patch info objects
 */
async function extractGridPatches(inputPath, outputDir, prefix, patchSize = 224, overlap = 50, maxPatches = 20) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    const patches = [];
    const step = patchSize - overlap;
    
    // Counter to limit patches
    let patchCount = 0;
    
    // Generate grid of patches
    for (let y = 0; y < metadata.height - patchSize; y += step) {
      for (let x = 0; x < metadata.width - patchSize; x += step) {
        if (patchCount >= maxPatches) break;
        
        const patchFilename = `${prefix}-${x}-${y}-${Date.now()}.png`;
        const patchPath = path.join(outputDir, patchFilename);
        
        // Extract and save patch
        await image
          .extract({ left: x, top: y, width: patchSize, height: patchSize })
          .toFile(patchPath);
        
        // Add patch info
        patches.push({
          path: patchPath,
          filename: patchFilename,
          x,
          y,
          width: patchSize,
          height: patchSize
        });
        
        patchCount++;
      }
      
      if (patchCount >= maxPatches) break;
    }
    
    return patches;
  } catch (error) {
    logger.error(`Error extracting grid patches from ${inputPath}:`, error);
    throw error;
  }
}

/**
 * Simulate RBC detection for thin smears using image processing techniques
 * @param {string} inputPath - Path to input image
 * @param {string} outputDir - Directory to save patches
 * @param {string} prefix - Prefix for patch filenames
 * @param {number} patchSize - Size of patches (square)
 * @param {number} maxPatches - Maximum number of patches to extract
 * @returns {Promise<Array>} Array of patch info objects
 */
async function extractCellPatches(inputPath, outputDir, prefix, patchSize = 100, maxPatches = 20) {
  try {
    // For a full OpenCV replacement, we'd need complex blob detection
    // This is a simplified version that extracts patches in a grid with some randomization
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    const patches = [];
    
    // Generate "RBC-like" patches
    for (let i = 0; i < maxPatches; i++) {
      // Generate random coordinates within the image bounds
      const x = Math.floor(Math.random() * (metadata.width - patchSize));
      const y = Math.floor(Math.random() * (metadata.height - patchSize));
      
      const patchFilename = `${prefix}-${x}-${y}-${Date.now()}.png`;
      const patchPath = path.join(outputDir, patchFilename);
      
      // Extract and save patch
      await image
        .extract({ left: x, top: y, width: patchSize, height: patchSize })
        .toFile(patchPath);
      
      // Add patch info
      patches.push({
        path: patchPath,
        filename: patchFilename,
        x,
        y,
        width: patchSize,
        height: patchSize
      });
    }
    
    return patches;
  } catch (error) {
    logger.error(`Error extracting cell patches from ${inputPath}:`, error);
    throw error;
  }
}

/**
 * Generate a visualization of patches extracted from an image
 * @param {string} originalPath - Path to original image
 * @param {Array} patches - Array of patch info objects
 * @param {string} outputPath - Path to save visualization
 * @returns {Promise<boolean>} True if successful
 */
async function visualizePatches(originalPath, patches, outputPath) {
  try {
    const original = sharp(originalPath);
    const metadata = await original.metadata();
    
    // Create a copy of the original image to draw on
    const visualization = await original.clone().toBuffer();
    
    // Create a composite operation for each patch
    const compositeOperations = [];
    
    // For each patch, draw a rectangle outline
    for (const patch of patches) {
      // Create an overlay SVG with transparent center and colored border
      // Use red for positive patches, blue for negatives
      const color = patch.isPositive ? 'red' : 'blue';
      
      // Create SVG overlay for the patch rectangle
      const rectSvg = Buffer.from(
        `<svg width="${metadata.width}" height="${metadata.height}">
          <rect 
            x="${patch.x}" 
            y="${patch.y}" 
            width="${patch.width}" 
            height="${patch.height}" 
            stroke="${color}" 
            stroke-width="3" 
            fill="none"
          />
          ${patch.isPositive ? 
            `<circle cx="${patch.x + patch.width/2}" cy="${patch.y + patch.height/2}" r="5" fill="red" />` :
            ''
          }
         </svg>`
      );
      
      compositeOperations.push({
        input: rectSvg,
        gravity: 'northwest'
      });
    }
    
    // Apply all rectangle overlays
    await sharp(visualization)
      .composite(compositeOperations)
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    logger.error('Error creating visualization:', error);
    return false;
  }
}

// Initialize on module load
createDirectories();
logger.info('Image helper initialized successfully.');

module.exports = {
  createDirectories,
  saveImage,
  loadImage,
  createThumbnail,
  extractGridPatches,
  extractCellPatches,
  visualizePatches
};