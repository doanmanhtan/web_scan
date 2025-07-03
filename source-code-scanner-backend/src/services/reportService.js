// src/services/reportService.js - FIXED VERSION
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const reportRepository = require('../db/repositories/reportRepository');
const scanRepository = require('../db/repositories/scanRepository');
const vulnerabilityRepository = require('../db/repositories/vulnerabilityRepository');
const appConfig = require('../config/app');

function getErrorMessage(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Service for managing reports
 */
class ReportService {
  /**
   * Generate a new report
   * @param {Object} reportData - Report data
   * @param {String} userId - User ID
   * @returns {Object} Created report
   */
  async generateReport(reportData, userId) {
    try {
      // Validate input parameters
      if (!reportData || !reportData.scanId) {
        throw new Error('Invalid report data: scanId is required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Validate scan ID
      let scan;
      try {
        scan = await scanRepository.getScanById(reportData.scanId);
      } catch (err) {
        logger.error(`Error fetching scan: ${getErrorMessage(err)}`);
        throw new Error(`Failed to fetch scan: ${getErrorMessage(err)}`);
      }
      
      if (!scan) {
        throw new Error(`Scan not found: ${reportData.scanId}`);
      }
      
      if (scan.status !== 'completed') {
        throw new Error(`Scan not completed: ${reportData.scanId}`);
      }
      
      // Create report directory if it doesn't exist
      const reportsDir = appConfig.reports.directory;
      if (!reportsDir) {
        throw new Error('Reports directory not configured');
      }
      
      fs.ensureDirSync(reportsDir);
      
      // Generate unique report ID
      const reportId = uuidv4();
      const reportDir = path.join(reportsDir, reportId);
      fs.ensureDirSync(reportDir);
      
      // Generate report file - FIXED TEMPLATE LITERAL
      const format = reportData.format || 'json';
      const reportFileName = `${scan.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().replace(/:/g, '-')}.${format}`;
      const reportFilePath = path.join(reportDir, reportFileName);
      
      // Get vulnerabilities
      let vulnerabilities = [];
      let vulnerabilityStats = {};
      try {
        const vulnResult = await vulnerabilityRepository.getVulnerabilitiesByScan(
          reportData.scanId, {}, 1000, 0
        );
        vulnerabilities = vulnResult?.vulnerabilities || [];
        
        const statsResult = await vulnerabilityRepository.getVulnerabilityStatsByScan(reportData.scanId);
        vulnerabilityStats = statsResult || {};
      } catch (err) {
        logger.error(`Error fetching vulnerabilities: ${getErrorMessage(err)}`);
        throw new Error(`Failed to fetch vulnerabilities: ${getErrorMessage(err)}`);
      }
      
      // Generate report content
      let reportContent;
      try {
        reportContent = await this.generateReportContent(
          scan,
          vulnerabilities,
          vulnerabilityStats,
          format,
          reportData.includeOptions || {}
        );
      } catch (err) {
        logger.error(`Error generating report content: ${getErrorMessage(err)}`);
        throw new Error(`Failed to generate report content: ${getErrorMessage(err)}`);
      }
      
      // Write report to file
      try {
        await fs.writeFile(reportFilePath, reportContent);
      } catch (err) {
        logger.error(`Error writing report file: ${getErrorMessage(err)}`);
        throw new Error(`Failed to write report file: ${getErrorMessage(err)}`);
      }
      
      // Get file size
      let stats;
      try {
        stats = await fs.stat(reportFilePath);
      } catch (err) {
        logger.error(`Error getting file stats: ${getErrorMessage(err)}`);
        throw new Error(`Failed to get file stats: ${getErrorMessage(err)}`);
      }
      
      // Create report record - FIXED TEMPLATE LITERAL
      let report;
      try {
        report = await reportRepository.createReport({
          reportId,
          scan: reportData.scanId,
          name: reportData.name || `Report for ${scan.name}`,
          format,
          filePath: reportFilePath,
          fileSize: stats.size,
          includeOptions: reportData.includeOptions || {
            details: true,
            code: true,
            charts: true,
            remediation: true
          },
          createdBy: userId
        });
      } catch (err) {
        logger.error(`Error creating report record: ${getErrorMessage(err)}`);
        throw new Error(`Failed to create report record: ${getErrorMessage(err)}`);
      }
      
      // logger.info(`Report generated: ${reportId}`);
      
      return report;
    } catch (error) {
      console.error('=== ERROR IN generateReport ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      throw error;
    }
  }

  /**
   * Generate report content based on format
   */
  async generateReportContent(scan, vulnerabilities, vulnerabilityStats, format, includeOptions) {
    try {
      switch (format.toLowerCase()) {
        case 'json':
          return this.generateJsonReport(scan, vulnerabilities, vulnerabilityStats, includeOptions);
        case 'html':
          return this.generateHtmlReport(scan, vulnerabilities, vulnerabilityStats, includeOptions);
        case 'csv':
          return this.generateCsvReport(scan, vulnerabilities, vulnerabilityStats, includeOptions);
        default:
          throw new Error(`Unsupported report format: ${format}`);
      }
    } catch (error) {
      logger.error(`Error generating report content: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(scan, vulnerabilities, vulnerabilityStats, includeOptions) {
    const report = {
      scanInfo: {
        id: scan?._id || '',
        scanId: scan?.scanId || '',
        name: scan?.name || 'Unnamed Scan',
        status: scan?.status || 'unknown',
        scanType: scan?.scanType || 'unknown',
        tools: scan?.tools || [],
        createdAt: scan?.createdAt || new Date(),
        startTime: scan?.startTime || null,
        endTime: scan?.endTime || null,
        duration: scan?.duration || 0,
        filesScanned: scan?.filesScanned || 0,
        linesOfCode: scan?.linesOfCode || 0,
        issuesCounts: scan?.issuesCounts || {}
      },
      summary: {
        totalVulnerabilities: vulnerabilityStats?.totalVulnerabilities || 0,
        bySeverity: vulnerabilityStats?.bySeverity || {},
        byType: vulnerabilityStats?.byType || {},
        byTool: vulnerabilityStats?.byTool || {},
        byStatus: vulnerabilityStats?.byStatus || {}
      }
    };
    
    // Include details if requested
    if (includeOptions.details) {
      report.vulnerabilities = vulnerabilities.map(v => ({
        id: v._id,
        name: v.name,
        severity: v.severity,
        type: v.type,
        tool: v.tool,
        file: v.file,
        location: v.location,
        description: v.description,
        status: v.status
      }));
      
      // Include code snippets if requested
      if (includeOptions.code) {
        report.vulnerabilities.forEach(v => {
          const vuln = vulnerabilities.find(vul => vul._id.toString() === v.id.toString());
          if (vuln && vuln.codeSnippet) {
            v.codeSnippet = vuln.codeSnippet;
          }
        });
      }
      
      // Include remediation if requested
      if (includeOptions.remediation) {
        report.vulnerabilities.forEach(v => {
          const vuln = vulnerabilities.find(vul => vul._id.toString() === v.id.toString());
          if (vuln && vuln.remediation) {
            v.remediation = vuln.remediation;
          }
        });
      }
    }
    
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate HTML report - SIMPLIFIED VERSION
   */
  generateHtmlReport(scan, vulnerabilities, vulnerabilityStats, includeOptions) {
    const issuesBySeverity = vulnerabilityStats?.bySeverity || {};
    const issuesByType = vulnerabilityStats?.byType || {};
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Source Code Scan Report - ${scan?.name || 'Unnamed Scan'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #2c3e50; color: white; padding: 20px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .card { flex: 1; padding: 15px; text-align: center; color: white; }
    .critical { background: #d9534f; }
    .high { background: #f0ad4e; }
    .medium { background: #5bc0de; }
    .low { background: #5cb85c; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
    th { background: #f2f2f2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Source Code Scan Report</h1>
      <h2>${scan?.name || 'Unnamed Scan'}</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
      <div class="card critical">
        <h3>Critical</h3>
        <h2>${issuesBySeverity.critical || 0}</h2>
      </div>
      <div class="card high">
        <h3>High</h3>
        <h2>${issuesBySeverity.high || 0}</h2>
      </div>
      <div class="card medium">
        <h3>Medium</h3>
        <h2>${issuesBySeverity.medium || 0}</h2>
      </div>
      <div class="card low">
        <h3>Low</h3>
        <h2>${issuesBySeverity.low || 0}</h2>
      </div>
    </div>
    
    <h3>Issues by Type</h3>
    <table>
      <tr><th>Type</th><th>Count</th></tr>
      ${Object.entries(issuesByType).map(([type, count]) => 
        `<tr><td>${type}</td><td>${count}</td></tr>`
      ).join('')}
    </table>
  </div>
</body>
</html>`;
    
    return html;
  }

  /**
   * Generate CSV report - FIXED VERSION
   */
  generateCsvReport(scan, vulnerabilities, vulnerabilityStats, includeOptions) {
    let csv = 'Severity,Name,Type,File,Line,Column,Tool,Description,Status\n';
    
    vulnerabilities.forEach(v => {
      const escapedName = `"${v.name.replace(/"/g, '""')}"`;
      const escapedDescription = `"${v.description.replace(/"/g, '""')}"`;
      const escapedFile = `"${v.file.fileName.replace(/"/g, '""')}"`;
      
      csv += `${v.severity},${escapedName},${v.type},${escapedFile},${v.location.line},${v.location.column || ''},${v.tool},${escapedDescription},${v.status}\n`;
    });
    
    return csv;
  }

  // REST OF METHODS UNCHANGED...
  async getReportById(reportId) {
    try {
      return await reportRepository.getReportById(reportId);
    } catch (error) {
      logger.error(`Error getting report by ID: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getReportByUniqueId(uniqueReportId) {
    try {
      return await reportRepository.getReportByUniqueId(uniqueReportId);
    } catch (error) {
      logger.error(`Error getting report by unique ID: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getReportsByScan(scanId) {
    try {
      return await reportRepository.getReportsByScan(scanId);
    } catch (error) {
      logger.error(`Error getting reports by scan: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getReports(filter = {}, limit = 10, skip = 0) {
    try {
      const reports = await reportRepository.getReports(filter, limit, skip);
      const total = await reportRepository.countReports(filter);
      
      return {
        reports,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + limit
        }
      };
    } catch (error) {
      logger.error(`Error getting reports: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async downloadReport(reportId) {
    try {
      const report = await reportRepository.getReportById(reportId);
      
      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      if (!report.filePath || !fs.existsSync(report.filePath)) {
        throw new Error(`Report file not found: ${report.filePath}`);
      }
      
      return {
        filePath: report.filePath,
        fileName: path.basename(report.filePath),
        fileSize: report.fileSize,
        format: report.format
      };
    } catch (error) {
      logger.error(`Error downloading report: ${getErrorMessage(error)}`);
      throw error;
    }
  }
  /**
 * Share report - FIXED VERSION
 * @param {String} reportId - Report ID
 * @param {Number} expiryDays - Number of days until link expires
 * @returns {Object} Share information
 */
async shareReport(reportId, expiryDays = 7) {
  try {
    console.log(`📤 Starting shareReport for ID: ${reportId}, expiryDays: ${expiryDays}`);
    
    const report = await reportRepository.getReportById(reportId);
    
    if (!report) {
      console.error(`❌ Report not found: ${reportId}`);
      throw new Error(`Report not found: ${reportId}`);
    }
    
    console.log(`✅ Found report: ${report.name}`);
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    console.log(`📅 Expiry date: ${expiryDate.toISOString()}`);
    
    // Generate share link
    const updatedReport = await reportRepository.generateShareLink(reportId, expiryDate);
    
    if (!updatedReport) {
      console.error('❌ Failed to generate share link');
      throw new Error('Failed to generate share link');
    }
    
    console.log(`✅ Share link generated: ${updatedReport.shareLink}`);
    
    return {
      reportId: updatedReport._id,
      shareLink: updatedReport.shareLink,
      expiryDate: updatedReport.shareExpiry
    };
    
  } catch (error) {
    console.error('💥 Error in shareReport service:', {
      reportId,
      error: error.message,
      stack: error.stack
    });
    
    logger.error(`Error sharing report: ${error.message}`);
    
    // FIXED: Don't access error.error - just throw the error
    throw error;
  }
}

  // async shareReport(reportId, expiryDays = 7) {
  //   try {
  //     if (!reportId) {
  //       throw new Error('Report ID is required');
  //     }

  //     const report = await reportRepository.getReportById(reportId);
      
  //     if (!report) {
  //       throw new Error(`Report not found: ${reportId}`);
  //     }
      
  //     const expiryDate = new Date();
  //     expiryDate.setDate(expiryDate.getDate() + expiryDays);
      
  //     const updatedReport = await reportRepository.generateShareLink(reportId, expiryDate);
      
  //     if (!updatedReport) {
  //       throw new Error('Failed to generate share link');
  //     }
      
  //     return {
  //       reportId: updatedReport._id,
  //       shareLink: updatedReport.shareLink,
  //       expiryDate: updatedReport.shareExpiry
  //     };
  //   } catch (error) {
  //     const errorMessage = getErrorMessage(error);
  //     logger.error(`Error sharing report: ${errorMessage}`);
  //     throw new Error(errorMessage);
  //   }
  // }

  async getReportByShareLink(shareLink) {
    try {
      const report = await reportRepository.getReportByShareLink(shareLink);
      
      if (!report) {
        throw new Error(`Report not found or link expired: ${shareLink}`);
      }
      
      return report;
    } catch (error) {
      logger.error(`Error getting report by share link: ${getErrorMessage(error)}`);
      throw error;
    }
  }
// /**
//  * Delete report - SIMPLE VERSION
//  * @param {String} reportId - Report ID
//  * @returns {Boolean} Success status
//  */
// async deleteReport(reportId) {
//   try {
//     console.log(`🔍 Finding report ${reportId}`);
//     const report = await reportRepository.getReportById(reportId);
    
//     if (!report) {
//       throw new Error(`Report not found: ${reportId}`);
//     }
    
//     console.log(`✅ Found report: ${report.name}`);
    
//     // Delete file if exists
//     if (report.filePath && fs.existsSync(report.filePath)) {
//       console.log(`🗑️ Deleting file: ${report.filePath}`);
//       await fs.unlink(report.filePath);
//     }
    
//     // Delete from database
//     console.log(`🗑️ Deleting from database`);
//     await reportRepository.deleteReport(reportId);
    
//     console.log(`✅ Report deleted successfully`);
//     logger.info(`Report deleted: ${reportId}`);
    
//     return true;
    
//   } catch (error) {
//     console.error(`💥 Delete error:`, error.message); // ← Chỉ dùng .message
//     // logger.error(`Error deleting report: ${error.message}`); // ← Chỉ dùng .message
//     throw error;
//   }
// }

/**
 * Delete report and all vulnerabilities of the scan
 * @param {String} reportId - Report ID
 * @returns {Object} Deletion summary
 */
async deleteReport(reportId) {
  try {
    console.log(`🔍 Finding report ${reportId}`);
    const report = await reportRepository.getReportById(reportId);
    
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }
    
    console.log(`✅ Found report: ${report.name} for scan: ${report.scan}`);
    
    const deletionSummary = {
      reportId,
      reportName: report.name,
      scanId: report.scan,
      deletedVulnerabilities: 0,
      deletedFiles: 0,
      errors: []
    };
    
    // ===== DELETE ALL VULNERABILITIES FOR THIS SCAN =====
    try {
      console.log(`🗑️ Deleting ALL vulnerabilities for scan: ${report.scan}`);
      const vulnDeleteResult = await vulnerabilityRepository.deleteVulnerabilitiesByScan(report.scan);
      deletionSummary.deletedVulnerabilities = vulnDeleteResult.deletedCount || 0;
      console.log(`✅ Deleted ${deletionSummary.deletedVulnerabilities} vulnerabilities`);
    } catch (vulnError) {
      console.error(`❌ Error deleting vulnerabilities: ${vulnError.message}`);
      deletionSummary.errors.push(`Vulnerabilities: ${vulnError.message}`);
      // Continue with report deletion even if vulnerability deletion fails
    }
    
    // ===== DELETE REPORT FILE =====
    try {
      if (report.filePath && fs.existsSync(report.filePath)) {
        console.log(`🗑️ Deleting report file: ${report.filePath}`);
        await fs.unlink(report.filePath);
        deletionSummary.deletedFiles = 1;
        console.log(`✅ Report file deleted`);
      } else {
        console.log(`ℹ️ No report file to delete`);
      }
    } catch (fileError) {
      console.error(`❌ Error deleting report file: ${fileError.message}`);
      deletionSummary.errors.push(`Report file: ${fileError.message}`);
    }
    
    // ===== DELETE REPORT RECORD =====
    try {
      console.log(`🗑️ Deleting report record from database`);
      const deletedReport = await reportRepository.deleteReport(reportId);
      
      if (!deletedReport) {
        throw new Error('Failed to delete report from database');
      }
      
      console.log(`✅ Report record deleted successfully`);
    } catch (dbError) {
      console.error(`❌ Error deleting report record: ${dbError.message}`);
      deletionSummary.errors.push(`Report record: ${dbError.message}`);
      throw dbError; // This is critical, so throw
    }
    
    // ===== LOG COMPLETION =====
    const hasErrors = deletionSummary.errors.length > 0;
    logger.info(`Report deleted with vulnerabilities: ${reportId}`, deletionSummary);
    
    console.log(`✅ Report deletion completed:`, deletionSummary);
    
    return {
      success: true,
      message: hasErrors 
        ? 'Report deleted with some warnings' 
        : 'Report and all related vulnerabilities deleted successfully',
      data: deletionSummary,
      warnings: hasErrors ? deletionSummary.errors : undefined
    };
    
  } catch (error) {
    console.error(`💥 Error in deleteReport service:`, {
      reportId,
      error: error.message,
      stack: error.stack
    });
    
    logger.error(`Error deleting report: ${error.message}`);
    throw error;
  }
}
  getSeverityColor(severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#d9534f';
      case 'high':
        return '#f0ad4e';
      case 'medium':
        return '#5bc0de';
      case 'low':
        return '#5cb85c';
      default:
        return '#777777';
    }
  }

  escapeHtml(html) {
    if (!html) return '';
    
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = new ReportService();