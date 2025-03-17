// src/controllers/images.js
const path = require('path');
const fs = require('fs').promises;
const { ErrorResponse } = require('../middleware/error');
const { Sample, SampleImage } = require('../models');
const { processUploadedImage } = require('../services/imageProcessor');

/**
 * @desc    Upload a sample image
 * @route   POST /api/images/upload/:sampleId
 * @access  Private
 */
exports.uploadImage = async (req, res, next) => {
  try {
    const { sampleId } = req.params;
    const { fieldOfView, magnification, imageType } = req.body;
    
    // Check if sample exists
    const sample = await Sample.findByPk(sampleId);
    if (!sample) {
      // Delete uploaded file if sample doesn't exist
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      return next(new ErrorResponse(`Sample not found with id ${sampleId}`, 404));
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }
    
    // Process the uploaded image
    const imageData = await processUploadedImage({
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      sampleId,
      fieldOfView: fieldOfView || 'Center',
      magnification: magnification || '100x',
      imageType: imageType || (sample.sampleType === 'thin_smear' ? 'thin' : 'thick')
    });
    
    // Create image record in database
    const sampleImage = await SampleImage.create({
      sampleId,
      imageUrl: imageData.imageUrl,
      thumbnailUrl: imageData.thumbnailUrl,
      originalFilename: imageData.originalFilename,
      fieldOfView: fieldOfView || 'Center',
      magnification: magnification || '100x',
      imageType: imageType || (sample.sampleType === 'thin_smear' ? 'thin' : 'thick'),
      width: imageData.width,
      height: imageData.height,
      format: imageData.format,
      size: imageData.size,
      captureDevice: req.body.captureDevice
    });
    
    // Update sample status if it's still in 'registered' state
    if (sample.status === 'registered') {
      await sample.update({ status: 'ready_for_analysis' });
    }
    
    res.status(201).json({
      success: true,
      data: sampleImage
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    next(error);
  }
};

/**
 * @desc    Get all images for a sample
 * @route   GET /api/images/sample/:sampleId
 * @access  Private
 */
exports.getSampleImages = async (req, res, next) => {
  try {
    const { sampleId } = req.params;
    
    // Check if sample exists
    const sample = await Sample.findByPk(sampleId);
    if (!sample) {
      return next(new ErrorResponse(`Sample not found with id ${sampleId}`, 404));
    }
    
    // Get all images for the sample
    const images = await SampleImage.findAll({
      where: { sampleId },
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single image
 * @route   GET /api/images/:id
 * @access  Private
 */
exports.getImage = async (req, res, next) => {
  try {
    const image = await SampleImage.findByPk(req.params.id);
    
    if (!image) {
      return next(new ErrorResponse(`Image not found with id ${req.params.id}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an image
 * @route   DELETE /api/images/:id
 * @access  Private
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const image = await SampleImage.findByPk(req.params.id);
    
    if (!image) {
      return next(new ErrorResponse(`Image not found with id ${req.params.id}`, 404));
    }
    
    // Delete the image files
    // Extract filenames from URLs
    const imageUrl = image.imageUrl;
    const imageFilename = path.basename(imageUrl);
    const imagePath = path.join(__dirname, '../../uploads/original', imageFilename);
    
    if (image.thumbnailUrl) {
      const thumbnailUrl = image.thumbnailUrl;
      const thumbnailFilename = path.basename(thumbnailUrl);
      const thumbnailPath = path.join(__dirname, '../../uploads/thumbnails', thumbnailFilename);
      
      // Delete thumbnail if it exists
      try {
        await fs.access(thumbnailPath);
        await fs.unlink(thumbnailPath);
      } catch (error) {
        // Ignore errors if thumbnail doesn't exist
      }
    }
    
    // Delete original image
    try {
      await fs.access(imagePath);
      await fs.unlink(imagePath);
    } catch (error) {
      // Ignore errors if image doesn't exist
    }
    
    // Delete image record
    await image.destroy();
    
    // Check if sample has any images left
    const remainingImages = await SampleImage.count({ where: { sampleId: image.sampleId } });
    
    // If no images left, update sample status
    if (remainingImages === 0) {
      await Sample.update(
        { status: 'registered' },
        { where: { id: image.sampleId } }
      );
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
