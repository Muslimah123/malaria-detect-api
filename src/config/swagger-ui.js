// src/config/swagger-ui.js
const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { 
        background-color: #003366; 
      }
      .swagger-ui .topbar .download-url-wrapper .select-label select { 
        border-color: #003366; 
      }
      .swagger-ui .info .title { 
        color: #003366; 
      }
      .swagger-ui .opblock.opblock-post { 
        border-color: #10a54a; 
        background: rgba(16, 165, 74, 0.1); 
      }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { 
        background: #10a54a; 
      }
      .swagger-ui .opblock.opblock-get { 
        border-color: #0085c3; 
        background: rgba(0, 133, 195, 0.1); 
      }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { 
        background: #0085c3; 
      }
      .swagger-ui .opblock.opblock-delete { 
        border-color: #e53935; 
        background: rgba(229, 57, 53, 0.1); 
      }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { 
        background: #e53935; 
      }
      .swagger-ui .opblock.opblock-put { 
        border-color: #e67700; 
        background: rgba(230, 119, 0, 0.1); 
      }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { 
        background: #e67700; 
      }
      .swagger-ui .btn.execute { 
        background-color: #003366; 
        color: #fff; 
        border-color: #003366; 
      }
      .swagger-ui section.models { 
        border-color: #003366; 
      }
      .swagger-ui section.models .model-container { 
        background: rgba(0, 51, 102, 0.1); 
      }
      .swagger-ui .response-col_status { 
        font-weight: bold; 
      }
      .swagger-ui .markdown code, .swagger-ui .renderedMarkdown code { 
        background: rgba(0, 0, 0, 0.05); 
        color: #003366; 
      }
    `,
    customSiteTitle: "MalariaDetect API Documentation",
    customfavIcon: "/favicon.ico",
    // Hide the models by default
    defaultModelsExpandDepth: -1,
    // Expand operations by default
    defaultModelExpandDepth: 3,
    // Expand the tags
    docExpansion: "list",
    // Show request duration
    displayRequestDuration: true,
    // Filter by tag
    filter: true,
    // Deep linking for easier sharing
    deepLinking: true
  };
  
  module.exports = swaggerUiOptions;