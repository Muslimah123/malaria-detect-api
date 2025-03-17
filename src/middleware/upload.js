// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ErrorResponse } = require('./error');

// Ensure upload directories exist
const createUploadDirectories = () => {
  const dirs = [
    path.join(__dirname, '../../uploads/original'),
    path.join(__dirname, '../../uploads/thumbnails'),
    path.join(__dirname, '../../uploads/patches')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirectories();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/original'));
  },
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    const fileExt = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${timestamp}-${randomName}${fileExt}`);
  }
});

// Filter file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|tiff|bmp/i;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new ErrorResponse('Only image files are allowed', 400), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter
});

// Middleware to handle file upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next(err);
};

module.exports = {
  upload,
  handleUploadError
};