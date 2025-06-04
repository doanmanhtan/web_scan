const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Base scanner class that all scanner implementations should extend
 */
class BaseScanner {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  /**
   * Check if scanner is installed and accessible
   * @returns {Promise<boolean>} True if scanner is available
   */
  async checkInstallation() {
    throw new Error('checkInstallation() must be implemented by scanner');
  }

  /**
   * Scan directory with scanner
   * @param {string} directory - Directory to scan
   * @param {string} outputPath - Output file path
   * @returns {Promise<Object>} Scan results
   */
  async scanDirectory(directory, outputPath) {
    throw new Error('scanDirectory() must be implemented by scanner');
  }

  /**
   * Get source files in directory that are supported by this scanner
   * @param {string} directory - Directory to scan
   * @returns {string[]} Array of file paths
   */
  getSourceFiles(directory) {
    const supportedExtensions = this.config.supportedLanguages.map(lang => `.${lang}`);
    
    const files = [];
    const walkDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and .git directories
          if (entry.name === 'node_modules' || entry.name === '.git') {
            continue;
          }
          walkDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    walkDir(directory);
    return files;
  }

  /**
   * Create empty scan result
   * @returns {Object} Empty result object
   */
  createEmptyResult() {
    return {
      scanner: this.name,
      vulnerabilities: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      metadata: {
        scannedFiles: 0,
        totalFiles: 0,
        scanDuration: 0,
        tool: this.name,
        version: this.config.version
      }
    };
  }

  /**
   * Create vulnerability object
   * @param {string} filePath - Path to file with vulnerability
   * @param {number} lineNum - Line number of vulnerability
   * @param {string} severity - Severity level
   * @param {string} id - Vulnerability ID
   * @param {string} message - Vulnerability message
   * @param {string} baseDirectory - Base directory for relative paths
   * @returns {Object} Vulnerability object
   */
  createVulnerability(filePath, lineNum, severity, id, message, baseDirectory) {
    const relativePath = path.relative(baseDirectory, filePath);
    
    return {
      id,
      type: 'vulnerability',
      severity: this.normalizeSeverity(severity),
      location: {
        file: relativePath,
        line: parseInt(lineNum) || 0
      },
      message,
      tool: this.name,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Normalize severity level
   * @param {string} severity - Raw severity level
   * @returns {string} Normalized severity level
   */
  normalizeSeverity(severity) {
    const severityMap = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'info': 'info',
      'warning': 'low',
      'error': 'high',
      'note': 'info'
    };

    const normalized = severityMap[severity.toLowerCase()] || 'low';
    return normalized;
  }

  /**
   * Create summary of vulnerabilities
   * @param {Array} vulnerabilities - Array of vulnerability objects
   * @returns {Object} Summary object
   */
  createSummary(vulnerabilities) {
    const summary = {
      total: vulnerabilities.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    for (const vuln of vulnerabilities) {
      summary[vuln.severity]++;
    }

    return summary;
  }
}

module.exports = BaseScanner; 