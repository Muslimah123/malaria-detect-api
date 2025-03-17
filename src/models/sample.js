// src/models/sample.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sample = sequelize.define('Sample', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sampleId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'sample_id',
      validate: {
        notEmpty: { msg: 'Sample ID is required' }
      }
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'patient_id',
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    sampleType: {
      type: DataTypes.ENUM('thick_smear', 'thin_smear', 'both'),
      allowNull: false,
      defaultValue: 'thick_smear',
      field: 'sample_type'
    },
    collectionTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'collection_time'
    },
    labTechnician: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'lab_technician',
      validate: {
        notEmpty: { msg: 'Lab technician name is required' }
      }
    },
    status: {
      type: DataTypes.ENUM('registered', 'ready_for_analysis', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'registered'
    },
    priority: {
      type: DataTypes.ENUM('routine', 'urgent'),
      allowNull: false,
      defaultValue: 'routine'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'samples',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Associations
  Sample.associate = (models) => {
    Sample.belongsTo(models.Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    
    Sample.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    
    Sample.hasMany(models.SampleImage, {
      foreignKey: 'sample_id',
      as: 'images'
    });
    
    Sample.hasMany(models.InitialAnalysis, {
      foreignKey: 'sample_id',
      as: 'initialAnalyses'
    });
    
    Sample.hasMany(models.DetailedAnalysis, {
      foreignKey: 'sample_id',
      as: 'detailedAnalyses'
    });
  };

  return Sample;
};