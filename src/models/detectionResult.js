// src/models/detectionResult.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DetectionResult = sequelize.define('DetectionResult', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    detailedAnalysisId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'detailed_analysis_id',
      references: {
        model: 'detailed_analysis',
        key: 'id'
      }
    },
    className: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'class_name'
    },
    xCoord: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'x_coord'
    },
    yCoord: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'y_coord'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'detection_results',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Associations
  DetectionResult.associate = (models) => {
    DetectionResult.belongsTo(models.DetailedAnalysis, {
      foreignKey: 'detailed_analysis_id',
      as: 'analysis'
    });
  };

  return DetectionResult;
};