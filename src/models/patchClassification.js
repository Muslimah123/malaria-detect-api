// src/models/patchClassification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PatchClassification = sequelize.define('PatchClassification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    patchId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'patch_id',
      references: {
        model: 'image_patches',
        key: 'id'
      }
    },
    analysisId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'analysis_id',
      references: {
        model: 'initial_analysis',
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
    }
  }, {
    tableName: 'patch_classifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Associations
  PatchClassification.associate = (models) => {
    PatchClassification.belongsTo(models.ImagePatch, {
      foreignKey: 'patch_id',
      as: 'patch'
    });
    
    PatchClassification.belongsTo(models.InitialAnalysis, {
      foreignKey: 'analysis_id',
      as: 'analysis'
    });
  };

  return PatchClassification;
};