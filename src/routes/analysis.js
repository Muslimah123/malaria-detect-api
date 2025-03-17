// // src/routes/analysis.js
// const express = require('express');
// const {
//   processImagePatches,
//   getImagePatches,
//   runCnnAnalysis,
//   getCnnAnalysisResults,
//   sendToYoloAnalysis,
//   getYoloAnalysisResults,
//   verifyAnalysis
// } = require('../controllers/analysis');
// const { protect, authorize } = require('../middleware/auth');

// const router = express.Router();

// // Apply auth middleware to all routes
// router.use(protect);

// // Image processing routes
// router.post('/process-image/:imageId', processImagePatches);
// router.get('/patches/:imageId', getImagePatches);

// // CNN analysis routes
// router.post('/cnn/:imageId', runCnnAnalysis);
// router.get('/cnn/:imageId', getCnnAnalysisResults);

// // YOLO API routes
// router.post('/yolo/:imageId/:initialAnalysisId', sendToYoloAnalysis);
// router.get('/yolo/:imageId', getYoloAnalysisResults);

// // Verification routes (restricted to authorized roles)
// router.put(
//   '/verify/:id',
//   authorize('lab_technician', 'doctor', 'admin'),
//   verifyAnalysis
// );

// module.exports = router;
// src/routes/analysis.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { processImage } = require('../services/imageProcessor');
const { runAnalysis } = require('../services/cnnClassifier');
const { sendToYoloApi } = require('../services/yoloIntegration');

// Process image to extract patches
router.post('/process-image/:imageId', protect, async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    // Return 202 Accepted - processing will continue asynchronously
    res.status(202).json({
      success: true,
      message: 'Image processing started',
      data: { imageId, status: 'processing' }
    });
    
    // Process the image asynchronously
    processImage(imageId)
      .then(patches => {
        console.log(`Processed image ${imageId}, extracted ${patches.length} patches`);
      })
      .catch(error => {
        console.error(`Failed to process image ${imageId}:`, error);
      });
      
  } catch (error) {
    next(error);
  }
});

// Run CNN analysis on the extracted patches
router.post('/analyze/:imageId', protect, async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    // Return 202 Accepted - analysis will continue asynchronously
    res.status(202).json({
      success: true,
      message: 'Analysis started',
      data: { imageId, status: 'processing' }
    });
    
    // Run analysis asynchronously
    runAnalysis(imageId)
      .then(analysis => {
        console.log(`Analysis completed for image ${imageId}`);
        
        // If analysis is positive, send to YOLO API
        if (analysis.isPositive) {
          sendToYoloApi(imageId, analysis.id)
            .then(() => {
              console.log(`Sent image ${imageId} to YOLO API for detailed analysis`);
            })
            .catch(error => {
              console.error(`Failed to send image ${imageId} to YOLO API:`, error);
            });
        }
      })
      .catch(error => {
        console.error(`Failed to analyze image ${imageId}:`, error);
      });
      
  } catch (error) {
    next(error);
  }
});

module.exports = router;