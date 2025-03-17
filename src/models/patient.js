// src/models/patient.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    patientId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'patient_id',
      validate: {
        notEmpty: { msg: 'Patient ID is required' }
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' }
      }
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    contactNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'contact_number'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medicalHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'medical_history'
    }
  }, {
    tableName: 'patients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Associations
  Patient.associate = (models) => {
    Patient.hasMany(models.Sample, {
      foreignKey: 'patient_id',
      as: 'samples'
    });
  };

  return Patient;
};