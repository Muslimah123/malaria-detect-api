// src/utils/ensureModelDirectories.js
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Ensures that all required model directories exist
 */
function ensureModelDirectories() {
  const dirs = [
    path.join(__dirname, '../../models'),
    path.join(__dirname, '../../models/cnn'),
    path.join(__dirname, '../../models/cnn/thin_smear_model'),
    path.join(__dirname, '../../models/cnn/thick_smear_model')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }
  
  // Create dummy model.json files if they don't exist
  const thinModelPath = path.join(__dirname, '../../models/cnn/thin_smear_model/model.json');
  const thickModelPath = path.join(__dirname, '../../models/cnn/thick_smear_model/model.json');
  
  if (!fs.existsSync(thinModelPath)) {
    const dummyThinModel = {
      format: "simplified",
      generatedBy: "placeholder",
      inputShape: [64, 64, 1],
      outputShape: [1]
    };
    fs.writeFileSync(thinModelPath, JSON.stringify(dummyThinModel, null, 2));
    logger.info(`Created dummy model file: ${thinModelPath}`);
  }
  
  if (!fs.existsSync(thickModelPath)) {
    const dummyThickModel = {
      format: "simplified",
      generatedBy: "placeholder",
      inputShape: [32, 32, 1],
      outputShape: [1]
    };
    fs.writeFileSync(thickModelPath, JSON.stringify(dummyThickModel, null, 2));
    logger.info(`Created dummy model file: ${thickModelPath}`);
  }
}

module.exports = ensureModelDirectories;