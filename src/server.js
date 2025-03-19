// src/server.js
require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');
const logger = require('./config/logger');
const ensureModelDirectories = require('./utils/ensureModelDirectories');


// Set port
const PORT = process.env.PORT || 5000;

// Initialize server
const startServer = async () => {
  try {
    // Ensure model directories exist
    ensureModelDirectories();
    // Test database connection
    await testConnection();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process with failure
  process.exit(1);
});

// Start server
startServer();