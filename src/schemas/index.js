// src/schemas/index.js
/**
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Error message
 *     
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the user
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           description: The full name of the user
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *           example: "john@example.com"
 *         role:
 *           type: string
 *           enum: [admin, lab_technician, doctor, researcher]
 *           description: The role of the user
 *           example: "lab_technician"
 *         profileImage:
 *           type: string
 *           description: URL to the user's profile image
 *           example: "http://localhost:5000/uploads/profile/user123.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when user was created
 *           example: "2023-08-10T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when user was last updated
 *           example: "2023-08-11T09:45:00.000Z"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *         role:
 *           type: string
 *           enum: [admin, lab_technician, doctor, researcher]
 *           example: "lab_technician"
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "550e8400-e29b-41d4-a716-446655440000"
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john@example.com"
 *             role:
 *               type: string
 *               example: "lab_technician"
 *
 *     Patient:
 *       type: object
 *       required:
 *         - patientId
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the patient
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         patientId:
 *           type: string
 *           description: The unique patient identifier (hospital ID or national ID)
 *           example: "PTNT-2023-12345"
 *         name:
 *           type: string
 *           description: The full name of the patient
 *           example: "James Mwangi"
 *         age:
 *           type: integer
 *           description: The age of the patient in years
 *           minimum: 0
 *           maximum: 120
 *           example: 42
 *         gender:
 *           type: string
 *           description: The gender of the patient
 *           enum: [Male, Female, Other, Prefer not to say]
 *           example: "Male"
 *         contactNumber:
 *           type: string
 *           description: The contact phone number of the patient (with country code)
 *           example: "+254712345678"
 *         address:
 *           type: string
 *           description: The residential address of the patient
 *           example: "123 Kimathi Street, Nairobi, Kenya"
 *         medicalHistory:
 *           type: string
 *           description: The relevant medical history of the patient including previous malaria infections
 *           example: "Previous malaria infection (P. falciparum) in 2021. Type II diabetes diagnosed in 2018."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the patient record was created
 *           example: "2023-08-10T14:32:21.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the patient record was last updated
 *           example: "2023-08-11T09:15:45.000Z"
 *
 *     Sample:
 *       type: object
 *       required:
 *         - patientId
 *         - labTechnician
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the sample
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         sampleId:
 *           type: string
 *           description: The unique sample identifier generated by the system
 *           example: "S20230811-12345"
 *         patientId:
 *           type: string
 *           format: uuid
 *           description: The ID of the associated patient
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         sampleType:
 *           type: string
 *           enum: [thick_smear, thin_smear, both]
 *           description: |
 *             The type of blood smear:
 *             * `thick_smear` - Thick blood film (higher sensitivity for detection)
 *             * `thin_smear` - Thin blood film (better for species identification)
 *             * `both` - Both thick and thin smears collected
 *           example: "thick_smear"
 *         collectionTime:
 *           type: string
 *           format: date-time
 *           description: The date and time when the sample was collected
 *           example: "2023-08-11T10:30:00.000Z"
 *         labTechnician:
 *           type: string
 *           description: The name of the lab technician who collected the sample
 *           example: "Sarah Johnson"
 *         status:
 *           type: string
 *           enum: [registered, ready_for_analysis, processing, completed, failed]
 *           description: |
 *             The current status of the sample processing workflow:
 *             * `registered` - Initial registration, no images uploaded yet
 *             * `ready_for_analysis` - Images uploaded, ready for processing
 *             * `processing` - Currently being processed/analyzed
 *             * `completed` - Analysis completed
 *             * `failed` - Processing or analysis failed
 *           example: "ready_for_analysis"
 *         priority:
 *           type: string
 *           enum: [routine, urgent]
 *           description: |
 *             The priority level for processing this sample:
 *             * `routine` - Standard processing time (default)
 *             * `urgent` - Expedited processing required
 *           example: "routine"
 *         notes:
 *           type: string
 *           description: Additional clinical notes or observations about the sample
 *           example: "Patient presenting with fever (39°C) and chills for 3 days. Sample collected from finger prick."
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: The ID of the user who created this sample record
 *           example: "550e8400-e29b-41d4-a716-446655440002"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the sample record was created
 *           example: "2023-08-11T10:35:22.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the sample record was last updated
 *           example: "2023-08-11T14:20:15.000Z"
 *
 *     SampleImage:
 *       type: object
 *       required:
 *         - sampleId
 *         - imageUrl
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the image
 *           example: "550e8400-e29b-41d4-a716-446655440010"
 *         sampleId:
 *           type: string
 *           format: uuid
 *           description: The ID of the associated sample
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         imageUrl:
 *           type: string
 *           description: The URL of the image
 *           example: "http://localhost:5000/uploads/original/1629739821-abcdef123456.jpg"
 *         thumbnailUrl:
 *           type: string
 *           description: The URL of the image thumbnail
 *           example: "http://localhost:5000/uploads/thumbnails/thumb-1629739821-abcdef123456.jpg"
 *         originalFilename:
 *           type: string
 *           description: The original filename of the image
 *           example: "blood_sample_123.jpg"
 *         fieldOfView:
 *           type: string
 *           description: The field of view in the blood smear
 *           example: "Center"
 *         magnification:
 *           type: string
 *           description: The magnification used
 *           example: "100x"
 *         imageType:
 *           type: string
 *           description: The type of image (thin/thick)
 *           example: "thick"
 *         width:
 *           type: integer
 *           description: The width of the image in pixels
 *           example: 1920
 *         height:
 *           type: integer
 *           description: The height of the image in pixels
 *           example: 1080
 *         isAnalyzed:
 *           type: boolean
 *           description: Whether the image has been analyzed
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the image was uploaded
 *           example: "2023-08-11T10:40:21.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the image was last updated
 *           example: "2023-08-11T10:40:21.000Z"
 *
 *     ImagePatch:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the patch
 *           example: "550e8400-e29b-41d4-a716-446655440020"
 *         imageId:
 *           type: string
 *           format: uuid
 *           description: The ID of the parent image
 *           example: "550e8400-e29b-41d4-a716-446655440010"
 *         patchUrl:
 *           type: string
 *           description: The URL of the patch
 *           example: "http://localhost:5000/uploads/patches/rbc-550e8400-e29b-41d4-a716-446655440010-100-200-1629739825.png"
 *         xCoord:
 *           type: integer
 *           description: The x-coordinate of the patch in the original image
 *           example: 100
 *         yCoord:
 *           type: integer
 *           description: The y-coordinate of the patch in the original image
 *           example: 200
 *         width:
 *           type: integer
 *           description: The width of the patch in pixels
 *           example: 100
 *         height:
 *           type: integer
 *           description: The height of the patch in pixels
 *           example: 100
 *         patchType:
 *           type: string
 *           description: The type of patch (rbc or parasite_candidate)
 *           example: "rbc"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the patch was created
 *           example: "2023-08-11T10:42:15.000Z"
 *
 *     InitialAnalysis:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the analysis
 *           example: "550e8400-e29b-41d4-a716-446655440030"
 *         sampleId:
 *           type: string
 *           format: uuid
 *           description: The ID of the associated sample
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         imageId:
 *           type: string
 *           format: uuid
 *           description: The ID of the analyzed image
 *           example: "550e8400-e29b-41d4-a716-446655440010"
 *         isPositive:
 *           type: boolean
 *           description: Whether malaria parasites were detected
 *           example: true
 *         confidence:
 *           type: number
 *           format: float
 *           description: The confidence level of the analysis
 *           example: 0.87
 *         processingTime:
 *           type: integer
 *           description: The processing time in milliseconds
 *           example: 3450
 *         patchesAnalyzed:
 *           type: integer
 *           description: The number of patches analyzed
 *           example: 20
 *         positivePatchCount:
 *           type: integer
 *           description: The number of positive patches
 *           example: 3
 *         modelVersion:
 *           type: string
 *           description: The version of the CNN model used
 *           example: "1.0.0"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the analysis was performed
 *           example: "2023-08-11T10:45:30.000Z"
 *
 *     DetailedAnalysis:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the analysis
 *           example: "550e8400-e29b-41d4-a716-446655440040"
 *         sampleId:
 *           type: string
 *           format: uuid
 *           description: The ID of the associated sample
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         imageId:
 *           type: string
 *           format: uuid
 *           description: The ID of the analyzed image
 *           example: "550e8400-e29b-41d4-a716-446655440010"
 *         initialAnalysisId:
 *           type: string
 *           format: uuid
 *           description: The ID of the initial analysis
 *           example: "550e8400-e29b-41d4-a716-446655440030"
 *         parasiteDetected:
 *           type: boolean
 *           description: Whether malaria parasites were detected
 *           example: true
 *         species:
 *           type: string
 *           enum: [p_falciparum, p_vivax, p_malariae, p_ovale, p_knowlesi, unknown, none]
 *           description: The detected parasite species
 *           example: "p_falciparum"
 *         confidence:
 *           type: number
 *           format: float
 *           description: The confidence level of the analysis
 *           example: 0.92
 *         parasiteDensity:
 *           type: number
 *           format: float
 *           description: The parasite density (parasites/µL)
 *           example: 1200.5
 *         processingTime:
 *           type: integer
 *           description: The processing time in milliseconds
 *           example: 12500
 *         externalApiId:
 *           type: string
 *           description: The external API reference ID
 *           example: "yolo-api-20230811-123456"
 *         modelVersion:
 *           type: string
 *           description: The version of the YOLO model used
 *           example: "YOLOv10-1.0.0"
 *         verifiedBy:
 *           type: string
 *           format: uuid
 *           description: The ID of the user who verified the analysis
 *           example: "550e8400-e29b-41d4-a716-446655440002"
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: The time when the analysis was verified
 *           example: "2023-08-11T14:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the analysis was performed
 *           example: "2023-08-11T11:00:00.000Z"
 *
 *     DetectionResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the detection
 *           example: "550e8400-e29b-41d4-a716-446655440050"
 *         detailedAnalysisId:
 *           type: string
 *           format: uuid
 *           description: The ID of the associated detailed analysis
 *           example: "550e8400-e29b-41d4-a716-446655440040"
 *         className:
 *           type: string
 *           description: The class name of the detected object
 *           example: "ring"
 *         xCoord:
 *           type: integer
 *           description: The x-coordinate of the detection
 *           example: 450
 *         yCoord:
 *           type: integer
 *           description: The y-coordinate of the detection
 *           example: 320
 *         width:
 *           type: integer
 *           description: The width of the detection
 *           example: 30
 *         height:
 *           type: integer
 *           description: The height of the detection
 *           example: 30
 *         confidence:
 *           type: number
 *           format: float
 *           description: The confidence level of the detection
 *           example: 0.88
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the detection was created
 *           example: "2023-08-11T11:00:05.000Z"
 */