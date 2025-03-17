// src/controllers/analysis.js
const { ErrorResponse } = require('../middleware/error');
const { 
  Sample, 
  SampleImage, 
  ImagePatch, 
  InitialAnalysis,
  DetailedAnalysis,
  PatchClassification,
  DetectionResult
} = require('../models');
const { processImage } = require('../services/imageProcessor');
const { runInitialAnalysis } = require('../services/cnnAnalyzer');
const { sendToYoloApi } = require('../services/yoloIntegration');

/**
 * @desc    Start image processing (patching)
 * @route   POST /api/analysis/process-image/:imageId
 * @access  Private
 */
exports.processImagePatches = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    // Check if image exists
    const image = await SampleImage.findByPk(imageId);
    if (!image) {
      return next(new ErrorResponse(`Image not found with id ${imageId}`, 404));
    }
    
    // Check if patches already exist
    const existingPatches = await ImagePatch.count({ where: { imageId } });
    if (existingPatches > 0) {
      return next(new ErrorResponse(`Image has already been processed with ${existingPatches} patches`, 400));
    }
    
    // Update sample status
    await Sample.update(
      { status: 'processing' },
      { where: { id: image.sampleId } }
    );
    
    // Return a 202 Accepted response - processing will continue asynchronously
    res.status(202).json({
      success: true,
      message: 'Image processing started',
      data: {
        imageId,
        status: 'processing'
      }
    });
    
    // Process the image asynchronously
    processImage(imageId)
      .then(patches => {
        console.log(`Processed image ${imageId} with ${patches.length} patches`);
        
        // Update sample status
        Sample.update(
          { status: 'ready_for_analysis' },
          { where: { id: image.sampleId } }
        );
      })
      .catch(error => {
        console.error(`Failed to process image ${imageId}:`, error);
        
        // Update sample status on error
        Sample.update(
          { status: 'failed' },
          { where: { id: image.sampleId } }
        );
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all patches for an image
 * @route   GET /api/analysis/patches/:imageId
 * @access  Private
 */
exports.getImagePatches = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    // Check if image exists
    const image = await SampleImage.findByPk(imageId);
    if (!image) {
      return next(new ErrorResponse(`Image not found with id ${imageId}`, 404));
    }
    
    // Get all patches for the image
    const patches = await ImagePatch.findAll({
      where: { imageId },
      order: [['created_at', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: patches.length,
      data: patches
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start CNN analysis of an image
 * @route   POST /api/analysis/cnn/:imageId
 * @access  Private
 */
exports.runCnnAnalysis = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    // Check if image exists
    const image = await SampleImage.findByPk(imageId);
    if (!image) {
      return next(new ErrorResponse(`Image not found with id ${imageId}`, 404));
    }
    
    // Check if image has patches
    const patchCount = await ImagePatch.count({ where: { imageId } });
    if (patchCount === 0) {
      return next(new ErrorResponse('Image has not been processed into patches yet', 400));
    }
    
    // Check if CNN analysis already exists
    const existingAnalysis = await InitialAnalysis.findOne({ where: { imageId } });
    if (existingAnalysis) {
      return next(new ErrorResponse(`Image has already been analyzed with CNN (ID: ${existingAnalysis.id})`, 400));
    }
    
    // Update sample status
    await Sample.update(
      { status: 'processing' },
      { where: { id: image.sampleId } }
    );
    
    // Return a 202 Accepted response - analysis will continue asynchronously
    res.status(202).json({
      success: true,
      message: 'CNN analysis started',
      data: {
        imageId,
        status: 'processing'
      }
    });
    
    // Run CNN analysis asynchronously
    runInitialAnalysis(imageId)
      .then(analysis => {
        console.log(`Completed CNN analysis for image ${imageId} (ID: ${analysis.id})`);
      })
      .catch(error => {
        console.error(`Failed to analyze image ${imageId}:`, error);
        
        // Update sample status on error
        Sample.update(
          { status: 'failed' },
          { where: { id: image.sampleId } }
        );
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get CNN analysis results
 * @route   GET /api/analysis/cnn/:imageId
 * @access  Private
 */
exports.getCnnAnalysisResults = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    // Check if image exists
    const image = await SampleImage.findByPk(imageId);
    if (!image) {
      return next(new ErrorResponse(`Image not found with id ${imageId}`, 404));
    }
    
    // Get CNN analysis
    const analysis = await InitialAnalysis.findOne({
      where: { imageId },
      include: [
        {
          model: PatchClassification,
          as: 'patchResults',
          include: [
            {
              model: ImagePatch,
              as: 'patch'
            }
          ]
        }
      ]
    });
    
    if (!analysis) {
      return next(new ErrorResponse(`No CNN analysis found for image ${imageId}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send to YOLO API for detailed analysis
 * @route   POST /api/analysis/yolo/:imageId/:initialAnalysisId
 * @access  Private
 */
exports.sendToYoloAnalysis = async (req, res, next) => {
  try {
    const { imageId, initialAnalysisId } = req.params;
    
    // Check if image exists
    const image = await SampleImage.findByPk(imageId);
    if (!image) {
      return next(new ErrorResponse(`Image not found with id ${imageId}`, 404));
    }
    
    // Check if initial analysis exists
    const initialAnalysis = await InitialAnalysis.findByPk(initialAnalysisId);
    if (!initialAnalysis) {
      return next(new ErrorResponse(`Initial analysis not found with id ${initialAnalysisId}`, 404));
    }
    
    // Check if YOLO analysis already exists
    const existingAnalysis = await DetailedAnalysis.findOne({
      where: { 
        imageId,
        initialAnalysisId
      }
    });
    
    if (existingAnalysis) {
      return next(new ErrorResponse(`YOLO analysis already exists for this image and initial analysis (ID: ${existingAnalysis.id})`, 400));
    }
    
    // Return a 202 Accepted response - analysis will continue asynchronously
    res.status(202).json({
      success: true,
      message: 'YOLO analysis started',
      data: {
        imageId,
        initialAnalysisId,
        status: 'processing'
      }
    });
    
    // Send to YOLO API asynchronously
    sendToYoloApi(imageId, initialAnalysisId)
      .then(analysis => {
        console.log(`Completed YOLO analysis for image ${imageId} (ID: ${analysis.id})`);
      })
      .catch(error => {
        console.error(`Failed to send image ${imageId} to YOLO API:`, error);
        
        // Update sample status on error
        Sample.update(
          { status: 'failed' },
          { where: { id: image.sampleId } }
        );
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get YOLO analysis results
 * @route   GET /api/analysis/yolo/:imageId
 * @access  Private
 */
exports.getYoloAnalysisResults = async (req, res, next) => {
  try {
    const { imageId } = req.params;
    
    // Check if image exists
    const image = await SampleImage.findByPk(imageId);
    if (!image) {
      return next(new ErrorResponse(`Image not found with id ${imageId}`, 404));
    }
    
    // Get YOLO analysis
    const analysis = await DetailedAnalysis.findOne({
      where: { imageId },
      include: [
        {
          model: DetectionResult,
          as: 'detections'
        },
        {
          model: InitialAnalysis,
          as: 'initialAnalysis'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    if (!analysis) {
      return next(new ErrorResponse(`No YOLO analysis found for image ${imageId}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify analysis results (manual confirmation)
 * @route   PUT /api/analysis/verify/:id
 * @access  Private
 */
exports.verifyAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // Find the detailed analysis
    const analysis = await DetailedAnalysis.findByPk(id);
    if (!analysis) {
      return next(new ErrorResponse(`YOLO analysis not found with id ${id}`, 404));
    }
    
    // Update verification details
    analysis.verifiedBy = req.user.id;
    analysis.verifiedAt = new Date();
    
    if (notes) {
      analysis.notes = notes;
    }
    
    await analysis.save();
    
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};