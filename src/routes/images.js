// src/routes/images.js
const express = require('express');
const { 
  uploadImage, 
  getSampleImages, 
  getImage, 
  deleteImage 
} = require('../controllers/images');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.post('/upload/:sampleId', upload.single('image'), handleUploadError, uploadImage);
router.get('/sample/:sampleId', getSampleImages);
router.get('/:id', getImage);
router.delete('/:id', deleteImage);

module.exports = router;