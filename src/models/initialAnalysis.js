// src/models/initialAnalysis.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InitialAnalysis = sequelize.define('InitialAnalysis', {
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
    isPositive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_positive'
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    processingTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'processing_time'
    },
    patchesAnalyzed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'patches_analyzed'
    },
    positivePatchCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'positive_patches'
    },
    modelVersion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'model_version'
    }
  }, {
    tableName: 'initial_analysis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Associations
  InitialAnalysis.associate = (models) => {
    InitialAnalysis.belongsTo(models.Sample, {
      foreignKey: 'sample_id',
      as: 'sample'
    });
    
    InitialAnalysis.belongsTo(models.SampleImage, {
      foreignKey: 'image_id',
      as: 'image'
    });
    
    InitialAnalysis.hasMany(models.PatchClassification, {
      foreignKey: 'analysis_id',
      as: 'patchResults'
    });
    
    InitialAnalysis.hasOne(models.DetailedAnalysis, {
      foreignKey: 'initial_analysis_id',
      as: 'detailedAnalysis'
    });
  };

  return InitialAnalysis;
};