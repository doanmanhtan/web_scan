// src/api/controllers/settingsController.js
const fs = require('fs-extra');
const path = require('path');
const { logger } = require('../../utils/logger');
const { scannerConfig } = require('../../config/scanners');
const appConfig = require('../../config/app');

/**
 * Settings controller
 */
const settingsController = {
  /**
   * Get scanner paths
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getScannerPaths: async (req, res) => {
    try {
      const scannerPaths = {};
      
      for (const [scanner, config] of Object.entries(scannerConfig)) {
        scannerPaths[scanner] = config.path;
      }
      
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
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateScannerPaths: async (req, res) => {
    try {
      const updates = req.body;
      
      // Validate updates
      for (const [scanner, path] of Object.entries(updates)) {
        if (!scannerConfig[scanner]) {
          return res.status(400).json({
            success: false,
            message: `Unknown scanner: ${scanner}`
          });
        }
      }
      
      // In a real application, you would update the scanner paths in the database
      // and reload the configuration. For this example, we'll just return the updated paths.
      
      const updatedPaths = {};
      for (const [scanner, config] of Object.entries(scannerConfig)) {
        updatedPaths[scanner] = updates[scanner] || config.path;
      }
      
      res.status(200).json({
        success: true,
        message: 'Scanner paths updated successfully',
        data: updatedPaths
      });
    } catch (error) {
      logger.error(`Error in updateScannerPaths controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error updating scanner paths'
      });
    }
  },

  /**
   * Get scanner rules
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getScannerRules: async (req, res) => {
    try {
      const rules = [];
      
      // In a real application, you would fetch rules from the database
      // For this example, we'll just scan the rules directory
      
      // Get rules for each scanner
      for (const [scanner, config] of Object.entries(scannerConfig)) {
        if (config.rules && fs.existsSync(config.rules)) {
          const files = await fs.readdir(config.rules);
          
          for (const file of files) {
            if (file.endsWith('.yaml') || file.endsWith('.yml')) {
              rules.push({
                id: `${scanner}_${file}`,
                name: file,
                scanner,
                path: path.join(config.rules, file)
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
   * Create scanner rule
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createScannerRule: async (req, res) => {
    try {
      const { scanner, name, content } = req.body;
      
      if (!scanner || !name || !content) {
        return res.status(400).json({
          success: false,
          message: 'Scanner, name, and content are required'
        });
      }
      
      if (!scannerConfig[scanner]) {
        return res.status(400).json({
          success: false,
          message: `Unknown scanner: ${scanner}`
        });
      }
      
      if (!scannerConfig[scanner].rules) {
        return res.status(400).json({
          success: false,
          message: `No rules directory configured for scanner: ${scanner}`
        });
      }
      
      // Ensure rules directory exists
      const rulesDir = scannerConfig[scanner].rules;
      fs.ensureDirSync(rulesDir);
      
      // Create rule file
      const rulePath = path.join(rulesDir, name.endsWith('.yaml') ? name : `${name}.yaml`);
      
      // Check if file already exists
      if (fs.existsSync(rulePath)) {
        return res.status(400).json({
          success: false,
          message: 'Rule file already exists'
        });
      }
      
      // Write rule file
      await fs.writeFile(rulePath, content);
      
      res.status(201).json({
        success: true,
        message: 'Rule created successfully',
        data: {
          id: `${scanner}_${name}`,
          name,
          scanner,
          path: rulePath
        }
      });
    } catch (error) {
      logger.error(`Error in createScannerRule controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error creating scanner rule'
      });
    }
  },

  /**
   * Update scanner rule
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
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
      
      if (!scannerConfig[scanner]) {
        return res.status(400).json({
          success: false,
          message: `Unknown scanner: ${scanner}`
        });
      }
      
      if (!scannerConfig[scanner].rules) {
        return res.status(400).json({
          success: false,
          message: `No rules directory configured for scanner: ${scanner}`
        });
      }
      
      // Find rule file
      const rulesDir = scannerConfig[scanner].rules;
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
   * Delete scanner rule
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
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
      
      if (!scannerConfig[scanner]) {
        return res.status(400).json({
          success: false,
          message: `Unknown scanner: ${scanner}`
        });
      }
      
      if (!scannerConfig[scanner].rules) {
        return res.status(400).json({
          success: false,
          message: `No rules directory configured for scanner: ${scanner}`
        });
      }
      
      // Find rule file
      const rulesDir = scannerConfig[scanner].rules;
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
   * Get system settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSystemSettings: async (req, res) => {
    try {
      // In a real application, you would fetch these settings from the database
      // For this example, we'll just return the app config
      
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
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateSystemSettings: async (req, res) => {
    try {
      const updates = req.body;
      
      // In a real application, you would update these settings in the database
      // For this example, we'll just return the updated settings
      
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
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // In a real application, you would fetch user settings from the database
      // For this example, we'll just return some default settings
      
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
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateUserSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      // In a real application, you would update user settings in the database
      // For this example, we'll just return the updated settings
      
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
  }
};

module.exports = settingsController;