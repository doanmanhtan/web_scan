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

// // src/scanners/snykScanner.js - Fixed version
// const { exec } = require('child_process');
// const { promisify } = require('util');
// const path = require('path');
// const fs = require('fs-extra');
// const logger = require('../utils/logger');
// const { scannerConfig } = require('../config/scanners');

// const execAsync = promisify(exec);

// /**
//  * Snyk scanner implementation - Fixed version
//  */
// class SnykScanner {
//   constructor() {
//     this.name = 'snyk';
//     this.config = scannerConfig.snyk;
//   }

//   /**
//    * Check if snyk is installed and accessible
//    */
//   async checkInstallation() {
//     try {
//       const { stdout } = await execAsync(`${this.config.path} --version`, { timeout: 10000 });
//       console.log('Snyk version:', stdout.trim());
//       return true;
//     } catch (error) {
//       console.error(`Snyk installation check failed: ${error.message}`);
//       return false;
//     }
//   }

//   /**
//    * Scan a directory with snyk - Fixed version
//    */
//   async scanDirectory(directory, outputPath, options = {}) {
//     console.log('=== Starting Fixed Snyk Scan ===');
//     console.log('Directory:', directory);
//     console.log('Output path:', outputPath);
    
//     try {
//       // Ensure output directory exists
//       fs.ensureDirSync(path.dirname(outputPath));
      
//       // Check if directory exists
//       if (!fs.existsSync(directory)) {
//         console.error(`Directory not found: ${directory}`);
//         return this.getEmptyResults();
//       }

//       // Get all files in directory
//       const allFiles = await this.getAllFiles(directory);
      
//       // Filter for supported file types
//       const supportedExtensions = ['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go'];
//       const supportedFiles = allFiles.filter(file => {
//         const ext = path.extname(file).toLowerCase();
//         return supportedExtensions.includes(ext);
//       });
      
//       console.log(`Found ${supportedFiles.length} supported files to scan`);
      
//       if (supportedFiles.length === 0) {
//         console.log('No supported files found in directory');
//         return this.getEmptyResults();
//       }

//       // Try different Snyk scanning approaches
//       const vulnerabilities = [];
      
//       // Approach 1: Snyk Code for source code analysis
//       console.log('Running Snyk Code scan...');
//       const codeResults = await this.scanWithSnykCode(directory);
//       vulnerabilities.push(...codeResults);
      
//       // Approach 2: Snyk test for dependencies (if package files exist)
//       const hasPackageFiles = allFiles.some(file => 
//         ['package.json', 'requirements.txt', 'pom.xml', 'Gemfile', 'go.mod'].includes(path.basename(file))
//       );
      
//       if (hasPackageFiles) {
//         console.log('Found package files, running dependency scan...');
//         const depResults = await this.scanWithSnykTest(directory);
//         vulnerabilities.push(...depResults);
//       }
      
//       // Combine and deduplicate results
//       const uniqueVulnerabilities = this.deduplicateVulnerabilities(vulnerabilities);
      
//       const combinedResults = {
//         vulnerabilities: uniqueVulnerabilities
//       };

//       // Write results to output file
//       try {
//         fs.writeFileSync(outputPath, JSON.stringify(combinedResults, null, 2));
//         console.log(`Results written to: ${outputPath}`);
//       } catch (writeError) {
//         console.error('Error writing Snyk results:', writeError.message);
//       }
      
//       console.log(`Snyk scan completed successfully, found ${uniqueVulnerabilities.length} issues`);
//       return this.formatResults(combinedResults, directory);
      
//     } catch (error) {
//       console.error('Error in Snyk scan:', error.message);
//       return this.getEmptyResults();
//     }
//   }

//   /**
//    * Scan using Snyk Code (for source code analysis) - Fixed
//    */
//   async scanWithSnykCode(directory) {
//     try {
//       const command = `${this.config.path} code test "${directory}" --json --severity-threshold=low`;
//       console.log('Executing Snyk Code command:', command);
      
//       // Execute command and handle both success and error cases
//       let stdout = '';
//       let stderr = '';
//       let exitCode = 0;
      
//       try {
//         const result = await execAsync(command, {
//           maxBuffer: 1024 * 1024 * 10,
//           timeout: this.config.timeoutMs || 120000,
//           cwd: directory
//         });
        
//         stdout = result.stdout;
//         stderr = result.stderr;
//         exitCode = 0;
//       } catch (execError) {
//         // Snyk returns different exit codes:
//         // 0: No issues found
//         // 1: Issues found
//         // 2: Failure (authentication, network, etc.)
        
//         stdout = execError.stdout || '';
//         stderr = execError.stderr || '';
//         exitCode = execError.code || 1;
        
//         console.log(`Snyk Code exit code: ${exitCode}`);
        
//         // Exit code 1 means vulnerabilities were found - this is what we want!
//         if (exitCode !== 1 && exitCode !== 0) {
//           console.error('Snyk Code scan failed:', stderr);
//           return [];
//         }
//       }
      
//       if (stderr) {
//         console.warn('Snyk Code warnings:', stderr);
//       }
      
//       console.log('Snyk Code stdout length:', stdout.length);
//       console.log('Snyk Code stdout preview:', stdout.substring(0, 500));
      
//       if (stdout && stdout.trim()) {
//         try {
//           const result = JSON.parse(stdout);
//           console.log('Parsed Snyk Code result structure:', Object.keys(result));
          
//           return this.extractVulnerabilities(result, 'code');
//         } catch (parseError) {
//           console.error('Error parsing Snyk Code JSON:', parseError.message);
//           console.log('Raw stdout that failed to parse:', stdout);
          
//           // Try to extract vulnerabilities from non-JSON output
//           return this.parseTextOutput(stdout, 'code');
//         }
//       }
      
//       console.log('No output from Snyk Code scan');
//       return [];
      
//     } catch (error) {
//       console.error('Snyk Code scan error:', error.message);
//       return [];
//     }
//   }

//   /**
//    * Scan using Snyk Test (for dependencies) - Fixed
//    */
//   async scanWithSnykTest(directory) {
//     try {
//       const command = `${this.config.path} test "${directory}" --json --severity-threshold=low`;
//       console.log('Executing Snyk Test command:', command);
      
//       let stdout = '';
//       let stderr = '';
//       let exitCode = 0;
      
//       try {
//         const result = await execAsync(command, {
//           maxBuffer: 1024 * 1024 * 10,
//           timeout: this.config.timeoutMs || 120000,
//           cwd: directory
//         });
        
//         stdout = result.stdout;
//         stderr = result.stderr;
//         exitCode = 0;
//       } catch (execError) {
//         stdout = execError.stdout || '';
//         stderr = execError.stderr || '';
//         exitCode = execError.code || 1;
        
//         console.log(`Snyk Test exit code: ${exitCode}`);
        
//         if (exitCode !== 1 && exitCode !== 0) {
//           console.error('Snyk Test scan failed:', stderr);
//           return [];
//         }
//       }
      
//       if (stderr) {
//         console.warn('Snyk Test warnings:', stderr);
//       }
      
//       if (stdout && stdout.trim()) {
//         try {
//           const result = JSON.parse(stdout);
//           return this.extractVulnerabilities(result, 'dependency');
//         } catch (parseError) {
//           console.error('Error parsing Snyk Test JSON:', parseError.message);
//           return this.parseTextOutput(stdout, 'dependency');
//         }
//       }
      
//       return [];
      
//     } catch (error) {
//       console.error('Snyk Test scan error:', error.message);
//       return [];
//     }
//   }

//   /**
//    * Parse text output when JSON parsing fails
//    */
//   parseTextOutput(output, scanType) {
//     console.log('Attempting to parse text output...');
    
//     const vulnerabilities = [];
//     const lines = output.split('\n');
    
//     let currentVuln = null;
    
//     for (const line of lines) {
//       const trimmedLine = line.trim();
      
//       // Look for vulnerability indicators
//       if (trimmedLine.includes('✗') || trimmedLine.includes('[')) {
//         // Extract severity and title
//         const severityMatch = trimmedLine.match(/\[(High|Medium|Low|Critical)\]/i);
//         const titleMatch = trimmedLine.replace(/✗|\[.*?\]|Path:|Info:/g, '').trim();
        
//         if (severityMatch && titleMatch) {
//           currentVuln = {
//             title: titleMatch,
//             severity: severityMatch[1].toLowerCase(),
//             scanType: scanType,
//             description: '',
//             filePath: '',
//             line: 1
//           };
//         }
//       }
      
//       // Look for path information
//       if (trimmedLine.includes('Path:') && currentVuln) {
//         const pathMatch = trimmedLine.match(/Path:\s*([^,]+)(?:,\s*line\s*(\d+))?/);
//         if (pathMatch) {
//           currentVuln.filePath = pathMatch[1].trim();
//           currentVuln.line = pathMatch[2] ? parseInt(pathMatch[2]) : 1;
//         }
//       }
      
//       // Look for description/info
//       if (trimmedLine.includes('Info:') && currentVuln) {
//         currentVuln.description = trimmedLine.replace('Info:', '').trim();
        
//         // Add the vulnerability when we have all info
//         if (currentVuln.title && currentVuln.filePath) {
//           vulnerabilities.push(currentVuln);
//           console.log('Parsed vulnerability:', currentVuln.title, 'in', currentVuln.filePath);
//         }
//         currentVuln = null;
//       }
//     }
    
//     console.log(`Parsed ${vulnerabilities.length} vulnerabilities from text output`);
//     return vulnerabilities;
//   }

//   /**
//    * Extract vulnerabilities from JSON results - Enhanced
//    */
//   extractVulnerabilities(result, scanType) {
//     const vulnerabilities = [];
    
//     console.log('Extracting vulnerabilities from result type:', scanType);
//     console.log('Result structure:', Object.keys(result));
    
//     // Handle different result formats
//     if (result.vulnerabilities && Array.isArray(result.vulnerabilities)) {
//       console.log('Found vulnerabilities array with', result.vulnerabilities.length, 'items');
//       vulnerabilities.push(...result.vulnerabilities);
//     }
    
//     if (result.runs && Array.isArray(result.runs)) {
//       // SARIF format from Snyk Code
//       console.log('Found SARIF format with', result.runs.length, 'runs');
//       result.runs.forEach(run => {
//         if (run.results && Array.isArray(run.results)) {
//           console.log('Processing', run.results.length, 'SARIF results');
//           run.results.forEach(finding => {
//             vulnerabilities.push(this.convertSarifToVulnerability(finding, scanType));
//           });
//         }
//       });
//     }
    
//     // Handle Snyk Code specific format
//     if (result.type === 'sast' && result.results) {
//       console.log('Found Snyk Code SAST format');
//       Object.values(result.results).forEach(fileResults => {
//         if (Array.isArray(fileResults)) {
//           fileResults.forEach(finding => {
//             vulnerabilities.push(this.convertSnykCodeFinding(finding, scanType));
//           });
//         }
//       });
//     }
    
//     console.log(`Extracted ${vulnerabilities.length} vulnerabilities from ${scanType} scan`);
//     return vulnerabilities;
//   }

//   /**
//    * Convert Snyk Code finding to vulnerability format
//    */
//   convertSnykCodeFinding(finding, scanType) {
//     return {
//       title: finding.rule?.name || finding.message || 'Unknown vulnerability',
//       severity: this.mapSnykSeverity(finding.severity || 'medium'),
//       description: finding.message || 'No description available',
//       filePath: finding.filePath || 'unknown',
//       line: finding.range?.start?.line || 1,
//       column: finding.range?.start?.character || 1,
//       scanType: scanType,
//       ruleId: finding.rule?.id || 'unknown-rule'
//     };
//   }

//   /**
//    * Convert SARIF format to vulnerability format - Enhanced
//    */
//   convertSarifToVulnerability(sarifResult, scanType) {
//     const location = sarifResult.locations?.[0]?.physicalLocation;
//     const filePath = location?.artifactLocation?.uri || 'unknown';
//     const line = location?.region?.startLine || 1;
    
//     return {
//       title: sarifResult.message?.text || sarifResult.ruleId || 'Unknown vulnerability',
//       severity: this.mapSnykSeverity(sarifResult.level || 'info'),
//       description: sarifResult.message?.text || 'No description available',
//       filePath: filePath,
//       line: line,
//       column: location?.region?.startColumn || 1,
//       scanType: scanType,
//       ruleId: sarifResult.ruleId || 'unknown-rule'
//     };
//   }

//   /**
//    * Map Snyk severity levels
//    */
//   mapSnykSeverity(level) {
//     const mapping = {
//       'error': 'high',
//       'warning': 'medium',
//       'note': 'low',
//       'info': 'low',
//       'critical': 'critical',
//       'high': 'high',
//       'medium': 'medium',
//       'low': 'low'
//     };
    
//     return mapping[level.toLowerCase()] || 'low';
//   }

//   /**
//    * Get all files recursively
//    */
//   async getAllFiles(directory) {
//     const files = [];
    
//     const getFilesRecursive = async (dir) => {
//       try {
//         const entries = await fs.readdir(dir, { withFileTypes: true });
        
//         for (const entry of entries) {
//           const fullPath = path.join(dir, entry.name);
          
//           if (entry.isDirectory()) {
//             // Skip node_modules and other irrelevant directories
//             if (!['node_modules', '.git', '.vscode', 'dist', 'build', '__pycache__'].includes(entry.name)) {
//               await getFilesRecursive(fullPath);
//             }
//           } else {
//             files.push(fullPath);
//           }
//         }
//       } catch (err) {
//         console.warn(`Error reading directory ${dir}:`, err.message);
//       }
//     };
    
//     await getFilesRecursive(directory);
//     return files;
//   }

//   /**
//    * Deduplicate vulnerabilities
//    */
//   deduplicateVulnerabilities(vulnerabilities) {
//     const seen = new Set();
//     const unique = [];
    
//     vulnerabilities.forEach(vuln => {
//       const key = `${vuln.title}-${vuln.filePath}-${vuln.line}`;
//       if (!seen.has(key)) {
//         seen.add(key);
//         unique.push(vuln);
//       }
//     });
    
//     return unique;
//   }

//   /**
//    * Get empty results structure
//    */
//   getEmptyResults() {
//     return {
//       scanner: this.name,
//       vulnerabilities: [],
//       summary: {
//         total: 0,
//         critical: 0,
//         high: 0,
//         medium: 0,
//         low: 0
//       }
//     };
//   }

//   /**
//    * Format results to standard format
//    */
//   formatResults(rawResults, basePath) {
//     if (!rawResults.vulnerabilities || !Array.isArray(rawResults.vulnerabilities)) {
//       console.warn('No valid results found in Snyk output');
//       return this.getEmptyResults();
//     }
    
//     const summary = {
//       total: 0,
//       critical: 0,
//       high: 0,
//       medium: 0,
//       low: 0
//     };
    
//     const vulnerabilities = rawResults.vulnerabilities.map(vuln => {
//       const severity = vuln.severity || 'low';
//       summary[severity]++;
//       summary.total++;
      
//       const fileName = vuln.filePath || vuln.file || 'unknown';
//       const filePath = path.isAbsolute(fileName) 
//         ? fileName 
//         : path.join(basePath, fileName);
      
//       const relativePath = path.relative(basePath, filePath);
      
//       return {
//         name: vuln.title || vuln.name || 'Unknown Vulnerability',
//         severity,
//         type: 'Security',
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
//         description: vuln.description || vuln.message || 'No description provided',
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

// src/scanners/snykScanner.js - Debug version với logging chi tiết
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');
const { scannerConfig } = require('../config/scanners');

const execAsync = promisify(exec);

/**
 * Snyk scanner implementation - Debug version
 */
class SnykScanner {
  constructor() {
    this.name = 'snyk';
    this.config = scannerConfig.snyk;
  }

  /**
   * Check if snyk is installed and accessible
   */
  async checkInstallation() {
    try {
      const { stdout } = await execAsync(`${this.config.path} --version`, { timeout: 10000 });
      console.log('Snyk version:', stdout.trim());
      
      // Check authentication status
      try {
        const { stdout: authStatus } = await execAsync(`${this.config.path} auth`, { timeout: 10000 });
        console.log('Snyk auth status:', authStatus.trim());
      } catch (authError) {
        console.warn('Snyk auth check failed:', authError.message);
      }
      
      return true;
    } catch (error) {
      console.error(`Snyk installation check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Scan a directory with snyk - Debug version
   */
  async scanDirectory(directory, outputPath, options = {}) {
    console.log('=== Starting Debug Snyk Scan ===');
    console.log('Directory:', directory);
    console.log('Output path:', outputPath);
    console.log('Snyk path:', this.config.path);
    
    try {
      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Check if directory exists
      if (!fs.existsSync(directory)) {
        console.error(`Directory not found: ${directory}`);
        return this.getEmptyResults();
      }

      // List files in directory for debugging
      const allFiles = await this.getAllFiles(directory);
      console.log('All files found:', allFiles.map(f => path.basename(f)));
      
      // Filter for supported file types
      const supportedExtensions = ['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go'];
      const supportedFiles = allFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return supportedExtensions.includes(ext);
      });
      
      console.log(`Found ${supportedFiles.length} supported files to scan:`, 
        supportedFiles.map(f => path.basename(f)));
      
      if (supportedFiles.length === 0) {
        console.log('No supported files found in directory');
        return this.getEmptyResults();
      }

      // Try multiple scanning approaches
      const vulnerabilities = [];
      
      // First, try to understand why Snyk Code is failing
      console.log('\n=== Debugging Snyk Code ===');
      const codeResults = await this.debugSnykCode(directory);
      vulnerabilities.push(...codeResults);
      
      // Try alternative: scan individual files
      console.log('\n=== Trying individual file scan ===');
      const individualResults = await this.scanIndividualFiles(supportedFiles);
      vulnerabilities.push(...individualResults);
      
      // Try with different command variations
      console.log('\n=== Trying alternative commands ===');
      const altResults = await this.tryAlternativeCommands(directory);
      vulnerabilities.push(...altResults);
      
      // Combine and deduplicate results
      const uniqueVulnerabilities = this.deduplicateVulnerabilities(vulnerabilities);
      
      const combinedResults = {
        vulnerabilities: uniqueVulnerabilities,
        debug: {
          totalFound: vulnerabilities.length,
          afterDedup: uniqueVulnerabilities.length,
          methods: ['code', 'individual', 'alternative']
        }
      };

      // Write results to output file
      try {
        fs.writeFileSync(outputPath, JSON.stringify(combinedResults, null, 2));
        console.log(`Results written to: ${outputPath}`);
      } catch (writeError) {
        console.error('Error writing Snyk results:', writeError.message);
      }
      
      console.log(`\nSnyk scan completed: found ${uniqueVulnerabilities.length} issues`);
      return this.formatResults(combinedResults, directory);
      
    } catch (error) {
      console.error('Error in Snyk scan:', error.message);
      return this.getEmptyResults();
    }
  }

  /**
   * Debug Snyk Code thoroughly
   */
  async debugSnykCode(directory) {
    console.log('Debugging Snyk Code...');
    
    // Try different command variations
    const commands = [
      `${this.config.path} code test "${directory}" --json`,
      `${this.config.path} code test "${directory}" --json --severity-threshold=low`,
      `${this.config.path} code test "${directory}" --json --all-projects`,
      `${this.config.path} code test "${directory}"` // Without --json first to see actual output
    ];
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\nTrying command ${i + 1}: ${command}`);
      
      try {
        const result = await this.executeSnykCommand(command, directory);
        
        if (result.vulnerabilities.length > 0) {
          console.log(`✓ Command ${i + 1} found ${result.vulnerabilities.length} vulnerabilities`);
          return result.vulnerabilities;
        } else {
          console.log(`○ Command ${i + 1} found no vulnerabilities`);
        }
      } catch (error) {
        console.log(`✗ Command ${i + 1} failed: ${error.message}`);
      }
    }
    
    return [];
  }

  /**
   * Scan individual files
   */
  async scanIndividualFiles(supportedFiles) {
    console.log('Scanning individual files...');
    const vulnerabilities = [];
    
    for (const file of supportedFiles.slice(0, 3)) { // Limit to first 3 files for testing
      console.log(`\nScanning individual file: ${path.basename(file)}`);
      
      try {
        const command = `${this.config.path} code test "${file}" --json`;
        console.log(`Command: ${command}`);
        
        const result = await this.executeSnykCommand(command, path.dirname(file));
        vulnerabilities.push(...result.vulnerabilities);
        
        console.log(`Found ${result.vulnerabilities.length} issues in ${path.basename(file)}`);
      } catch (error) {
        console.log(`Failed to scan ${path.basename(file)}: ${error.message}`);
      }
    }
    
    return vulnerabilities;
  }

  /**
   * Try alternative commands
   */
  async tryAlternativeCommands(directory) {
    console.log('Trying alternative commands...');
    const vulnerabilities = [];
    
    // Try with different working directories
    const commands = [
      { cmd: `cd "${directory}" && ${this.config.path} code test . --json`, desc: 'From within directory' },
      { cmd: `${this.config.path} test "${directory}" --json`, desc: 'Regular test command' },
      { cmd: `${this.config.path} code test "${directory}" --format=json`, desc: 'With format flag' }
    ];
    
    for (const { cmd, desc } of commands) {
      console.log(`\nTrying: ${desc}`);
      console.log(`Command: ${cmd}`);
      
      try {
        const { stdout, stderr } = await execAsync(cmd, {
          maxBuffer: 1024 * 1024 * 10,
          timeout: 60000,
          shell: true
        });
        
        console.log(`Exit code: success`);
        console.log(`Stdout length: ${stdout.length}`);
        console.log(`Stderr: ${stderr || 'none'}`);
        
        if (stdout && stdout.trim()) {
          const parsed = this.parseAnyOutput(stdout, 'alternative');
          vulnerabilities.push(...parsed);
          console.log(`Found ${parsed.length} vulnerabilities`);
        }
      } catch (error) {
        console.log(`Exit code: ${error.code || 'unknown'}`);
        console.log(`Error: ${error.message}`);
        
        // Even if there's an error, check if we got useful output
        if (error.stdout && error.stdout.trim()) {
          console.log(`But we got stdout: ${error.stdout.length} chars`);
          const parsed = this.parseAnyOutput(error.stdout, 'alternative');
          vulnerabilities.push(...parsed);
        }
      }
    }
    
    return vulnerabilities;
  }

  /**
   * Execute Snyk command with detailed logging
   */
  async executeSnykCommand(command, workingDir) {
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    
    try {
      const result = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: this.config.timeoutMs || 120000,
        cwd: workingDir
      });
      
      stdout = result.stdout;
      stderr = result.stderr;
      exitCode = 0;
    } catch (execError) {
      stdout = execError.stdout || '';
      stderr = execError.stderr || '';
      exitCode = execError.code || 1;
    }
    
    console.log(`Exit code: ${exitCode}`);
    console.log(`Stdout length: ${stdout.length}`);
    console.log(`Stderr length: ${stderr.length}`);
    
    if (stderr) {
      console.log(`Stderr content: ${stderr.substring(0, 200)}...`);
    }
    
    if (stdout && stdout.length > 0) {
      console.log(`Stdout preview: ${stdout.substring(0, 300)}...`);
    }
    
    // Parse output regardless of exit code
    const vulnerabilities = this.parseAnyOutput(stdout, 'code');
    
    return { vulnerabilities, exitCode, stderr };
  }

  /**
   * Parse any type of output (JSON or text)
   */
  parseAnyOutput(output, scanType) {
    if (!output || !output.trim()) {
      return [];
    }
    
    console.log('Parsing output...');
    
    // Try JSON first
    try {
      const result = JSON.parse(output);
      console.log('Successfully parsed as JSON');
      console.log('JSON structure:', Object.keys(result));
      
      return this.extractVulnerabilities(result, scanType);
    } catch (jsonError) {
      console.log('JSON parsing failed, trying text parsing...');
      
      // Try text parsing
      const textResults = this.parseTextOutput(output, scanType);
      if (textResults.length > 0) {
        console.log(`Text parsing found ${textResults.length} vulnerabilities`);
        return textResults;
      }
      
      console.log('No vulnerabilities found in output');
      return [];
    }
  }

  /**
   * Parse text output when JSON parsing fails - Enhanced
   */
  parseTextOutput(output, scanType) {
    console.log('Parsing text output...');
    
    const vulnerabilities = [];
    const lines = output.split('\n');
    
    let currentVuln = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Look for vulnerability indicators - more patterns
      if (trimmedLine.includes('✗') || 
          trimmedLine.match(/\[(High|Medium|Low|Critical)\]/i) ||
          trimmedLine.includes('Severity:') ||
          trimmedLine.includes('Issue:')) {
        
        console.log('Found vulnerability line:', trimmedLine);
        
        // Extract severity and title
        const severityMatch = trimmedLine.match(/\[(High|Medium|Low|Critical)\]/i);
        let title = trimmedLine.replace(/✗|\[.*?\]|Path:|Info:|Severity:/g, '').trim();
        
        // Clean up title
        title = title.replace(/^\s*[-•]\s*/, '').trim();
        
        if (title) {
          currentVuln = {
            title: title,
            severity: severityMatch ? severityMatch[1].toLowerCase() : 'medium',
            scanType: scanType,
            description: '',
            filePath: '',
            line: 1
          };
          
          console.log('Created vulnerability:', currentVuln.title);
        }
      }
      
      // Look for path information - more patterns
      if ((trimmedLine.includes('Path:') || trimmedLine.includes('File:')) && currentVuln) {
        const pathMatch = trimmedLine.match(/(?:Path|File):\s*([^,]+)(?:,\s*line\s*(\d+))?/i);
        if (pathMatch) {
          currentVuln.filePath = pathMatch[1].trim();
          currentVuln.line = pathMatch[2] ? parseInt(pathMatch[2]) : 1;
          
          console.log('Found path:', currentVuln.filePath, 'line:', currentVuln.line);
        }
      }
      
      // Look for description/info - more patterns
      if ((trimmedLine.includes('Info:') || trimmedLine.includes('Description:')) && currentVuln) {
        currentVuln.description = trimmedLine.replace(/Info:|Description:/i, '').trim();
        
        console.log('Found description:', currentVuln.description);
        
        // Add the vulnerability when we have minimum info
        if (currentVuln.title) {
          // If we don't have a file path, try to find it in the next few lines
          if (!currentVuln.filePath) {
            for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
              const nextLine = lines[j].trim();
              if (nextLine.includes('.c') || nextLine.includes('.cpp') || nextLine.includes('.h')) {
                currentVuln.filePath = nextLine.replace(/[^\w\.\-\/]/g, '').trim();
                break;
              }
            }
          }
          
          // Use filename if still no path
          if (!currentVuln.filePath) {
            currentVuln.filePath = 'unknown';
          }
          
          vulnerabilities.push({...currentVuln});
          console.log('Added vulnerability:', currentVuln.title);
        }
        currentVuln = null;
      }
    }
    
    console.log(`Text parsing completed: ${vulnerabilities.length} vulnerabilities found`);
    return vulnerabilities;
  }

  /**
   * Extract vulnerabilities from JSON results
   */
  extractVulnerabilities(result, scanType) {
    const vulnerabilities = [];
    
    console.log('Extracting vulnerabilities from JSON result');
    console.log('Result keys:', Object.keys(result));
    
    // Handle different result formats
    if (result.vulnerabilities && Array.isArray(result.vulnerabilities)) {
      console.log('Found vulnerabilities array with', result.vulnerabilities.length, 'items');
      vulnerabilities.push(...result.vulnerabilities.map(v => ({
        title: v.title || v.name || 'Unknown',
        severity: v.severity || 'medium',
        description: v.description || '',
        filePath: v.filePath || v.from?.[0] || 'unknown',
        line: v.line || 1,
        scanType
      })));
    }
    
    if (result.runs && Array.isArray(result.runs)) {
      // SARIF format
      console.log('Found SARIF format with', result.runs.length, 'runs');
      result.runs.forEach(run => {
        if (run.results && Array.isArray(run.results)) {
          run.results.forEach(finding => {
            vulnerabilities.push(this.convertSarifToVulnerability(finding, scanType));
          });
        }
      });
    }
    
    console.log(`Extracted ${vulnerabilities.length} vulnerabilities`);
    return vulnerabilities;
  }

  /**
   * Convert SARIF format to vulnerability format
   */
  convertSarifToVulnerability(sarifResult, scanType) {
    const location = sarifResult.locations?.[0]?.physicalLocation;
    const filePath = location?.artifactLocation?.uri || 'unknown';
    const line = location?.region?.startLine || 1;
    
    return {
      title: sarifResult.message?.text || sarifResult.ruleId || 'Unknown vulnerability',
      severity: this.mapSnykSeverity(sarifResult.level || 'info'),
      description: sarifResult.message?.text || 'No description available',
      filePath: filePath,
      line: line,
      column: location?.region?.startColumn || 1,
      scanType: scanType,
      ruleId: sarifResult.ruleId || 'unknown-rule'
    };
  }

  /**
   * Map Snyk severity levels
   */
  mapSnykSeverity(level) {
    const mapping = {
      'error': 'high',
      'warning': 'medium',
      'note': 'low',
      'info': 'low',
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    
    return mapping[level.toLowerCase()] || 'low';
  }

  /**
   * Get all files recursively
   */
  async getAllFiles(directory) {
    const files = [];
    
    const getFilesRecursive = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', '.vscode', 'dist', 'build'].includes(entry.name)) {
              await getFilesRecursive(fullPath);
            }
          } else {
            files.push(fullPath);
          }
        }
      } catch (err) {
        console.warn(`Error reading directory ${dir}:`, err.message);
      }
    };
    
    await getFilesRecursive(directory);
    return files;
  }

  /**
   * Deduplicate vulnerabilities
   */
  deduplicateVulnerabilities(vulnerabilities) {
    const seen = new Set();
    const unique = [];
    
    vulnerabilities.forEach(vuln => {
      const key = `${vuln.title}-${vuln.filePath}-${vuln.line}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(vuln);
      }
    });
    
    return unique;
  }

  /**
   * Get empty results structure
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
   * Format results to standard format
   */
  formatResults(rawResults, basePath) {
    if (!rawResults.vulnerabilities || !Array.isArray(rawResults.vulnerabilities)) {
      console.warn('No valid results found in Snyk output');
      return this.getEmptyResults();
    }
    
    const summary = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    const vulnerabilities = rawResults.vulnerabilities.map(vuln => {
      const severity = vuln.severity || 'low';
      summary[severity]++;
      summary.total++;
      
      const fileName = vuln.filePath || 'unknown';
      const filePath = path.isAbsolute(fileName) 
        ? fileName 
        : path.join(basePath, fileName);
      
      const relativePath = path.relative(basePath, filePath);
      
      return {
        name: vuln.title || 'Unknown Vulnerability',
        severity,
        type: 'Security',
        tool: this.name,
        file: {
          fileName: path.basename(filePath),
          filePath: relativePath,
          fileExt: path.extname(filePath)
        },
        location: {
          line: vuln.line || 1,
          column: vuln.column || 1
        },
        description: vuln.description || 'No description provided',
        codeSnippet: {
          line: '',
          before: [],
          after: []
        },
        remediation: {
          description: 'Review and fix the security issue according to best practices'
        },
        references: [],
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