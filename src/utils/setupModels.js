// src/utils/setupModels.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createWriteStream } = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);
const logger = require('../config/logger');

// Model directory
const MODELS_DIR = path.join(__dirname, '../../models');
const CNN_MODELS_DIR = path.join(MODELS_DIR, 'cnn');

// Model URLs - Update these with the actual URLs of your models
// For example, you might host them on GitHub, S3, or other suitable storage
const MODEL_URLS = {
  thin: {
    modelJson: 'https://example.com/models/malaria_thin/model.json',
    weightsPath: 'https://example.com/models/malaria_thin/weights.bin'
  },
  thick: {
    modelJson: 'https://example.com/models/malaria_thick/model.json',
    weightsPath: 'https://example.com/models/malaria_thick/weights.bin'
  }
};

/**
 * Ensure all necessary directories exist
 */
function ensureDirectories() {
  const dirs = [
    MODELS_DIR,
    CNN_MODELS_DIR,
    path.join(CNN_MODELS_DIR, 'thin_smear_model'),
    path.join(CNN_MODELS_DIR, 'thick_smear_model')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  }
}

/**
 * Download a file from a URL
 * @param {string} url - URL to download
 * @param {string} destPath - Destination path
 * @returns {Promise<void>}
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    // Create write stream
    const file = createWriteStream(destPath);
    
    // Handle HTTPS request
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }
      
      // Pipe response to file
      response.pipe(file);
      
      // Handle events
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(destPath, () => {}); // Delete the file async (but don't check result)
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file async (but don't check result)
      reject(err);
    });
  });
}

/**
 * Check if TensorFlow.js is installed, install if needed
 */
async function checkTensorflowJs() {
  try {
    // Check if @tensorflow/tfjs-node is installed
    await execPromise('npm list @tensorflow/tfjs-node');
    logger.info('TensorFlow.js is already installed');
  } catch (error) {
    logger.warn('TensorFlow.js not found, installing...');
    try {
      await execPromise('npm install @tensorflow/tfjs-node');
      logger.info('TensorFlow.js installed successfully');
    } catch (installError) {
      logger.error('Failed to install TensorFlow.js:', installError);
      throw installError;
    }
  }
}

/**
 * Download all models
 */
async function downloadModels() {
  // Download thin smear model
  const thinModelDir = path.join(CNN_MODELS_DIR, 'thin_smear_model');
  const thickModelDir = path.join(CNN_MODELS_DIR, 'thick_smear_model');
  
  try {
    // Check if models are already downloaded
    if (fs.existsSync(path.join(thinModelDir, 'model.json')) && 
        fs.existsSync(path.join(thickModelDir, 'model.json'))) {
      logger.info('Models already exist, skipping download');
      return;
    }
    
    // Download thin smear model
    logger.info('Downloading thin smear model...');
    await downloadFile(MODEL_URLS.thin.modelJson, path.join(thinModelDir, 'model.json'));
    await downloadFile(MODEL_URLS.thin.weightsPath, path.join(thinModelDir, 'weights.bin'));
    
    // Download thick smear model
    logger.info('Downloading thick smear model...');
    await downloadFile(MODEL_URLS.thick.modelJson, path.join(thickModelDir, 'model.json'));
    await downloadFile(MODEL_URLS.thick.weightsPath, path.join(thickModelDir, 'weights.bin'));
    
    logger.info('All models downloaded successfully');
  } catch (error) {
    logger.error('Error downloading models:', error);
    
    // Create placeholder models for development/testing if downloading fails
    logger.warn('Creating placeholder models for development/testing');
    createPlaceholderModels();
  }
}

/**
 * Create placeholder model files for development/testing
 */
function createPlaceholderModels() {
  const thinModelDir = path.join(CNN_MODELS_DIR, 'thin_smear_model');
  const thickModelDir = path.join(CNN_MODELS_DIR, 'thick_smear_model');
  
  // Create placeholder model.json for thin smear
  if (!fs.existsSync(path.join(thinModelDir, 'model.json'))) {
    const thinModelJson = {
      format: "layers-model",
      generatedBy: "placeholder-for-development",
      convertedBy: "TensorFlow.js Converter",
      modelTopology: {
        keras_version: "2.4.0",
        backend: "tensorflow",
        model_config: {
          class_name: "Sequential",
          config: {
            name: "sequential",
            layers: []
          }
        }
      },
      weightsManifest: [
        {
          paths: ["weights.bin"],
          weights: []
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(thinModelDir, 'model.json'),
      JSON.stringify(thinModelJson, null, 2)
    );
    
    // Create empty weights.bin
    if (!fs.existsSync(path.join(thinModelDir, 'weights.bin'))) {
      fs.writeFileSync(path.join(thinModelDir, 'weights.bin'), Buffer.alloc(0));
    }
  }
  
  // Create placeholder model.json for thick smear
  if (!fs.existsSync(path.join(thickModelDir, 'model.json'))) {
    const thickModelJson = {
      format: "layers-model",
      generatedBy: "placeholder-for-development",
      convertedBy: "TensorFlow.js Converter",
      modelTopology: {
        keras_version: "2.4.0",
        backend: "tensorflow",
        model_config: {
          class_name: "Sequential",
          config: {
            name: "sequential",
            layers: []
          }
        }
      },
      weightsManifest: [
        {
          paths: ["weights.bin"],
          weights: []
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(thickModelDir, 'model.json'),
      JSON.stringify(thickModelJson, null, 2)
    );
    
    // Create empty weights.bin
    if (!fs.existsSync(path.join(thickModelDir, 'weights.bin'))) {
      fs.writeFileSync(path.join(thickModelDir, 'weights.bin'), Buffer.alloc(0));
    }
  }
  
  logger.info('Placeholder models created successfully');
}

/**
 * Setup models and dependencies
 */
async function setupModels() {
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Check TensorFlow.js installation
    await checkTensorflowJs();
    
    // Download or create models
    await downloadModels();
    
    logger.info('Model setup completed successfully');
  } catch (error) {
    logger.error('Error setting up models:', error);
    throw error;
  }
}

// If run directly
if (require.main === module) {
  setupModels().then(() => {
    logger.info('Model setup script completed');
  }).catch((error) => {
    logger.error('Model setup script failed:', error);
    process.exit(1);
  });
}

module.exports = setupModels;