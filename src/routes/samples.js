
// src/routes/samples.js
const express = require('express');
const {
  createSample,
  getSamples,
  getSample,
  updateSample,
  deleteSample,
  getStats
} = require('../controllers/samples');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

/**
 * @openapi
 * /api/samples/stats:
 *   get:
 *     tags:
 *       - Samples
 *     summary: Get sample statistics
 *     description: Get statistics about samples for dashboard display
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         registered:
 *                           type: integer
 *                           example: 20
 *                         ready_for_analysis:
 *                           type: integer
 *                           example: 15
 *                         processing:
 *                           type: integer
 *                           example: 5
 *                         completed:
 *                           type: integer
 *                           example: 55
 *                         failed:
 *                           type: integer
 *                           example: 5
 *                     byPriority:
 *                       type: object
 *                       properties:
 *                         routine:
 *                           type: integer
 *                           example: 70
 *                         urgent:
 *                           type: integer
 *                           example: 30
 *                     byType:
 *                       type: object
 *                       properties:
 *                         thick_smear:
 *                           type: integer
 *                           example: 50
 *                         thin_smear:
 *                           type: integer
 *                           example: 40
 *                         both:
 *                           type: integer
 *                           example: 10
 *                     positiveCount:
 *                       type: integer
 *                       example: 35
 *                     recentSamples:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Sample'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', getStats);

/**
 * @openapi
 * /api/samples:
 *   post:
 *     tags:
 *       - Samples
 *     summary: Create a new sample
 *     description: Register a new blood sample for a patient
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - labTechnician
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the patient
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               sampleType:
 *                 type: string
 *                 enum: [thick_smear, thin_smear, both]
 *                 description: Type of blood smear
 *                 example: "thick_smear"
 *               collectionTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time when sample was collected
 *                 example: "2023-05-01T10:30:00Z"
 *               labTechnician:
 *                 type: string
 *                 description: Name of lab technician who collected the sample
 *                 example: "Dr. Jane Smith"
 *               priority:
 *                 type: string
 *                 enum: [routine, urgent]
 *                 description: Priority level of the sample
 *                 example: "routine"
 *               notes:
 *                 type: string
 *                 description: Additional notes about the sample
 *                 example: "Sample collected from finger prick"
 *     responses:
 *       201:
 *         description: Sample created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sample'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Patient not found
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
 *   get:
 *     tags:
 *       - Samples
 *     summary: Get all samples
 *     description: Get a list of all samples with pagination and filtering options
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for sample ID or lab technician
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, ready_for_analysis, processing, completed, failed]
 *         description: Filter by sample status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [routine, urgent]
 *         description: Filter by sample priority
 *       - in: query
 *         name: sampleType
 *         schema:
 *           type: string
 *           enum: [thick_smear, thin_smear, both]
 *         description: Filter by sample type
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by patient ID
 *     responses:
 *       200:
 *         description: List of samples retrieved successfully
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
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sample'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/')
  .post(createSample)
  .get(getSamples);

/**
 * @openapi
 * /api/samples/{id}:
 *   get:
 *     tags:
 *       - Samples
 *     summary: Get a single sample
 *     description: Get detailed information about a specific sample
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sample ID
 *     responses:
 *       200:
 *         description: Sample retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sample'
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
 *
 *   put:
 *     tags:
 *       - Samples
 *     summary: Update a sample
 *     description: Update information for a specific sample
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sample ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               labTechnician:
 *                 type: string
 *                 example: "Dr. Jane Smith"
 *               priority:
 *                 type: string
 *                 enum: [routine, urgent]
 *                 example: "urgent"
 *               notes:
 *                 type: string
 *                 example: "Updated notes for this sample"
 *     responses:
 *       200:
 *         description: Sample updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sample'
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
 *
 *   delete:
 *     tags:
 *       - Samples
 *     summary: Delete a sample
 *     description: Delete a specific sample and all related records
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sample ID
 *     responses:
 *       200:
 *         description: Sample deleted successfully
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
 *       403:
 *         description: Not authorized for this action
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/:id')
  .get(getSample)
  .put(updateSample)
  .delete(authorize('admin', 'lab_technician'), deleteSample);

module.exports = router;