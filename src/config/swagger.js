// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MalariaDetect API',
    version: '1.0.0',
    description: `
      <h2>Backend API for MalariaDetect automated diagnosis system</h2>
      <p>This API provides endpoints for automated malaria diagnosis using a two-stage approach:</p>
      <ol>
        <li><strong>Initial Screening:</strong> CNN model processes blood smear patches to identify potential parasites</li>
        <li><strong>Detailed Analysis:</strong> YOLOv10 model provides comprehensive analysis of positive cases</li>
      </ol>
      <p>For complete documentation and setup instructions, please refer to the <a href="https://github.com/yourusername/malaria-detect-api" target="_blank">GitHub repository</a>.</p>
    `,
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    contact: {
      name: 'API Support',
      email: 'support@malariadetect.example.com',
      url: 'https://malariadetect.example.com/support'
    }
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 5000}`,
      description: 'Development server'
    },
    {
      url: 'https://api.malariadetect.example.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: `
          <p>JWT Authentication using Bearer token scheme.</p>
          <p>To authenticate, obtain a JWT token from the <strong>/api/auth/login</strong> endpoint and add it as follows:</p>
          <pre>Authorization: Bearer your_token_here</pre>
          <p>The token is valid for 24 hours by default.</p>
          <p><strong>Example:</strong></p>
          <pre>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</pre>
          <p><strong>Roles:</strong></p>
          <ul>
            <li><code>admin</code>: Full access to all endpoints</li>
            <li><code>lab_technician</code>: Can manage samples, images, and run analyses</li>
            <li><code>doctor</code>: Can view patients, samples, and results, and verify analyses</li>
            <li><code>researcher</code>: Read-only access to anonymized data and analysis results</li>
          </ul>
        `
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and user management endpoints'
    },
    {
      name: 'Patients',
      description: 'Patient management, including registration and record access'
    },
    {
      name: 'Samples',
      description: 'Blood sample management, including registration, tracking, and status updates'
    },
    {
      name: 'Images',
      description: 'Blood smear image upload, management, and retrieval'
    },
    {
      name: 'Analysis',
      description: 'Image processing, machine learning analysis, and result verification'
    },
    {
      name: 'Base',
      description: 'Base API endpoints for status and health checks'
    }
  ]
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../models/*.js'),
    path.join(__dirname, '../schemas/*.js') // We'll create this for request/response schemas
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;