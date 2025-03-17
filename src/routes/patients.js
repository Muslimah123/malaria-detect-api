// src/routes/patients.js
const express = require('express');
const {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patients');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .post(createPatient)
  .get(getPatients);

router.route('/:id')
  .get(getPatient)
  .put(updatePatient)
  .delete(authorize('admin', 'doctor'), deletePatient);

module.exports = router;


