// src/services/thinSmearProcessor.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { SampleImage, ImagePatch } = require('../models');

// Base directory for image storage
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const PATCHES_DIR = path.join(UPLOADS_DIR, 'patches');

/**
 * Process a thin smear image using watershed-based cell segmentation
 * This implementation is based on the Malaria Screener algorithm
 * @param {string} imageId - The ID of the image to process
 * @returns {Promise<Array>} The extracted cell patches
 */
async function processThinSmear(imageId) {
  try {
    // Get image data from database
    const imageData = await SampleImage.findByPk(imageId);
    if (!imageData) {
      throw new Error(`Image not found with id ${imageId}`);
    }
    
    // Extract filename from URL
    const imageUrl = imageData.imageUrl;
    const filename = path.basename(imageUrl);
    const imagePath = path.join(UPLOADS_DIR, 'original', filename);
    
    logger.info(`Processing thin smear image: ${imageId}`);
    
    // Load image and extract green channel (for better parasite contrast)
    const { data, info } = await sharp(imagePath)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Extract dimensions
    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    // Prepare Buffer for green channel
    const greenChannelData = Buffer.alloc(width * height);
    
    // Extract green channel (index 1 in RGB)
    for (let i = 0; i < width * height; i++) {
      greenChannelData[i] = data[i * channels + 1];
    }
    
    // Simulate watershed segmentation (following the MarkerBasedWatershed.java approach)
    const cellRegions = await watershedSegmentation(greenChannelData, width, height, imagePath);
    
    // Extract cell patches
    const patches = [];
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const maxPatches = Math.min(cellRegions.length, 20); // Limit to 20 patches
    
    logger.info(`Found ${cellRegions.length} potential cells, extracting ${maxPatches} patches`);
    
    // Extract top cell regions (sorted by quality)
    for (let i = 0; i < maxPatches; i++) {
      const region = cellRegions[i];
      
      // Ensure patch is within image boundaries
      const x = Math.max(0, Math.min(region.x, width - region.width));
      const y = Math.max(0, Math.min(region.y, height - region.height));
      
      // Generate patch filename
      const patchFilename = `rbc-${imageId}-${x}-${y}-${Date.now()}.png`;
      const patchPath = path.join(PATCHES_DIR, patchFilename);
      
      try {
        // Extract cell patch (ensuring square patches of set size)
        await sharp(imagePath)
          .extract({
            left: x,
            top: y,
            width: region.width,
            height: region.height
          })
          .toFile(patchPath);
        
        // Create patch URL
        const patchUrl = `${baseUrl}/uploads/patches/${patchFilename}`;
        
        // Create patch record
        const patch = await ImagePatch.create({
          imageId,
          patchUrl,
          xCoord: x,
          yCoord: y,
          width: region.width,
          height: region.height,
          patchType: 'rbc'
        });
        
        patches.push(patch);
        
      } catch (extractError) {
        logger.warn(`Failed to extract RBC patch at x=${x}, y=${y}: ${extractError.message}`);
      }
    }
    
    // Create visualization
    try {
      const extractedPatches = patches.map(patch => ({
        x: patch.xCoord,
        y: patch.yCoord,
        width: patch.width,
        height: patch.height
      }));
      
      await createVisualization(imagePath, extractedPatches, 
        path.join(UPLOADS_DIR, 'patches', `viz-${imageId}-${Date.now()}.jpg`));
      
    } catch (vizError) {
      logger.warn(`Couldn't create visualization: ${vizError.message}`);
    }
    
    logger.info(`Successfully processed thin smear image ${imageId}, extracted ${patches.length} cell patches`);
    return patches;
    
  } catch (error) {
    logger.error(`Error processing thin smear image ${imageId}:`, error);
    throw error;
  }
}

/**
 * Implements watershed-based segmentation for RBC detection
 * Based on MarkerBasedWatershed.java from Malaria Screener
 * @param {Buffer} greenChannel - Green channel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} imagePath - Path to original image for visualization
 * @returns {Array} Detected cell regions
 */
async function watershedSegmentation(greenChannel, width, height, imagePath) {
  // Step 1: Apply histogram stretching (enhance contrast)
  const stretchedGreenChannel = stretchHistogram(greenChannel, width, height);
  
  // Step 2: Apply thresholding to create binary mask
  const binaryMask = applyThreshold(stretchedGreenChannel, width, height);
  
  // Step 3: Apply morphological operations to clean up the mask
  const cleanedMask = applyMorphology(binaryMask, width, height);
  
  // Step 4: Find contours in the mask (simulate findContours from OpenCV)
  const contours = findContours(cleanedMask, width, height);
  
  // Step 5: Filter contours by size and shape to identify potential RBCs
  const cellRegions = filterCellContours(contours, width, height);
  
  // Step 6: Sort cell regions by quality (size, circularity, etc.)
  cellRegions.sort((a, b) => b.quality - a.quality);
  
  return cellRegions;
}

/**
 * Apply histogram stretching to improve contrast
 * @param {Buffer} channel - Image channel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Buffer} Contrast-enhanced channel
 */
function stretchHistogram(channel, width, height) {
  // Create histogram
  const histogram = new Array(256).fill(0);
  const pixelCount = width * height;
  
  // Count pixel intensities
  for (let i = 0; i < pixelCount; i++) {
    histogram[channel[i]]++;
  }
  
  // Calculate cumulative histogram
  const cumulativeHist = new Array(256).fill(0);
  cumulativeHist[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cumulativeHist[i] = cumulativeHist[i-1] + histogram[i];
  }
  
  // Find min and max values for stretching (using percentiles)
  const minPercentile = 0.01;
  const maxPercentile = 0.99;
  
  let minVal = 0;
  let maxVal = 255;
  
  // Find intensity at min percentile
  for (let i = 0; i < 256; i++) {
    if (cumulativeHist[i] / pixelCount >= minPercentile) {
      minVal = i;
      break;
    }
  }
  
  // Find intensity at max percentile
  for (let i = 255; i >= 0; i--) {
    if (cumulativeHist[i] / pixelCount <= maxPercentile) {
      maxVal = i;
      break;
    }
  }
  
  // Apply stretching
  const stretched = Buffer.alloc(pixelCount);
  const range = maxVal - minVal;
  
  if (range === 0) {
    return channel; // No stretching needed
  }
  
  for (let i = 0; i < pixelCount; i++) {
    const val = channel[i];
    if (val <= minVal) {
      stretched[i] = 0;
    } else if (val >= maxVal) {
      stretched[i] = 255;
    } else {
      stretched[i] = Math.round(((val - minVal) / range) * 255);
    }
  }
  
  return stretched;
}

/**
 * Apply threshold to create binary mask
 * @param {Buffer} channel - Image channel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Buffer} Binary mask (0 or 1 values)
 */
function applyThreshold(channel, width, height) {
  // Otsu's method would be ideal here, but for simplicity we'll use a fixed threshold
  // Typically for thin smears, RBCs appear darker than background
  const pixelCount = width * height;
  const mask = Buffer.alloc(pixelCount);
  
  // Calculate mean intensity as simple threshold
  let sum = 0;
  for (let i = 0; i < pixelCount; i++) {
    sum += channel[i];
  }
  const meanIntensity = sum / pixelCount;
  
  // Create binary mask (foreground = 1, background = 0)
  // RBCs are typically darker than background
  for (let i = 0; i < pixelCount; i++) {
    mask[i] = channel[i] < meanIntensity ? 1 : 0;
  }
  
  return mask;
}

/**
 * Apply morphological operations to clean the mask
 * @param {Buffer} mask - Binary mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Buffer} Cleaned mask
 */
function applyMorphology(mask, width, height) {
  // Simple erosion to separate touching cells
  const eroded = Buffer.alloc(width * height);
  
  // Copy mask to avoid modifying original
  for (let i = 0; i < width * height; i++) {
    eroded[i] = mask[i];
  }
  
  // Apply 3x3 erosion
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // If any neighbor is background (0), erode this pixel
      if (mask[idx - width - 1] === 0 || mask[idx - width] === 0 || mask[idx - width + 1] === 0 ||
          mask[idx - 1] === 0 || mask[idx + 1] === 0 ||
          mask[idx + width - 1] === 0 || mask[idx + width] === 0 || mask[idx + width + 1] === 0) {
        eroded[idx] = 0;
      }
    }
  }
  
  return eroded;
}

/**
 * Find contours in binary mask (simplified version of OpenCV's findContours)
 * @param {Buffer} mask - Binary mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} Array of contours (each a set of points)
 */
function findContours(mask, width, height) {
  // This is a simplified contour finding algorithm
  // In a real implementation, we would use a proper contour tracing algorithm
  
  // Label connected components
  const labels = new Int32Array(width * height);
  let nextLabel = 1;
  
  // First pass: assign initial labels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (mask[idx] === 1) {
        // Check neighbors (4-connectivity)
        const neighbors = [];
        
        if (x > 0 && mask[idx - 1] === 1) {
          neighbors.push(labels[idx - 1]);
        }
        
        if (y > 0 && mask[idx - width] === 1) {
          neighbors.push(labels[idx - width]);
        }
        
        if (neighbors.length === 0) {
          // New label
          labels[idx] = nextLabel++;
        } else {
          // Use minimum neighbor label
          labels[idx] = Math.min(...neighbors);
        }
      }
    }
  }
  
  // Create contours from labeled regions
  const contours = [];
  
  // For each label, create a contour (gather all pixels with that label)
  for (let label = 1; label < nextLabel; label++) {
    const contour = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        if (labels[idx] === label) {
          contour.push({ x, y });
        }
      }
    }
    
    // Only add if contour has points
    if (contour.length > 0) {
      contours.push(contour);
    }
  }
  
  return contours;
}

/**
 * Filter contours to identify potential RBCs based on size and shape
 * @param {Array} contours - Array of contours
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} Filtered cell regions with quality score
 */
function filterCellContours(contours, width, height) {
  const cellRegions = [];
  
  // For each contour, calculate properties and filter
  for (const contour of contours) {
    // Skip tiny contours
    if (contour.length < 20) {
      continue;
    }
    
    // Find bounding box
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    
    for (const point of contour) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    // Calculate dimensions
    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    const area = contour.length;
    
    // Filter by size (typical RBC is ~7-8 μm, which translates to ~50-100 pixels at 100x magnification)
    // These are approximate values and may need tuning
    const minSize = 40;
    const maxSize = 150;
    
    if (boxWidth < minSize || boxHeight < minSize || 
        boxWidth > maxSize || boxHeight > maxSize) {
      continue;
    }
    
    // Calculate circularity (approximation)
    const perimeter = calculatePerimeter(contour);
    const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
    
    // RBCs should be roughly circular
    if (circularity < 0.5) {
      continue;
    }
    
    // Calculate aspect ratio
    const aspectRatio = boxWidth / boxHeight;
    
    // RBCs should be roughly circular (aspect ratio close to 1)
    if (aspectRatio < 0.7 || aspectRatio > 1.3) {
      continue;
    }
    
    // Compute a quality score based on circularity and size
    // Higher is better
    const quality = circularity * (1 - Math.abs(1 - aspectRatio));
    
    // Create a square region centered on the cell
    const cellSize = Math.max(boxWidth, boxHeight);
    const centerX = Math.floor(minX + boxWidth / 2);
    const centerY = Math.floor(minY + boxHeight / 2);
    
    // Ensure full square fits within image bounds
    const halfSize = Math.floor(cellSize / 2);
    const x = Math.max(0, centerX - halfSize);
    const y = Math.max(0, centerY - halfSize);
    const sideLength = Math.min(cellSize, 
                               Math.min(width - x, height - y));
    
    // Add to cell regions with quality score
    cellRegions.push({
      x,
      y,
      width: sideLength,
      height: sideLength,
      quality,
      circularity,
      area
    });
  }
  
  return cellRegions;
}

/**
 * Calculate perimeter of a contour
 * @param {Array} contour - Array of points
 * @returns {number} Approximate perimeter length
 */
function calculatePerimeter(contour) {
  let perimeter = 0;
  
  for (let i = 0; i < contour.length; i++) {
    const p1 = contour[i];
    const p2 = contour[(i + 1) % contour.length];
    
    // Euclidean distance
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  
  return perimeter;
}

/**
 * Create visualization of detected cells
 * @param {string} imagePath - Path to original image
 * @param {Array} regions - Detected cell regions
 * @param {string} outputPath - Path to save visualization
 */
async function createVisualization(imagePath, regions, outputPath) {
  // Get image dimensions
  const metadata = await sharp(imagePath).metadata();
  
  // Create SVG overlay for the cells
  let svgContent = `<svg width="${metadata.width}" height="${metadata.height}">`;
  
  // Add each cell as a circle with border
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const centerX = region.x + region.width / 2;
    const centerY = region.y + region.height / 2;
    const radius = region.width / 2;
    
    // Use blue for all cells (could be changed based on classification)
    svgContent += `
      <circle
        cx="${centerX}"
        cy="${centerY}"
        r="${radius}"
        stroke="blue"
        stroke-width="2"
        fill="none"
      />
      <text
        x="${centerX - 5}"
        y="${centerY + 5}"
        font-family="Arial"
        font-size="14"
        fill="blue"
      >${i + 1}</text>
    `;
  }
  
  // Close SVG
  svgContent += '</svg>';
  
  // Overlay SVG on original image
  await sharp(imagePath)
    .composite([{
      input: Buffer.from(svgContent),
      gravity: 'northwest'
    }])
    .toFile(outputPath);
  
  logger.info(`Created visualization at ${outputPath}`);
}

module.exports = processThinSmear;