// src/routes/samples.js
const express = require('express');
const {
  createSample,
  getSamples,
  getSample,
  updateSample,
  deleteSample,
  getStats
} = require('../controllers/samples');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Stats route
router.get('/stats', getStats);

router.route('/')
  .post(createSample)
  .get(getSamples);

router.route('/:id')
  .get(getSample)
  .put(updateSample)
  .delete(authorize('admin', 'lab_technician'), deleteSample);

module.exports = router;