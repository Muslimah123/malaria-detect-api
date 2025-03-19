// // src/models/user.js
// const { DataTypes } = require('sequelize');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// module.exports = (sequelize) => {
//   const User = sequelize.define('User', {
//     id: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true
//     },
//     name: {
//       type: DataTypes.STRING(100),
//       allowNull: false,
//       validate: {
//         notEmpty: { msg: 'Name is required' }
//       }
//     },
//     email: {
//       type: DataTypes.STRING(100),
//       allowNull: false,
//       unique: true,
//       validate: {
//         isEmail: { msg: 'Please include a valid email' },
//         notEmpty: { msg: 'Email is required' }
//       }
//     },
//     password: {
//       type: DataTypes.STRING(100),
//       allowNull: false,
//       validate: {
//         notEmpty: { msg: 'Password is required' },
//         len: { args: [6, 100], msg: 'Password must be at least 6 characters' }
//       }
//     },
//     role: {
//       type: DataTypes.ENUM('admin', 'lab_technician', 'doctor', 'researcher'),
//       defaultValue: 'lab_technician'
//     },
//     profileImage: {
//       type: DataTypes.STRING(255),
//       allowNull: true
//     }
//   }, {
//     tableName: 'users',
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: 'updated_at',
//     hooks: {
//       beforeSave: async (user) => {
//         // Hash password before saving
//         if (user.changed('password')) {
//           const salt = await bcrypt.genSalt(10);
//           user.password = await bcrypt.hash(user.password, salt);
//         }
//       }
//     }
//   });

//   // Instance method to generate JWT token
//   User.prototype.generateAuthToken = function() {
//     return jwt.sign(
//       { id: this.id, email: this.email, role: this.role },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRY || '1d' }
//     );
//   };

//   // Instance method to compare passwords
//   User.prototype.comparePassword = async function(password) {
//     return await bcrypt.compare(password, this.password);
//   };

//   return User;
// };
// src/models/user.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please include a valid email' },
        notEmpty: { msg: 'Email is required' }
      }
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
        len: { args: [6, 100], msg: 'Password must be at least 6 characters' }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'lab_technician', 'doctor', 'researcher'),
      defaultValue: 'lab_technician'
    },
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'profile_image' // Map to the correct database column name
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeSave: async (user) => {
        // Hash password before saving
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance method to generate JWT token
  User.prototype.generateAuthToken = function() {
    return jwt.sign(
      { id: this.id, email: this.email, role: this.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '1d' }
    );
  };

  // Instance method to compare passwords
  User.prototype.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};