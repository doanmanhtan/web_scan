// src/api/routes/scanRoutes.js
const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { authenticate } = require('../middleware/auth');
const { validateFiles } = require('../middleware/validation');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Routes
// All routes require authentication
router.use(authenticate);

// Create new scan
router.post(
  '/',
  upload.array('files', 20), // Max 20 files
  validateFiles(['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go']),
  scanController.createScan
);

// Start scan
router.post('/:id/start', scanController.startScan);

// Get scan by ID
router.get('/:id', scanController.getScanById);

// Get scan by unique scan ID
router.get('/by-scan-id/:scanId', scanController.getScanByUniqueId);

// Get all scans with pagination and filtering
router.get('/', scanController.getAllScans);

// Delete scan
router.delete('/:id', scanController.deleteScan);

// Get vulnerabilities by scan ID
router.get('/:id/vulnerabilities', scanController.getVulnerabilitiesByScan);

// Get vulnerability statistics by scan ID
router.get('/:id/vulnerability-stats', scanController.getVulnerabilityStatsByScan);

// Check scanner installation status
router.get('/system/check-scanners', scanController.checkScannerInstallation);

// Get scan statistics
router.get('/stats/summary', scanController.getScanStats);

module.exports = router;