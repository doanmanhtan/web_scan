// src/scanners/semgrepScanner.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');
const { scannerConfig } = require('../config/scanners');

/**
 * Semgrep scanner implementation
 */
class SemgrepScanner {
  constructor() {
    this.name = 'semgrep';
    this.config = scannerConfig.semgrep;
  }

  /**
   * Check if semgrep is installed and accessible
   * @returns {Promise<Boolean>} True if installed, false otherwise
   */
  async checkInstallation() {
    return new Promise((resolve) => {
      exec(`${this.config.path} --version`, (error) => {
        if (error) {
          logger.error(`Semgrep installation check failed: ${error.message}`);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Scan a directory with semgrep
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
      
      // Add rule path if not provided in options
      if (!options.rules && this.config.rules) {
        args.push('--config', this.config.rules);
      } else if (options.rules) {
        args.push('--config', options.rules);
      }
      
      // Add output file
      args.push('--json-output', outputPath);
      
      // Add directory to scan
      args.push(directory);
      
      // Construct command
      const command = `${this.config.path} ${args.join(' ')}`;
      
      logger.info(`Running semgrep scan: ${command}`);
      
      // Execute command
      const child = exec(command, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: this.config.timeoutMs
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data;
      });
      
      child.stderr.on('data', (data) => {
        stderr += data;
      });
      
      child.on('close', (code) => {
        if (code !== 0) {
          logger.error(`Semgrep scan failed with code ${code}: ${stderr}`);
          reject(new Error(`Semgrep scan failed with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          // Check if output file exists
          if (fs.existsSync(outputPath)) {
            // Read and parse results
            const rawResults = fs.readFileSync(outputPath, 'utf8');
            const results = JSON.parse(rawResults);
            
            logger.info(`Semgrep scan completed successfully, found ${results.results ? results.results.length : 0} issues`);
            resolve(this.formatResults(results, directory));
          } else {
            logger.error('Semgrep scan completed but no output file was generated');
            reject(new Error('Semgrep scan completed but no output file was generated'));
          }
        } catch (error) {
          logger.error(`Error processing Semgrep results: ${error.message}`);
          reject(error);
        }
      });
      
      child.on('error', (error) => {
        logger.error(`Semgrep scan error: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Format semgrep results to standard format
   * @param {Object} rawResults - Raw scan results
   * @param {String} basePath - Base path for relative file paths
   * @returns {Object} Formatted results
   */
  formatResults(rawResults, basePath) {
    if (!rawResults.results || !Array.isArray(rawResults.results)) {
      logger.warn('No valid results found in Semgrep output');
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
    const vulnerabilities = rawResults.results.map(result => {
      // Map semgrep severity to our severity levels
      let severity;
      switch (result.extra.severity.toLowerCase()) {
        case 'error':
        case 'critical':
          severity = 'critical';
          summary.critical++;
          break;
        case 'warning':
        case 'high':
          severity = 'high';
          summary.high++;
          break;
        case 'info':
        case 'medium':
          severity = 'medium';
          summary.medium++;
          break;
        default:
          severity = 'low';
          summary.low++;
      }
      
      summary.total++;
      
      // Determine vulnerability type
      let type;
      if (result.check_id.includes('security') || result.extra.metadata.cwe) {
        type = 'Security';
      } else if (result.check_id.includes('performance')) {
        type = 'Performance';
      } else if (result.check_id.includes('memory') || result.check_id.includes('leak')) {
        type = 'Memory Safety';
      } else if (result.check_id.includes('concurrency') || result.check_id.includes('race')) {
        type = 'Concurrency';
      } else {
        type = 'Code Quality';
      }
      
      // Relative file path
      const relativePath = path.relative(basePath, result.path);
      
      return {
        name: result.check_id.split('.').pop().replace(/-/g, ' '),
        severity,
        type,
        tool: this.name,
        file: {
          fileName: path.basename(result.path),
          filePath: relativePath,
          fileExt: path.extname(result.path)
        },
        location: {
          line: result.start.line,
          column: result.start.col,
          endLine: result.end.line,
          endColumn: result.end.col
        },
        description: result.extra.message || 'No description provided',
        codeSnippet: {
          line: result.extra.lines || '',
          before: [],
          after: []
        },
        remediation: {
          description: result.extra.metadata?.fix || 'No specific remediation provided'
        },
        references: result.extra.metadata?.references ? 
          result.extra.metadata.references.map(ref => ({ title: ref, url: ref })) : 
          [],
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

module.exports = new SemgrepScanner();