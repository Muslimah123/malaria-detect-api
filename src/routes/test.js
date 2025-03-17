// src/routes/test.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Public test endpoint (no auth required)
router.get('/public', (req, res) => {
  res.json({
    success: true,
    message: 'Public route is working!',
    timestamp: new Date().toISOString()
  });
});

// Protected test endpoint (auth required)
router.get('/protected', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route is working! You are authenticated.',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

// Add this to your src/routes/index.js file:
// const testRoutes = require('./test');
// router.use('/test', testRoutes);