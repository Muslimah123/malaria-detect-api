
// src/routes/analysis.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  processImagePatches, 
  getImagePatches,
  runCnnAnalysis,
  getCnnAnalysisResults,
  sendToYoloAnalysis,
  getYoloAnalysisResults,
  verifyAnalysis
} = require('../controllers/analysis');

// Apply auth middleware to all routes
router.use(protect);

/**
 * @openapi
 * /api/analysis/process-image/{imageId}:
 *   post:
 *     tags:
 *       - Analysis
 *     summary: Process image into patches
 *     description: | 
 *       Segment an image and extract patches for analysis. The segmentation approach differs based on the image type:
 *       
 *       **For Thin Smear Images:**
 *       - Identifies and segments individual red blood cells (RBCs)
 *       - Uses watershed segmentation algorithm
 *       - Extracts each RBC as a separate patch for analysis
 *       
 *       **For Thick Smear Images:**
 *       - Creates a grid of overlapping patches
 *       - Focuses on regions likely to contain parasites
 *       - Processes the entire field of view
 *       
 *       ⚠️ **Note:** This is an asynchronous operation. The API returns immediately with a 202 status,
 *       while processing continues in the background. Processing typically takes 30-60 seconds
 *       depending on image size and complexity.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the image to process
 *         example: "550e8400-e29b-41d4-a716-446655440010"
 *     responses:
 *       202:
 *         description: Image processing started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Image processing started"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageId:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440010"
 *                     status:
 *                       type: string
 *                       example: "processing"
 *             examples:
 *               thinSmear:
 *                 summary: Processing a thin smear image
 *                 value:
 *                   success: true
 *                   message: "Image processing started"
 *                   data:
 *                     imageId: "550e8400-e29b-41d4-a716-446655440010"
 *                     status: "processing"
 *               thickSmear:
 *                 summary: Processing a thick smear image
 *                 value:
 *                   success: true
 *                   message: "Image processing started"
 *                   data:
 *                     imageId: "550e8400-e29b-41d4-a716-446655440011"
 *                     status: "processing"
 *       400:
 *         description: Image already processed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Image has already been processed with 42 patches"
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Image not found with id 550e8400-e29b-41d4-a716-446655440099"
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
router.post('/process-image/:imageId', processImagePatches);

/**
 * @openapi
 * /api/analysis/patches/{imageId}:
 *   get:
 *     tags:
 *       - Analysis
 *     summary: Get image patches
 *     description: Get all patches extracted from a specific image
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the image
 *     responses:
 *       200:
 *         description: Patches retrieved successfully
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
 *                   example: 20
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ImagePatch'
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
router.get('/patches/:imageId', getImagePatches);
/**
 * @openapi
 * /api/analysis/cnn/{imageId}:
 *   post:
 *     tags:
 *       - Analysis
 *     summary: Run CNN analysis
 *     description: |
 *       Process image patches with CNN for initial malaria screening. This is the first stage
 *       of the two-stage detection process, which performs a fast binary classification
 *       on all extracted patches.
 *       
 *       **The CNN analysis performs the following tasks:**
 *       1. Loads the appropriate CNN model based on image type (thin vs thick smear)
 *       2. Processes each patch with the CNN model
 *       3. Classifies each patch as positive (parasite) or negative (no parasite)
 *       4. Aggregates results to determine overall sample classification
 *       
 *       **Thin smear model:**
 *       - MobileNetV2-based architecture
 *       - Input size: 64x64 pixels
 *       - Binary classification (parasitized/non-parasitized)
 *       
 *       **Thick smear model:**
 *       - EfficientNetB0-based architecture
 *       - Input size: 32x32 pixels
 *       - Binary classification (parasitized/non-parasitized)
 *       
 *       ⚠️ **Note:** This is an asynchronous operation. The API returns immediately with a 202 status,
 *       while processing continues in the background.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the image to analyze
 *         example: "550e8400-e29b-41d4-a716-446655440010"
 *     responses:
 *       202:
 *         description: CNN analysis started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "CNN analysis started"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageId:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440010"
 *                     status:
 *                       type: string
 *                       example: "processing"
 *       400:
 *         description: Image not processed or already analyzed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notProcessed:
 *                 summary: Image not yet processed
 *                 value:
 *                   success: false
 *                   error: "Image has not been processed into patches yet"
 *               alreadyAnalyzed:
 *                 summary: Already analyzed
 *                 value:
 *                   success: false
 *                   error: "Image has already been analyzed with CNN (ID: 550e8400-e29b-41d4-a716-446655440020)"
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Image not found with id 550e8400-e29b-41d4-a716-446655440099"
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

router.post('/cnn/:imageId', runCnnAnalysis);
router.get('/cnn/:imageId', getCnnAnalysisResults);

/**
 * @openapi
 * /api/analysis/yolo/{imageId}/{initialAnalysisId}:
 *   post:
 *     tags:
 *       - Analysis
 *     summary: Send to YOLO API
 *     description: |
 *       Send image to external YOLOv10 API for detailed analysis. This is the second stage
 *       of the two-stage detection process, which provides comprehensive analysis including
 *       species identification and parasite density estimation.
 *       
 *       **The YOLO analysis provides:**
 *       - Parasite species identification (P. falciparum, P. vivax, P. malariae, P. ovale, P. knowlesi)
 *       - Parasite life stage classification (ring, trophozoite, schizont, gametocyte)
 *       - Precise localization with bounding boxes 
 *       - Parasite density estimation (parasites/µL)
 *       - Confidence scores for each detection
 *       
 *       This endpoint integrates with an external specialized YOLO API which runs
 *       a custom-trained YOLOv10 model optimized for malaria parasite detection.
 *       
 *       ⚠️ **Note:** This is an asynchronous operation. The API returns immediately with a 202 status,
 *       while processing continues in the background. Detailed analysis typically takes 1-2 minutes.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the image to analyze
 *         example: "550e8400-e29b-41d4-a716-446655440010"
 *       - in: path
 *         name: initialAnalysisId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the initial CNN analysis
 *         example: "550e8400-e29b-41d4-a716-446655440020"
 *     responses:
 *       202:
 *         description: YOLO analysis started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "YOLO analysis started"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageId:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440010"
 *                     initialAnalysisId:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440020"
 *                     status:
 *                       type: string
 *                       example: "processing"
 *             examples:
 *               positiveCase:
 *                 summary: Processing a positive case
 *                 value:
 *                   success: true
 *                   message: "YOLO analysis started"
 *                   data:
 *                     imageId: "550e8400-e29b-41d4-a716-446655440010"
 *                     initialAnalysisId: "550e8400-e29b-41d4-a716-446655440020"
 *                     status: "processing"
 *       400:
 *         description: Image already analyzed with YOLO
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "YOLO analysis already exists for this image and initial analysis (ID: 550e8400-e29b-41d4-a716-446655440030)"
 *       404:
 *         description: Image or initial analysis not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               imageNotFound:
 *                 summary: Image not found
 *                 value:
 *                   success: false
 *                   error: "Image not found with id 550e8400-e29b-41d4-a716-446655440099"
 *               analysisNotFound:
 *                 summary: Initial analysis not found
 *                 value:
 *                   success: false
 *                   error: "Initial analysis not found with id 550e8400-e29b-41d4-a716-446655440099"
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
router.post('/yolo/:imageId/:initialAnalysisId', sendToYoloAnalysis);

/**
 * @openapi
 * /api/analysis/yolo/{imageId}:
 *   get:
 *     tags:
 *       - Analysis
 *     summary: Get YOLO analysis results
 *     description: Get the results of the YOLO API analysis for an image
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the analyzed image
 *     responses:
 *       200:
 *         description: Analysis results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DetailedAnalysis'
 *       404:
 *         description: Image or analysis not found
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
router.get('/yolo/:imageId', getYoloAnalysisResults);

/**
 * @openapi
 * /api/analysis/verify/{id}:
 *   put:
 *     tags:
 *       - Analysis
 *     summary: Verify analysis results
 *     description: Manually verify the results of a detailed analysis
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the detailed analysis
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Notes from the verifier
 *                 example: "Verified positively. Parasite count appears accurate."
 *     responses:
 *       200:
 *         description: Analysis verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DetailedAnalysis'
 *       404:
 *         description: Analysis not found
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
 *       403:
 *         description: Not authorized for this action
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/verify/:id', authorize('lab_technician', 'doctor', 'admin'), verifyAnalysis);

module.exports = router;