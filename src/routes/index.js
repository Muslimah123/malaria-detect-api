// src/routes/index.js
const express = require('express');
const router = express.Router();
const testRoutes = require('./test');
router.use('/test', testRoutes);

// Import route files
const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const sampleRoutes = require('./samples');
const imageRoutes = require('./images');
const analysisRoutes = require('./analysis');

// Mount routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/samples', sampleRoutes);
router.use('/images', imageRoutes);
router.use('/analysis', analysisRoutes);

// Base route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MalariaDetect API is running',
    version: '1.0.0'
  });
});

module.exports = router;