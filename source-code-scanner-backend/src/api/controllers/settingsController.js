// // src/api/controllers/settingsController.js
// const fs = require('fs-extra');
// const path = require('path');
// const { logger } = require('../../utils/logger');
// const { scannerConfig } = require('../../config/scanners');
// const appConfig = require('../../config/app');
// const configService = require('../../services/configService');

// /**
//  * Settings controller
//  */
// const settingsController = {
//   /**
//    * Get scanner paths
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   getScannerPaths: async (req, res) => {
//     try {
//       // Use dynamic config service instead of static config
//       const scannerPaths = configService.getScannerPaths();
      
//       res.status(200).json({
//         success: true,
//         data: scannerPaths
//       });
//     } catch (error) {
//       logger.error(`Error in getScannerPaths controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching scanner paths'
//       });
//     }
//   },

//   /**
//    * Update scanner paths
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   updateScannerPaths: async (req, res) => {
//     try {
//       const updates = req.body;
      
//       // Validate updates
//       for (const [scanner, scannerUpdates] of Object.entries(updates)) {
//         if (!configService.getScannerConfig(scanner)) {
//           return res.status(400).json({
//             success: false,
//             message: `Unknown scanner: ${scanner}`
//           });
//         }
//       }
      
//       // Update configuration using the service
//       const results = configService.updateMultipleScanners(updates);
      
//       // Check for errors
//       const errors = Object.entries(results).filter(([_, result]) => result.error);
//       if (errors.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'Some scanner updates failed',
//           errors: errors.reduce((acc, [scanner, result]) => {
//             acc[scanner] = result.error;
//             return acc;
//           }, {})
//         });
//       }
      
//       // Force reload config to ensure ScannerFactory gets latest changes
//       configService.forceReloadConfig();
      
//       // Get updated configurations
//       const updatedConfigs = configService.getConfig();
      
//       res.status(200).json({
//         success: true,
//         message: 'Scanner configurations updated successfully',
//         data: updatedConfigs
//       });
//     } catch (error) {
//       logger.error(`Error in updateScannerPaths controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error updating scanner configurations'
//       });
//     }
//   },

//   /**
//    * Test scanner connection
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   testScannerConnection: async (req, res) => {
//     try {
//       const { scanner } = req.params;
//       const { path: testPath } = req.body;
      
//       if (!scanner) {
//         return res.status(400).json({
//           success: false,
//           message: 'Scanner name is required'
//         });
//       }
      
//       // Test connection using the service with specific path if provided
//       let result;
//       if (testPath) {
//         result = await configService.testScannerConnectionWithPath(scanner, testPath);
//       } else {
//         result = await configService.testScannerConnection(scanner);
//       }
      
//       res.status(200).json({
//         success: true,
//         data: result
//       });
//     } catch (error) {
//       logger.error(`Error in testScannerConnection controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error testing scanner connection'
//       });
//     }
//   },

//   /**
//    * Get scanner configuration details
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   getScannerConfig: async (req, res) => {
//     try {
//       const { scanner } = req.params;
      
//       if (!scanner) {
//         return res.status(400).json({
//           success: false,
//           message: 'Scanner name is required'
//         });
//       }
      
//       const config = configService.getScannerConfig(scanner);
//       if (!config) {
//         return res.status(404).json({
//           success: false,
//           message: `Scanner not found: ${scanner}`
//         });
//       }
      
//       res.status(200).json({
//         success: true,
//         data: config
//       });
//     } catch (error) {
//       logger.error(`Error in getScannerConfig controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching scanner configuration'
//       });
//     }
//   },

//   /**
//    * Get all scanner configurations
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   getAllScannerConfigs: async (req, res) => {
//     try {
//       const configs = configService.getConfig();
      
//       res.status(200).json({
//         success: true,
//         data: configs
//       });
//     } catch (error) {
//       logger.error(`Error in getAllScannerConfigs controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching scanner configurations'
//       });
//     }
//   },

//   /**
//    * Reset scanner configurations to defaults
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   resetScannerConfigs: async (req, res) => {
//     try {
//       const configs = configService.resetToDefaults();
      
//       res.status(200).json({
//         success: true,
//         message: 'Scanner configurations reset to defaults',
//         data: configs
//       });
//     } catch (error) {
//       logger.error(`Error in resetScannerConfigs controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error resetting scanner configurations'
//       });
//     }
//   },

//   /**
//    * Get scanner rules
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   getScannerRules: async (req, res) => {
//     try {
//       const rules = [];
      
//       // In a real application, you would fetch rules from the database
//       // For this example, we'll just scan the rules directory
      
//       // Get rules for each scanner
//       for (const [scanner, config] of Object.entries(scannerConfig)) {
//         if (config.rules && fs.existsSync(config.rules)) {
//           const files = await fs.readdir(config.rules);
          
//           for (const file of files) {
//             if (file.endsWith('.yaml') || file.endsWith('.yml')) {
//               rules.push({
//                 id: `${scanner}_${file}`,
//                 name: file,
//                 scanner,
//                 path: path.join(config.rules, file)
//               });
//             }
//           }
//         }
//       }
      
//       res.status(200).json({
//         success: true,
//         data: rules
//       });
//     } catch (error) {
//       logger.error(`Error in getScannerRules controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching scanner rules'
//       });
//     }
//   },

//   /**
//    * Create scanner rule
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   createScannerRule: async (req, res) => {
//     try {
//       const { scanner, name, content } = req.body;
      
//       if (!scanner || !name || !content) {
//         return res.status(400).json({
//           success: false,
//           message: 'Scanner, name, and content are required'
//         });
//       }
      
//       if (!scannerConfig[scanner]) {
//         return res.status(400).json({
//           success: false,
//           message: `Unknown scanner: ${scanner}`
//         });
//       }
      
//       if (!scannerConfig[scanner].rules) {
//         return res.status(400).json({
//           success: false,
//           message: `No rules directory configured for scanner: ${scanner}`
//         });
//       }
      
//       // Ensure rules directory exists
//       const rulesDir = scannerConfig[scanner].rules;
//       fs.ensureDirSync(rulesDir);
      
//       // Create rule file
//       const rulePath = path.join(rulesDir, name.endsWith('.yaml') ? name : `${name}.yaml`);
      
//       // Check if file already exists
//       if (fs.existsSync(rulePath)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Rule file already exists'
//         });
//       }
      
//       // Write rule file
//       await fs.writeFile(rulePath, content);
      
//       res.status(201).json({
//         success: true,
//         message: 'Rule created successfully',
//         data: {
//           id: `${scanner}_${name}`,
//           name,
//           scanner,
//           path: rulePath
//         }
//       });
//     } catch (error) {
//       logger.error(`Error in createScannerRule controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error creating scanner rule'
//       });
//     }
//   },

//   /**
//    * Update scanner rule
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   updateScannerRule: async (req, res) => {
//     try {
//       const ruleId = req.params.id;
//       const { content } = req.body;
      
//       if (!content) {
//         return res.status(400).json({
//           success: false,
//           message: 'Content is required'
//         });
//       }
      
//       // Parse rule ID to get scanner and name
//       const [scanner, ...nameParts] = ruleId.split('_');
//       const name = nameParts.join('_');
      
//       if (!scanner || !name) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid rule ID'
//         });
//       }
      
//       if (!scannerConfig[scanner]) {
//         return res.status(400).json({
//           success: false,
//           message: `Unknown scanner: ${scanner}`
//         });
//       }
      
//       if (!scannerConfig[scanner].rules) {
//         return res.status(400).json({
//           success: false,
//           message: `No rules directory configured for scanner: ${scanner}`
//         });
//       }
      
//       // Find rule file
//       const rulesDir = scannerConfig[scanner].rules;
//       const rulePath = path.join(rulesDir, name);
      
//       // Check if file exists
//       if (!fs.existsSync(rulePath)) {
//         return res.status(404).json({
//           success: false,
//           message: 'Rule file not found'
//         });
//       }
      
//       // Update rule file
//       await fs.writeFile(rulePath, content);
      
//       res.status(200).json({
//         success: true,
//         message: 'Rule updated successfully',
//         data: {
//           id: ruleId,
//           name,
//           scanner,
//           path: rulePath
//         }
//       });
//     } catch (error) {
//       logger.error(`Error in updateScannerRule controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error updating scanner rule'
//       });
//     }
//   },

//   /**
//    * Delete scanner rule
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   deleteScannerRule: async (req, res) => {
//     try {
//       const ruleId = req.params.id;
      
//       // Parse rule ID to get scanner and name
//       const [scanner, ...nameParts] = ruleId.split('_');
//       const name = nameParts.join('_');
      
//       if (!scanner || !name) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid rule ID'
//         });
//       }
      
//       if (!scannerConfig[scanner]) {
//         return res.status(400).json({
//           success: false,
//           message: `Unknown scanner: ${scanner}`
//         });
//       }
      
//       if (!scannerConfig[scanner].rules) {
//         return res.status(400).json({
//           success: false,
//           message: `No rules directory configured for scanner: ${scanner}`
//         });
//       }
      
//       // Find rule file
//       const rulesDir = scannerConfig[scanner].rules;
//       const rulePath = path.join(rulesDir, name);
      
//       // Check if file exists
//       if (!fs.existsSync(rulePath)) {
//         return res.status(404).json({
//           success: false,
//           message: 'Rule file not found'
//         });
//       }
      
//       // Delete rule file
//       await fs.unlink(rulePath);
      
//       res.status(200).json({
//         success: true,
//         message: 'Rule deleted successfully'
//       });
//     } catch (error) {
//       logger.error(`Error in deleteScannerRule controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error deleting scanner rule'
//       });
//     }
//   },

//   /**
//    * Get system settings
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   getSystemSettings: async (req, res) => {
//     try {
//       // In a real application, you would fetch these settings from the database
//       // For this example, we'll just return the app config
      
//       const settings = {
//         upload: {
//           maxFileSize: appConfig.upload.maxFileSize,
//           supportedFileTypes: appConfig.upload.supportedFileTypes
//         },
//         reports: {
//           formats: appConfig.reports.formats
//         },
//         scans: {
//           defaultScanType: appConfig.scans.defaultScanType
//         },
//         scanners: {
//           maxThreads: require('../../config/scanners').maxScanThreads,
//           defaultTimeout: require('../../config/scanners').defaultScanTimeout
//         }
//       };
      
//       res.status(200).json({
//         success: true,
//         data: settings
//       });
//     } catch (error) {
//       logger.error(`Error in getSystemSettings controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching system settings'
//       });
//     }
//   },

//   /**
//    * Update system settings
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   updateSystemSettings: async (req, res) => {
//     try {
//       const updates = req.body;
      
//       // In a real application, you would update these settings in the database
//       // For this example, we'll just return the updated settings
      
//       const settings = {
//         upload: {
//           maxFileSize: updates.upload?.maxFileSize || appConfig.upload.maxFileSize,
//           supportedFileTypes: updates.upload?.supportedFileTypes || appConfig.upload.supportedFileTypes
//         },
//         reports: {
//           formats: updates.reports?.formats || appConfig.reports.formats
//         },
//         scans: {
//           defaultScanType: updates.scans?.defaultScanType || appConfig.scans.defaultScanType
//         },
//         scanners: {
//           maxThreads: updates.scanners?.maxThreads || require('../../config/scanners').maxScanThreads,
//           defaultTimeout: updates.scanners?.defaultTimeout || require('../../config/scanners').defaultScanTimeout
//         }
//       };
      
//       res.status(200).json({
//         success: true,
//         message: 'System settings updated successfully',
//         data: settings
//       });
//     } catch (error) {
//       logger.error(`Error in updateSystemSettings controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error updating system settings'
//       });
//     }
//   },

//   /**
//    * Get user settings
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   getUserSettings: async (req, res) => {
//     try {
//       const userId = req.user.id;
      
//       // In a real application, you would fetch user settings from the database
//       // For this example, we'll just return some default settings
      
//       const settings = {
//         notifications: {
//           scanCompleted: true,
//           criticalVulnerabilityFound: true,
//           assignedVulnerability: true
//         },
//         display: {
//           defaultScanType: 'all',
//           defaultReportFormat: 'html',
//           defaultVulnerabilitySort: 'severity'
//         },
//         ui: {
//           theme: 'light',
//           language: 'en'
//         }
//       };
      
//       res.status(200).json({
//         success: true,
//         data: settings
//       });
//     } catch (error) {
//       logger.error(`Error in getUserSettings controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching user settings'
//       });
//     }
//   },

//   /**
//    * Update user settings
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   updateUserSettings: async (req, res) => {
//     try {
//       const userId = req.user.id;
//       const updates = req.body;
      
//       // In a real application, you would update user settings in the database
//       // For this example, we'll just return the updated settings
      
//       const defaultSettings = {
//         notifications: {
//           scanCompleted: true,
//           criticalVulnerabilityFound: true,
//           assignedVulnerability: true
//         },
//         display: {
//           defaultScanType: 'all',
//           defaultReportFormat: 'html',
//           defaultVulnerabilitySort: 'severity'
//         },
//         ui: {
//           theme: 'light',
//           language: 'en'
//         }
//       };
      
//       const settings = {
//         notifications: {
//           ...defaultSettings.notifications,
//           ...updates.notifications
//         },
//         display: {
//           ...defaultSettings.display,
//           ...updates.display
//         },
//         ui: {
//           ...defaultSettings.ui,
//           ...updates.ui
//         }
//       };
      
//       res.status(200).json({
//         success: true,
//         message: 'User settings updated successfully',
//         data: settings
//       });
//     } catch (error) {
//       logger.error(`Error in updateUserSettings controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error updating user settings'
//       });
//     }
//   },

//   /**
//    * Get scanner rule by ID
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   getScannerRuleById: async (req, res) => {
//     try {
//       const ruleId = req.params.id;
//       if (!ruleId || !ruleId.includes('_')) {
//         return res.status(400).json({ success: false, message: 'Invalid rule ID' });
//       }
//       const [scanner, ...fileParts] = ruleId.split('_');
//       const fileName = fileParts.join('_');
//       if (!scannerConfig[scanner] || !scannerConfig[scanner].rules) {
//         return res.status(404).json({ success: false, message: 'Scanner or rules directory not found' });
//       }
//       // Tìm file .yaml hoặc .yml
//       const rulesDir = scannerConfig[scanner].rules;
//       let rulePath = path.join(rulesDir, fileName);
//       if (!rulePath.endsWith('.yaml') && !rulePath.endsWith('.yml')) {
//         if (fs.existsSync(path.join(rulesDir, fileName + '.yaml'))) {
//           rulePath = path.join(rulesDir, fileName + '.yaml');
//         } else if (fs.existsSync(path.join(rulesDir, fileName + '.yml'))) {
//           rulePath = path.join(rulesDir, fileName + '.yml');
//         }
//       }
//       if (!fs.existsSync(rulePath)) {
//         return res.status(404).json({ success: false, message: 'Rule file not found' });
//       }
//       const content = await fs.readFile(rulePath, 'utf8');
//       res.status(200).json({
//         success: true,
//         data: {
//           id: ruleId,
//           scanner,
//           name: fileName,
//           path: rulePath,
//           content
//         }
//       });
//     } catch (error) {
//       logger.error(`Error in getScannerRuleById controller: ${error.message}`);
//       res.status(500).json({ success: false, message: 'Error fetching scanner rule' });
//     }
//   },

//   /**
//    * Import scanner rule from uploaded file
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   importScannerRule: async (req, res) => {
//     try {
//       // Sử dụng multer để lấy file upload
//       const { scanner } = req.body;
//       const file = req.file;
//       if (!scanner || !file) {
//         return res.status(400).json({ success: false, message: 'Scanner and file are required' });
//       }
//       if (!scannerConfig[scanner] || !scannerConfig[scanner].rules) {
//         return res.status(400).json({ success: false, message: 'Unknown scanner or rules directory not found' });
//       }
//       const rulesDir = scannerConfig[scanner].rules;
//       await fs.ensureDir(rulesDir);
//       // Đặt tên file (giữ nguyên tên gốc, tránh trùng thì thêm hậu tố)
//       let fileName = file.originalname;
//       let rulePath = path.join(rulesDir, fileName);
//       let count = 1;
//       while (fs.existsSync(rulePath)) {
//         const ext = path.extname(fileName);
//         const base = path.basename(fileName, ext);
//         fileName = `${base}_imported${count}${ext}`;
//         rulePath = path.join(rulesDir, fileName);
//         count++;
//       }
//       // Lưu file
//       await fs.writeFile(rulePath, file.buffer);
//       res.status(201).json({
//         success: true,
//         message: 'Rule imported successfully',
//         data: {
//           id: `${scanner}_${fileName}`,
//           name: fileName,
//           scanner,
//           path: rulePath
//         }
//       });
//     } catch (error) {
//       logger.error(`Error in importScannerRule controller: ${error.message}`);
//       res.status(500).json({ success: false, message: 'Error importing scanner rule' });
//     }
//   },

//   /**
//    * Get current scanner paths for debugging
//    * @param {Object} req - Express request object
//    * @param {Object} res - Express response object
//    */
//   getCurrentScannerPaths: async (req, res) => {
//     try {
//       // Force reload to get latest config
//       configService.forceReloadConfig();
      
//       const scannerPaths = configService.getScannerPaths();
//       const fullConfigs = configService.getConfig();
      
//       res.status(200).json({
//         success: true,
//         data: {
//           paths: scannerPaths,
//           fullConfigs: fullConfigs,
//           configFile: configService.configPath,
//           lastModified: configService.lastLoadTime
//         }
//       });
//     } catch (error) {
//       logger.error(`Error in getCurrentScannerPaths controller: ${error.message}`);
      
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching current scanner paths'
//       });
//     }
//   },
//   /**
//    * Get Cppcheck custom rules
//    */
//   getCppcheckCustomRules: async (req, res) => {
//     try {
//       const rulesDir = process.env.CPPCHECK_CUSTOM_RULES_PATH || 
//                        path.join(__dirname, '../../rules/cppcheck-custom');
      
//       if (!fs.existsSync(rulesDir)) {
//         return res.status(404).json({
//           success: false,
//           message: 'Custom rules directory not found'
//         });
//       }

//       const ruleFiles = fs.readdirSync(rulesDir)
//         .filter(f => f.endsWith('.xml') || f.endsWith('.rule'))
//         .map(filename => {
//           const content = fs.readFileSync(path.join(rulesDir, filename), 'utf8');
//           return {
//             id: filename,
//             name: filename,
//             content: content,
//             path: path.join(rulesDir, filename)
//           };
//         });

//       res.status(200).json({
//         success: true,
//         data: ruleFiles
//       });
//     } catch (error) {
//       logger.error(`Error getting cppcheck custom rules: ${error.message}`);
//       res.status(500).json({
//         success: false,
//         message: 'Error getting custom rules'
//       });
//     }
//   },

//   /**
//    * Create Cppcheck custom rule
//    */
//   createCppcheckCustomRule: async (req, res) => {
//     try {
//       const { name, content } = req.body;
      
//       if (!name || !content) {
//         return res.status(400).json({
//           success: false,
//           message: 'Name and content are required'
//         });
//       }

//       const rulesDir = process.env.CPPCHECK_CUSTOM_RULES_PATH || 
//                        path.join(__dirname, '../../rules/cppcheck-custom');
      
//       fs.ensureDirSync(rulesDir);
      
//       const fileName = name.endsWith('.xml') ? name : `${name}.xml`;
//       const rulePath = path.join(rulesDir, fileName);
      
//       if (fs.existsSync(rulePath)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Rule file already exists'
//         });
//       }

//       await fs.writeFile(rulePath, content);

//       res.status(201).json({
//         success: true,
//         message: 'Custom rule created successfully',
//         data: {
//           id: fileName,
//           name: fileName,
//           path: rulePath
//         }
//       });
//     } catch (error) {
//       logger.error(`Error creating cppcheck custom rule: ${error.message}`);
//       res.status(500).json({
//         success: false,
//         message: 'Error creating custom rule'
//       });
//     }
//   },

//   /**
//    * Update Cppcheck custom rule
//    */
//   updateCppcheckCustomRule: async (req, res) => {
//     try {
//       const ruleId = req.params.id;
//       const { content } = req.body;
      
//       if (!content) {
//         return res.status(400).json({
//           success: false,
//           message: 'Content is required'
//         });
//       }

//       const rulesDir = process.env.CPPCHECK_CUSTOM_RULES_PATH || 
//                        path.join(__dirname, '../../rules/cppcheck-custom');
      
//       const rulePath = path.join(rulesDir, ruleId);
      
//       if (!fs.existsSync(rulePath)) {
//         return res.status(404).json({
//           success: false,
//           message: 'Rule file not found'
//         });
//       }

//       await fs.writeFile(rulePath, content);

//       res.status(200).json({
//         success: true,
//         message: 'Custom rule updated successfully',
//         data: {
//           id: ruleId,
//           name: ruleId,
//           path: rulePath
//         }
//       });
//     } catch (error) {
//       logger.error(`Error updating cppcheck custom rule: ${error.message}`);
//       res.status(500).json({
//         success: false,
//         message: 'Error updating custom rule'
//       });
//     }
//   },

//   /**
//    * Delete Cppcheck custom rule
//    */
//   deleteCppcheckCustomRule: async (req, res) => {
//     try {
//       const ruleId = req.params.id;
      
//       const rulesDir = process.env.CPPCHECK_CUSTOM_RULES_PATH || 
//                        path.join(__dirname, '../../rules/cppcheck-custom');
      
//       const rulePath = path.join(rulesDir, ruleId);
      
//       if (!fs.existsSync(rulePath)) {
//         return res.status(404).json({
//           success: false,
//           message: 'Rule file not found'
//         });
//       }

//       await fs.unlink(rulePath);

//       res.status(200).json({
//         success: true,
//         message: 'Custom rule deleted successfully'
//       });
//     } catch (error) {
//       logger.error(`Error deleting cppcheck custom rule: ${error.message}`);
//       res.status(500).json({
//         success: false,
//         message: 'Error deleting custom rule'
//       });
//     }
//   },

//   /**
//    * Get single Cppcheck custom rule
//    */
//   getCppcheckCustomRuleById: async (req, res) => {
//     try {
//       const ruleId = req.params.id;
      
//       const rulesDir = process.env.CPPCHECK_CUSTOM_RULES_PATH || 
//                        path.join(__dirname, '../../rules/cppcheck-custom');
      
//       const rulePath = path.join(rulesDir, ruleId);
      
//       if (!fs.existsSync(rulePath)) {
//         return res.status(404).json({
//           success: false,
//           message: 'Rule file not found'
//         });
//       }

//       const content = fs.readFileSync(rulePath, 'utf8');

//       res.status(200).json({
//         success: true,
//         data: {
//           id: ruleId,
//           name: ruleId,
//           content: content,
//           path: rulePath
//         }
//       });
//     } catch (error) {
//       logger.error(`Error getting cppcheck custom rule: ${error.message}`);
//       res.status(500).json({
//         success: false,
//         message: 'Error getting custom rule'
//       });
//     }
//   }
// };

// module.exports = settingsController;


// src/api/controllers/settingsController.js - FIXED VERSION
const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../../utils/logger');
const appConfig = require('../../config/app');
const configService = require('../../services/configService');

/**
 * Settings controller - Fixed with proper error handling
 */
const settingsController = {
  /**
   * Get scanner paths
   */
  getScannerPaths: async (req, res) => {
    try {
      const scannerPaths = configService.getScannerPaths();
      
      res.status(200).json({
        success: true,
        data: scannerPaths
      });
    } catch (error) {
      logger.error(`Error in getScannerPaths controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching scanner paths'
      });
    }
  },

  /**
   * Update scanner paths
   */
  updateScannerPaths: async (req, res) => {
    try {
      const updates = req.body;
      
      // Validate updates
      for (const [scanner, scannerUpdates] of Object.entries(updates)) {
        if (!configService.getScannerConfig(scanner)) {
          return res.status(400).json({
            success: false,
            message: `Unknown scanner: ${scanner}`
          });
        }
      }
      
      // Update configuration using the service
      const results = configService.updateMultipleScanners(updates);
      
      // Check for errors
      const errors = Object.entries(results).filter(([_, result]) => result.error);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some scanner updates failed',
          errors: errors.reduce((acc, [scanner, result]) => {
            acc[scanner] = result.error;
            return acc;
          }, {})
        });
      }
      
      // Force reload config to ensure ScannerFactory gets latest changes
      configService.forceReloadConfig();
      
      // Get updated configurations
      const updatedConfigs = configService.getConfig();
      
      res.status(200).json({
        success: true,
        message: 'Scanner configurations updated successfully',
        data: updatedConfigs
      });
    } catch (error) {
      logger.error(`Error in updateScannerPaths controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error updating scanner configurations'
      });
    }
  },

  /**
   * Test scanner connection
   */
  testScannerConnection: async (req, res) => {
    try {
      const { scanner } = req.params;
      const { path: testPath } = req.body;
      
      if (!scanner) {
        return res.status(400).json({
          success: false,
          message: 'Scanner name is required'
        });
      }
      
      // Test connection using the service with specific path if provided
      let result;
      if (testPath) {
        result = await configService.testScannerConnectionWithPath(scanner, testPath);
      } else {
        result = await configService.testScannerConnection(scanner);
      }
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error in testScannerConnection controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error testing scanner connection'
      });
    }
  },

  /**
   * Get scanner configuration details
   */
  getScannerConfig: async (req, res) => {
    try {
      const { scanner } = req.params;
      
      if (!scanner) {
        return res.status(400).json({
          success: false,
          message: 'Scanner name is required'
        });
      }
      
      const config = configService.getScannerConfig(scanner);
      if (!config) {
        return res.status(404).json({
          success: false,
          message: `Scanner not found: ${scanner}`
        });
      }
      
      res.status(200).json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error(`Error in getScannerConfig controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching scanner configuration'
      });
    }
  },

  /**
   * Get all scanner configurations
   */
  getAllScannerConfigs: async (req, res) => {
    try {
      const configs = configService.getConfig();
      
      res.status(200).json({
        success: true,
        data: configs
      });
    } catch (error) {
      logger.error(`Error in getAllScannerConfigs controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching scanner configurations'
      });
    }
  },

  /**
   * Reset scanner configurations to defaults
   */
  resetScannerConfigs: async (req, res) => {
    try {
      const configs = configService.resetToDefaults();
      
      res.status(200).json({
        success: true,
        message: 'Scanner configurations reset to defaults',
        data: configs
      });
    } catch (error) {
      logger.error(`Error in resetScannerConfigs controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error resetting scanner configurations'
      });
    }
  },

  /**
   * Get scanner rules - UPDATED to use dynamic config and support multiple extensions
   */
  getScannerRules: async (req, res) => {
    try {
      const rules = [];
      
      // Use dynamic config instead of static
      const configs = configService.getConfig();
      
      // Get rules for each scanner
      for (const [scanner, config] of Object.entries(configs)) {
        if (config.rules && fs.existsSync(config.rules)) {
          const files = await fs.readdir(config.rules);
          
          for (const file of files) {
            // Support multiple extensions
            if (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.xml')) {
              rules.push({
                id: `${scanner}_${file}`,
                name: file,
                scanner,
                path: path.join(config.rules, file),
                extension: path.extname(file)
              });
            }
          }
        }
      }
      
      res.status(200).json({
        success: true,
        data: rules
      });
    } catch (error) {
      logger.error(`Error in getScannerRules controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching scanner rules'
      });
    }
  },

  /**
   * Create scanner rule - FIXED ERROR HANDLING
   */
  createScannerRule: async (req, res) => {
    try {
      let { scanner, name, content } = req.body;
      
      console.log('📝 Creating scanner rule:', { scanner, name: name?.substring(0, 50) });
      
      if (!name || !content) {
        return res.status(400).json({
          success: false,
          message: 'Name and content are required'
        });
      }

      // AUTO-DETECT scanner based on file extension if scanner not provided
      if (!scanner) {
        scanner = settingsController._getTargetScannerByExtension(name);
        console.log('🔍 Auto-detected scanner:', scanner);
        
        if (!scanner) {
          return res.status(400).json({
            success: false,
            message: 'Cannot auto-detect scanner. Please specify scanner or use .yaml/.yml/.xml extension'
          });
        }
      }

      // OVERRIDE scanner based on file extension for consistent routing
      const targetScanner = settingsController._getTargetScannerByExtension(name);
      if (targetScanner) {
        console.log('🔄 Overriding scanner based on extension:', targetScanner);
        scanner = targetScanner;
      }

      // Get scanner config
      console.log('⚙️ Getting config for scanner:', scanner);
      const config = configService.getScannerConfig(scanner);
      if (!config) {
        console.log('❌ Scanner config not found:', scanner);
        return res.status(400).json({
          success: false,
          message: `Unknown scanner: ${scanner}`
        });
      }
      
      if (!config.rules) {
        console.log('❌ No rules directory configured for scanner:', scanner);
        return res.status(400).json({
          success: false,
          message: `No rules directory configured for scanner: ${scanner}`
        });
      }

      // Ensure rules directory exists
      const rulesDir = config.rules;
      console.log('📁 Rules directory:', rulesDir);
      fs.ensureDirSync(rulesDir);

      // Smart extension handling
      let fileName = name;
      const currentExt = path.extname(fileName).toLowerCase();
      
      // If no extension, add appropriate one based on scanner
      if (!currentExt) {
        fileName = settingsController._addExtensionForScanner(scanner, fileName);
        console.log('🏷️ Added extension:', fileName);
      }

      // Validate extension matches scanner requirements
      const validationResult = settingsController._validateExtensionForScanner(scanner, fileName);
      if (!validationResult.valid) {
        console.log('❌ Extension validation failed:', validationResult.message);
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

      // Create rule file path
      const rulePath = path.join(rulesDir, fileName);
      console.log('💾 Rule file path:', rulePath);
      
      // Check if file already exists
      if (fs.existsSync(rulePath)) {
        console.log('❌ File already exists:', rulePath);
        return res.status(400).json({
          success: false,
          message: 'Rule file already exists'
        });
      }
      
      // Write rule file
      await fs.writeFile(rulePath, content);
      
      // Log success with directory info
      const dirInfo = rulesDir.includes('semgrep') ? 'semgrep' : 'cppcheck-custom';
      console.log(`✅ Rule created successfully: ${fileName} -> ${dirInfo} directory`);
      
      // Safe logging
      if (logger && typeof logger.info === 'function') {
        logger.info(`Rule created successfully: ${fileName} -> ${dirInfo} directory`);
      }
      
      res.status(201).json({
        success: true,
        message: `Rule created successfully in ${dirInfo} directory`,
        data: {
          id: `${scanner}_${fileName}`,
          name: fileName,
          scanner,
          path: rulePath,
          directory: dirInfo
        }
      });
    } catch (error) {
      // FIXED: Safe error handling
      const errorInfo = {
        name: req.body?.name || 'unknown',
        scanner: req.body?.scanner || 'unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      };
      
      console.error('❌ Error creating scanner rule:', errorInfo);
      
      // Safe logging
      if (logger && typeof logger.error === 'function') {
        logger.error(`Error in createScannerRule controller: ${errorInfo.message}`);
      }
      
      res.status(500).json({
        success: false,
        message: 'Error creating scanner rule',
        debug: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
      });
    }
  },

  /**
   * Update scanner rule - UPDATED to use dynamic config
   */
  updateScannerRule: async (req, res) => {
    try {
      const ruleId = req.params.id;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }
      
      // Parse rule ID to get scanner and name
      const [scanner, ...nameParts] = ruleId.split('_');
      const name = nameParts.join('_');
      
      if (!scanner || !name) {
        return res.status(400).json({
          success: false,
          message: 'Invalid rule ID'
        });
      }
      
      // Use dynamic config
      const config = configService.getScannerConfig(scanner);
      if (!config) {
        return res.status(400).json({
          success: false,
          message: `Unknown scanner: ${scanner}`
        });
      }
      
      if (!config.rules) {
        return res.status(400).json({
          success: false,
          message: `No rules directory configured for scanner: ${scanner}`
        });
      }
      
      // Find rule file
      const rulesDir = config.rules;
      const rulePath = path.join(rulesDir, name);
      
      // Check if file exists
      if (!fs.existsSync(rulePath)) {
        return res.status(404).json({
          success: false,
          message: 'Rule file not found'
        });
      }
      
      // Update rule file
      await fs.writeFile(rulePath, content);
      
      res.status(200).json({
        success: true,
        message: 'Rule updated successfully',
        data: {
          id: ruleId,
          name,
          scanner,
          path: rulePath
        }
      });
    } catch (error) {
      logger.error(`Error in updateScannerRule controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error updating scanner rule'
      });
    }
  },

  /**
   * Delete scanner rule - UPDATED to use dynamic config
   */
  deleteScannerRule: async (req, res) => {
    try {
      const ruleId = req.params.id;
      
      // Parse rule ID to get scanner and name
      const [scanner, ...nameParts] = ruleId.split('_');
      const name = nameParts.join('_');
      
      if (!scanner || !name) {
        return res.status(400).json({
          success: false,
          message: 'Invalid rule ID'
        });
      }
      
      // Use dynamic config
      const config = configService.getScannerConfig(scanner);
      if (!config) {
        return res.status(400).json({
          success: false,
          message: `Unknown scanner: ${scanner}`
        });
      }
      
      if (!config.rules) {
        return res.status(400).json({
          success: false,
          message: `No rules directory configured for scanner: ${scanner}`
        });
      }
      
      // Find rule file
      const rulesDir = config.rules;
      const rulePath = path.join(rulesDir, name);
      
      // Check if file exists
      if (!fs.existsSync(rulePath)) {
        return res.status(404).json({
          success: false,
          message: 'Rule file not found'
        });
      }
      
      // Delete rule file
      await fs.unlink(rulePath);
      
      res.status(200).json({
        success: true,
        message: 'Rule deleted successfully'
      });
    } catch (error) {
      logger.error(`Error in deleteScannerRule controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error deleting scanner rule'
      });
    }
  },

  /**
   * Get scanner rule by ID - UPDATED to use dynamic config and support multiple extensions
   */
  getScannerRuleById: async (req, res) => {
    try {
      const ruleId = req.params.id;
      if (!ruleId || !ruleId.includes('_')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid rule ID' 
        });
      }
      
      const [scanner, ...fileParts] = ruleId.split('_');
      const fileName = fileParts.join('_');
      
      // Use dynamic config
      const config = configService.getScannerConfig(scanner);
      if (!config || !config.rules) {
        return res.status(404).json({ 
          success: false, 
          message: 'Scanner or rules directory not found' 
        });
      }
      
      // Find file with any supported extension
      const rulesDir = config.rules;
      let rulePath = path.join(rulesDir, fileName);
      
      // If no extension, try to find file with supported extensions
      if (!path.extname(fileName)) {
        const supportedExts = ['.yaml', '.yml', '.xml'];
        let found = false;
        
        for (const ext of supportedExts) {
          const testPath = path.join(rulesDir, fileName + ext);
          if (fs.existsSync(testPath)) {
            rulePath = testPath;
            found = true;
            break;
          }
        }
        
        if (!found) {
          return res.status(404).json({ 
            success: false, 
            message: 'Rule file not found' 
          });
        }
      } else {
        if (!fs.existsSync(rulePath)) {
          return res.status(404).json({ 
            success: false, 
            message: 'Rule file not found' 
          });
        }
      }
      
      const content = await fs.readFile(rulePath, 'utf8');
      
      res.status(200).json({
        success: true,
        data: {
          id: ruleId,
          scanner,
          name: path.basename(rulePath),
          path: rulePath,
          content
        }
      });
    } catch (error) {
      logger.error(`Error in getScannerRuleById controller: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching scanner rule' 
      });
    }
  },

  /**
   * Import scanner rule - UPDATED with smart routing
   */
  importScannerRule: async (req, res) => {
    try {
      let { scanner } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          success: false, 
          message: 'File is required' 
        });
      }

      // Auto-detect scanner if not provided
      if (!scanner) {
        scanner = settingsController._getTargetScannerByExtension(file.originalname);
        
        if (!scanner) {
          return res.status(400).json({
            success: false,
            message: 'Cannot auto-detect scanner. Use .yaml/.yml for semgrep or .xml for cppcheckCustom'
          });
        }
      }

      // Override scanner based on file extension for consistent routing
      const targetScanner = settingsController._getTargetScannerByExtension(file.originalname);
      if (targetScanner) {
        scanner = targetScanner;
      }

      // Get config for target scanner
      const config = configService.getScannerConfig(scanner);
      if (!config || !config.rules) {
        return res.status(400).json({ 
          success: false, 
          message: 'Scanner rules directory not configured' 
        });
      }
      
      const rulesDir = config.rules;
      await fs.ensureDir(rulesDir);
      
      // Validate file extension
      const validationResult = settingsController._validateExtensionForScanner(scanner, file.originalname);
      if (!validationResult.valid) {
        return res.status(400).json({ 
          success: false, 
          message: validationResult.message 
        });
      }
      
      // Generate unique filename
      let fileName = file.originalname;
      let rulePath = path.join(rulesDir, fileName);
      let count = 1;
      
      while (fs.existsSync(rulePath)) {
        const ext = path.extname(fileName);
        const base = path.basename(fileName, ext);
        fileName = `${base}_imported${count}${ext}`;
        rulePath = path.join(rulesDir, fileName);
        count++;
      }
      
      // Save file
      await fs.writeFile(rulePath, file.buffer);
      
      const dirInfo = rulesDir.includes('semgrep') ? 'semgrep' : 'cppcheck-custom';
      logger.info(`Rule imported successfully: ${fileName} -> ${dirInfo} directory`);
      
      res.status(201).json({
        success: true,
        message: `Rule imported successfully to ${dirInfo} directory`,
        data: {
          id: `${scanner}_${fileName}`,
          name: fileName,
          scanner,
          path: rulePath,
          directory: dirInfo
        }
      });
    } catch (error) {
      logger.error(`Error in importScannerRule controller: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: 'Error importing scanner rule' 
      });
    }
  },

  /**
   * Get current scanner paths for debugging
   */
  getCurrentScannerPaths: async (req, res) => {
    try {
      // Force reload to get latest config
      configService.forceReloadConfig();
      
      const scannerPaths = configService.getScannerPaths();
      const fullConfigs = configService.getConfig();
      
      res.status(200).json({
        success: true,
        data: {
          paths: scannerPaths,
          fullConfigs: fullConfigs,
          configFile: configService.configPath,
          lastModified: configService.lastLoadTime
        }
      });
    } catch (error) {
      logger.error(`Error in getCurrentScannerPaths controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching current scanner paths'
      });
    }
  },

  /**
   * Get system settings
   */
  getSystemSettings: async (req, res) => {
    try {
      const settings = {
        upload: {
          maxFileSize: appConfig.upload.maxFileSize,
          supportedFileTypes: appConfig.upload.supportedFileTypes
        },
        reports: {
          formats: appConfig.reports.formats
        },
        scans: {
          defaultScanType: appConfig.scans.defaultScanType
        },
        scanners: {
          maxThreads: require('../../config/scanners').maxScanThreads,
          defaultTimeout: require('../../config/scanners').defaultScanTimeout
        }
      };
      
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error(`Error in getSystemSettings controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching system settings'
      });
    }
  },

  /**
   * Update system settings
   */
  updateSystemSettings: async (req, res) => {
    try {
      const updates = req.body;
      
      const settings = {
        upload: {
          maxFileSize: updates.upload?.maxFileSize || appConfig.upload.maxFileSize,
          supportedFileTypes: updates.upload?.supportedFileTypes || appConfig.upload.supportedFileTypes
        },
        reports: {
          formats: updates.reports?.formats || appConfig.reports.formats
        },
        scans: {
          defaultScanType: updates.scans?.defaultScanType || appConfig.scans.defaultScanType
        },
        scanners: {
          maxThreads: updates.scanners?.maxThreads || require('../../config/scanners').maxScanThreads,
          defaultTimeout: updates.scanners?.defaultTimeout || require('../../config/scanners').defaultScanTimeout
        }
      };
      
      res.status(200).json({
        success: true,
        message: 'System settings updated successfully',
        data: settings
      });
    } catch (error) {
      logger.error(`Error in updateSystemSettings controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error updating system settings'
      });
    }
  },

  /**
   * Get user settings
   */
  getUserSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const settings = {
        notifications: {
          scanCompleted: true,
          criticalVulnerabilityFound: true,
          assignedVulnerability: true
        },
        display: {
          defaultScanType: 'all',
          defaultReportFormat: 'html',
          defaultVulnerabilitySort: 'severity'
        },
        ui: {
          theme: 'light',
          language: 'en'
        }
      };
      
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error(`Error in getUserSettings controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching user settings'
      });
    }
  },

  /**
   * Update user settings
   */
  updateUserSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      const defaultSettings = {
        notifications: {
          scanCompleted: true,
          criticalVulnerabilityFound: true,
          assignedVulnerability: true
        },
        display: {
          defaultScanType: 'all',
          defaultReportFormat: 'html',
          defaultVulnerabilitySort: 'severity'
        },
        ui: {
          theme: 'light',
          language: 'en'
        }
      };
      
      const settings = {
        notifications: {
          ...defaultSettings.notifications,
          ...updates.notifications
        },
        display: {
          ...defaultSettings.display,
          ...updates.display
        },
        ui: {
          ...defaultSettings.ui,
          ...updates.ui
        }
      };
      
      res.status(200).json({
        success: true,
        message: 'User settings updated successfully',
        data: settings
      });
    } catch (error) {
      logger.error(`Error in updateUserSettings controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error updating user settings'
      });
    }
  },

  // Helper methods for smart rule handling
  /**
   * Get target scanner based on file extension
   */
  _getTargetScannerByExtension: (fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    
    if (['.yaml', '.yml'].includes(ext)) {
      return 'semgrep';
    } else if (ext === '.xml') {
      return 'cppcheckCustom';
    }
    
    return null;
  },

  /**
   * Add appropriate extension based on scanner type
   */
  _addExtensionForScanner: (scanner, baseName) => {
    if (scanner === 'semgrep') {
      return `${baseName}.yaml`;
    } else if (scanner.includes('cppcheck') || scanner.includes('clang')) {
      return `${baseName}.xml`;
    } else {
      return `${baseName}.yaml`; // default
    }
  },

  /**
   * Validate file extension for scanner
   */
  _validateExtensionForScanner: (scanner, fileName) => {
    const ext = path.extname(fileName).toLowerCase();
    
    if (scanner === 'semgrep') {
      if (!['.yaml', '.yml'].includes(ext)) {
        return {
          valid: false,
          message: 'Semgrep rules must use .yaml or .yml extension and will be saved to semgrep directory'
        };
      }
    } else if (scanner.includes('cppcheck') || scanner.includes('clang')) {
      if (ext !== '.xml') {
        return {
          valid: false,
          message: `${scanner} rules must use .xml extension and will be saved to cppcheck-custom directory`
        };
      }
    }
    
    return { valid: true };
  }
};

module.exports = settingsController;