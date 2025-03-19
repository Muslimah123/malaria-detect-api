## API Documentation

The MalariaDetect API uses Swagger/OpenAPI for comprehensive API documentation and interactive testing.

### Accessing the Documentation

Once you have the API running, you can access the Swagger documentation at:

```
http://localhost:5000/api-docs
```

### Features

- **Interactive API Documentation**: Explore all available endpoints with detailed descriptions, request parameters, and response formats.
- **Request Testing**: Test API endpoints directly from the documentation interface with a user-friendly UI.
- **Authentication Support**: Secure testing of protected endpoints using JWT tokens.
- **Schema References**: Detailed models and schema definitions for all data structures.
- **Multiple Examples**: Various request and response examples for different scenarios.
- **Role-Based Access Control**: Clear documentation of which endpoints require specific roles.
- **Custom UI Theme**: Customized Swagger UI for improved readability and user experience.

### Authentication in Swagger

To test authenticated endpoints:

1. First, obtain a JWT token:
   - Use the `/api/auth/login` endpoint with default admin credentials:
     ```json
     {
       "email": "admin@example.com",
       "password": "admin123"
     }
     ```
   - Or create a new user with the `/api/auth/register` endpoint

2. Authorize your session:
   - Click the 🔓 (lock) button at the top right of the Swagger UI
   - In the "Value" field, enter your JWT token with the Bearer prefix:
     ```
     Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZC...
     ```
   - Click "Authorize" and close the modal

3. You can now test authenticated endpoints with the token applied.

### User Roles and Permissions

The API supports four user roles with different permissions:

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | System administrator | Full access to all endpoints |
| `lab_technician` | Laboratory staff | Can manage samples, images, and run analyses |
| `doctor` | Medical doctor | Can view patients, samples, and results, and verify analyses |
| `researcher` | Research personnel | Read-only access to anonymized data and analysis results |

### Example Workflow

1. Register or login to get a JWT token
2. Create a patient record
3. Create a sample for the patient
4. Upload a blood smear image for the sample
5. Process the image into patches
6. Run CNN analysis on the patches
7. For positive samples, run detailed YOLO analysis
8. Verify the analysis results

### Using API with External Tools

You can also access the raw OpenAPI specification at:

```
http://localhost:5000/api-docs.json
```

This can be imported into API testing and development tools:

- **Postman**: Import the OpenAPI spec to create a complete collection
- **Insomnia**: Import for a ready-to-use API workspace
- **OpenAPI Generator**: Generate client libraries for various programming languages

### Swagger Documentation Conventions

Our API documentation follows these conventions:

- **Consistent Naming**: All endpoints follow RESTful naming conventions
- **Detailed Descriptions**: Each endpoint has comprehensive documentation
- **Request Examples**: Multiple realistic examples for different scenarios
- **Response Examples**: Complete response examples including error cases
- **Schema References**: All data models are fully documented with examples
- **Authentication Requirements**: Clear indication of required permissions