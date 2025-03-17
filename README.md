// README.md
# MalariaDetect API

Backend API for MalariaDetect automated diagnosis system. This system uses a two-step approach for malaria detection:

1. **Initial Screening**: Uses a CNN model to process cropped patches from blood smear images to identify potential malaria parasites.
2. **Detailed Analysis**: For positive cases, sends images to an external YOLOv10 API for comprehensive analysis.

## Features

- **Image Processing Pipeline**:
  - For thin smear images: Segments RBCs and processes each cell 
  - For thick smear images: Creates parasite candidate patches
  - Initial CNN-based binary classification
  - Integration with external YOLOv10 API for detailed analysis

- **User Authentication and Authorization**:
  - JWT-based authentication
  - Role-based access control (admin, lab technician, doctor, researcher)

- **Patient and Sample Management**:
  - Complete patient records management
  - Blood sample tracking and status updates
  - Image upload and management

- **Analysis Workflow**:
  - Image segmentation and patch extraction
  - Initial malaria detection with CNN
  - Detailed species identification via external YOLO API
  - Result verification and reporting

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Sequelize ORM
- **Image Processing**: Sharp, TensorFlow.js
- **Authentication**: JWT, bcrypt
- **Containers**: Docker, Docker Compose

## Project Structure

```
malaria-detect-api/
├── src/
│   ├── config/                # Configuration files
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Express middleware
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── services/              # Business logic (image processing, CNN)
│   ├── utils/                 # Utility functions
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── uploads/                   # Upload directory for images
├── models/                    # ML model files
├── database/                  # Database scripts
│   └── init.sql               # Initial database setup
├── docker-compose.yml         # Docker Compose configuration 
├── Dockerfile                 # Docker configuration
└── package.json               # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js v16 or higher
- Docker and Docker Compose (for containerized setup)
- PostgreSQL 14 or higher (if running locally)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=malaria_detection
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=1d

# External YOLO API
YOLO_API_URL=https://example.com/api/v1/analyze
YOLO_API_KEY=your_api_key

# Optional pgAdmin config
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

### Using Docker (Recommended)

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/malaria-detect-api.git
   cd malaria-detect-api
   ```

2. Start the containers:
   ```
   docker-compose up -d
   ```

3. The API will be available at http://localhost:5000

### Local Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/malaria-detect-api.git
   cd malaria-detect-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the PostgreSQL database:
   ```
   psql -U postgres -f database/init.sql
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. The API will be available at http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get logged in user

### Patients
- `POST /api/patients` - Create a patient
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get a single patient
- `PUT /api/patients/:id` - Update a patient
- `DELETE /api/patients/:id` - Delete a patient

### Samples
- `POST /api/samples` - Create a sample
- `GET /api/samples` - Get all samples
- `GET /api/samples/:id` - Get a single sample
- `PUT /api/samples/:id` - Update a sample
- `DELETE /api/samples/:id` - Delete a sample
- `GET /api/samples/stats` - Get sample statistics

### Images
- `POST /api/images/upload/:sampleId` - Upload a sample image
- `GET /api/images/sample/:sampleId` - Get all images for a sample
- `GET /api/images/:id` - Get a single image
- `DELETE /api/images/:id` - Delete an image

### Analysis
- `POST /api/analysis/process-image/:imageId` - Process an image into patches
- `GET /api/analysis/patches/:imageId` - Get patches for an image
- `POST /api/analysis/cnn/:imageId` - Run CNN analysis on image patches
- `GET /api/analysis/cnn/:imageId` - Get CNN analysis results
- `POST /api/analysis/yolo/:imageId/:initialAnalysisId` - Send to YOLO API
- `GET /api/analysis/yolo/:imageId` - Get YOLO analysis results
- `PUT /api/analysis/verify/:id` - Verify analysis results

## ML Model Integration

The system uses a two-step approach for malaria parasite detection:

1. **CNN Initial Screening**:
   - Uses CNN models trained for binary classification (parasite/no parasite)
   - Processes image patches extracted from blood smear images
   - Provides rapid initial screening results

2. **YOLOv10 Detailed Analysis**:
   - Integrates with external YOLOv10 API for comprehensive analysis
   - Classifies parasite species and stages
   - Provides detailed detection results with bounding boxes

## Connecting with Frontend

To connect this backend with your React Native frontend:

1. Update the API URL in your frontend app to point to this backend server
2. Use the JWT authentication tokens for protected API requests
3. Implement proper error handling for the various response types

## License

This project is licensed under the MIT License

## Acknowledgements

- TensorFlow.js for machine learning capabilities
- Express.js for the web framework
- Sequelize for database ORM
- Sharp for image processing