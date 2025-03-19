
// src/routes/auth.js
const express = require('express');
const { register, login, getMe } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: |
 *       Create a new user account in the system.
 *       
 *       **Role-based Access:**
 *       - Only users with `admin` role can create accounts with the `admin` role
 *       - By default, new users are assigned the `lab_technician` role if not specified
 *       
 *       **Password Requirements:**
 *       - Minimum 6 characters
 *       - Maximum 100 characters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             lab_technician:
 *               summary: New Lab Technician
 *               value:
 *                 name: "Sarah Johnson"
 *                 email: "sarah.johnson@lab.example.com"
 *                 password: "securePassword123"
 *                 role: "lab_technician"
 *             doctor:
 *               summary: New Doctor
 *               value:
 *                 name: "Dr. Michael Chen"
 *                 email: "michael.chen@hospital.example.com"
 *                 password: "dr.Chen2023!"
 *                 role: "doctor"
 *             researcher:
 *               summary: New Researcher
 *               value:
 *                 name: "Dr. Amina Diallo"
 *                 email: "amina.diallo@research.example.com"
 *                 password: "Research.2023"
 *                 role: "researcher"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoic2FyYWguam9obnNvbkBsYWIuZXhhbXBsZS5jb20iLCJyb2xlIjoibGFiX3RlY2huaWNpYW4iLCJpYXQiOjE2Mjk3Mzk4MjEsImV4cCI6MTYyOTgyNjIyMX0.tLmI1NmQXzPF4NjSFTGOcUlCwTHf6MIOqVVIyDwGzSM"
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Sarah Johnson"
 *                 email: "sarah.johnson@lab.example.com"
 *                 role: "lab_technician"
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               emailExists:
 *                 summary: Email already exists
 *                 value:
 *                   success: false
 *                   error: "User with email sarah.johnson@lab.example.com already exists"
 *               invalidInput:
 *                 summary: Invalid input
 *                 value:
 *                   success: false
 *                   error: "Please include a valid email"
 */
router.post('/register', register);


 /**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User login
 *     description: |
 *       Authenticate a user and return a JWT token.
 *       
 *       **Important Notes:**
 *       - The JWT token will be valid for 24 hours by default
 *       - You must include this token in the Authorization header for all protected routes
 *       - Format: `Authorization: Bearer your_token_here`
 *       
 *       **Default Admin Account:**
 *       - Email: admin@example.com
 *       - Password: admin123 (Change this in production)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Admin login
 *               value:
 *                 email: "admin@example.com"
 *                 password: "admin123"
 *             labTechnician:
 *               summary: Lab technician login
 *               value:
 *                 email: "sarah.johnson@lab.example.com"
 *                 password: "securePassword123"
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2Mjk3Mzk4MjEsImV4cCI6MTYyOTgyNjIyMX0.aBmOeNnOLk8-fKL6p24xWMqAWvHDW0k2RdZIV"
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Admin User"
 *                 email: "admin@example.com"
 *                 role: "admin"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Invalid credentials"
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Please provide email and password"
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current user
 *     description: Get the profile of the currently authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', protect, getMe);

module.exports = router;