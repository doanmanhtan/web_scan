// // src/scanners/semgrepScanner.js
// const { exec } = require('child_process');
// const path = require('path');
// const fs = require('fs-extra');
// const logger = require('../utils/logger');
// const { scannerConfig } = require('../config/scanners');

// /**
//  * Semgrep scanner implementation
//  */
// class SemgrepScanner {
//   constructor() {
//     this.name = 'semgrep';
//     this.config = scannerConfig.semgrep;
//   }

//   /**
//    * Check if semgrep is installed and accessible
//    * @returns {Promise<Boolean>} True if installed, false otherwise
//    */
//   async checkInstallation() {
//     return new Promise((resolve) => {
//       exec(`${this.config.path} --version`, (error) => {
//         if (error) {
//           logger.error(`Semgrep installation check failed: ${error.message}`);
//           resolve(false);
//         } else {
//           resolve(true);
//         }
//       });
//     });
//   }

//   /**
//    * Scan a directory with semgrep
//    * @param {String} directory - Directory to scan
//    * @param {String} outputPath - Path to store scan results
//    * @param {Object} options - Scan options
//    * @returns {Promise<Object>} Scan results
//    */
//   scanDirectory(directory, outputPath, options = {}) {
//     return new Promise((resolve, reject) => {
//       // Ensure output directory exists
//       fs.ensureDirSync(path.dirname(outputPath));
      
//       // Prepare arguments
//       const args = [...this.config.defaultArgs];
      
//       // Add rule path if not provided in options
//       if (!options.rules && this.config.rules) {
//         args.push('--config', this.config.rules);
//       } else if (options.rules) {
//         args.push('--config', options.rules);
//       }
      
//       // Add output file
//       args.push('--json-output', outputPath);
      
//       // Add directory to scan
//       args.push(directory);
      
//       // Construct command
//       const command = `docker run --rm -v "${directory}:/src" -v "${this.config.rules}:/rules" returntocorp/semgrep semgrep --config "/rules" /src --json -o ${outputPath}`;
      
//       logger.info(`Running semgrep scan: ${command}`);
      
//       // Execute command
//       const child = exec(command, {
//         maxBuffer: 1024 * 1024 * 10, // 10MB buffer
//         timeout: this.config.timeoutMs
//       });
      
//       let stdout = '';
//       let stderr = '';
      
//       child.stdout.on('data', (data) => {
//         stdout += data;
//       });
      
//       child.stderr.on('data', (data) => {
//         stderr += data;
//       });
      
//       child.on('close', (code) => {
//         if (code !== 0) {
//           logger.error(`Semgrep scan failed with code ${code}: ${stderr}`);
//           reject(new Error(`Semgrep scan failed with code ${code}: ${stderr}`));
//           return;
//         }
        
//         try {
//           // Check if output file exists
//           if (fs.existsSync(outputPath)) {
//             // Read and parse results
//             const rawResults = fs.readFileSync(outputPath, 'utf8');
//             const results = JSON.parse(rawResults);
            
//             logger.info(`Semgrep scan completed successfully, found ${results.results ? results.results.length : 0} issues`);
//             resolve(this.formatResults(results, directory));
//           } else {
//             logger.error('Semgrep scan completed but no output file was generated');
//             reject(new Error('Semgrep scan completed but no output file was generated'));
//           }
//         } catch (error) {
//           logger.error(`Error processing Semgrep results: ${error.message}`);
//           reject(error);
//         }
//       });
      
//       child.on('error', (error) => {
//         console.error('Command error:', error);
//         console.error('Command output:', stderr);
//         logger.error(`Semgrep scan error: ${error.message}`);
//         reject(error);
//       });
//     });
//   }

//   /**
//    * Format semgrep results to standard format
//    * @param {Object} rawResults - Raw scan results
//    * @param {String} basePath - Base path for relative file paths
//    * @returns {Object} Formatted results
//    */
//   formatResults(rawResults, basePath) {
//     if (!rawResults.results || !Array.isArray(rawResults.results)) {
//       logger.warn('No valid results found in Semgrep output');
//       return {
//         scanner: this.name,
//         vulnerabilities: [],
//         summary: {
//           total: 0,
//           critical: 0,
//           high: 0,
//           medium: 0,
//           low: 0
//         }
//       };
//     }
    
//     // Initialize counters
//     const summary = {
//       total: 0,
//       critical: 0,
//       high: 0,
//       medium: 0,
//       low: 0
//     };
    
//     // Process results
//     const vulnerabilities = rawResults.results.map(result => {
//       // Map semgrep severity to our severity levels
//       let severity;
//       switch (result.extra.severity.toLowerCase()) {
//         case 'error':
//         case 'critical':
//           severity = 'critical';
//           summary.critical++;
//           break;
//         case 'warning':
//         case 'high':
//           severity = 'high';
//           summary.high++;
//           break;
//         case 'info':
//         case 'medium':
//           severity = 'medium';
//           summary.medium++;
//           break;
//         default:
//           severity = 'low';
//           summary.low++;
//       }
      
//       summary.total++;
      
//       // Determine vulnerability type
//       let type;
//       if (result.check_id.includes('security') || result.extra.metadata.cwe) {
//         type = 'Security';
//       } else if (result.check_id.includes('performance')) {
//         type = 'Performance';
//       } else if (result.check_id.includes('memory') || result.check_id.includes('leak')) {
//         type = 'Memory Safety';
//       } else if (result.check_id.includes('concurrency') || result.check_id.includes('race')) {
//         type = 'Concurrency';
//       } else {
//         type = 'Code Quality';
//       }
      
//       // Relative file path
//       const relativePath = path.relative(basePath, result.path);
      
//       return {
//         name: result.check_id.split('.').pop().replace(/-/g, ' '),
//         severity,
//         type,
//         tool: this.name,
//         file: {
//           fileName: path.basename(result.path),
//           filePath: relativePath,
//           fileExt: path.extname(result.path)
//         },
//         location: {
//           line: result.start.line,
//           column: result.start.col,
//           endLine: result.end.line,
//           endColumn: result.end.col
//         },
//         description: result.extra.message || 'No description provided',
//         codeSnippet: {
//           line: result.extra.lines || '',
//           before: [],
//           after: []
//         },
//         remediation: {
//           description: result.extra.metadata?.fix || 'No specific remediation provided'
//         },
//         references: result.extra.metadata?.references ? 
//           result.extra.metadata.references.map(ref => ({ title: ref, url: ref })) : 
//           [],
//         status: 'open'
//       };
//     });
    
//     return {
//       scanner: this.name,
//       vulnerabilities,
//       summary
//     };
//   }
// }

// module.exports = new SemgrepScanner();

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
      // Check if Docker is available first
      exec('docker --version', (dockerError) => {
        if (dockerError) {
          logger.error(`Docker not available: ${dockerError.message}`);
          resolve(false);
          return;
        }
        
        // Check if Semgrep Docker image is available
        exec('docker images returntocorp/semgrep', (semgrepError, stdout) => {
          if (semgrepError) {
            logger.error(`Semgrep Docker image check failed: ${semgrepError.message}`);
            resolve(false);
          } else {
            const hasImage = stdout.includes('returntocorp/semgrep');
            if (!hasImage) {
              logger.warn('Semgrep Docker image not found, will pull on first use');
            }
            resolve(true);
          }
        });
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
      
      // Convert all paths to absolute paths
      const absoluteDirectory = path.resolve(directory);
      const absoluteRulesPath = path.resolve(this.config.rules);
      const absoluteOutputPath = path.resolve(outputPath);
      
      // Get the output directory and filename separately
      const outputDir = path.dirname(absoluteOutputPath);
      const outputFileName = path.basename(absoluteOutputPath);
      
      // Validate that rules directory exists
      if (!fs.existsSync(absoluteRulesPath)) {
        logger.error(`Rules directory not found: ${absoluteRulesPath}`);
        const emptyResults = {
          results: [],
          errors: [`Rules directory not found: ${absoluteRulesPath}`]
        };
        resolve(this.formatResults(emptyResults, directory));
        return;
      }
      
      // Validate that source directory exists
      if (!fs.existsSync(absoluteDirectory)) {
        logger.error(`Source directory not found: ${absoluteDirectory}`);
        const emptyResults = {
          results: [],
          errors: [`Source directory not found: ${absoluteDirectory}`]
        };
        resolve(this.formatResults(emptyResults, directory));
        return;
      }
      
      // Construct Docker command with absolute paths
      const command = `docker run --rm \
        -v "${absoluteDirectory}:/src" \
        -v "${absoluteRulesPath}:/rules" \
        -v "${outputDir}:/output" \
        returntocorp/semgrep semgrep \
        --config "/rules" \
        /src \
        --json \
        --output "/output/${outputFileName}"`;
      
      logger.info(`Running semgrep scan: ${command}`);
      
      // Execute command
      const child = exec(command, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: this.config.timeoutMs,
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data;
        logger.debug(`Semgrep stdout: ${data}`);
      });
      
      child.stderr.on('data', (data) => {
        stderr += data;
        logger.debug(`Semgrep stderr: ${data}`);
      });
      
      child.on('close', (code) => {
        logger.info(`Semgrep process exited with code: ${code}`);
        
        if (code !== 0) {
          logger.error(`Semgrep scan failed with code ${code}: ${stderr}`);
          // Instead of rejecting, return empty results
          const emptyResults = {
            results: [],
            errors: [stderr || `Process exited with code ${code}`]
          };
          resolve(this.formatResults(emptyResults, directory));
          return;
        }
        
        try {
          // Check if output file exists
          if (fs.existsSync(absoluteOutputPath)) {
            // Read and parse results
            const rawResults = fs.readFileSync(absoluteOutputPath, 'utf8');
            let results;
            
            try {
              results = JSON.parse(rawResults);
            } catch (parseError) {
              logger.error(`Error parsing Semgrep JSON: ${parseError.message}`);
              logger.debug(`Raw output: ${rawResults}`);
              const emptyResults = {
                results: [],
                errors: [`JSON parse error: ${parseError.message}`]
              };
              resolve(this.formatResults(emptyResults, directory));
              return;
            }
            
            logger.info(`Semgrep scan completed successfully, found ${results.results ? results.results.length : 0} issues`);
            resolve(this.formatResults(results, directory));
          } else {
            logger.warn('Semgrep scan completed but no output file was generated');
            // Create empty results
            const emptyResults = {
              results: [],
              errors: ['No output file generated']
            };
            resolve(this.formatResults(emptyResults, directory));
          }
        } catch (error) {
          logger.error(`Error processing Semgrep results: ${error.message}`);
          // Return empty results instead of rejecting
          const emptyResults = {
            results: [],
            errors: [error.message]
          };
          resolve(this.formatResults(emptyResults, directory));
        }
      });
      
      child.on('error', (error) => {
        logger.error(`Semgrep scan error: ${error.message}`);
        // Return empty results instead of rejecting
        const emptyResults = {
          results: [],
          errors: [error.message]
        };
        resolve(this.formatResults(emptyResults, directory));
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
      // FIXED: Improved severity mapping for Semgrep
      let severity;
      const severityLevel = result.extra?.severity?.toLowerCase() || 'info';
      
      // Map Semgrep severity levels more accurately
      switch (severityLevel) {
        case 'error':
          severity = 'critical';
          summary.critical++;
          break;
        case 'warning':
          severity = 'high';
          summary.high++;
          break;
        case 'info':
          severity = 'medium';
          summary.medium++;
          break;
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
        case 'low':
          severity = 'low';
          summary.low++;
          break;
        default:
          // For unknown severities, check rule metadata or default to medium
          if (result.extra?.metadata?.severity) {
            const metaSeverity = result.extra.metadata.severity.toLowerCase();
            switch (metaSeverity) {
              case 'critical':
              case 'error':
                severity = 'critical';
                summary.critical++;
                break;
              case 'high':
              case 'warning':
                severity = 'high';
                summary.high++;
                break;
              case 'medium':
              case 'info':
                severity = 'medium';
                summary.medium++;
                break;
              case 'low':
                severity = 'low';
                summary.low++;
                break;
              default:
                severity = 'medium';
                summary.medium++;
            }
          } else {
            // Check rule ID for severity hints
            const ruleId = result.check_id || '';
            if (ruleId.includes('security') || ruleId.includes('cwe')) {
              severity = 'high';
              summary.high++;
            } else if (ruleId.includes('performance') || ruleId.includes('maintainability')) {
              severity = 'medium';
              summary.medium++;
            } else {
              severity = 'medium';
              summary.medium++;
            }
          }
      }
      
      summary.total++;
      
      // Determine vulnerability type
      let type;
      const ruleId = result.check_id || '';
      if (ruleId.includes('security') || (result.extra?.metadata?.cwe)) {
        type = 'Security';
      } else if (ruleId.includes('performance')) {
        type = 'Performance';
      } else if (ruleId.includes('memory') || ruleId.includes('leak')) {
        type = 'Memory Safety';
      } else if (ruleId.includes('concurrency') || ruleId.includes('race')) {
        type = 'Concurrency';
      } else {
        type = 'Code Quality';
      }
      
      // Convert Docker internal path back to relative path
      let filePath = result.path;
      if (filePath.startsWith('/src/')) {
        filePath = filePath.substring(5); // Remove '/src/' prefix
      }
      
      return {
        name: result.check_id.split('.').pop().replace(/-/g, ' '),
        severity,
        type,
        tool: this.name,
        file: {
          fileName: path.basename(filePath),
          filePath: filePath,
          fileExt: path.extname(filePath)
        },
        location: {
          line: result.start?.line || 1,
          column: result.start?.col || 1,
          endLine: result.end?.line,
          endColumn: result.end?.col
        },
        description: result.extra?.message || 'No description provided',
        codeSnippet: {
          line: result.extra?.lines || '',
          before: [],
          after: []
        },
        remediation: {
          description: result.extra?.metadata?.fix || 'No specific remediation provided'
        },
        references: result.extra?.metadata?.references ? 
          result.extra.metadata.references.map(ref => ({ title: ref, url: ref })) : 
          [],
        status: 'open'
      };
    });
    
    // Log summary for debugging
    console.log(`Semgrep Summary: Total=${summary.total}, Critical=${summary.critical}, High=${summary.high}, Medium=${summary.medium}, Low=${summary.low}`);
    
    return {
      scanner: this.name,
      vulnerabilities,
      summary
    };
  }
}

module.exports = new SemgrepScanner();