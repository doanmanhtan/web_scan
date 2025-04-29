// src/api/middleware/validation.js
const { validationResult } = require('express-validator');
const { logger } = require('../../utils/logger');
const path = require('path');
const appConfig = require('../../config/app');

/**
 * Validate request body/params/query
 * Uses express-validator
 */
const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    next();
  };
};

/**
 * Validate uploaded files
 * @param {Array} allowedExtensions - List of allowed file extensions
 * @param {Number} maxFileSize - Maximum file size in bytes
 */
const validateFiles = (allowedExtensions = appConfig.upload.supportedFileTypes, maxFileSize = appConfig.upload.maxFileSize) => {
  return (req, res, next) => {
    try {
      // Check if files exist
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No files uploaded' 
        });
      }

      // Validate each file
      const invalidFiles = [];
      
      for (const file of req.files) {
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        // Check file extension
        if (!allowedExtensions.includes(fileExt)) {
          invalidFiles.push({
            fileName: file.originalname,
            error: `Unsupported file type: ${fileExt}. Allowed types: ${allowedExtensions.join(', ')}`
          });
          continue;
        }
        
        // Check file size
        if (file.size > maxFileSize) {
          invalidFiles.push({
            fileName: file.originalname,
            error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(2)}MB`
          });
          continue;
        }
      }
      
      if (invalidFiles.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid files detected', 
          invalidFiles 
        });
      }

      next();
    } catch (error) {
      logger.error(`File validation error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Error validating files' 
      });
    }
  };
};

module.exports = {
  validateRequest,
  validateFiles
};

