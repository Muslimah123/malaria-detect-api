// src/models/sampleImage.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SampleImage = sequelize.define('SampleImage', {
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
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'image_url',
      validate: {
        notEmpty: { msg: 'Image URL is required' }
      }
    },
    thumbnailUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'thumbnail_url'
    },
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'original_filename'
    },
    fieldOfView: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Center',
      field: 'field_of_view'
    },
    magnification: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '100x'
    },
    imageType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'thick',
      field: 'image_type'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    format: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    captureDevice: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'capture_device'
    },
    isAnalyzed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_analyzed'
    }
  }, {
    tableName: 'sample_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Associations
  SampleImage.associate = (models) => {
    SampleImage.belongsTo(models.Sample, {
      foreignKey: 'sample_id',
      as: 'sample'
    });
    
    SampleImage.hasMany(models.ImagePatch, {
      foreignKey: 'image_id',
      as: 'patches'
    });
    
    SampleImage.hasMany(models.InitialAnalysis, {
      foreignKey: 'image_id',
      as: 'analyses'
    });
  };

  return SampleImage;
};
