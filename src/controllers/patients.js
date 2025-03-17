// src/controllers/patients.js
const { Op } = require('sequelize');
const { Patient, Sample } = require('../models');
const { ErrorResponse } = require('../middleware/error');

/**
 * @desc    Create a new patient
 * @route   POST /api/patients
 * @access  Private
 */
exports.createPatient = async (req, res, next) => {
  try {
    const { patientId, name, age, gender, contactNumber, address, medicalHistory } = req.body;
    
    // Check if patient with this ID already exists
    const existingPatient = await Patient.findOne({ where: { patientId } });
    if (existingPatient) {
      return next(new ErrorResponse(`Patient with ID ${patientId} already exists`, 400));
    }
    
    // Create patient
    const patient = await Patient.create({
      patientId,
      name,
      age,
      gender,
      contactNumber,
      address,
      medicalHistory
    });
    
    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all patients with pagination and filtering
 * @route   GET /api/patients
 * @access  Private
 */
exports.getPatients = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const search = req.query.search || '';
    
    // Build query
    let whereClause = {};
    
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { patientId: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Get total count
    const total = await Patient.count({ where: whereClause });
    
    // Get patients
    const patients = await Patient.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset: startIndex
    });
    
    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single patient
 * @route   GET /api/patients/:id
 * @access  Private
 */
exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        {
          model: Sample,
          as: 'samples',
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!patient) {
      return next(new ErrorResponse(`Patient not found with id ${req.params.id}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a patient
 * @route   PUT /api/patients/:id
 * @access  Private
 */
exports.updatePatient = async (req, res, next) => {
  try {
    // Fields to update
    const { name, age, gender, contactNumber, address, medicalHistory } = req.body;
    
    // Find patient
    let patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return next(new ErrorResponse(`Patient not found with id ${req.params.id}`, 404));
    }
    
    // Update patient
    patient = await patient.update({
      name,
      age,
      gender,
      contactNumber,
      address,
      medicalHistory
    });
    
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a patient
 * @route   DELETE /api/patients/:id
 * @access  Private
 */
exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return next(new ErrorResponse(`Patient not found with id ${req.params.id}`, 404));
    }
    
    // Delete patient (cascade will handle related samples)
    await patient.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};