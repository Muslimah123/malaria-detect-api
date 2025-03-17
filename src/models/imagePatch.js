// src/models/imagePatch.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ImagePatch = sequelize.define('ImagePatch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    patchUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'patch_url',
      validate: {
        notEmpty: { msg: 'Patch URL is required' }
      }
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
    patchType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'patch_type'
    }
  }, {
    tableName: 'image_patches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Associations
  ImagePatch.associate = (models) => {
    ImagePatch.belongsTo(models.SampleImage, {
      foreignKey: 'image_id',
      as: 'image'
    });
    
    ImagePatch.hasMany(models.PatchClassification, {
      foreignKey: 'patch_id',
      as: 'classifications'
    });
  };

  return ImagePatch;
};