// // src/scanners/snykScanner.js
// const { exec } = require('child_process');
// const path = require('path');
// const fs = require('fs-extra');
// const { logger } = require('../utils/logger');
// const { scannerConfig } = require('../config/scanners');

// /**
//  * Snyk scanner implementation
//  */
// class SnykScanner {
//   constructor() {
//     this.name = 'snyk';
//     this.config = scannerConfig.snyk;
//   }

//   /**
//    * Get all files in a directory recursively
//    * @param {String} directory - Directory to scan
//    * @returns {Promise<String[]>} Array of file paths
//    */
//   async getFiles(directory) {
//     try {
//       const files = await fs.readdir(directory);
//       const fileList = [];
      
//       for (const file of files) {
//         const filePath = path.join(directory, file);
//         const stat = await fs.stat(filePath);
        
//         if (stat.isDirectory()) {
//           const subFiles = await this.getFiles(filePath);
//           fileList.push(...subFiles);
//         } else {
//           fileList.push(filePath);
//         }
//       }
      
//       return fileList;
//     } catch (error) {
//       logger.error(`Error getting files from directory ${directory}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Check if snyk is installed and accessible
//    * @returns {Promise<Boolean>} True if installed, false otherwise
//    */
//   async checkInstallation() {
//     return new Promise((resolve) => {
//       exec(`${this.config.path} --version`, (error) => {
//         if (error) {
//           logger.error(`Snyk installation check failed: ${error.message}`);
//           resolve(false);
//         } else {
//           resolve(true);
//         }
//       });
//     });
//   }

//   /**
//    * Scan a directory with snyk
//    * @param {String} directory - Directory to scan
//    * @param {String} outputPath - Path to store scan results
//    * @param {Object} options - Scan options
//    * @returns {Promise<Object>} Scan results
//    */
//   async scanDirectory(directory, outputPath, options = {}) {
//     try {
//       const files = await this.getFiles(directory);
//       const vulnerabilities = [];

//       for (const file of files) {
//         const filePath = path.join(directory, file);
//         console.log(`Scanning file with Snyk: ${filePath}`);

//         try {
//           // Sử dụng lệnh test trực tiếp với đường dẫn file
//           const command = `${this.config.path} test --file="${filePath}" --json --severity-threshold=low`;
//           console.log('Executing Snyk command:', command);

//           const { stdout, stderr } = await exec(command);
          
//           if (stderr) {
//             console.warn(`Snyk warning for ${file}:`, stderr);
//           }

//           if (stdout) {
//             try {
//               const result = JSON.parse(stdout);
//               if (result.vulnerabilities && result.vulnerabilities.length > 0) {
//                 vulnerabilities.push(...result.vulnerabilities.map(vuln => ({
//                   ...vuln,
//                   file: file,
//                   tool: 'snyk'
//                 })));
//               }
//             } catch (parseError) {
//               console.error(`Error parsing Snyk output for ${file}:`, parseError);
//             }
//           }
//         } catch (error) {
//           console.error(`Error scanning file ${file} with Snyk:`, error);
//           // Continue with next file
//         }
//       }

//       return vulnerabilities;
//     } catch (error) {
//       console.error('Error in Snyk scanDirectory:', error);
//       throw error;
//     }
//   }

//   /**
//    * Format snyk results to standard format
//    * @param {Object} rawResults - Raw scan results
//    * @param {String} basePath - Base path for relative file paths
//    * @returns {Object} Formatted results
//    */
//   formatResults(rawResults, basePath) {
//     if (!rawResults.vulnerabilities || !Array.isArray(rawResults.vulnerabilities)) {
//       logger.warn('No valid results found in Snyk output');
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
//     const vulnerabilities = rawResults.vulnerabilities.map(vuln => {
//       // Map snyk severity to our severity levels
//       let severity;
//       switch ((vuln.severity || '').toLowerCase()) {
//         case 'critical':
//           severity = 'critical';
//           summary.critical++;
//           break;
//         case 'high':
//           severity = 'high';
//           summary.high++;
//           break;
//         case 'medium':
//           severity = 'medium';
//           summary.medium++;
//           break;
//         default:
//           severity = 'low';
//           summary.low++;
//       }
      
//       summary.total++;
      
//       // Snyk sometimes provides relative paths, normalize them
//       // src/scanners/snykScanner.js (tiếp theo)
//       const filePath = path.isAbsolute(vuln.filePath) 
//         ? vuln.filePath 
//         : path.join(basePath, vuln.filePath);
      
//       const relativePath = path.relative(basePath, filePath);
      
//       return {
//         name: vuln.title || vuln.name || 'Unknown Vulnerability',
//         severity,
//         type: 'Security', // Snyk primarily focuses on security
//         tool: this.name,
//         file: {
//           fileName: path.basename(filePath),
//           filePath: relativePath,
//           fileExt: path.extname(filePath)
//         },
//         location: {
//           line: vuln.line || 1,
//           column: vuln.column || 1,
//           endLine: vuln.endLine,
//           endColumn: vuln.endColumn
//         },
//         description: vuln.description || 'No description provided',
//         codeSnippet: {
//           line: vuln.code || '',
//           before: [],
//           after: []
//         },
//         remediation: {
//           description: vuln.fix || vuln.remediation || 'No specific remediation provided'
//         },
//         references: (vuln.references || []).map(ref => ({ 
//           title: ref.title || ref, 
//           url: ref.url || ref 
//         })),
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

// module.exports = new SnykScanner();

// src/scanners/snykScanner.js
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger'); // Sửa import logger
const { scannerConfig } = require('../config/scanners');

const execAsync = promisify(exec);

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
          console.error(`Snyk installation check failed: ${error.message}`);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Get all files in a directory recursively
   * @param {String} directory - Directory to scan
   * @returns {Promise<String[]>} Array of file paths
   */
  async getFiles(directory) {
    try {
      const files = await fs.readdir(directory);
      const fileList = [];
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          const subFiles = await this.getFiles(filePath);
          fileList.push(...subFiles);
        } else {
          fileList.push(filePath);
        }
      }
      
      return fileList;
    } catch (error) {
      console.error(`Error getting files from directory ${directory}:`, error);
      return [];
    }
  }

  /**
   * Scan a directory with snyk
   * @param {String} directory - Directory to scan
   * @param {String} outputPath - Path to store scan results
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Scan results
   */
  async scanDirectory(directory, outputPath, options = {}) {
    console.log('Starting Snyk scan for directory:', directory);
    
    try {
      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Get all files in directory
      const allFiles = await this.getFiles(directory);
      
      // Filter for supported file types
      const supportedExtensions = ['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go'];
      const supportedFiles = allFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return supportedExtensions.includes(ext);
      });
      
      console.log('Supported files to scan:', supportedFiles.length);
      
      if (supportedFiles.length === 0) {
        console.log('No supported files found in directory');
        return this.getEmptyResults();
      }

      // Scan each file individually
      const vulnerabilities = [];
      
      for (const filePath of supportedFiles) {
        try {
          console.log(`Scanning file with Snyk: ${filePath}`);
          
          // Use 'snyk code test' for source code analysis
          const command = `${this.config.path} code test "${filePath}" --json --severity-threshold=low`;
          console.log('Executing Snyk command:', command);
          
          const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 1024 * 1024 * 10,
            timeout: this.config.timeoutMs
          });
          
          if (stderr) {
            console.warn(`Snyk warning for ${filePath}:`, stderr);
          }
          
          if (stdout && stdout.trim()) {
            try {
              const result = JSON.parse(stdout);
              console.log('Parsed Snyk results for', filePath, ':', result);
              
              // Extract vulnerabilities if they exist
              if (result.vulnerabilities && Array.isArray(result.vulnerabilities)) {
                vulnerabilities.push(...result.vulnerabilities);
              }
              
            } catch (parseError) {
              console.error(`Error parsing Snyk output for ${filePath}:`, parseError.message);
            }
          } else {
            console.log(`No Snyk output for: ${filePath}`);
          }
          
        } catch (scanError) {
          // Snyk returns exit code 1 when vulnerabilities are found, which is normal
          if (scanError.code === 1 || scanError.code === 2) {
            try {
              if (scanError.stdout && scanError.stdout.trim()) {
                const result = JSON.parse(scanError.stdout);
                console.log('Parsed Snyk results (from error) for', filePath, ':', result);
                
                if (result.vulnerabilities && Array.isArray(result.vulnerabilities)) {
                  vulnerabilities.push(...result.vulnerabilities);
                }
              }
            } catch (parseError) {
              console.error(`Error parsing Snyk error output for ${filePath}:`, parseError.message);
            }
          } else {
            console.error(`Snyk scan failed for ${filePath}:`, scanError.message);
          }
        }
      }

      // Combine results
      const combinedResults = {
        vulnerabilities: vulnerabilities
      };

      console.log('Combined Snyk results:', combinedResults);

      // Write combined results to output file
      try {
        fs.writeFileSync(outputPath, JSON.stringify(combinedResults, null, 2));
      } catch (writeError) {
        console.error('Error writing Snyk results:', writeError.message);
      }
      
      console.log(`Snyk scan completed successfully, found ${vulnerabilities.length} issues`);
      return this.formatResults(combinedResults, directory);
      
    } catch (error) {
      console.error('Error in Snyk scan:', error.message);
      return this.getEmptyResults();
    }
  }

  /**
   * Get empty results structure
   * @returns {Object} Empty results
   */
  getEmptyResults() {
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

  /**
   * Format snyk results to standard format
   * @param {Object} rawResults - Raw scan results
   * @param {String} basePath - Base path for relative file paths
   * @returns {Object} Formatted results
   */
  formatResults(rawResults, basePath) {
    if (!rawResults.vulnerabilities || !Array.isArray(rawResults.vulnerabilities)) {
      console.warn('No valid results found in Snyk output');
      return this.getEmptyResults();
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
      
      // Handle file path
      const fileName = vuln.filePath || vuln.file || 'unknown';
      const filePath = path.isAbsolute(fileName) 
        ? fileName 
        : path.join(basePath, fileName);
      
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
        description: vuln.description || vuln.message || 'No description provided',
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