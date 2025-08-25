// // src/api/routes/settingsRoutes.js
// const express = require('express');
// const router = express.Router();
// const settingsController = require('../controllers/settingsController');
// const { authenticate, authorize } = require('../middleware/auth');
// const multer = require('multer');
// const upload = multer();

// // All routes require authentication
// router.use(authenticate);

// // Get scanner paths
// router.get('/scanners', settingsController.getScannerPaths);

// // Get current scanner paths (for debugging)
// router.get('/scanners/current', settingsController.getCurrentScannerPaths);

// // Update scanner paths
// router.put('/scanners', authorize(['admin']), settingsController.updateScannerPaths);

// // Get all scanner configurations
// router.get('/scanners/configs', settingsController.getAllScannerConfigs);

// // Get specific scanner configuration
// router.get('/scanners/:scanner/config', settingsController.getScannerConfig);

// // Test scanner connection
// router.post('/scanners/:scanner/test', settingsController.testScannerConnection);

// // Reset scanner configurations to defaults
// router.post('/scanners/reset', authorize(['admin']), settingsController.resetScannerConfigs);

// // Get scanner rules
// router.get('/rules', settingsController.getScannerRules);

// // Get scanner rule by ID
// router.get('/rules/:id', settingsController.getScannerRuleById);

// // Create scanner rule
// router.post('/rules', authorize(['admin', 'security_team']), settingsController.createScannerRule);

// // Update scanner rule
// router.put('/rules/:id', authorize(['admin', 'security_team']), settingsController.updateScannerRule);

// // Delete scanner rule
// router.delete('/rules/:id', authorize(['admin', 'security_team']), settingsController.deleteScannerRule);

// // Import scanner rule (upload file)
// router.post('/rules/import', authorize(['admin', 'security_team']), upload.single('file'), settingsController.importScannerRule);

// // Get system settings
// router.get('/system', authorize(['admin']), settingsController.getSystemSettings);

// // Update system settings
// router.put('/system', authorize(['admin']), settingsController.updateSystemSettings);

// // Get user settings
// router.get('/user', settingsController.getUserSettings);

// // Update user settings
// router.put('/user', settingsController.updateUserSettings);

// // Get all custom rules
// router.get('/cppcheck-custom/rules', 
//     settingsController.getCppcheckCustomRules
//   );
  
//   // Get single custom rule by ID
//   router.get('/cppcheck-custom/rules/:id', 
//     settingsController.getCppcheckCustomRuleById
//   );
  
//   // Create new custom rule (admin/security_team only)
//   router.post('/cppcheck-custom/rules', 
//     authorize(['admin', 'security_team']), 
//     settingsController.createCppcheckCustomRule
//   );
  
//   // Update custom rule (admin/security_team only)
//   router.put('/cppcheck-custom/rules/:id', 
//     authorize(['admin', 'security_team']), 
//     settingsController.updateCppcheckCustomRule
//   );
  
//   // Delete custom rule (admin only)
//   router.delete('/cppcheck-custom/rules/:id', 
//     authorize(['admin']), 
//     settingsController.deleteCppcheckCustomRule
//   );
  

// module.exports = router;


// src/api/routes/settingsRoutes.js - FINAL CLEANED VERSION
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// SCANNER MANAGEMENT ROUTES
// ============================================================================

// Get scanner paths
router.get('/scanners', settingsController.getScannerPaths);

// Get current scanner paths (for debugging)
router.get('/scanners/current', settingsController.getCurrentScannerPaths);

// Update scanner paths (admin only)
router.put('/scanners', authorize(['admin']), settingsController.updateScannerPaths);

// Get all scanner configurations
router.get('/scanners/configs', settingsController.getAllScannerConfigs);

// Get specific scanner configuration
router.get('/scanners/:scanner/config', settingsController.getScannerConfig);

// Test scanner connection
router.post('/scanners/:scanner/test', settingsController.testScannerConnection);

// Reset scanner configurations to defaults (admin only)
router.post('/scanners/reset', authorize(['admin']), settingsController.resetScannerConfigs);

// ============================================================================
// GENERIC RULES MANAGEMENT ROUTES
// Handles ALL scanner types with smart routing by file extension:
// - .xml files → automatically routed to cppcheck-custom directory
// - .yaml/.yml files → automatically routed to semgrep directory
// ============================================================================

// Get all scanner rules (from all scanners)
router.get('/rules', settingsController.getScannerRules);

// Get scanner rule by ID
router.get('/rules/:id', settingsController.getScannerRuleById);

// Create scanner rule (admin/security_team only)
// Supports auto-routing based on file extension
router.post('/rules', authorize(['admin', 'security_team']), settingsController.createScannerRule);

// Update scanner rule (admin/security_team only)
router.put('/rules/:id', authorize(['admin', 'security_team']), settingsController.updateScannerRule);

// Delete scanner rule (admin/security_team only)
router.delete('/rules/:id', authorize(['admin', 'security_team']), settingsController.deleteScannerRule);

// Import scanner rule from file upload (admin/security_team only)
// Supports auto-routing based on file extension
router.post('/rules/import', authorize(['admin', 'security_team']), upload.single('file'), settingsController.importScannerRule);

// ============================================================================
// SYSTEM SETTINGS ROUTES
// ============================================================================

// Get system settings (admin only)
router.get('/system', authorize(['admin']), settingsController.getSystemSettings);

// Update system settings (admin only)
router.put('/system', authorize(['admin']), settingsController.updateSystemSettings);

// ============================================================================
// USER SETTINGS ROUTES
// ============================================================================

// Get user settings (current user)
router.get('/user', settingsController.getUserSettings);

// Update user settings (current user)
router.put('/user', settingsController.updateUserSettings);

// ============================================================================
// REMOVED: All cppcheck-custom specific routes
// ============================================================================
// ❌ REMOVED - These are now handled by generic /rules endpoints:
// 
// router.get('/cppcheck-custom/rules', settingsController.getCppcheckCustomRules);
// router.get('/cppcheck-custom/rules/:id', settingsController.getCppcheckCustomRuleById);
// router.post('/cppcheck-custom/rules', authorize(['admin', 'security_team']), settingsController.createCppcheckCustomRule);
// router.put('/cppcheck-custom/rules/:id', authorize(['admin', 'security_team']), settingsController.updateCppcheckCustomRule);
// router.delete('/cppcheck-custom/rules/:id', authorize(['admin']), settingsController.deleteCppcheckCustomRule);
//
// WHY REMOVED:
// - Generic /rules endpoints now handle ALL scanner types automatically
// - File extension determines target directory (.xml → cppcheck-custom, .yaml/.yml → semgrep)
// - Eliminates code duplication and maintenance overhead
// - Provides consistent API interface for all scanner types

module.exports = router;