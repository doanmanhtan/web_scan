// src/scanners/snykScanner.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { logger } = require('../utils/logger');
const { scannerConfig } = require('../config/scanners');

/**
 * Snyk scanner implementation
 */
class SnykScanner {
  constructor() {
    this.name = 'snyk';
    this.config = scannerConfig.snyk;
  }

  /**
   * Check if snyk is installed and accessible
   * @returns {Promise<Boolean>} True if installed, false otherwise
   */
  async checkInstallation() {
    return new Promise((resolve) => {
      exec(`${this.config.path} --version`, (error) => {
        if (error) {
          logger.error(`Snyk installation check failed: ${error.message}`);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Scan a directory with snyk
   * @param {String} directory - Directory to scan
   * @param {String} outputPath - Path to store scan results
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Scan results
   */
  scanDirectory(directory, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Prepare arguments
      const args = [...this.config.defaultArgs];
      
      // Add output file - Snyk outputs to stdout, we'll redirect it
      
      // Construct command
      const command = `${this.config.path} ${args.join(' ')} "${directory}" > "${outputPath}"`;
      
      logger.info(`Running snyk scan: ${command}`);
      
      // Execute command
      const child = exec(command, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: this.config.timeoutMs
      });
      
      let stderr = '';
      
      child.stderr.on('data', (data) => {
        stderr += data;
      });
      
      child.on('close', (code) => {
        // Snyk can return non-zero exit codes when it finds vulnerabilities, but that's not an error
        if (code !== 0 && code !== 1) {
          logger.error(`Snyk scan failed with code ${code}: ${stderr}`);
          reject(new Error(`Snyk scan failed with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          // Check if output file exists
          if (fs.existsSync(outputPath)) {
            // Read and parse results
            const rawResults = fs.readFileSync(outputPath, 'utf8');
            const results = JSON.parse(rawResults);
            
            logger.info(`Snyk scan completed successfully, found ${results.vulnerabilities ? results.vulnerabilities.length : 0} issues`);
            resolve(this.formatResults(results, directory));
          } else {
            logger.error('Snyk scan completed but no output file was generated');
            reject(new Error('Snyk scan completed but no output file was generated'));
          }
        } catch (error) {
          logger.error(`Error processing Snyk results: ${error.message}`);
          reject(error);
        }
      });
      
      child.on('error', (error) => {
        logger.error(`Snyk scan error: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Format snyk results to standard format
   * @param {Object} rawResults - Raw scan results
   * @param {String} basePath - Base path for relative file paths
   * @returns {Object} Formatted results
   */
  formatResults(rawResults, basePath) {
    if (!rawResults.vulnerabilities || !Array.isArray(rawResults.vulnerabilities)) {
      logger.warn('No valid results found in Snyk output');
      return {
        scanner: this.name,
        vulnerabilities: [],
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };
    }
    
    // Initialize counters
    const summary = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    // Process results
    const vulnerabilities = rawResults.vulnerabilities.map(vuln => {
      // Map snyk severity to our severity levels
      let severity;
      switch ((vuln.severity || '').toLowerCase()) {
        case 'critical':
          severity = 'critical';
          summary.critical++;
          break;
        case 'high':
          severity = 'high';
          summary.high++;
          break;
        case 'medium':
          severity = 'medium';
          summary.medium++;
          break;
        default:
          severity = 'low';
          summary.low++;
      }
      
      summary.total++;
      
      // Snyk sometimes provides relative paths, normalize them
      // src/scanners/snykScanner.js (tiếp theo)
      const filePath = path.isAbsolute(vuln.filePath) 
        ? vuln.filePath 
        : path.join(basePath, vuln.filePath);
      
      const relativePath = path.relative(basePath, filePath);
      
      return {
        name: vuln.title || vuln.name || 'Unknown Vulnerability',
        severity,
        type: 'Security', // Snyk primarily focuses on security
        tool: this.name,
        file: {
          fileName: path.basename(filePath),
          filePath: relativePath,
          fileExt: path.extname(filePath)
        },
        location: {
          line: vuln.line || 1,
          column: vuln.column || 1,
          endLine: vuln.endLine,
          endColumn: vuln.endColumn
        },
        description: vuln.description || 'No description provided',
        codeSnippet: {
          line: vuln.code || '',
          before: [],
          after: []
        },
        remediation: {
          description: vuln.fix || vuln.remediation || 'No specific remediation provided'
        },
        references: (vuln.references || []).map(ref => ({ 
          title: ref.title || ref, 
          url: ref.url || ref 
        })),
        status: 'open'
      };
    });
    
    return {
      scanner: this.name,
      vulnerabilities,
      summary
    };
  }
}

module.exports = new SnykScanner();