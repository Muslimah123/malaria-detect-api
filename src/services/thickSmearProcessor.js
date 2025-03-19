// src/services/thickSmearProcessor.js
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
 * Process a thick smear image using greedy patch selection
 * This implementation is based on the Malaria Screener algorithm for thick smears
 * @param {string} imageId - The ID of the image to process
 * @returns {Promise<Array>} The extracted parasite candidate patches
 */
async function processThickSmear(imageId) {
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
    
    logger.info(`Processing thick smear image: ${imageId}`);
    
    // Load image and extract green channel (for better parasite contrast)
    const { data, info } = await sharp(imagePath)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Extract dimensions
    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    // Prepare buffer for green channel
    const greenChannelData = Buffer.alloc(width * height);
    
    // Extract green channel (index 1 in RGB)
    for (let i = 0; i < width * height; i++) {
      greenChannelData[i] = data[i * channels + 1];
    }
    
    // Simulate thick smear processing (following the processThickImage.cpp approach)
    const candidateRegions = await extractCandidateRegions(greenChannelData, width, height, imagePath);
    
    // Extract parasite candidate patches
    const patches = [];
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const maxPatches = Math.min(candidateRegions.length, 20); // Limit to 20 patches
    
    logger.info(`Found ${candidateRegions.length} potential parasite regions, extracting ${maxPatches} patches`);
    
    // Extract top candidate regions (sorted by score)
    for (let i = 0; i < maxPatches; i++) {
      const region = candidateRegions[i];
      
      // Ensure patch is within image boundaries
      const x = Math.max(0, Math.min(region.x, width - region.width));
      const y = Math.max(0, Math.min(region.y, height - region.height));
      
      // Generate patch filename
      const patchFilename = `parasite-${imageId}-${x}-${y}-${Date.now()}.png`;
      const patchPath = path.join(PATCHES_DIR, patchFilename);
      
      try {
        // Extract parasite patch
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
          patchType: 'parasite_candidate'
        });
        
        patches.push(patch);
        
      } catch (extractError) {
        logger.warn(`Failed to extract parasite patch at x=${x}, y=${y}: ${extractError.message}`);
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
    
    logger.info(`Successfully processed thick smear image ${imageId}, extracted ${patches.length} parasite candidate patches`);
    return patches;
    
  } catch (error) {
    logger.error(`Error processing thick smear image ${imageId}:`, error);
    throw error;
  }
}

/**
 * Extract candidate regions for parasites in thick smear
 * Based on processThickImage.cpp from Malaria Screener
 * @param {Buffer} greenChannel - Green channel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} imagePath - Path to original image for visualization
 * @returns {Array} Detected parasite candidate regions
 */
async function extractCandidateRegions(greenChannel, width, height, imagePath) {
  // Step 1: Apply binary threshold to create mask
  const binaryMask = applyThreshold(greenChannel, width, height);
  
  // Step 2: Identify field borders and WBCs
  const { borderMask, wbcMask } = identifyMasks(binaryMask, width, height);
  
  // Step 3: Create candidate mask by removing borders and WBCs
  const candidateMask = createCandidateMask(greenChannel, borderMask, wbcMask, width, height);
  
  // Step 4: Apply greedy algorithm to find candidate regions
  return greedyRegionSelection(greenChannel, candidateMask, width, height);
}

/**
 * Apply threshold to create binary mask
 * @param {Buffer} channel - Image channel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Buffer} Binary mask (0 or 1 values)
 */
function applyThreshold(channel, width, height) {
  // Simulate Otsu thresholding
  const pixelCount = width * height;
  const mask = Buffer.alloc(pixelCount);
  
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  
  for (let i = 0; i < pixelCount; i++) {
    histogram[channel[i]]++;
  }
  
  // Find threshold using a simplified Otsu's method
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  
  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;
  
  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    
    wF = pixelCount - wB;
    if (wF === 0) break;
    
    sumB += i * histogram[i];
    
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    
    const variance = wB * wF * Math.pow(mB - mF, 2);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }
  
  // Apply threshold
  for (let i = 0; i < pixelCount; i++) {
    mask[i] = channel[i] > threshold ? 1 : 0;
  }
  
  return mask;
}

/**
 * Identify field borders and WBCs
 * @param {Buffer} binaryMask - Binary mask from thresholding
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} Border mask and WBC mask
 */
function identifyMasks(binaryMask, width, height) {
  // Create border mask (inverted binary mask with morphological processing)
  const borderMask = Buffer.alloc(width * height);
  
  // Copy binary mask to border mask
  for (let i = 0; i < width * height; i++) {
    borderMask[i] = binaryMask[i];
  }
  
  // Apply erosion to identify border regions
  applyErosion(borderMask, width, height);
  
  // Create WBC mask by identifying large dark regions in the border
  const wbcMask = identifyWBCs(binaryMask, borderMask, width, height);
  
  return { borderMask, wbcMask };
}

/**
 * Apply erosion morphological operation
 * @param {Buffer} mask - Binary mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
function applyErosion(mask, width, height) {
  // Create temporary buffer for result
  const result = Buffer.alloc(width * height);
  
  // Apply 11x11 erosion (simplified)
  const kernelSize = 5; // Half of 11x11
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let keepForeground = true;
      
      // Check neighborhood
      for (let ky = -kernelSize; ky <= kernelSize && keepForeground; ky++) {
        for (let kx = -kernelSize; kx <= kernelSize && keepForeground; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          
          // Skip out-of-bounds
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) {
            continue;
          }
          
          // If any neighbor is 0, erode to 0
          if (mask[ny * width + nx] === 0) {
            keepForeground = false;
          }
        }
      }
      
      result[idx] = keepForeground ? 1 : 0;
    }
  }
  
  // Copy result back to mask
  for (let i = 0; i < width * height; i++) {
    mask[i] = result[i];
  }
}

/**
 * Identify WBCs (White Blood Cells) in the image
 * @param {Buffer} binaryMask - Original binary mask
 * @param {Buffer} borderMask - Border mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Buffer} WBC mask
 */
function identifyWBCs(binaryMask, borderMask, width, height) {
  // Create WBC mask
  const wbcMask = Buffer.alloc(width * height);
  
  // Subtract binary mask from border mask to get potential WBC regions
  for (let i = 0; i < width * height; i++) {
    wbcMask[i] = (borderMask[i] === 1 && binaryMask[i] === 0) ? 1 : 0;
  }
  
  // Identify connected components (simplified)
  const labels = new Int32Array(width * height);
  let nextLabel = 1;
  
  // First pass: assign initial labels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (wbcMask[idx] === 1) {
        // Check neighbors (4-connectivity)
        const neighbors = [];
        
        if (x > 0 && wbcMask[idx - 1] === 1) {
          neighbors.push(labels[idx - 1]);
        }
        
        if (y > 0 && wbcMask[idx - width] === 1) {
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
  
  // Calculate area of each labeled region
  const areas = new Array(nextLabel).fill(0);
  
  for (let i = 0; i < width * height; i++) {
    if (labels[i] > 0) {
      areas[labels[i]]++;
    }
  }
  
  // Filter small regions (not WBCs)
  const minWbcSize = 1000; // Minimum WBC size
  
  for (let i = 0; i < width * height; i++) {
    if (labels[i] > 0 && areas[labels[i]] < minWbcSize) {
      wbcMask[i] = 0;
    }
  }
  
  // Apply dilation to WBC mask
  applyDilation(wbcMask, width, height);
  
  return wbcMask;
}

/**
 * Apply dilation morphological operation
 * @param {Buffer} mask - Binary mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
function applyDilation(mask, width, height) {
  // Create temporary buffer for result
  const result = Buffer.alloc(width * height);
  
  // Apply 9x9 dilation (simplified)
  const kernelSize = 4; // Half of 9x9
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let setForeground = false;
      
      // Check neighborhood
      for (let ky = -kernelSize; ky <= kernelSize && !setForeground; ky++) {
        for (let kx = -kernelSize; kx <= kernelSize && !setForeground; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          
          // Skip out-of-bounds
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) {
            continue;
          }
          
          // If any neighbor is 1, dilate to 1
          if (mask[ny * width + nx] === 1) {
            setForeground = true;
          }
        }
      }
      
      result[idx] = setForeground ? 1 : 0;
    }
  }
  
  // Copy result back to mask
  for (let i = 0; i < width * height; i++) {
    mask[i] = result[i];
  }
}

/**
 * Create a candidate mask by removing borders and WBCs
 * @param {Buffer} greenChannel - Green channel data
 * @param {Buffer} borderMask - Border mask
 * @param {Buffer} wbcMask - WBC mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Buffer} Candidate mask
 */
function createCandidateMask(greenChannel, borderMask, wbcMask, width, height) {
  // Create candidate mask
  const candidateMask = Buffer.alloc(width * height);
  
  // Remove borders and WBCs from green channel
  for (let i = 0; i < width * height; i++) {
    if (borderMask[i] === 0 && wbcMask[i] === 0) {
      candidateMask[i] = greenChannel[i];
    } else {
      candidateMask[i] = 0;
    }
  }
  
  return candidateMask;
}

/**
 * Apply greedy algorithm to select candidate regions
 * @param {Buffer} greenChannel - Green channel data
 * @param {Buffer} candidateMask - Candidate mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} Selected regions
 */
function greedyRegionSelection(greenChannel, candidateMask, width, height) {
  // Create copy of candidate mask for modification
  const workingMask = Buffer.from(candidateMask);
  
  // Set patch size
  const patchSize = Math.min(Math.floor(height * 0.1), Math.floor(width * 0.1), 100);
  const radius = Math.floor(patchSize / 2);
  
  // List to store selected regions
  const selectedRegions = [];
  
  // Number of patches to select
  const numPatches = 20;
  
  // Greedy selection
  for (let i = 0; i < numPatches; i++) {
    // Find minimum value (darkest) in working mask
    let minValue = 255;
    let minX = -1;
    let minY = -1;
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = y * width + x;
        
        // Skip locations with zero value (borders, WBCs, or already selected)
        if (workingMask[idx] === 0) {
          continue;
        }
        
        if (workingMask[idx] < minValue) {
          minValue = workingMask[idx];
          minX = x;
          minY = y;
        }
      }
    }
    
    // If no suitable point found, break
    if (minX === -1 || minY === -1) {
      break;
    }
    
    // Calculate patch coordinates
    const x = minX - radius;
    const y = minY - radius;
    
    // Add to selected regions
    selectedRegions.push({
      x,
      y,
      width: patchSize,
      height: patchSize,
      value: minValue,
      score: 255 - minValue // Higher score for darker regions
    });
    
    // Zero out selected region in working mask (to avoid selecting overlapping regions)
    for (let py = Math.max(0, minY - radius); py < Math.min(height, minY + radius); py++) {
      for (let px = Math.max(0, minX - radius); px < Math.min(width, minX + radius); px++) {
        workingMask[py * width + px] = 0;
      }
    }
  }
  
  // Sort by score (higher is better)
  selectedRegions.sort((a, b) => b.score - a.score);
  
  return selectedRegions;
}

/**
 * Create visualization of candidate regions
 * @param {string} imagePath - Path to original image
 * @param {Array} regions - Candidate regions
 * @param {string} outputPath - Path to save visualization
 */
async function createVisualization(imagePath, regions, outputPath) {
  // Get image dimensions
  const metadata = await sharp(imagePath).metadata();
  
  // Create SVG overlay for the candidates
  let svgContent = `<svg width="${metadata.width}" height="${metadata.height}">`;
  
  // Add each region as a rectangle
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    
    // Use green for parasite candidates
    svgContent += `
      <rect
        x="${region.x}"
        y="${region.y}"
        width="${region.width}"
        height="${region.height}"
        stroke="green"
        stroke-width="2"
        fill="none"
      />
      <text
        x="${region.x + 5}"
        y="${region.y + 20}"
        font-family="Arial"
        font-size="14"
        fill="green"
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

module.exports = processThickSmear;