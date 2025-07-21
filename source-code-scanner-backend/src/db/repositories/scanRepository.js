// src/db/repositories/scanRepository.js - FIXED VERSION
const Scan = require('../models/scanModel');
const logger = require('../../utils/logger');

class ScanRepository {
  /**
   * Create a new scan - FIXED
   * @param {Object} scanData - Scan data
   * @returns {Object} Created scan
   */
  async createScan(scanData) {
    try {
      const scan = new Scan(scanData);
      await scan.save();
      return scan;
    } catch (error) {
      // FIXED: Đơn giản hóa error handling
      logger.error(`Error creating scan: ${error.message}`);
      throw error; // Throw lại error gốc thay vì truy cập .error
    }
  }

  /**
   * Get scan by ID
   * @param {String} scanId - Scan ID
   * @returns {Object} Scan
   */
  async getScanById(scanId) {
    try {
      const scan = await Scan.findById(scanId);
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      return scan;
    } catch (error) {
      console.error('Error in getScanById:', error);
      throw error;
    }
  }

  /**
   * Get scan by scan ID (the unique identifier, not MongoDB _id)
   * @param {String} uniqueScanId - Unique scan ID
   * @returns {Object} Scan
   */
  async getScanByUniqueId(uniqueScanId) {
    try {
      return await Scan.findOne({ scanId: uniqueScanId });
    } catch (error) {
      logger.error(`Error getting scan by unique ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update scan
   * @param {String} scanId - Scan ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated scan
   */
  async updateScan(scanId, updateData) {
    try {
      const scan = await Scan.findByIdAndUpdate(
        scanId,
        { $set: updateData },
        { new: true }
      );
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      return scan;
    } catch (error) {
      console.error('Error in updateScan:', error);
      throw error;
    }
  }

  /**
   * Update scan status and progress
   * @param {String} scanId - Scan ID
   * @param {String} status - New status
   * @param {Number} progress - New progress percentage
   * @returns {Object} Updated scan
   */
  async updateScanProgress(scanId, status, progress) {
    try {
      return await Scan.findByIdAndUpdate(
        scanId,
        { 
          status, 
          progress,
          ...(status === 'completed' && { endTime: new Date() })
        },
        { new: true }
      );
    } catch (error) {
      logger.error(`Error updating scan progress: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark scan as completed
   * @param {String} scanId - Scan ID
   * @param {Object} results - Scan results
   * @returns {Object} Updated scan
   */
  async completeScan(scanId, results) {
    try {
      const endTime = new Date();
      const scan = await Scan.findById(scanId);
      
      // Calculate duration
      const duration = scan.startTime ? endTime - scan.startTime : null;
      
      return await Scan.findByIdAndUpdate(
        scanId,
        {
          status: 'completed',
          progress: 100,
          endTime,
          duration,
          filesScanned: results.filesScanned || 0,
          linesOfCode: results.linesOfCode || 0,
          issuesCounts: results.issuesCounts || {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            total: 0
          }
        },
        { new: true }
      );
    } catch (error) {
      logger.error(`Error completing scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark scan as failed - FIXED
   * @param {String} scanId - Scan ID
   * @param {Error} error - Error that caused the failure
   * @returns {Object} Updated scan
   */
  async failScan(scanId, error) {
    try {
      // FIXED: Safe error handling
      const errorData = {
        message: error && error.message ? error.message : 'Unknown error',
        stack: error && error.stack ? error.stack : ''
      };

      return await Scan.findByIdAndUpdate(
        scanId,
        {
          status: 'failed',
          endTime: new Date(),
          error: errorData
        },
        { new: true }
      );
    } catch (dbError) {
      logger.error(`Error marking scan as failed: ${dbError.message || 'Unknown error'}`);
      throw dbError;
    }
  }

  /**
   * Delete scan
   * @param {String} scanId - Scan ID
   * @returns {Object} Deleted scan
   */
  async deleteScan(scanId) {
    try {
      return await Scan.findByIdAndDelete(scanId);
    } catch (error) {
      logger.error(`Error deleting scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all scans with optional filtering
   * @param {Object} filter - Filter criteria
   * @param {Number} limit - Maximum number of results
   * @param {Number} skip - Number of results to skip
   * @returns {Array} List of scans
   */
  async getScans(filter = {}, limit = 100, skip = 0) {
    try {
      return await Scan.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('createdBy', 'username firstName lastName');
    } catch (error) {
      logger.error(`Error getting scans: ${error.message}`);
      throw error;
    }
  }

  /**
   * Count scans with optional filtering
   * @param {Object} filter - Filter criteria
   * @returns {Number} Count of scans
   */
  async countScans(filter = {}) {
    try {
      return await Scan.countDocuments(filter);
    } catch (error) {
      logger.error(`Error counting scans: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get scan statistics
   * @param {Object} filter - Filter criteria
   * @returns {Object} Statistics
   */
  async getScanStats(filter = {}) {
    try {
      // Get total scans
      const totalScans = await Scan.countDocuments(filter);
      
      // Get scans by status
      const statusStats = await Scan.aggregate([
        { $match: filter },
        { $group: { 
          _id: '$status', 
          count: { $sum: 1 } 
        }}
      ]);
      
      // Get issue counts
      const issueStats = await Scan.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: {
          _id: null,
          criticalCount: { $sum: '$issuesCounts.critical' },
          highCount: { $sum: '$issuesCounts.high' },
          mediumCount: { $sum: '$issuesCounts.medium' },
          lowCount: { $sum: '$issuesCounts.low' },
          totalCount: { $sum: '$issuesCounts.total' },
          scansCount: { $sum: 1 }
        }}
      ]);
      
      // Transform status stats
      const statusCounts = {};
      statusStats.forEach(stat => {
        statusCounts[stat._id] = stat.count;
      });
      
      // Get issues per scan
      const issuesPerScan = issueStats.length > 0 && issueStats[0].scansCount > 0 
        ? (issueStats[0].totalCount / issueStats[0].scansCount).toFixed(2) 
        : 0;
      
      return {
        totalScans,
        statusCounts,
        issueStats: issueStats.length > 0 ? {
          critical: issueStats[0].criticalCount || 0,
          high: issueStats[0].highCount || 0,
          medium: issueStats[0].mediumCount || 0,
          low: issueStats[0].lowCount || 0,
          total: issueStats[0].totalCount || 0
        } : {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0
        },
        issuesPerScan
      };
    } catch (error) {
      logger.error(`Error getting scan statistics: ${error.message}`);
      throw error;
    }
  }

  async getScanIdsByUser(userId) {
    // Giả sử bạn dùng Mongoose
    const scans = await Scan.find({ createdBy: userId }, '_id');
    return scans.map(scan => scan._id);
  }
}

module.exports = new ScanRepository();