// // // // src/services/imageProcessor.js
// // // const sharp = require('sharp');
// // // const path = require('path');
// // // const fs = require('fs').promises;
// // // const { v4: uuidv4 } = require('uuid');
// // // const logger = require('../config/logger');
// // // const tf = require('@tensorflow/tfjs');
// // // const { SampleImage, ImagePatch } = require('../models');

// // // // Base directory for image storage
// // // const UPLOADS_DIR = path.join(__dirname, '../../uploads');
// // // const PATCHES_DIR = path.join(UPLOADS_DIR, 'patches');
// // // const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// // // /**
// // //  * Process an uploaded image - create thumbnail and prepare for analysis
// // //  * @param {Object} imageData - The uploaded image data
// // //  * @returns {Object} The processed image data
// // //  */
// // // async function processUploadedImage(imageData) {
// // //   try {
// // //     const { filename, originalFilename, sampleId, imageType, fieldOfView, magnification } = imageData;
// // //     const originalPath = path.join(UPLOADS_DIR, 'original', filename);
    
// // //     // Get image metadata
// // //     const metadata = await sharp(originalPath).metadata();
    
// // //     // Generate thumbnail
// // //     const thumbnailFilename = `thumb-${filename}`;
// // //     const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);
    
// // //     await sharp(originalPath)
// // //       .resize(300, 300, { fit: 'inside' })
// // //       .toFile(thumbnailPath);
    
// // //     // Construct URLs
// // //     const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
// // //     const imageUrl = `${baseUrl}/uploads/original/${filename}`;
// // //     const thumbnailUrl = `${baseUrl}/uploads/thumbnails/${thumbnailFilename}`;
    
// // //     // Return processed data
// // //     return {
// // //       imageUrl,
// // //       thumbnailUrl,
// // //       originalFilename,
// // //       width: metadata.width,
// // //       height: metadata.height,
// // //       format: metadata.format,
// // //       size: metadata.size
// // //     };
// // //   } catch (error) {
// // //     logger.error('Error processing uploaded image:', error);
// // //     throw error;
// // //   }
// // // }

// // // /**
// // //  * Segment and extract patches from a thin smear image (RBC detection)
// // //  * @param {string} imageId - The SampleImage ID
// // //  * @returns {Array} The extracted patch data
// // //  */
// // // async function processThinSmear(imageId) {
// // //   try {
// // //     // Get image data from database
// // //     const imageData = await SampleImage.findByPk(imageId);
// // //     if (!imageData) {
// // //       throw new Error('Image not found');
// // //     }
    
// // //     // Extract filename from URL
// // //     const imageUrl = imageData.imageUrl;
// // //     const filename = path.basename(imageUrl);
// // //     const imagePath = path.join(UPLOADS_DIR, 'original', filename);
    
// // //     // Load image
// // //     const image = await sharp(imagePath).toBuffer();
    
// // //     // For a real implementation, use a segmentation model to detect RBCs
// // //     // Here, we'll simulate RBC detection with a basic algorithm
    
// // //     // Load the RBC segmentation model
// // //     // This is just a placeholder - you'd need to implement the actual model loading
// // //     // const model = await tf.loadGraphModel(`file://${path.join(__dirname, '../../models/segmentation/cell_segmentation/model.json')}`);
    
// // //     // Instead of real segmentation, let's simulate RBC detection
// // //     const metadata = await sharp(imagePath).metadata();
// // //     const patches = [];
    
// // //     // Generate synthetic patches simulating RBCs
// // //     // In a real implementation, this would use the segmentation model results
// // //     const patchSize = 100; // Size of RBC patches
// // //     const patchCount = 10; // Number of synthetic patches to generate
    
// // //     for (let i = 0; i < patchCount; i++) {
// // //       // Generate random coordinates within the image bounds
// // //       const x = Math.floor(Math.random() * (metadata.width - patchSize));
// // //       const y = Math.floor(Math.random() * (metadata.height - patchSize));
      
// // //       // Extract a patch from the image
// // //       const patchFilename = `rbc-${imageId}-${i}-${uuidv4()}.png`;
// // //       const patchPath = path.join(PATCHES_DIR, patchFilename);
      
// // //       await sharp(imagePath)
// // //         .extract({ left: x, top: y, width: patchSize, height: patchSize })
// // //         .toFile(patchPath);
      
// // //       const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
// // //       const patchUrl = `${baseUrl}/uploads/patches/${patchFilename}`;
      
// // //       // Create patch record
// // //       const patch = await ImagePatch.create({
// // //         imageId,
// // //         patchUrl,
// // //         xCoord: x,
// // //         yCoord: y,
// // //         width: patchSize,
// // //         height: patchSize,
// // //         patchType: 'rbc'
// // //       });
      
// // //       patches.push(patch);
// // //     }
    
// // //     return patches;
// // //   } catch (error) {
// // //     logger.error('Error processing thin smear image:', error);
// // //     throw error;
// // //   }
// // // }

// // // /**
// // //  * Extract parasite candidate patches from a thick smear image
// // //  * @param {string} imageId - The SampleImage ID
// // //  * @returns {Array} The extracted patch data
// // //  */
// // // async function processThickSmear(imageId) {
// // //   try {
// // //     // Get image data from database
// // //     const imageData = await SampleImage.findByPk(imageId);
// // //     if (!imageData) {
// // //       throw new Error('Image not found');
// // //     }
    
// // //     // Extract filename from URL
// // //     const imageUrl = imageData.imageUrl;
// // //     const filename = path.basename(imageUrl);
// // //     const imagePath = path.join(UPLOADS_DIR, 'original', filename);
    
// // //     // Get image metadata
// // //     const metadata = await sharp(imagePath).metadata();
    
// // //     // For thick smears, we'll extract evenly spaced patches
// // //     // In a real implementation, you'd use a more sophisticated approach to find candidate regions
    
// // //     const patchSize = 200; // Bigger patches for parasite detection
// // //     const overlap = 50; // Overlap between patches
// // //     const step = patchSize - overlap;
    
// // //     const patches = [];
    
// // //     // Process the image in a grid pattern
// // //     for (let y = 0; y < metadata.height - patchSize; y += step) {
// // //       for (let x = 0; x < metadata.width - patchSize; x += step) {
// // //         // Extract a patch from the image
// // //         const patchFilename = `parasite-${imageId}-${x}-${y}-${uuidv4()}.png`;
// // //         const patchPath = path.join(PATCHES_DIR, patchFilename);
        
// // //         await sharp(imagePath)
// // //           .extract({ left: x, top: y, width: patchSize, height: patchSize })
// // //           .toFile(patchPath);
        
// // //         const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
// // //         const patchUrl = `${baseUrl}/uploads/patches/${patchFilename}`;
        
// // //         // Create patch record
// // //         const patch = await ImagePatch.create({
// // //           imageId,
// // //           patchUrl,
// // //           xCoord: x,
// // //           yCoord: y,
// // //           width: patchSize,
// // //           height: patchSize,
// // //           patchType: 'parasite_candidate'
// // //         });
        
// // //         patches.push(patch);
        
// // //         // Limit the number of patches to prevent overwhelming the system
// // //         if (patches.length >= 20) break;
// // //       }
      
// // //       if (patches.length >= 20) break;
// // //     }
    
// // //     return patches;
// // //   } catch (error) {
// // //     logger.error('Error processing thick smear image:', error);
// // //     throw error;
// // //   }
// // // }

// // // /**
// // //  * Process a sample image based on its type (thin or thick smear)
// // //  * @param {string} imageId - The SampleImage ID
// // //  * @returns {Array} The extracted patch data
// // //  */
// // // async function processImage(imageId) {
// // //   try {
// // //     // Get image data from database
// // //     const imageData = await SampleImage.findByPk(imageId);
// // //     if (!imageData) {
// // //       throw new Error('Image not found');
// // //     }
    
// // //     // Process based on image type
// // //     if (imageData.imageType === 'thin') {
// // //       return await processThinSmear(imageId);
// // //     } else {
// // //       return await processThickSmear(imageId);
// // //     }
// // //   } catch (error) {
// // //     logger.error('Error processing image:', error);
// // //     throw error;
// // //   }
// // // }

// // // module.exports = {
// // //   processUploadedImage,
// // //   processThinSmear,
// // //   processThickSmear,
// // //   processImage
// // // };
// // // src/services/imageProcessing.js
// // const sharp = require('sharp');
// // const path = require('path');
// // const fs = require('fs').promises;
// // const tf = require('@tensorflow/tfjs');
// // const cv = require('@u4/opencv4nodejs');
// //  // For advanced image processing operations
// // const { v4: uuidv4 } = require('uuid');
// // const logger = require('../config/logger');
// // const { SampleImage, ImagePatch } = require('../models');

// // // Base directory for image storage
// // const UPLOADS_DIR = path.join(__dirname, '../../uploads');
// // const PATCHES_DIR = path.join(UPLOADS_DIR, 'patches');
// // const MODELS_DIR = path.join(__dirname, '../../models');

// // /**
// //  * Thin Smear Processor - Adapted from Malaria Screener's ThinSmearProcessor
// //  * Identifies and extracts individual RBCs for classification
// //  */
// // class ThinSmearProcessor {
// //   /**
// //    * Process a thin smear image to extract RBC patches
// //    * @param {string} imageId - Database ID of the image
// //    * @returns {Promise<Array>} Array of extracted patches
// //    */
// //   static async processImage(imageId) {
// //     try {
// //       // Get image data from database
// //       const imageData = await SampleImage.findByPk(imageId);
// //       if (!imageData) {
// //         throw new Error('Image not found');
// //       }
      
// //       // Load image
// //       const imageUrl = imageData.imageUrl;
// //       const filename = path.basename(imageUrl);
// //       const imagePath = path.join(UPLOADS_DIR, 'original', filename);
      
// //       logger.info(`Processing thin smear image: ${imageId}`);
// //       const startTime = Date.now();
      
// //       // Convert to OpenCV format for processing
// //       const image = cv.imread(imagePath);
      
// //       // Split into channels (B, G, R) - using green channel as in original code
// //       const channels = image.splitChannels();
// //       const greenChannel = channels[1];
      
// //       // Apply watershed segmentation
// //       const segmentationResult = await this.markerBasedWatershed(greenChannel);
      
// //       if (!segmentationResult) {
// //         logger.error('Segmentation failed');
// //         return null;
// //       }
      
// //       // Extract cell patches
// //       const { watershedMask, wbcMask } = segmentationResult;
// //       const cellPatches = await this.extractCellPatches(imageId, image, watershedMask, wbcMask);
      
// //       logger.info(`Thin smear processing completed in ${Date.now() - startTime}ms. Extracted ${cellPatches.length} cells.`);
      
// //       // Release OpenCV matrices
// //       image.delete();
// //       greenChannel.delete();
// //       watershedMask.delete();
// //       wbcMask.delete();
      
// //       return cellPatches;
// //     } catch (error) {
// //       logger.error('Error processing thin smear image:', error);
// //       throw error;
// //     }
// //   }
  
// //   /**
// //    * Marker-based watershed segmentation - Adapted from MarkerBasedWatershed.java
// //    * @param {Mat} greenChannel - Green channel of the input image
// //    * @returns {Object} Object containing watershed mask and WBC mask
// //    */
// //   static async markerBasedWatershed(greenChannel) {
// //     try {
// //       // Step 1: Contrast stretching (as in original code)
// //       const minPercent = 0.01;
// //       const maxPercent = 0.99;
// //       const stretched = this.stretchHistogram(greenChannel, minPercent, maxPercent);
      
// //       if (!stretched) {
// //         return null;
// //       }
      
// //       // Step 2: Normalize to [0,1] range
// //       const normalized = stretched.convertTo(cv.CV_64F);
// //       const ones = new cv.Mat(normalized.rows, normalized.cols, cv.CV_64FC1, [1.0]);
// //       const negated = ones.subtract(normalized);
      
// //       // Step 3: Identify border regions (90% threshold)
// //       const threshold = new cv.Mat(negated.rows, negated.cols, cv.CV_64FC1, [0.8]);
// //       let maskBorder = negated.threshold(threshold, 1, cv.THRESH_BINARY_INV);
      
// //       // Step 4: Find contours and fill holes
// //       const contours = maskBorder.findContours(cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
// //       for (const contour of contours) {
// //         maskBorder.drawContours([contour], -1, new cv.Vec(1), cv.FILLED);
// //       }
      
// //       // Step 5: Erode to separate touching cells
// //       const kernel5x5 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
// //       maskBorder = maskBorder.erode(kernel5x5);
      
// //       // Step 6: Identify the main blood smear region
// //       const maskBorderContours = maskBorder.findContours(cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
      
// //       // Find the largest contour (main blood smear region)
// //       let maxArea = 0;
// //       let maxAreaIdx = 0;
      
// //       for (let i = 0; i < maskBorderContours.length; i++) {
// //         const area = contourArea(maskBorderContours[i]);
// //         if (area > maxArea) {
// //           maxArea = area;
// //           maxAreaIdx = i;
// //         }
// //       }
      
// //       // Get bounding rectangle of main region
// //       const rect = maskBorderContours[maxAreaIdx].boundingRect();
      
// //       // Crop the region of interest
// //       const croppedNegated = negated.getRegion(rect);
      
// //       // Step 7: Process for WBC detection (similar to original code)
// //       const kernel3x3 = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
// //       const dilated = croppedNegated.dilate(kernel3x3);
// //       const eroded = croppedNegated.erode(kernel3x3);
// //       const R = dilated.subtract(eroded);
      
// //       // Continue WBC detection (simplified for brevity)
// //       const WBCMask = R.threshold(0.2, 1, cv.THRESH_BINARY);
      
// //       // Step 8: Create watershed mask
// //       // Apply distance transform to find markers
// //       const distTransform = maskBorder.distanceTransform(cv.DIST_L2, 3);
      
// //       // Normalize distance transform
// //       let normalizedDist = distTransform.normalize(0, 1, cv.NORM_MINMAX);
// //       normalizedDist = normalizedDist.convertTo(cv.CV_8U, 255);
      
// //       // Find sure foreground (local maxima)
// //       const thresh = normalizedDist.threshold(0.7, 255, cv.THRESH_BINARY);
      
// //       // Find markers
// //       const markerContours = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
// //       const markers = new cv.Mat(thresh.rows, thresh.cols, cv.CV_32S, [0]);
      
// //       for (let i = 0; i < markerContours.length; i++) {
// //         markers.drawContours([markerContours[i]], -1, new cv.Vec(i + 1), cv.FILLED);
// //       }
      
// //       // Apply watershed
// //       cv.watershed(image, markers);
      
// //       // Create final mask
// //       const watershedMask = markers.threshold(0, 1, cv.THRESH_BINARY_INV);
      
// //       return { watershedMask, WBCMask };
// //     } catch (error) {
// //       logger.error('Error in watershed segmentation:', error);
// //       return null;
// //     }
// //   }
  
// //   /**
// //    * Stretches histogram to improve contrast
// //    * @param {Mat} image - Input image
// //    * @param {number} minPercent - Minimum percentile
// //    * @param {number} maxPercent - Maximum percentile
// //    * @returns {Mat} Contrast-enhanced image
// //    */
// //   static stretchHistogram(image, minPercent, maxPercent) {
// //     try {
// //       // Calculate histogram
// //       const hist = new cv.Mat();
// //       const channels = [0];
// //       const histSize = [256];
// //       const ranges = [0, 256];
      
// //       cv.calcHist([image], channels, null, histSize, ranges, hist);
      
// //       // Calculate cumulative histogram
// //       const cumulativeHist = new cv.Mat(hist.rows, hist.cols, hist.type());
// //       let sum = 0;
// //       for (let i = 0; i < hist.rows; i++) {
// //         sum += hist.at(i, 0);
// //         cumulativeHist.set(i, 0, sum);
// //       }
      
// //       // Find min and max values based on percentiles
// //       const totalPixels = image.rows * image.cols;
// //       const minVal = this.findPercentileValue(cumulativeHist, totalPixels, minPercent);
// //       const maxVal = this.findPercentileValue(cumulativeHist, totalPixels, maxPercent);
      
// //       // Apply contrast stretching
// //       return image.convertTo(cv.CV_8U, 255, 0, 1, (pixel) => {
// //         return Math.max(0, Math.min(255, ((pixel - minVal) * 255) / (maxVal - minVal)));
// //       });
// //     } catch (error) {
// //       logger.error('Error in histogram stretching:', error);
// //       return null;
// //     }
// //   }
  
// //   /**
// //    * Find value at given percentile in cumulative histogram
// //    * @param {Mat} cumulativeHist - Cumulative histogram
// //    * @param {number} totalPixels - Total number of pixels
// //    * @param {number} percentile - Desired percentile (0-1)
// //    * @returns {number} Value at percentile
// //    */
// //   static findPercentileValue(cumulativeHist, totalPixels, percentile) {
// //     const targetCount = totalPixels * percentile;
    
// //     for (let i = 0; i < cumulativeHist.rows; i++) {
// //       if (cumulativeHist.at(i, 0) >= targetCount) {
// //         return i;
// //       }
// //     }
    
// //     return 255;
// //   }
  
// //   /**
// //    * Extract individual cell patches based on watershed mask
// //    * @param {string} imageId - Database ID of the image
// //    * @param {Mat} image - Original image
// //    * @param {Mat} watershedMask - Watershed segmentation mask
// //    * @param {Mat} wbcMask - White blood cell mask
// //    * @returns {Promise<Array>} Array of extracted patches
// //    */
// //   static async extractCellPatches(imageId, image, watershedMask, wbcMask) {
// //     try {
// //       // Find contours in watershed mask
// //       const contours = watershedMask.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
// //       const patches = [];
// //       let cellCount = 0;
      
// //       for (const contour of contours) {
// //         // Filter contours by size (too small or too large are ignored)
// //         const area = contour.area;
        
// //         if (area < 500 || area > 5000) {
// //           continue;
// //         }
        
// //         // Get bounding rectangle
// //         const rect = contour.boundingRect();
        
// //         // Add padding
// //         const padding = 10;
// //         const x = Math.max(0, rect.x - padding);
// //         const y = Math.max(0, rect.y - padding);
// //         const width = Math.min(image.cols - x, rect.width + padding * 2);
// //         const height = Math.min(image.rows - y, rect.height + padding * 2);
        
// //         // Extract patch
// //         const patchMat = image.getRegion(new cv.Rect(x, y, width, height));
        
// //         // Save patch to file
// //         const patchFilename = `rbc-${imageId}-${x}-${y}-${uuidv4()}.png`;
// //         const patchPath = path.join(PATCHES_DIR, patchFilename);
        
// //         cv.imwrite(patchPath, patchMat);
        
// //         // Create URL for the patch
// //         const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
// //         const patchUrl = `${baseUrl}/uploads/patches/${patchFilename}`;
        
// //         // Create patch record in database
// //         const patch = await ImagePatch.create({
// //           imageId,
// //           patchUrl,
// //           xCoord: x,
// //           yCoord: y,
// //           width,
// //           height,
// //           patchType: 'rbc'
// //         });
        
// //         patches.push(patch);
// //         cellCount++;
        
// //         // Limit number of patches
// //         if (cellCount >= 100) {
// //           break;
// //         }
// //       }
      
// //       return patches;
// //     } catch (error) {
// //       logger.error('Error extracting cell patches:', error);
// //       throw error;
// //     }
// //   }
// // }

// // /**
// //  * Thick Smear Processor - Adapted from processThickImage.cpp
// //  * Processes thick smear images to extract parasite candidate patches
// //  */
// // class ThickSmearProcessor {
// //   /**
// //    * Process a thick smear image to extract parasite candidate patches
// //    * @param {string} imageId - Database ID of the image
// //    * @returns {Promise<Array>} Array of extracted patches
// //    */
// //   static async processImage(imageId) {
// //     try {
// //       // Get image data from database
// //       const imageData = await SampleImage.findByPk(imageId);
// //       if (!imageData) {
// //         throw new Error('Image not found');
// //       }
      
// //       // Load image
// //       const imageUrl = imageData.imageUrl;
// //       const filename = path.basename(imageUrl);
// //       const imagePath = path.join(UPLOADS_DIR, 'original', filename);
      
// //       logger.info(`Processing thick smear image: ${imageId}`);
// //       const startTime = Date.now();
      
// //       // Convert to OpenCV format for processing
// //       const image = cv.imread(imagePath);
      
// //       // Add border to image (similar to original code)
// //       const height = Math.round(image.rows * 0.1);
// //       const width = Math.round(image.cols * 0.1);
// //       const borderedImage = image.copyMakeBorder(height, height, width, width, cv.BORDER_CONSTANT);
      
// //       // Convert to grayscale
// //       const gray = borderedImage.cvtColor(cv.COLOR_RGB2GRAY);
      
// //       // Create binary mask using Otsu thresholding
// //       const mask = gray.threshold(0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
      
// //       // Get border mask
// //       const borderMask = await this.getBorderMask(mask);
      
// //       // Get WBC mask
// //       const wbcMask = await this.getWBCMask(mask, borderMask);
      
// //       // Extract parasite candidates using greedy algorithm
// //       const patches = await this.extractCandidatePatches(imageId, borderedImage, gray, borderMask, wbcMask);
      
// //       logger.info(`Thick smear processing completed in ${Date.now() - startTime}ms. Extracted ${patches.length} candidates.`);
      
// //       // Release OpenCV matrices
// //       image.delete();
// //       borderedImage.delete();
// //       gray.delete();
// //       mask.delete();
// //       borderMask.delete();
// //       wbcMask.delete();
      
// //       return patches;
// //     } catch (error) {
// //       logger.error('Error processing thick smear image:', error);
// //       throw error;
// //     }
// //   }
  
// //   /**
// //    * Create border mask from binary mask
// //    * @param {Mat} mask - Binary mask from thresholding
// //    * @returns {Mat} Border mask
// //    */
// //   static async getBorderMask(mask) {
// //     // Find contours
// //     const contours = mask.findContours(cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
    
// //     // Find the largest contour (main blood smear area)
// //     let maxArea = 0;
// //     let maxAreaIdx = 0;
    
// //     for (let i = 0; i < contours.length; i++) {
// //       const area = contours[i].area;
// //       if (area > maxArea) {
// //         maxArea = area;
// //         maxAreaIdx = i;
// //       }
// //     }
    
// //     // Create border mask
// //     const borderMask = mask.copy();
    
// //     // Fill all contours except the largest one
// //     for (let i = 0; i < contours.length; i++) {
// //       if (i !== maxAreaIdx) {
// //         borderMask.drawContours([contours[i]], -1, new cv.Vec(1), cv.FILLED);
// //       }
// //     }
    
// //     // Erode the border mask
// //     const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(11, 11));
// //     return borderMask.erode(kernel);
// //   }
  
// //   /**
// //    * Create WBC mask
// //    * @param {Mat} mask - Binary mask from thresholding
// //    * @param {Mat} borderMask - Border mask
// //    * @returns {Mat} WBC mask
// //    */
// //   static async getWBCMask(mask, borderMask) {
// //     // Subtract border mask from original mask
// //     const wbcMask = borderMask.subtract(mask);
    
// //     // Find contours and filter small ones
// //     const contours = wbcMask.findContours(cv.RETR_LIST, cv.CHAIN_APPROX_NONE);
    
// //     // Remove small areas (not WBCs)
// //     for (const contour of contours) {
// //       if (contour.area <= 1200) {
// //         wbcMask.drawContours([contour], -1, new cv.Vec(0), cv.FILLED);
// //       }
// //     }
    
// //     // Dilate to ensure coverage
// //     const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(9, 9));
// //     return wbcMask.dilate(kernel);
// //   }
  
// //   /**
// //    * Extract parasite candidate patches using greedy algorithm
// //    * @param {string} imageId - Database ID of the image
// //    * @param {Mat} image - Original image
// //    * @param {Mat} gray - Grayscale image
// //    * @param {Mat} borderMask - Border mask
// //    * @param {Mat} wbcMask - WBC mask
// //    * @returns {Promise<Array>} Array of extracted patches
// //    */
// //   static async extractCandidatePatches(imageId, image, gray, borderMask, wbcMask) {
// //     try {
// //       const height = Math.round(image.rows * 0.05);
// //       const width = Math.round(image.cols * 0.05);
// //       const numPatches = 400;
// //       const patches = [];
      
// //       // Create candidate mask (similar to original code)
// //       const ones = new cv.Mat(borderMask.rows, borderMask.cols, cv.CV_8UC1, [1]);
// //       const temp = ones.subtract(borderMask);
// //       const candidates = gray.mul(temp);
      
// //       // Remove WBC regions from candidates
// //       const wbcInverted = ones.subtract(wbcMask);
// //       const candidateMask = candidates.mul(wbcInverted);
      
// //       // Find min/max locations for greedy algorithm
// //       const minMaxResult = cv.minMaxLoc(candidateMask, wbcInverted);
      
// //       let minLoc = minMaxResult.minLoc;
// //       const radius = height / 2;
      
// //       // Greedy extraction of patches
// //       for (let i = 0; i < numPatches; i++) {
// //         if (minLoc.x - radius < 0 || minLoc.y - radius < 0) {
// //           break;
// //         }
        
// //         // Extract patch
// //         const rect = new cv.Rect(
// //           minLoc.x - radius, 
// //           minLoc.y - radius, 
// //           width, 
// //           height
// //         );
        
// //         const patch = image.getRegion(rect);
        
// //         // Create circular mask
// //         const circleMask = new cv.Mat(height, width, cv.CV_8UC1, [0]);
// //         circleMask.circle(
// //           new cv.Point(circleMask.cols / 2, circleMask.rows / 2),
// //           circleMask.cols / 2,
// //           new cv.Vec(255),
// //           cv.FILLED
// //         );
        
// //         // Apply mask to patch
// //         const maskedPatch = patch.bitwise_and(circleMask);
        
// //         // Save patch to file
// //         const patchFilename = `parasite-${imageId}-${minLoc.x}-${minLoc.y}-${uuidv4()}.png`;
// //         const patchPath = path.join(PATCHES_DIR, patchFilename);
        
// //         cv.imwrite(patchPath, maskedPatch);
        
// //         // Create URL for the patch
// //         const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
// //         const patchUrl = `${baseUrl}/uploads/patches/${patchFilename}`;
        
// //         // Create patch record in database
// //         const patchRecord = await ImagePatch.create({
// //           imageId,
// //           patchUrl,
// //           xCoord: minLoc.x,
// //           yCoord: minLoc.y,
// //           width,
// //           height,
// //           patchType: 'parasite_candidate'
// //         });
        
// //         patches.push(patchRecord);
        
// //         // Update candidate mask for next iteration
// //         candidateMask.circle(minLoc, radius, new cv.Vec(0), cv.FILLED);
        
// //         // Find next minimum
// //         const newMinMaxResult = cv.minMaxLoc(candidateMask, candidateMask);
// //         minLoc = newMinMaxResult.minLoc;
// //       }
      
// //       return patches;
// //     } catch (error) {
// //       logger.error('Error extracting candidate patches:', error);
// //       throw error;
// //     }
// //   }
// // }

// // /**
// //  * Main image processor that decides which processing to use based on image type
// //  */
// // async function processImage(imageId) {
// //   try {
// //     // Get image data from database
// //     const imageData = await SampleImage.findByPk(imageId);
// //     if (!imageData) {
// //       throw new Error('Image not found');
// //     }
    
// //     // Process based on image type
// //     if (imageData.imageType === 'thin') {
// //       return await ThinSmearProcessor.processImage(imageId);
// //     } else {
// //       return await ThickSmearProcessor.processImage(imageId);
// //     }
// //   } catch (error) {
// //     logger.error('Error processing image:', error);
// //     throw error;
// //   }
// // }

// // module.exports = {
// //   processImage,
// //   ThinSmearProcessor,
// //   ThickSmearProcessor
// // };

// // src/services/imageProcessor.js
// const path = require('path');
// const fs = require('fs').promises;
// const { v4: uuidv4 } = require('uuid');
// const logger = require('../config/logger');
// const sharp = require('sharp');
// const imageHelper = require('../utils/imageHelper');
// const { SampleImage, ImagePatch } = require('../models');

// // Base directory for image storage
// const UPLOADS_DIR = path.join(__dirname, '../../uploads');
// const PATCHES_DIR = path.join(UPLOADS_DIR, 'patches');
// const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// /**
//  * Process an uploaded image - create thumbnail and prepare for analysis
//  * @param {Object} imageData - The uploaded image data
//  * @returns {Object} The processed image data
//  */
// async function processUploadedImage(imageData) {
//   try {
//     const { filename, originalFilename, sampleId, imageType, fieldOfView, magnification } = imageData;
//     const originalPath = path.join(UPLOADS_DIR, 'original', filename);
    
//     // Get image metadata
//     const metadata = await sharp(originalPath).metadata();
    
//     // Generate thumbnail
//     const thumbnailFilename = `thumb-${filename}`;
//     const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);
    
//     await imageHelper.createThumbnail(originalPath, thumbnailPath);
    
//     // Construct URLs
//     const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
//     const imageUrl = `${baseUrl}/uploads/original/${filename}`;
//     const thumbnailUrl = `${baseUrl}/uploads/thumbnails/${thumbnailFilename}`;
    
//     // Return processed data
//     return {
//       imageUrl,
//       thumbnailUrl,
//       originalFilename,
//       width: metadata.width,
//       height: metadata.height,
//       format: metadata.format,
//       size: metadata.size
//     };
//   } catch (error) {
//     logger.error('Error processing uploaded image:', error);
//     throw error;
//   }
// }

// /**
//  * Process thin smear images (extract RBC-like regions)
//  * @param {string} imageId - The SampleImage ID
//  * @returns {Array} The extracted patch data
//  */
// async function processThinSmear(imageId) {
//   try {
//     // Get image data from database
//     const imageData = await SampleImage.findByPk(imageId);
//     if (!imageData) {
//       throw new Error('Image not found');
//     }
    
//     // Extract filename from URL
//     const imageUrl = imageData.imageUrl;
//     const filename = path.basename(imageUrl);
//     const imagePath = path.join(UPLOADS_DIR, 'original', filename);
    
//     logger.info(`Processing thin smear image: ${imageId}`);
    
//     // Extract RBC-like patches using our helper
//     const extractedPatches = await imageHelper.extractCellPatches(
//       imagePath, 
//       PATCHES_DIR, 
//       `rbc-${imageId}`, 
//       100, // patchSize 
//       20   // maxPatches
//     );
    
//     // Create database records for each patch
//     const patches = [];
//     const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    
//     for (const extractedPatch of extractedPatches) {
//       const patchUrl = `${baseUrl}/uploads/patches/${extractedPatch.filename}`;
      
//       // Create patch record
//       const patch = await ImagePatch.create({
//         imageId,
//         patchUrl,
//         xCoord: extractedPatch.x,
//         yCoord: extractedPatch.y,
//         width: extractedPatch.width,
//         height: extractedPatch.height,
//         patchType: 'rbc'
//       });
      
//       patches.push(patch);
//     }
    
//     logger.info(`Processed thin smear image ${imageId}, created ${patches.length} patches`);
    
//     // Optional: Create visualization of the patches
//     const visualizationPath = path.join(UPLOADS_DIR, 'patches', `viz-${imageId}-${Date.now()}.jpg`);
//     await imageHelper.visualizePatches(imagePath, extractedPatches, visualizationPath);
    
//     return patches;
//   } catch (error) {
//     logger.error('Error processing thin smear image:', error);
//     throw error;
//   }
// }

// /**
//  * Process thick smear images (extract grid patches)
//  * @param {string} imageId - The SampleImage ID
//  * @returns {Array} The extracted patch data
//  */
// async function processThickSmear(imageId) {
//   try {
//     // Get image data from database
//     const imageData = await SampleImage.findByPk(imageId);
//     if (!imageData) {
//       throw new Error('Image not found');
//     }
    
//     // Extract filename from URL
//     const imageUrl = imageData.imageUrl;
//     const filename = path.basename(imageUrl);
//     const imagePath = path.join(UPLOADS_DIR, 'original', filename);
    
//     logger.info(`Processing thick smear image: ${imageId}`);
    
//     // Extract grid patches using our helper
//     const extractedPatches = await imageHelper.extractGridPatches(
//       imagePath, 
//       PATCHES_DIR, 
//       `parasite-${imageId}`, 
//       200, // patchSize 
//       50,  // overlap
//       20   // maxPatches
//     );
    
//     // Create database records for each patch
//     const patches = [];
//     const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    
//     for (const extractedPatch of extractedPatches) {
//       const patchUrl = `${baseUrl}/uploads/patches/${extractedPatch.filename}`;
      
//       // Create patch record
//       const patch = await ImagePatch.create({
//         imageId,
//         patchUrl,
//         xCoord: extractedPatch.x,
//         yCoord: extractedPatch.y,
//         width: extractedPatch.width,
//         height: extractedPatch.height,
//         patchType: 'parasite_candidate'
//       });
      
//       patches.push(patch);
//     }
    
//     logger.info(`Processed thick smear image ${imageId}, created ${patches.length} patches`);
    
//     // Create visualization of the patches
//     const visualizationPath = path.join(UPLOADS_DIR, 'patches', `viz-${imageId}-${Date.now()}.jpg`);
//     await imageHelper.visualizePatches(imagePath, extractedPatches, visualizationPath);
    
//     return patches;
//   } catch (error) {
//     logger.error('Error processing thick smear image:', error);
//     throw error;
//   }
// }

// /**
//  * Process a sample image based on its type (thin or thick smear)
//  * @param {string} imageId - The SampleImage ID
//  * @returns {Array} The extracted patch data
//  */
// async function processImage(imageId) {
//   try {
//     // Get image data from database
//     const imageData = await SampleImage.findByPk(imageId);
//     if (!imageData) {
//       throw new Error('Image not found');
//     }
    
//     // Process based on image type
//     if (imageData.imageType === 'thin') {
//       return await processThinSmear(imageId);
//     } else {
//       return await processThickSmear(imageId);
//     }
//   } catch (error) {
//     logger.error('Error processing image:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processUploadedImage,
//   processThinSmear,
//   processThickSmear,
//   processImage
// };

// src/services/imageProcessor.js
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const sharp = require('sharp');
const imageHelper = require('../utils/imageHelper');
const { SampleImage, ImagePatch } = require('../models');

// Base directory for image storage
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const PATCHES_DIR = path.join(UPLOADS_DIR, 'patches');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');
/**
 * Process an uploaded image - create thumbnail and prepare for analysis
 * @param {Object} imageData - The uploaded image data
 * @returns {Object} The processed image data
 */
async function processUploadedImage(imageData) {
  try {
    const { filename, originalFilename, sampleId, imageType, fieldOfView, magnification } = imageData;
    const originalPath = path.join(UPLOADS_DIR, 'original', filename);
    
    // Get image metadata
    const metadata = await sharp(originalPath).metadata();
    
    // Generate thumbnail
    const thumbnailFilename = `thumb-${filename}`;
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);
    
    await sharp(originalPath)
      .resize(300, 300, { fit: 'inside' })
      .toFile(thumbnailPath);
    
    // Construct URLs
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const imageUrl = `${baseUrl}/uploads/original/${filename}`;
    const thumbnailUrl = `${baseUrl}/uploads/thumbnails/${thumbnailFilename}`;
    
    // Return processed data
    return {
      imageUrl,
      thumbnailUrl,
      originalFilename,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size
    };
  } catch (error) {
    logger.error('Error processing uploaded image:', error);
    throw error;
  }
}
  


/**
 * Process thick smear images (extract grid patches)
 * @param {string} imageId - The SampleImage ID
 * @returns {Array} The extracted patch data
 */
async function processThickSmear(imageId) {
  try {
    // Get image data from database
    const imageData = await SampleImage.findByPk(imageId);
    if (!imageData) {
      throw new Error('Image not found');
    }
    
    // Extract filename from URL
    const imageUrl = imageData.imageUrl;
    const filename = path.basename(imageUrl);
    const imagePath = path.join(UPLOADS_DIR, 'original', filename);
    
    // Get image metadata to ensure we stay within boundaries
    const metadata = await sharp(imagePath).metadata();
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;
    
    logger.info(`Processing thick smear image: ${imageId} (${imageWidth}x${imageHeight})`);
    
    // Validate image dimensions
    if (imageWidth < 200 || imageHeight < 200) {
      throw new Error(`Image too small (${imageWidth}x${imageHeight}). Minimum size required: 200x200 pixels`);
    }
    
    // Calculate safe patch size (ensure we don't go out of bounds)
    const patchSize = Math.min(200, Math.floor(imageWidth * 0.2), Math.floor(imageHeight * 0.2));
    const overlap = Math.floor(patchSize * 0.25); // 25% overlap
    const step = patchSize - overlap;
    
    logger.info(`Using patch size: ${patchSize}, overlap: ${overlap}, step: ${step}`);
    
    // Extract patches evenly throughout the image, respecting boundaries
    const patches = [];
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    // Calculate grid of patches
    const numPatchesX = Math.floor((imageWidth - patchSize) / step) + 1;
    const numPatchesY = Math.floor((imageHeight - patchSize) / step) + 1;
    
    // Limit total patches for performance
    const maxPatches = 20;
    let patchCount = 0;
    
    // Process grid in row-major order
    for (let y = 0; y <= imageHeight - patchSize && patchCount < maxPatches; y += step) {
      for (let x = 0; x <= imageWidth - patchSize && patchCount < maxPatches; x += step) {
        // Create a safe patch - ensure we don't exceed image boundaries
        const safeX = Math.min(x, imageWidth - patchSize);
        const safeY = Math.min(y, imageHeight - patchSize);
        
        // Extract and save the patch
        const patchFilename = `parasite-${imageId}-${safeX}-${safeY}-${Date.now()}.png`;
        const patchPath = path.join(PATCHES_DIR, patchFilename);
        
        try {
          // Extract the patch using safe coordinates
          await sharp(imagePath)
            .extract({ 
              left: safeX, 
              top: safeY, 
              width: patchSize, 
              height: patchSize 
            })
            .toFile(patchPath);
          
          // Create patch URL
          const patchUrl = `${baseUrl}/uploads/patches/${patchFilename}`;
          
          // Create patch record
          const patch = await ImagePatch.create({
            imageId,
            patchUrl,
            xCoord: safeX,
            yCoord: safeY,
            width: patchSize,
            height: patchSize,
            patchType: 'parasite_candidate'
          });
          
          patches.push(patch);
          patchCount++;
          
        } catch (extractError) {
          logger.warn(`Failed to extract patch at x=${safeX}, y=${safeY}: ${extractError.message}`);
          // Continue with next patch, don't fail the whole process
        }
      }
    }
    
    if (patches.length === 0) {
      throw new Error('Failed to extract any valid patches from the image');
    }
    
    logger.info(`Successfully processed thick smear image ${imageId}, created ${patches.length} patches`);
    
    // Optional: Create visualization of the patches
    try {
      const extractedPatches = patches.map(patch => ({
        x: patch.xCoord,
        y: patch.yCoord,
        width: patch.width,
        height: patch.height
      }));
      
      const visualizationPath = path.join(UPLOADS_DIR, 'patches', `viz-${imageId}-${Date.now()}.jpg`);
      await imageHelper.visualizePatches(imagePath, extractedPatches, visualizationPath);
      logger.info(`Created visualization at ${visualizationPath}`);
    } catch (vizError) {
      logger.warn(`Couldn't create visualization: ${vizError.message}`);
    }
    
    return patches;
  } catch (error) {
    logger.error('Error processing thick smear image:', error);
    throw error;
  }
}

/**
 * Process thin smear images (extract RBC-like regions)
 * @param {string} imageId - The SampleImage ID
 * @returns {Array} The extracted patch data
 */
async function processThinSmear(imageId) {
  try {
    // Get image data from database
    const imageData = await SampleImage.findByPk(imageId);
    if (!imageData) {
      throw new Error('Image not found');
    }
    
    // Extract filename from URL
    const imageUrl = imageData.imageUrl;
    const filename = path.basename(imageUrl);
    const imagePath = path.join(UPLOADS_DIR, 'original', filename);
    
    // Get image metadata to ensure we stay within boundaries
    const metadata = await sharp(imagePath).metadata();
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;
    
    logger.info(`Processing thin smear image: ${imageId} (${imageWidth}x${imageHeight})`);
    
    // Validate image dimensions
    if (imageWidth < 200 || imageHeight < 200) {
      throw new Error(`Image too small (${imageWidth}x${imageHeight}). Minimum size required: 200x200 pixels`);
    }
    
    // Calculate safe patch size
    const patchSize = Math.min(100, Math.floor(imageWidth * 0.1), Math.floor(imageHeight * 0.1));
    
    logger.info(`Using patch size: ${patchSize}`);
    
    // Generate "RBC-like" patches in a distributed manner
    const patches = [];
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const maxPatches = 20;
    
    // Create a grid for more uniform coverage
    const gridSize = Math.ceil(Math.sqrt(maxPatches));
    const stepX = Math.floor((imageWidth - patchSize) / gridSize);
    const stepY = Math.floor((imageHeight - patchSize) / gridSize);
    
    // Add some randomness to simulate cell detection
    let patchCount = 0;
    
    // Process grid cells with randomization
    for (let gridY = 0; gridY < gridSize && patchCount < maxPatches; gridY++) {
      for (let gridX = 0; gridX < gridSize && patchCount < maxPatches; gridX++) {
        // Base position in the grid
        const baseX = gridX * stepX;
        const baseY = gridY * stepY;
        
        // Add randomness within the grid cell
        const randomOffsetX = Math.floor(Math.random() * (stepX * 0.5));
        const randomOffsetY = Math.floor(Math.random() * (stepY * 0.5));
        
        // Calculate final coordinates with safety bounds
        const x = Math.min(baseX + randomOffsetX, imageWidth - patchSize);
        const y = Math.min(baseY + randomOffsetY, imageHeight - patchSize);
        
        // Extract and save the patch
        const patchFilename = `rbc-${imageId}-${x}-${y}-${Date.now()}.png`;
        const patchPath = path.join(PATCHES_DIR, patchFilename);
        
        try {
          // Extract the patch using safe coordinates
          await sharp(imagePath)
            .extract({ 
              left: x, 
              top: y, 
              width: patchSize, 
              height: patchSize 
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
            width: patchSize,
            height: patchSize,
            patchType: 'rbc'
          });
          
          patches.push(patch);
          patchCount++;
          
        } catch (extractError) {
          logger.warn(`Failed to extract patch at x=${x}, y=${y}: ${extractError.message}`);
          // Continue with next patch, don't fail the whole process
        }
      }
    }
    
    if (patches.length === 0) {
      throw new Error('Failed to extract any valid patches from the image');
    }
    
    logger.info(`Successfully processed thin smear image ${imageId}, created ${patches.length} patches`);
    
    // Optional: Create visualization of the patches
    try {
      const extractedPatches = patches.map(patch => ({
        x: patch.xCoord,
        y: patch.yCoord,
        width: patch.width,
        height: patch.height
      }));
      
      const visualizationPath = path.join(UPLOADS_DIR, 'patches', `viz-${imageId}-${Date.now()}.jpg`);
      await imageHelper.visualizePatches(imagePath, extractedPatches, visualizationPath);
      logger.info(`Created visualization at ${visualizationPath}`);
    } catch (vizError) {
      logger.warn(`Couldn't create visualization: ${vizError.message}`);
    }
    
    return patches;
  } catch (error) {
    logger.error('Error processing thin smear image:', error);
    throw error;
  }
}
module.exports = {
  processUploadedImage,
  processThinSmear,
  processThickSmear
};