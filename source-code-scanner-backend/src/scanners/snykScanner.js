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
      console.log('Starting Snyk scan for directory:', directory);
      
      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Get all files in directory
      const files = fs.readdirSync(directory);
      console.log('Files found in directory:', files);
      
      const cFiles = files.filter(file => file.endsWith('.c'));
      console.log('C files to scan:', cFiles);
      
      if (cFiles.length === 0) {
        console.log('No .c files found in directory');
        resolve({
          scanner: this.name,
          vulnerabilities: [],
          summary: {
            total: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
        });
        return;
      }

      // Scan each file individually
      const scanPromises = cFiles.map(file => {
        return new Promise((resolveFile, rejectFile) => {
          const filePath = path.join(directory, file);
          console.log('Scanning file:', filePath);
          
          // Thêm --severity-threshold=low để đảm bảo bắt được tất cả các lỗi
          const command = `${this.config.path} code test "${filePath}" --json --severity-threshold=low`;
          console.log('Running command:', command);
          
          exec(command, {
            maxBuffer: 1024 * 1024 * 10,
            timeout: this.config.timeoutMs
          }, (error, stdout, stderr) => {
            console.log('Command output:', stdout);
            console.log('Command error:', stderr);
            
            if (error) {
              console.log('Command error code:', error.code);
              // Snyk returns 1 when vulnerabilities are found, which is not an error
              if (error.code === 1) {
                try {
                  const results = JSON.parse(stdout);
                  console.log('Parsed results:', results);
                  resolveFile(results);
                } catch (parseError) {
                  console.error('Error parsing results:', parseError);
                  rejectFile(parseError);
                }
              } else {
                console.error('Snyk scan failed:', error);
                rejectFile(error);
              }
              return;
            }

            try {
              const results = JSON.parse(stdout);
              console.log('Parsed results:', results);
              resolveFile(results);
            } catch (parseError) {
              console.error('Error parsing results:', parseError);
              rejectFile(parseError);
            }
          });
        });
      });

      // Wait for all scans to complete
      Promise.all(scanPromises)
        .then(results => {
          console.log('All scans completed. Results:', results);
          
          // Combine results from all files
          const combinedResults = {
            vulnerabilities: results.reduce((acc, result) => {
              if (result.vulnerabilities) {
                return [...acc, ...result.vulnerabilities];
              }
              return acc;
            }, [])
          };

          console.log('Combined results:', combinedResults);

          // Write combined results to output file
          fs.writeFileSync(outputPath, JSON.stringify(combinedResults, null, 2));
          
          console.log(`Snyk scan completed successfully, found ${combinedResults.vulnerabilities.length} issues`);
          resolve(this.formatResults(combinedResults, directory));
        })
        .catch(error => {
          console.error('Error in Snyk scan:', error);
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