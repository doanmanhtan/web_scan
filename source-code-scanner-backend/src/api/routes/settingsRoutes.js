// src/api/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer();

// All routes require authentication
router.use(authenticate);

// Get scanner paths
router.get('/scanners', settingsController.getScannerPaths);

// Get current scanner paths (for debugging)
router.get('/scanners/current', settingsController.getCurrentScannerPaths);

// Update scanner paths
router.put('/scanners', authorize(['admin']), settingsController.updateScannerPaths);

// Get all scanner configurations
router.get('/scanners/configs', settingsController.getAllScannerConfigs);

// Get specific scanner configuration
router.get('/scanners/:scanner/config', settingsController.getScannerConfig);

// Test scanner connection
router.post('/scanners/:scanner/test', settingsController.testScannerConnection);

// Reset scanner configurations to defaults
router.post('/scanners/reset', authorize(['admin']), settingsController.resetScannerConfigs);

// Get scanner rules
router.get('/rules', settingsController.getScannerRules);

// Get scanner rule by ID
router.get('/rules/:id', settingsController.getScannerRuleById);

// Create scanner rule
router.post('/rules', authorize(['admin', 'security_team']), settingsController.createScannerRule);

// Update scanner rule
router.put('/rules/:id', authorize(['admin', 'security_team']), settingsController.updateScannerRule);

// Delete scanner rule
router.delete('/rules/:id', authorize(['admin', 'security_team']), settingsController.deleteScannerRule);

// Import scanner rule (upload file)
router.post('/rules/import', authorize(['admin', 'security_team']), upload.single('file'), settingsController.importScannerRule);

// Get system settings
router.get('/system', authorize(['admin']), settingsController.getSystemSettings);

// Update system settings
router.put('/system', authorize(['admin']), settingsController.updateSystemSettings);

// Get user settings
router.get('/user', settingsController.getUserSettings);

// Update user settings
router.put('/user', settingsController.updateUserSettings);



module.exports = router;

