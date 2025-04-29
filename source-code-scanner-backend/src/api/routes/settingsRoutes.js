// src/api/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get scanner paths
router.get('/scanners', settingsController.getScannerPaths);

// Update scanner paths
router.put('/scanners', authorize(['admin']), settingsController.updateScannerPaths);

// Get scanner rules
router.get('/rules', settingsController.getScannerRules);

// Create scanner rule
router.post('/rules', authorize(['admin', 'security_team']), settingsController.createScannerRule);

// Update scanner rule
router.put('/rules/:id', authorize(['admin', 'security_team']), settingsController.updateScannerRule);

// Delete scanner rule
router.delete('/rules/:id', authorize(['admin', 'security_team']), settingsController.deleteScannerRule);

// Get system settings
router.get('/system', authorize(['admin']), settingsController.getSystemSettings);

// Update system settings
router.put('/system', authorize(['admin']), settingsController.updateSystemSettings);

// Get user settings
router.get('/user', settingsController.getUserSettings);

// Update user settings
router.put('/user', settingsController.updateUserSettings);

module.exports = router;

