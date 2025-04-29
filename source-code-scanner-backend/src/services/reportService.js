// src/services/reportService.js
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const reportRepository = require('../db/repositories/reportRepository');
const scanRepository = require('../db/repositories/scanRepository');
const vulnerabilityRepository = require('../db/repositories/vulnerabilityRepository');
const appConfig = require('../config/app');

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
      // Validate scan ID
      const scan = await scanRepository.getScanById(reportData.scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${reportData.scanId}`);
      }
      
      if (scan.status !== 'completed') {
        throw new Error(`Scan not completed: ${reportData.scanId}`);
      }
      
      // Create report directory if it doesn't exist
      const reportsDir = appConfig.reports.directory;
      fs.ensureDirSync(reportsDir);
      
      // Generate unique report ID
      const reportId = uuidv4();
      const reportDir = path.join(reportsDir, reportId);
      fs.ensureDirSync(reportDir);
      
      // Generate report file
      const format = reportData.format || 'json';
      const reportFileName = `${scan.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().replace(/:/g, '-')}.${format}`;
      const reportFilePath = path.join(reportDir, reportFileName);
      
      // Get vulnerabilities
      const { vulnerabilities } = await vulnerabilityRepository.getVulnerabilitiesByScan(
        reportData.scanId, {}, 1000, 0
      );
      
      // Get vulnerability statistics
      const vulnerabilityStats = await vulnerabilityRepository.getVulnerabilityStatsByScan(reportData.scanId);
      
      // Generate report content
      const reportContent = await this.generateReportContent(
        scan,
        vulnerabilities,
        vulnerabilityStats,
        format,
        reportData.includeOptions || {}
      );
      
      // Write report to file
      await fs.writeFile(reportFilePath, reportContent);
      
      // Get file size
      const stats = await fs.stat(reportFilePath);
      
      // Create report record
      const report = await reportRepository.createReport({
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
      
      logger.info(`Report generated: ${reportId}`);
      
      return report;
    } catch (error) {
      logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate report content based on format
   * @param {Object} scan - Scan data
   * @param {Array} vulnerabilities - Vulnerabilities
   * @param {Object} vulnerabilityStats - Vulnerability statistics
   * @param {String} format - Report format
   * @param {Object} includeOptions - Options for what to include
   * @returns {String} Report content
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
      logger.error(`Error generating report content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate JSON report
   * @param {Object} scan - Scan data
   * @param {Array} vulnerabilities - Vulnerabilities
   * @param {Object} vulnerabilityStats - Vulnerability statistics
   * @param {Object} includeOptions - Options for what to include
   * @returns {String} JSON report content
   */
  generateJsonReport(scan, vulnerabilities, vulnerabilityStats, includeOptions) {
    const report = {
      scanInfo: {
        id: scan._id,
        scanId: scan.scanId,
        name: scan.name,
        status: scan.status,
        scanType: scan.scanType,
        tools: scan.tools,
        createdAt: scan.createdAt,
        startTime: scan.startTime,
        endTime: scan.endTime,
        duration: scan.duration,
        filesScanned: scan.filesScanned,
        linesOfCode: scan.linesOfCode,
        issuesCounts: scan.issuesCounts
      },
      summary: {
        totalVulnerabilities: vulnerabilityStats.totalVulnerabilities,
        bySeverity: vulnerabilityStats.bySeverity,
        byType: vulnerabilityStats.byType,
        byTool: vulnerabilityStats.byTool,
        byStatus: vulnerabilityStats.byStatus
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
   * Generate HTML report
   * @param {Object} scan - Scan data
   * @param {Array} vulnerabilities - Vulnerabilities
   * @param {Object} vulnerabilityStats - Vulnerability statistics
   * @param {Object} includeOptions - Options for what to include
   * @returns {String} HTML report content
   */
  generateHtmlReport(scan, vulnerabilities, vulnerabilityStats, includeOptions) {
    const issuesBySeverity = vulnerabilityStats.bySeverity || {};
    const issuesByType = vulnerabilityStats.byType || {};
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Source Code Scan Report - ${scan.name}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        h1, h2, h3 {
          color: #2c3e50;
        }
        .report-header {
          background-color: #2c3e50;
          color: white;
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .report-meta {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .meta-item {
          flex: 1;
          min-width: 200px;
          margin: 10px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
          border-left: 4px solid #2c3e50;
        }
        .summary-cards {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .severity-card {
          flex: 1;
          min-width: 150px;
          margin: 10px;
          padding: 15px;
          text-align: center;
          border-radius: 5px;
          color: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .critical { background-color: #d9534f; }
        .high { background-color: #f0ad4e; }
        .medium { background-color: #5bc0de; }
        .low { background-color: #5cb85c; }
        .vulnerability-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .vulnerability-table th, .vulnerability-table td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        .vulnerability-table th {
          background-color: #f2f2f2;
        }
        .vulnerability-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .vulnerability-table tr:hover {
          background-color: #f5f5f5;
        }
        .severity-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 3px;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }
        .code-block {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 3px;
          padding: 10px;
          font-family: monospace;
          white-space: pre-wrap;
          overflow-x: auto;
          margin: 10px 0;
        }
        .highlighted-line {
          background-color: #ffdddd;
          display: block;
        }
        .remediation {
          background-color: #e8f4f8;
          border-left: 4px solid #5bc0de;
          padding: 10px;
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          color: #777;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="report-header">
          <h1>Source Code Scan Report</h1>
          <h2>${scan.name}</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <h2>Scan Information</h2>
        <div class="report-meta">
          <div class="meta-item">
            <h3>Scan Details</h3>
            <p><strong>Scan ID:</strong> ${scan.scanId}</p>
            <p><strong>Scan Type:</strong> ${scan.scanType}</p>
            <p><strong>Status:</strong> ${scan.status}</p>
            <p><strong>Start Time:</strong> ${scan.startTime ? new Date(scan.startTime).toLocaleString() : 'N/A'}</p>
            <p><strong>End Time:</strong> ${scan.endTime ? new Date(scan.endTime).toLocaleString() : 'N/A'}</p>
            <p><strong>Duration:</strong> ${scan.duration ? this.formatDuration(scan.duration) : 'N/A'}</p>
          </div>
          <div class="meta-item">
            <h3>Scan Metrics</h3>
            <p><strong>Files Scanned:</strong> ${scan.filesScanned || 0}</p>
            <p><strong>Lines of Code:</strong> ${scan.linesOfCode ? scan.linesOfCode.toLocaleString() : 0}</p>
            <p><strong>Total Issues:</strong> ${vulnerabilityStats.totalVulnerabilities || 0}</p>
            <p><strong>Tools Used:</strong> ${scan.tools.join(', ')}</p>
          </div>
        </div>
        
        <h2>Summary</h2>
        <div class="summary-cards">
          <div class="severity-card critical">
            <h3>Critical</h3>
            <h2>${issuesBySeverity.critical || 0}</h2>
          </div>
          <div class="severity-card high">
            <h3>High</h3>
            <h2>${issuesBySeverity.high || 0}</h2>
          </div>
          <div class="severity-card medium">
            <h3>Medium</h3>
            <h2>${issuesBySeverity.medium || 0}</h2>
          </div>
          <div class="severity-card low">
            <h3>Low</h3>
            <h2>${issuesBySeverity.low || 0}</h2>
          </div>
        </div>
        
        <h3>Issues by Type</h3>
        <table class="vulnerability-table">
          <tr>
            <th>Type</th>
            <th>Count</th>
          </tr>
          ${Object.entries(issuesByType).map(([type, count]) => `
            <tr>
              <td>${type}</td>
              <td>${count}</td>
            </tr>
          `).join('')}
        </table>
    `;
    
    // Include vulnerabilities if details option is enabled
    if (includeOptions.details && vulnerabilities.length > 0) {
      html += `
        <h2>Vulnerabilities</h2>
        <table class="vulnerability-table">
          <tr>
            <th>Severity</th>
            <th>Name</th>
            <th>Type</th>
            <th>File</th>
            <th>Line</th>
            <th>Tool</th>
          </tr>
          ${vulnerabilities.map(v => `
            <tr>
              <td>
                <span class="severity-badge ${v.severity.toLowerCase()}">
                  ${v.severity.toUpperCase()}
                </span>
              </td>
              <td>${v.name}</td>
              <td>${v.type}</td>
              <td>${v.file.fileName}</td>
              <td>${v.location.line}</td>
              <td>${v.tool}</td>
            </tr>
          `).join('')}
        </table>
      `;
      
      // Include detailed vulnerability information
      if (includeOptions.code || includeOptions.remediation) {
        html += `<h2>Detailed Findings</h2>`;
        
        vulnerabilities.forEach(v => {
          html += `
            <div style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-left: 4px solid ${this.getSeverityColor(v.severity)};">
              <h3>${v.name}</h3>
              <p><strong>Severity:</strong> <span class="severity-badge ${v.severity.toLowerCase()}">${v.severity.toUpperCase()}</span></p>
              <p><strong>Type:</strong> ${v.type}</p>
              <p><strong>File:</strong> ${v.file.fileName}</p>
              <p><strong>Location:</strong> Line ${v.location.line}, Column ${v.location.column || 'N/A'}</p>
              <p><strong>Description:</strong> ${v.description}</p>
          `;
          
          // Include code snippet if requested
          if (includeOptions.code && v.codeSnippet && v.codeSnippet.line) {
            html += `
              <h4>Code Snippet</h4>
              <div class="code-block">
                <span class="highlighted-line">${this.escapeHtml(v.codeSnippet.line)}</span>
              </div>
            `;
          }
          
          // Include remediation if requested
          if (includeOptions.remediation && v.remediation && v.remediation.description) {
            html += `
              <h4>Remediation</h4>
              <div class="remediation">
                <p>${v.remediation.description}</p>
              </div>
            `;
          }
          
          html += `</div>`;
        });
      }
    }
    
    // Finish HTML
    html += `
        <div class="footer">
          <p>Report generated by Source Code Scanner on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    return html;
  }

  /**
   * Generate CSV report
   * @param {Object} scan - Scan data
   * @param {Array} vulnerabilities - Vulnerabilities
   * @param {Object} vulnerabilityStats - Vulnerability statistics
   * @param {Object} includeOptions - Options for what to include
   * @returns {String} CSV report content
   */
  generateCsvReport(scan, vulnerabilities, vulnerabilityStats, includeOptions) {
    // Create CSV header
    let csv = 'Severity,Name,Type,File,Line,Column,Tool,Description,Status\n';
    
    // Add vulnerabilities
    vulnerabilities.forEach(v => {
      // Escape any commas in fields
      const escapedName = `"${v.name.replace(/"/g, '""')}"`;
      const escapedDescription = `"${v.description.replace(/"/g, '""')}"`;
      const escapedFile = `"${v.file.fileName.replace(/"/g, '""')}"`;
      
      csv += `${v.severity},${escapedName},${v.type},${escapedFile},${v.location.line},${v.location.column || ''},${v.tool},${escapedDescription},${v.status}\n`;
    });
    
    return csv;
  }

  /**
   * Get report by ID
   * @param {String} reportId - Report ID
   * @returns {Object} Report
   */
  async getReportById(reportId) {
    try {
      return await reportRepository.getReportById(reportId);
    } catch (error) {
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
      return await reportRepository.getReportByUniqueId(uniqueReportId);
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
      return await reportRepository.getReportsByScan(scanId);
    } catch (error) {
      logger.error(`Error getting reports by scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all reports with optional filtering
   * @param {Object} filter - Filter criteria
   * @param {Number} limit - Maximum number of results
   * @param {Number} skip - Number of results to skip
   * @returns {Object} Reports with pagination
   */
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
      logger.error(`Error getting reports: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download report
   * @param {String} reportId - Report ID
   * @returns {Object} Report file information
   */
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
      logger.error(`Error downloading report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Share report
   * @param {String} reportId - Report ID
   * @param {Number} expiryDays - Number of days until link expires
   * @returns {Object} Share information
   */
  async shareReport(reportId, expiryDays = 7) {
    try {
      const report = await reportRepository.getReportById(reportId);
      
      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      
      // Generate share link
      const updatedReport = await reportRepository.generateShareLink(reportId, expiryDate);
      
      return {
        reportId: updatedReport._id,
        shareLink: updatedReport.shareLink,
        expiryDate: updatedReport.shareExpiry
      };
    } catch (error) {
      logger.error(`Error sharing report: ${error.message}`);
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
      const report = await reportRepository.getReportByShareLink(shareLink);
      
      if (!report) {
        throw new Error(`Report not found or link expired: ${shareLink}`);
      }
      
      return report;
    } catch (error) {
      logger.error(`Error getting report by share link: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete report
   * @param {String} reportId - Report ID
   * @returns {Boolean} Success status
   */
  async deleteReport(reportId) {
    try {
      const report = await reportRepository.getReportById(reportId);
      
      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      // Delete report file
      if (report.filePath && fs.existsSync(report.filePath)) {
        await fs.unlink(report.filePath);
      }
      
      // Delete report record
      await reportRepository.deleteReport(reportId);
      
      logger.info(`Report deleted: ${reportId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format duration in milliseconds to human readable string
   * @param {Number} ms - Duration in milliseconds
   * @returns {String} Formatted duration
   */
  formatDuration(ms) {
    if (!ms) return 'N/A';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const secondsRemainder = seconds % 60;
    const minutesRemainder = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutesRemainder.toString().padStart(2, '0')}:${secondsRemainder.toString().padStart(2, '0')}`;
  }

  /**
   * Get color for severity
   * @param {String} severity - Severity level
   * @returns {String} CSS color
   */
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

  /**
   * Escape HTML special characters
   * @param {String} html - HTML string
   * @returns {String} Escaped HTML
   */
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