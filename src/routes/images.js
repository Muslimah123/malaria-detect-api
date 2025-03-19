// src/routes/images.js
const express = require('express');
const { 
  uploadImage, 
  getSampleImages, 
  getImage, 
  deleteImage 
} = require('../controllers/images');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

/**
 * @openapi
 * /api/images/upload/{sampleId}:
 *   post:
 *     tags:
 *       - Images
 *     summary: Upload a sample image
 *     description: |
 *       Upload a blood smear microscopy image for a specific sample. The system automatically
 *       processes the uploaded image to create a thumbnail and extract metadata.
 *       
 *       **Supported Image Formats:**
 *       - JPEG/JPG (recommended)
 *       - PNG
 *       - TIFF
 *       - BMP
 *       
 *       **Image Requirements:**
 *       - Maximum file size: 10MB
 *       - Recommended resolution: 1920x1080 or higher
 *       - Good focus and illumination
 *       - Standard microscope field of view
 *       - Proper staining (Giemsa stain)
 *       
 *       **Best Practices:**
 *       - Use oil immersion objective (100x) for best results
 *       - Ensure RBCs are well-separated (for thin smears)
 *       - Include sufficient field area for accurate parasite detection
 *       - Maintain consistent lighting conditions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sampleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sample ID to associate the image with
 *         example: "550e8400-e29b-41d4-a716-446655440001"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The blood smear image file to upload (JPEG/PNG/TIFF/BMP)
 *               fieldOfView:
 *                 type: string
 *                 description: Field of view in the blood smear
 *                 enum: [Center, Periphery, Custom]
 *                 default: "Center"
 *                 example: "Center"
 *               magnification:
 *                 type: string
 *                 description: Microscope magnification used
 *                 enum: [40x, 60x, 100x, Other]
 *                 default: "100x"
 *                 example: "100x"
 *               imageType:
 *                 type: string
 *                 enum: [thin, thick]
 *                 description: |
 *                   Type of blood smear image:
 *                   * `thin` - Thin blood film (single cell layer, good for species identification)
 *                   * `thick` - Thick blood film (concentrated, better for detection of low parasitemia)
 *                 default: "thick"
 *                 example: "thick"
 *               captureDevice:
 *                 type: string
 *                 description: Device or camera used to capture the image
 *                 example: "Olympus BX53 with Olympus DP74 camera"
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SampleImage'
 *             examples:
 *               thinSmear:
 *                 summary: Thin smear image upload
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "550e8400-e29b-41d4-a716-446655440010"
 *                     sampleId: "550e8400-e29b-41d4-a716-446655440001"
 *                     imageUrl: "http://localhost:5000/uploads/original/1629739821-abcdef123456.jpg"
 *                     thumbnailUrl: "http://localhost:5000/uploads/thumbnails/thumb-1629739821-abcdef123456.jpg"
 *                     originalFilename: "thin_smear_sample.jpg"
 *                     fieldOfView: "Center"
 *                     magnification: "100x"
 *                     imageType: "thin"
 *                     width: 1920
 *                     height: 1080
 *                     format: "jpeg"
 *                     size: 2457600
 *                     captureDevice: "Olympus BX53 with Olympus DP74 camera"
 *                     isAnalyzed: false
 *                     createdAt: "2023-08-11T10:30:21.000Z"
 *                     updatedAt: "2023-08-11T10:30:21.000Z"
 *               thickSmear:
 *                 summary: Thick smear image upload
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "550e8400-e29b-41d4-a716-446655440011"
 *                     sampleId: "550e8400-e29b-41d4-a716-446655440001"
 *                     imageUrl: "http://localhost:5000/uploads/original/1629739822-ghijkl789012.jpg"
 *                     thumbnailUrl: "http://localhost:5000/uploads/thumbnails/thumb-1629739822-ghijkl789012.jpg"
 *                     originalFilename: "thick_smear_sample.jpg"
 *                     fieldOfView: "Center"
 *                     magnification: "100x"
 *                     imageType: "thick"
 *                     width: 1920
 *                     height: 1080
 *                     format: "jpeg"
 *                     size: 2355200
 *                     captureDevice: "Olympus BX53 with Olympus DP74 camera"
 *                     isAnalyzed: false
 *                     createdAt: "2023-08-11T10:30:22.000Z"
 *                     updatedAt: "2023-08-11T10:30:22.000Z"
 *       400:
 *         description: Invalid input or file format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noFile:
 *                 summary: No file uploaded
 *                 value:
 *                   success: false
 *                   error: "Please upload an image file"
 *               invalidFormat:
 *                 summary: Invalid file format
 *                 value:
 *                   success: false
 *                   error: "Only image files are allowed"
 *               fileTooLarge:
 *                 summary: File too large
 *                 value:
 *                   success: false
 *                   error: "File too large. Maximum size is 10MB"
 *       404:
 *         description: Sample not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Sample not found with id 550e8400-e29b-41d4-a716-446655440099"
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Not authorized to access this route"
 */
router.post('/upload/:sampleId', upload.single('image'), handleUploadError, uploadImage);

/**
 * @openapi
 * /api/images/sample/{sampleId}:
 *   get:
 *     tags:
 *       - Images
 *     summary: Get all images for a sample
 *     description: Retrieve all images associated with a specific sample
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sampleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sample ID
 *     responses:
 *       200:
 *         description: Images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SampleImage'
 *       404:
 *         description: Sample not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sample/:sampleId', getSampleImages);

/**
 * @openapi
 * /api/images/{id}:
 *   get:
 *     tags:
 *       - Images
 *     summary: Get a single image
 *     description: Get detailed information about a specific image
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SampleImage'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   delete:
 *     tags:
 *       - Images
 *     summary: Delete an image
 *     description: Delete a specific image and its related files
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getImage);
router.delete('/:id', deleteImage);

module.exports = router;