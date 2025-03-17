// src/models/index.js
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const logger = require('../config/logger');

const models = {};

// Read all model files and import them
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize);
      models[model.name] = model;
    } catch (err) {
      logger.error(`Error importing model ${file}:`, err);
    }
  });

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};