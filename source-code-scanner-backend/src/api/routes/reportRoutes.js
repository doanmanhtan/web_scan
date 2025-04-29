// src/api/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body } = require('express-validator');

// Validation rules
const generateReportValidation = [
  body('scanId')
    .notEmpty()
    .withMessage('Scan ID is required'),
  body('format')
    .isIn(['json', 'html', 'csv'])
    .withMessage('Invalid report format. Supported formats: json, html, csv'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Report name must be between 1 and 100 characters'),
  body('includeOptions')
    .optional()
    .isObject()
    .withMessage('Include options must be an object')
];

// Routes
// All routes require authentication
router.use(authenticate);

// Generate a new report
router.post(
  '/',
  validateRequest(generateReportValidation),
  reportController.generateReport
);

// Get report by ID
router.get('/:id', reportController.getReportById);

// Get report by unique report ID
router.get('/by-report-id/:reportId', reportController.getReportByUniqueId);

// Get reports by scan ID
router.get('/by-scan/:scanId', reportController.getReportsByScan);

// Get all reports with pagination and filtering
router.get('/', reportController.getAllReports);

// Download report
router.get('/:id/download', reportController.downloadReport);

// Share report
router.post('/:id/share', reportController.shareReport);

// Get report by share link
router.get('/share/:shareLink', reportController.getReportByShareLink);

// Delete report
router.delete('/:id', reportController.deleteReport);

module.exports = router;

