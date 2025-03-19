// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth');
const patientRoutes = require('./patients');
const sampleRoutes = require('./samples');
const imageRoutes = require('./images');
const analysisRoutes = require('./analysis');
const testRoutes = require('./test');

// Mount routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/samples', sampleRoutes);
router.use('/images', imageRoutes);
router.use('/analysis', analysisRoutes);
router.use('/test', testRoutes);

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Base
 *     summary: API Status
 *     description: Check if the API is running
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "MalariaDetect API is running"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MalariaDetect API is running',
    version: '1.0.0'
  });
});

module.exports = router;