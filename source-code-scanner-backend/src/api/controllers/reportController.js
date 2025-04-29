// src/api/controllers/reportController.js
const reportService = require('../../services/reportService');
const { logger } = require('../../utils/logger');
const path = require('path');
const fs = require('fs-extra');

/**
 * Report controller
 */
const reportController = {
  /**
   * Generate a new report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  generateReport: async (req, res) => {
    try {
      const reportData = req.body;
      const userId = req.user.id;
      
      const result = await reportService.generateReport(reportData, userId);
      
      res.status(201).json({
        success: true,
        message: 'Report generated successfully',
        data: result
      });
    } catch (error) {
      logger.error(`Error in generateReport controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('not completed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('format')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error generating report'
      });
    }
  },

  /**
   * Get report by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getReportById: async (req, res) => {
    try {
      const reportId = req.params.id;
      
      const report = await reportService.getReportById(reportId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error(`Error in getReportById controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching report'
      });
    }
  },

  /**
   * Get report by unique report ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getReportByUniqueId: async (req, res) => {
    try {
      const reportId = req.params.reportId;
      
      const report = await reportService.getReportByUniqueId(reportId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error(`Error in getReportByUniqueId controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching report'
      });
    }
  },

  /**
   * Get reports by scan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getReportsByScan: async (req, res) => {
    try {
      const scanId = req.params.scanId;
      
      const reports = await reportService.getReportsByScan(scanId);
      
      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      logger.error(`Error in getReportsByScan controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching reports'
      });
    }
  },

  /**
   * Get all reports with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllReports: async (req, res) => {
    try {
      const { 
        limit = 10, 
        skip = 0, 
        format,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build filter
      const filter = {};
      if (format) filter.format = format;
      
      // Add user filter if not admin
      if (req.user.role !== 'admin') {
        filter.createdBy = req.user.id;
      }
      
      const result = await reportService.getReports(
        filter,
        parseInt(limit),
        parseInt(skip)
      );
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Error in getAllReports controller: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: 'Error fetching reports'
      });
    }
  },

  /**
   * Download report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  downloadReport: async (req, res) => {
    try {
      const reportId = req.params.id;
      
      const fileInfo = await reportService.downloadReport(reportId);
      
      if (!fileInfo || !fs.existsSync(fileInfo.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Report file not found'
        });
      }
      
      // Set content type based on format
      let contentType;
      switch (fileInfo.format) {
        case 'json':
          contentType = 'application/json';
          break;
        case 'html':
          contentType = 'text/html';
          break;
        case 'csv':
          contentType = 'text/csv';
          break;
        default:
          contentType = 'application/octet-stream';
      }
      
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileInfo.fileName}"`,
        'Content-Length': fileInfo.fileSize
      });
      
      // Stream the file
      const fileStream = fs.createReadStream(fileInfo.filePath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error(`Error in downloadReport controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error downloading report'
      });
    }
  },

  /**
   * Share report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  shareReport: async (req, res) => {
    try {
      const reportId = req.params.id;
      const { expiryDays = 7 } = req.body;
      
      const result = await reportService.shareReport(reportId, expiryDays);
      
      res.status(200).json({
        success: true,
        message: 'Report shared successfully',
        data: result
      });
    } catch (error) {
      logger.error(`Error in shareReport controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error sharing report'
      });
    }
  },

  /**
   * Get report by share link
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getReportByShareLink: async (req, res) => {
    try {
      const shareLink = req.params.shareLink;
      
      const report = await reportService.getReportByShareLink(shareLink);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found or link expired'
        });
      }
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error(`Error in getReportByShareLink controller: ${error.message}`);
      
      if (error.message.includes('expired')) {
        return res.status(410).json({
          success: false,
          message: 'Report link expired'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error fetching report'
      });
    }
  },

  /**
   * Delete report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteReport: async (req, res) => {
    try {
      const reportId = req.params.id;
      
      await reportService.deleteReport(reportId);
      
      res.status(200).json({
        success: true,
        message: 'Report deleted successfully'
      });
    } catch (error) {
      logger.error(`Error in deleteReport controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error deleting report'
      });
    }
  }
};

module.exports = reportController;