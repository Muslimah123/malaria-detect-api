// // src/models/detailedAnalysis.js
// const { DataTypes } = require('sequelize');
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Ensure this points to your DB connection


module.exports = (sequelize) => {
  const DetailedAnalysis = sequelize.define('DetailedAnalysis', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sampleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'sample_id',
      references: {
        model: 'samples',
        key: 'id'
      }
    },
    imageId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'image_id',
      references: {
        model: 'sample_images',
        key: 'id'
      }
    },
    initialAnalysisId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'initial_analysis_id',
      references: {
        model: 'initial_analysis',
        key: 'id'
      }
    },
    parasiteDetected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'parasite_detected'
    },
    species: {
      type: DataTypes.ENUM('p_falciparum', 'p_vivax', 'p_malariae', 'p_ovale', 'p_knowlesi', 'unknown', 'none'),
      allowNull: false,
      defaultValue: 'none'
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    parasiteDensity: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'parasite_density'
    },
    processingTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'processing_time'
    },
    externalApiId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'external_api_id'
    },
    modelVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'model_version'
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'verified_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    }
  }, {
    tableName: 'detailed_analysis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Associations
  DetailedAnalysis.associate = (models) => {
    DetailedAnalysis.belongsTo(models.Sample, {
      foreignKey: 'sample_id',
      as: 'sample'
    });
    
    DetailedAnalysis.belongsTo(models.SampleImage, {
      foreignKey: 'image_id',
      as: 'image'
    });
    
    DetailedAnalysis.belongsTo(models.InitialAnalysis, {
      foreignKey: 'initial_analysis_id',
      as: 'initialAnalysis'
    });
    
    DetailedAnalysis.belongsTo(models.User, {
      foreignKey: 'verified_by',
      as: 'verifier'
    });
    
    DetailedAnalysis.hasMany(models.DetectionResult, {
      foreignKey: 'detailed_analysis_id',
      as: 'detections'
    });
  };

  return DetailedAnalysis;
};