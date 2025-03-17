// src/controllers/samples.js
const { Op } = require('sequelize');
const { Sample, Patient, SampleImage, User, InitialAnalysis, DetailedAnalysis } = require('../models');
const { ErrorResponse } = require('../middleware/error');

/**
 * @desc    Create a new sample
 * @route   POST /api/samples
 * @access  Private
 */
exports.createSample = async (req, res, next) => {
  try {
    const {
      patientId,
      sampleType,
      collectionTime,
      labTechnician,
      priority,
      notes
    } = req.body;
    
    // Check if patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return next(new ErrorResponse(`Patient not found with id ${patientId}`, 404));
    }
    
    // Generate sample ID (could be customized for your needs)
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    const sampleId = `S${dateString}-${randomPart}`;
    
    // Create sample
    const sample = await Sample.create({
      sampleId,
      patientId,
      sampleType,
      collectionTime: collectionTime || new Date(),
      labTechnician,
      priority: priority || 'routine',
      notes,
      createdBy: req.user.id,
      status: 'registered'
    });
    
    res.status(201).json({
      success: true,
      data: sample
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all samples with pagination and filtering
 * @route   GET /api/samples
 * @access  Private
 */
exports.getSamples = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const search = req.query.search || '';
    const status = req.query.status;
    const priority = req.query.priority;
    const sampleType = req.query.sampleType;
    const patientId = req.query.patientId;
    
    // Build query
    let whereClause = {};
    
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { sampleId: { [Op.iLike]: `%${search}%` } },
          { labTechnician: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (priority) {
      whereClause.priority = priority;
    }
    
    if (sampleType) {
      whereClause.sampleType = sampleType;
    }
    
    if (patientId) {
      whereClause.patientId = patientId;
    }
    
    // Get total count
    const total = await Sample.count({ where: whereClause });
    
    // Get samples
    const samples = await Sample.findAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'patientId', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset: startIndex
    });
    
    res.status(200).json({
      success: true,
      count: samples.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: samples
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single sample with full details
 * @route   GET /api/samples/:id
 * @access  Private
 */
exports.getSample = async (req, res, next) => {
  try {
    const sample = await Sample.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: SampleImage,
          as: 'images',
          order: [['created_at', 'DESC']]
        },
        {
          model: InitialAnalysis,
          as: 'initialAnalyses',
          order: [['created_at', 'DESC']]
        },
        {
          model: DetailedAnalysis,
          as: 'detailedAnalyses',
          order: [['created_at', 'DESC']]
        }
      ]
    });
    
    if (!sample) {
      return next(new ErrorResponse(`Sample not found with id ${req.params.id}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: sample
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a sample
 * @route   PUT /api/samples/:id
 * @access  Private
 */
exports.updateSample = async (req, res, next) => {
  try {
    // Fields to update
    const { labTechnician, priority, notes } = req.body;
    
    // Find sample
    let sample = await Sample.findByPk(req.params.id);
    
    if (!sample) {
      return next(new ErrorResponse(`Sample not found with id ${req.params.id}`, 404));
    }
    
    // Update sample
    sample = await sample.update({
      labTechnician,
      priority,
      notes
    });
    
    res.status(200).json({
      success: true,
      data: sample
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a sample
 * @route   DELETE /api/samples/:id
 * @access  Private
 */
exports.deleteSample = async (req, res, next) => {
  try {
    const sample = await Sample.findByPk(req.params.id);
    
    if (!sample) {
      return next(new ErrorResponse(`Sample not found with id ${req.params.id}`, 404));
    }
    
    // Delete sample (cascade will handle related images and analyses)
    await sample.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/samples/stats
 * @access  Private
 */
exports.getStats = async (req, res, next) => {
  try {
    // Get counts by status
    const statusCounts = await Sample.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Get counts by priority
    const priorityCounts = await Sample.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['priority']
    });
    
    // Get counts by sample type
    const typeCounts = await Sample.findAll({
      attributes: [
        'sampleType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['sampleType']
    });
    
    // Get counts of positive samples
    const positiveCount = await InitialAnalysis.count({
      where: { isPositive: true }
    });
    
    // Get recent samples
    const recentSamples = await Sample.findAll({
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'patientId', 'name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    // Format status counts into object
    const statusStats = {};
    statusCounts.forEach(item => {
      statusStats[item.status] = parseInt(item.getDataValue('count'));
    });
    
    // Format priority counts into object
    const priorityStats = {};
    priorityCounts.forEach(item => {
      priorityStats[item.priority] = parseInt(item.getDataValue('count'));
    });
    
    // Format type counts into object
    const typeStats = {};
    typeCounts.forEach(item => {
      typeStats[item.sampleType] = parseInt(item.getDataValue('count'));
    });
    
    // Return formatted stats
    res.status(200).json({
      success: true,
      data: {
        total: await Sample.count(),
        byStatus: statusStats,
        byPriority: priorityStats,
        byType: typeStats,
        positiveCount,
        recentSamples
      }
    });
  } catch (error) {
    next(error);
  }
};