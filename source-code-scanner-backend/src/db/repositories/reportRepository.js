// src/db/repositories/reportRepository.js
const Report = require('../models/reportModel');
const { logger } = require('../../utils/logger');

class ReportRepository {
  /**
   * Create a new report
   * @param {Object} reportData - Report data
   * @returns {Object} Created report
   */
  async createReport(reportData) {
    try {
      const report = new Report(reportData);
      await report.save();
      return report;
    } catch (error) {
      logger.error(`Error creating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get report by ID
   * @param {String} reportId - Report ID
   * @returns {Object} Report
   */
  async getReportById(reportId) {
    try {
      return await Report.findById(reportId)
        .populate('scan')
        .populate('createdBy', 'username firstName lastName');
    } catch (error) {
      // src/db/repositories/reportRepository.js (tiếp)
      logger.error(`Error getting report by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get report by unique report ID
   * @param {String} uniqueReportId - Unique report ID
   * @returns {Object} Report
   */
  async getReportByUniqueId(uniqueReportId) {
    try {
      return await Report.findOne({ reportId: uniqueReportId })
        .populate('scan')
        .populate('createdBy', 'username firstName lastName');
    } catch (error) {
      logger.error(`Error getting report by unique ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reports by scan ID
   * @param {String} scanId - Scan ID
   * @returns {Array} Reports
   */
  async getReportsByScan(scanId) {
    try {
      return await Report.find({ scan: scanId })
        .populate('createdBy', 'username firstName lastName')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Error getting reports by scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update report
   * @param {String} reportId - Report ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated report
   */
  async updateReport(reportId, updateData) {
    try {
      return await Report.findByIdAndUpdate(
        reportId,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error(`Error updating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete report
   * @param {String} reportId - Report ID
   * @returns {Object} Deleted report
   */
  async deleteReport(reportId) {
    try {
      return await Report.findByIdAndDelete(reportId);
    } catch (error) {
      logger.error(`Error deleting report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate share link for report
   * @param {String} reportId - Report ID
   * @param {Date} expiryDate - Expiry date for share link
   * @returns {Object} Updated report
   */
  async generateShareLink(reportId, expiryDate) {
    try {
      const shareLink = `report-${reportId}-${Date.now().toString(36)}`;
      
      return await Report.findByIdAndUpdate(
        reportId,
        {
          shared: true,
          shareLink,
          shareExpiry: expiryDate
        },
        { new: true }
      );
    } catch (error) {
      logger.error(`Error generating share link: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get report by share link
   * @param {String} shareLink - Share link
   * @returns {Object} Report
   */
  async getReportByShareLink(shareLink) {
    try {
      const report = await Report.findOne({ 
        shareLink,
        shared: true,
        shareExpiry: { $gt: new Date() } // Only return if not expired
      }).populate('scan');
      
      return report;
    } catch (error) {
      logger.error(`Error getting report by share link: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all reports with optional filtering
   * @param {Object} filter - Filter criteria
   * @param {Number} limit - Maximum number of results
   * @param {Number} skip - Number of results to skip
   * @returns {Array} List of reports
   */
  async getReports(filter = {}, limit = 100, skip = 0) {
    try {
      return await Report.find(filter)
        .populate('scan')
        .populate('createdBy', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      logger.error(`Error getting reports: ${error.message}`);
      throw error;
    }
  }

  /**
   * Count reports with optional filtering
   * @param {Object} filter - Filter criteria
   * @returns {Number} Count of reports
   */
  async countReports(filter = {}) {
    try {
      return await Report.countDocuments(filter);
    } catch (error) {
      logger.error(`Error counting reports: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ReportRepository();