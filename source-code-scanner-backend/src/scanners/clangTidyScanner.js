// // src/scanners/clangTidyScanner.js
// const { exec } = require('child_process');
// const path = require('path');
// const fs = require('fs-extra');
// const logger = require('../utils/logger'); // Sửa import logger
// const { scannerConfig } = require('../config/scanners');

// /**
//  * ClangTidy scanner implementation
//  */
// class ClangTidyScanner {
//   constructor() {
//     this.name = 'clangtidy';
//     this.config = scannerConfig.clangTidy;
//   }

//   /**
//    * Check if clang-tidy is installed and accessible
//    * @returns {Promise<Boolean>} True if installed, false otherwise
//    */
//   async checkInstallation() {
//     return new Promise((resolve) => {
//       exec(`${this.config.path} --version`, (error) => {
//         if (error) {
//           console.error(`ClangTidy installation check failed: ${error.message}`);
//           resolve(false);
//         } else {
//           resolve(true);
//         }
//       });
//     });
//   }

//   /**
//    * Scan a directory with clang-tidy
//    * @param {String} directory - Directory to scan
//    * @param {String} outputPath - Path to store scan results
//    * @param {Object} options - Scan options
//    * @returns {Promise<Object>} Scan results
//    */
//   async scanDirectory(directory, outputPath, options = {}) {
//     try {
//       // Ensure output directory exists
//       fs.ensureDirSync(path.dirname(outputPath));
      
//       // Find all C/C++ files in the directory
//       const files = await this.findCppFiles(directory);
      
//       if (files.length === 0) {
//         console.warn(`No C/C++ files found in ${directory}`);
//         return {
//           scanner: this.name,
//           vulnerabilities: [],
//           summary: {
//             total: 0,
//             critical: 0,
//             high: 0,
//             medium: 0,
//             low: 0
//           }
//         };
//       }
      
//       // Create a compilation database if it doesn't exist
//       const compileDbPath = path.join(directory, 'compile_commands.json');
//       if (!fs.existsSync(compileDbPath)) {
//         await this.createCompilationDatabase(directory, files);
//       }
      
//       // Scan each file and collect results
//       const results = [];
      
//       for (const file of files) {
//         try {
//           const fileResult = await this.scanFile(file, directory, options);
//           if (fileResult && Array.isArray(fileResult)) {
//             results.push(...fileResult);
//           }
//         } catch (scanError) {
//           logger.error(`Error scanning file ${file}: ${scanError.message}`);
//           // Continue with other files instead of failing completely
//         }
//       }
      
//       // Write results to output file
//       const outputData = { results };
//       fs.writeJsonSync(outputPath, outputData, { spaces: 2 });
      
//       console.info(`ClangTidy scan completed successfully, found ${results.length} issues`);
      
//       return this.formatResults(outputData, directory);
//     } catch (mainError) {
//       console.error(`ClangTidy scan error: ${mainError.message}`);
//       // Return empty results instead of throwing
//       return {
//         scanner: this.name,
//         vulnerabilities: [],
//         summary: {
//           total: 0,
//           critical: 0,
//           high: 0,
//           medium: 0,
//           low: 0
//         },
//         error: mainError.message
//       };
//     }
//   }

//   /**
//    * Find all C/C++ files in a directory recursively
//    * @param {String} directory - Directory to search
//    * @returns {Promise<Array>} List of file paths
//    */
//   async findCppFiles(directory) {
//     return new Promise((resolve) => {
//       const findCommand = `find "${directory}" -type f \\( -name "*.c" -o -name "*.cpp" -o -name "*.cc" -o -name "*.h" -o -name "*.hpp" \\)`;
      
//       exec(findCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
//         if (error) {
//           console.warn(`Error finding C/C++ files: ${error.message}`);
//           resolve([]);
//           return;
//         }
        
//         const files = stdout.trim().split('\n').filter(Boolean);
//         resolve(files);
//       });
//     });
//   }

//   /**
//    * Create a basic compilation database for clang-tidy
//    * @param {String} directory - Base directory
//    * @param {Array} files - List of files
//    */
//   async createCompilationDatabase(directory, files) {
//     try {
//       const compileDb = files.map(file => ({
//         directory: path.resolve(directory),
//         file: path.resolve(file),
//         command: `clang++ -std=c++11 -c "${file}"`,
//         output: `${path.basename(file, path.extname(file))}.o`
//       }));
      
//       const compileDbPath = path.join(directory, 'compile_commands.json');
//       fs.writeJsonSync(compileDbPath, compileDb, { spaces: 2 });
      
//       // Set proper permissions (without sudo)
//       exec(`chmod 644 "${compileDbPath}"`, (error) => {
//         if (error) {
//           console.warn(`Could not set permissions for compile_commands.json: ${error.message}`);
//         }
//       });
      
//       console.info(`Created compilation database at ${compileDbPath}`);
//     } catch (dbError) {
//       console.error(`Error creating compilation database: ${dbError.message}`);
//       // Don't throw, just log the error
//     }
//   }

//   /**
//    * Scan a single file with clang-tidy
//    * @param {String} filePath - File to scan
//    * @param {String} baseDir - Base directory
//    * @param {Object} options - Scan options
//    * @returns {Promise<Array>} Scan results
//    */
//   scanFile(filePath, baseDir, options = {}) {
//     return new Promise((resolve) => {
//       // Prepare arguments
//       const args = [];
      
//       // Add checks
//       if (options.checks) {
//         args.push(`-checks=${options.checks}`);
//       } else {
//         args.push('-checks=*,-clang-analyzer-*,-cppcoreguidelines-avoid-magic-numbers,-readability-magic-numbers');
//       }
      
//       // Add compilation database path
//       args.push('-p', baseDir);
      
//       // Add file to scan
//       args.push(`"${filePath}"`);
      
//       // Construct command (without sudo)
//       const command = `${this.config.path} ${args.join(' ')}`;
      
//       console.debug(`Running clang-tidy on file: ${command}`);
      
//       // Execute command
//       exec(command, {
//         cwd: baseDir,
//         maxBuffer: 1024 * 1024 * 10, // 10MB buffer
//         timeout: this.config.timeoutMs
//       }, (error, stdout, stderr) => {
//         // ClangTidy returns non-zero exit codes when it finds issues, which is normal
//         if (error && error.code > 2) { 
//           console.error(`ClangTidy scan failed for ${filePath}: ${stderr || error.message}`);
//           resolve([]);
//           return;
//         }
        
//         // Parse results
//         try {
//           const results = this.parseClangTidyOutput(stdout, filePath);
//           resolve(results);
//         } catch (parseError) {
//           console.error(`Error parsing ClangTidy output for ${filePath}: ${parseError.message}`);
//           resolve([]);
//         }
//       });
//     });
//   }

//   /**
//    * Parse clang-tidy output
//    * @param {String} output - Command output
//    * @param {String} filePath - File path
//    * @returns {Array} Parsed results
//    */
//   parseClangTidyOutput(output, filePath) {
//     if (!output || typeof output !== 'string') {
//       return [];
//     }
    
//     const results = [];
//     const lines = output.split('\n');
    
//     // Regular expression to match clang-tidy diagnostic lines
//     const diagnosticRegex = /^([^:]+):(\d+):(\d+):\s+(warning|error|note):\s+(.+?)\s+\[([^\]]+)\]$/;
    
//     for (let i = 0; i < lines.length; i++) {
//       const line = lines[i];
//       const match = line.match(diagnosticRegex);
      
//       if (match) {
//         const [, file, lineNum, column, level, message, checkName] = match;
        
//         // Skip 'note' level messages as they are usually follow-ups
//         if (level === 'note') {
//           continue;
//         }
        
//         // Get code snippet if available
//         let codeSnippet = '';
//         if (i + 1 < lines.length && !lines[i + 1].match(diagnosticRegex) && lines[i + 1].trim()) {
//           codeSnippet = lines[i + 1].trim();
//           // Check for the arrow line that points to the issue
//           if (i + 2 < lines.length && lines[i + 2].includes('^')) {
//             i += 2; // Skip both the code line and the arrow line
//           } else {
//             i += 1; // Skip just the code line
//           }
//         }
        
//         results.push({
//           file: file,
//           line: parseInt(lineNum, 10),
//           column: parseInt(column, 10),
//           level: level,
//           message: message,
//           checkName: checkName,
//           codeSnippet: codeSnippet
//         });
//       }
//     }
    
//     return results;
//   }

//   /**
//    * Format clang-tidy results to standard format
//    * @param {Object} rawResults - Raw scan results
//    * @param {String} basePath - Base path for relative file paths
//    * @returns {Object} Formatted results
//    */
//   formatResults(rawResults, basePath) {
//     if (!rawResults || !rawResults.results || !Array.isArray(rawResults.results)) {
//       console.warn('No valid results found in ClangTidy output');
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
//       // Map clang-tidy severity to our severity levels
//       let severity;
//       if (result.level === 'error') {
//         severity = 'high';
//         summary.high++;
//       } else if (result.checkName && (result.checkName.includes('security') || 
//                 result.checkName.includes('safety'))) {
//         severity = 'medium';
//         summary.medium++;
//       } else {
//         severity = 'low';
//         summary.low++;
//       }
      
//       summary.total++;
      
//       // Determine vulnerability type
//       let type;
//       if (result.checkName && result.checkName.includes('security')) {
//         type = 'Security';
//       } else if (result.checkName && result.checkName.includes('performance')) {
//         type = 'Performance';
//       } else if (result.checkName && (result.checkName.includes('memory') || 
//                 result.checkName.includes('leak') ||
//                 result.checkName.includes('buffer'))) {
//         type = 'Memory Safety';
//       } else if (result.checkName && (result.checkName.includes('thread') || 
//                 result.checkName.includes('concurrency'))) {
//         type = 'Concurrency';
//       } else {
//         type = 'Code Quality';
//       }
      
//       // Relative file path
//       const filePath = path.isAbsolute(result.file) 
//         ? result.file 
//         : path.join(basePath, result.file);
      
//       const relativePath = path.relative(basePath, filePath);
      
//       return {
//         name: (result.checkName || 'clang-tidy-issue').split('.').pop().replace(/-/g, ' '),
//         severity,
//         type,
//         tool: this.name,
//         file: {
//           fileName: path.basename(filePath),
//           filePath: relativePath,
//           fileExt: path.extname(filePath)
//         },
//         location: {
//           line: result.line || 1,
//           column: result.column || 1
//         },
//         description: result.message || 'No description provided',
//         codeSnippet: {
//           line: result.codeSnippet || '',
//           before: [],
//           after: []
//         },
//         remediation: {
//           description: this.getRemediationForCheck(result.checkName || '')
//         },
//         status: 'open'
//       };
//     });
    
//     return {
//       scanner: this.name,
//       vulnerabilities,
//       summary
//     };
//   }

//   /**
//    * Get remediation advice for a specific check
//    * @param {String} checkName - Name of the check
//    * @returns {String} Remediation advice
//    */
//   getRemediationForCheck(checkName) {
//     if (!checkName) {
//       return 'Review the issue and fix according to C++ best practices.';
//     }
    
//     // Common remediations for clang-tidy checks
//     const remediations = {
//       'bugprone-use-after-move': 'Don\'t use objects after they have been moved. Initialize the variable after the move operation.',
//       'bugprone-sizeof-expression': 'Check your sizeof expressions carefully. Make sure you\'re getting the size of the intended type.',
//       'cppcoreguidelines-no-malloc': 'Use C++ memory management (new/delete) or smart pointers instead of malloc/free.',
//       'cppcoreguidelines-owning-memory': 'Use RAII and smart pointers to manage resource ownership.',
//       'clang-analyzer-security.insecureAPI': 'Use secure alternatives to the insecure API functions.',
//       'clang-analyzer-deadcode': 'Remove or fix the dead code to improve maintainability.',
//       'clang-analyzer-cplusplus.NewDelete': 'Ensure proper matching of new and delete operations to prevent memory leaks.',
//       'clang-analyzer-unix.Malloc': 'Ensure proper malloc/free handling to prevent memory leaks.',
//       'performance': 'Optimize the code according to the suggestions for better performance.',
//       'readability': 'Improve code readability by following the suggested guidelines.'
//     };
    
//     // Check for matches
//     for (const [key, value] of Object.entries(remediations)) {
//       if (checkName.includes(key)) {
//         return value;
//       }
//     }
    
//     return 'Review the issue and fix according to C++ best practices.';
//   }
// }

// module.exports = new ClangTidyScanner();

// src/scanners/clangTidyScanner.js - Phiên bản cải thiện
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');
const { scannerConfig } = require('../config/scanners');

const execAsync = promisify(exec);

/**
 * ClangTidy scanner implementation - Improved version
 */
class ClangTidyScanner {
  constructor() {
    this.name = 'clangtidy';
    this.config = scannerConfig.clangTidy;
  }

  /**
   * Check if clang-tidy is installed and accessible
   */
  async checkInstallation() {
    try {
      const { stdout } = await execAsync(`${this.config.path} --version`, { timeout: 10000 });
      console.log('ClangTidy version:', stdout.trim());
      return true;
    } catch (error) {
      console.error(`ClangTidy installation check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Scan a directory with clang-tidy - Improved version
   */
  async scanDirectory(directory, outputPath, options = {}) {
    console.log('=== Starting Improved ClangTidy Scan ===');
    console.log('Directory:', directory);
    console.log('Output path:', outputPath);
    
    try {
      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Check if directory exists
      if (!fs.existsSync(directory)) {
        console.error(`Directory not found: ${directory}`);
        return this.getEmptyResults();
      }
      
      // Find all C/C++ files in the directory
      const files = await this.findCppFiles(directory);
      console.log(`Found ${files.length} C/C++ files to scan`);
      
      if (files.length === 0) {
        console.warn(`No C/C++ files found in ${directory}`);
        return this.getEmptyResults();
      }
      
      // Create a better compilation database
      const compileDbPath = await this.createCompilationDatabase(directory, files);
      
      // Scan each file and collect results
      const allResults = [];
      const scanPromises = [];
      
      // Process files in batches to avoid overwhelming the system
      const batchSize = 3;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        for (const file of batch) {
          scanPromises.push(this.scanSingleFile(file, directory, options));
        }
        
        // Wait for current batch to complete before starting next
        const batchResults = await Promise.allSettled(scanPromises);
        scanPromises.length = 0; // Clear array
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value && Array.isArray(result.value)) {
            allResults.push(...result.value);
          } else if (result.status === 'rejected') {
            console.error(`Error scanning file ${batch[index % batchSize]}:`, result.reason?.message || 'Unknown error');
          }
        });
      }
      
      // Write results to output file
      const outputData = { results: allResults };
      fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
      
      console.log(`ClangTidy scan completed successfully, found ${allResults.length} issues`);
      
      return this.formatResults(outputData, directory);
    } catch (mainError) {
      console.error(`ClangTidy scan error: ${mainError.message}`);
      return this.getEmptyResults();
    }
  }

  /**
   * Find all C/C++ files in a directory recursively - Improved
   */
  async findCppFiles(directory) {
    const files = [];
    
    const findFiles = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip irrelevant directories
            if (!['node_modules', '.git', '.vscode', 'dist', 'build', '__pycache__'].includes(entry.name)) {
              await findFiles(fullPath);
            }
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.hxx'].includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (err) {
        console.warn(`Error reading directory ${dir}:`, err.message);
      }
    };
    
    await findFiles(directory);
    return files;
  }

  /**
   * Create a more robust compilation database
   */
  async createCompilationDatabase(directory, files) {
    try {
      const compileDbPath = path.join(directory, 'compile_commands.json');
      
      // Create compilation database entries
      const compileDb = files.map(file => {
        const relativePath = path.relative(directory, file);
        const ext = path.extname(file).toLowerCase();
        
        // Choose appropriate compiler and flags based on file extension
        let compiler = 'gcc';
        let flags = ['-std=c11', '-Wall', '-Wextra'];
        
        if (['.cpp', '.cc', '.cxx', '.hpp', '.hxx'].includes(ext)) {
          compiler = 'g++';
          flags = ['-std=c++17', '-Wall', '-Wextra'];
        }
        
        return {
          directory: path.resolve(directory),
          file: path.resolve(file),
          command: `${compiler} ${flags.join(' ')} -c "${relativePath}" -o "${path.basename(file, path.extname(file))}.o"`,
          output: `${path.basename(file, path.extname(file))}.o`
        };
      });
      
      fs.writeFileSync(compileDbPath, JSON.stringify(compileDb, null, 2));
      
      console.log(`Created compilation database with ${compileDb.length} entries at ${compileDbPath}`);
      return compileDbPath;
    } catch (dbError) {
      console.error(`Error creating compilation database: ${dbError.message}`);
      throw dbError;
    }
  }

  /**
   * Scan a single file with clang-tidy - Improved
   */
  async scanSingleFile(filePath, baseDir, options = {}) {
    try {
      console.log(`Scanning file with ClangTidy: ${filePath}`);
      
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
      }
      
      // Prepare clang-tidy arguments
      const args = [];
      
      // Add checks - use a more conservative set to avoid too many false positives
      if (options.checks) {
        args.push(`-checks=${options.checks}`);
      } else {
        args.push('-checks=bugprone-*,clang-analyzer-*,cppcoreguidelines-*,performance-*,readability-*,-readability-magic-numbers,-cppcoreguidelines-avoid-magic-numbers');
      }
      
      // Add compilation database path
      args.push('-p', baseDir);
      
      // Add the file to scan (use absolute path)
      args.push(path.resolve(filePath));
      
      // Add format option for easier parsing
      args.push('--format-style=file');
      
      // Construct and execute command
      const command = `${this.config.path} ${args.join(' ')}`;
      console.log(`Executing: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: baseDir,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: this.config.timeoutMs || 60000, // 1 minute timeout per file
        env: { ...process.env, LC_ALL: 'C' } // Force English output
      });
      
      // ClangTidy writes diagnostics to stderr, not stdout
      const output = stderr || stdout;
      
      if (!output || output.trim() === '') {
        console.log(`No issues found in ${filePath}`);
        return [];
      }
      
      // Parse the output
      const results = this.parseClangTidyOutput(output, filePath);
      console.log(`Found ${results.length} issues in ${filePath}`);
      
      return results;
      
    } catch (error) {
      // Handle different types of errors
      if (error.code === 'ETIMEDOUT') {
        console.error(`ClangTidy scan timed out for ${filePath}`);
      } else if (error.code && error.code > 0) {
        // ClangTidy returns non-zero exit codes when it finds issues or has warnings
        // This is normal behavior, not necessarily an error
        const output = error.stderr || error.stdout || '';
        if (output.trim()) {
          try {
            const results = this.parseClangTidyOutput(output, filePath);
            console.log(`Found ${results.length} issues in ${filePath} (via error output)`);
            return results;
          } catch (parseError) {
            console.error(`Error parsing ClangTidy output for ${filePath}:`, parseError.message);
          }
        }
      } else {
        console.error(`ClangTidy scan failed for ${filePath}:`, error.message);
      }
      
      return [];
    }
  }

  /**
   * Parse clang-tidy output - Improved version
   */
  parseClangTidyOutput(output, filePath) {
    if (!output || typeof output !== 'string') {
      return [];
    }
    
    const results = [];
    const lines = output.split('\n');
    
    // Improved regex to match clang-tidy diagnostic lines
    // Handles both absolute and relative paths
    const diagnosticRegex = /^(.+?):(\d+):(\d+):\s+(warning|error|note):\s+(.+?)\s+\[([^\]]+)\]$/;
    const warningRegex = /^(.+?):(\d+):(\d+):\s+(warning|error):\s+(.+)$/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      let match = line.match(diagnosticRegex);
      
      // If the primary regex doesn't match, try the simpler one
      if (!match) {
        match = line.match(warningRegex);
        if (match) {
          // Add a default check name if not found
          match.push('clang-tidy-check');
        }
      }
      
      if (match) {
        const [, file, lineNum, column, level, message, checkName] = match;
        
        // Skip 'note' level messages as they are usually follow-ups
        if (level === 'note') {
          continue;
        }
        
        // Normalize file path
        let normalizedFile = file;
        if (path.isAbsolute(file)) {
          normalizedFile = file;
        } else {
          normalizedFile = path.resolve(path.dirname(filePath), file);
        }
        
        // Get code snippet if available (next non-empty line that doesn't look like a diagnostic)
        let codeSnippet = '';
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && !nextLine.match(diagnosticRegex) && !nextLine.match(warningRegex)) {
            codeSnippet = nextLine;
            
            // Check for the arrow line that points to the issue
            if (i + 2 < lines.length && lines[i + 2].includes('^')) {
              i += 2; // Skip both the code line and the arrow line
            } else {
              i += 1; // Skip just the code line
            }
          }
        }
        
        results.push({
          file: normalizedFile,
          line: parseInt(lineNum, 10),
          column: parseInt(column, 10),
          level: level,
          message: message.trim(),
          checkName: checkName || 'unknown-check',
          codeSnippet: codeSnippet
        });
      }
    }
    
    return results;
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
   * Format clang-tidy results to standard format - Improved
   */
  formatResults(rawResults, basePath) {
    if (!rawResults || !rawResults.results || !Array.isArray(rawResults.results)) {
      console.warn('No valid results found in ClangTidy output');
      return this.getEmptyResults();
    }
    
    const summary = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    const vulnerabilities = rawResults.results.map(result => {
      // Improved severity mapping
      let severity;
      if (result.level === 'error') {
        severity = 'high';
        summary.high++;
      } else if (result.checkName && this.isSecurityCheck(result.checkName)) {
        severity = 'medium';
        summary.medium++;
      } else if (result.checkName && this.isPerformanceCheck(result.checkName)) {
        severity = 'medium';
        summary.medium++;
      } else {
        severity = 'low';
        summary.low++;
      }
      
      summary.total++;
      
      // Improved vulnerability type determination
      const type = this.determineVulnerabilityType(result.checkName || '');
      
      // Handle file path
      const filePath = path.isAbsolute(result.file) 
        ? result.file 
        : path.join(basePath, result.file);
      
      const relativePath = path.relative(basePath, filePath);
      
      return {
        name: this.formatCheckName(result.checkName || 'clang-tidy-issue'),
        severity,
        type,
        tool: this.name,
        file: {
          fileName: path.basename(filePath),
          filePath: relativePath,
          fileExt: path.extname(filePath)
        },
        location: {
          line: result.line || 1,
          column: result.column || 1
        },
        description: result.message || 'No description provided',
        codeSnippet: {
          line: result.codeSnippet || '',
          before: [],
          after: []
        },
        remediation: {
          description: this.getRemediationForCheck(result.checkName || '')
        },
        status: 'open'
      };
    });
    
    return {
      scanner: this.name,
      vulnerabilities,
      summary
    };
  }

  /**
   * Check if a check name indicates a security issue
   */
  isSecurityCheck(checkName) {
    const securityKeywords = [
      'security', 'buffer', 'overflow', 'underflow', 'memory', 'use-after',
      'double-free', 'null-dereference', 'uninitialized', 'bounds'
    ];
    
    return securityKeywords.some(keyword => 
      checkName.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if a check name indicates a performance issue
   */
  isPerformanceCheck(checkName) {
    return checkName.toLowerCase().includes('performance');
  }

  /**
   * Determine vulnerability type based on check name
   */
  determineVulnerabilityType(checkName) {
    const checkLower = checkName.toLowerCase();
    
    if (checkLower.includes('security') || 
        checkLower.includes('buffer') || 
        checkLower.includes('overflow') ||
        checkLower.includes('memory') ||
        checkLower.includes('use-after') ||
        checkLower.includes('double-free')) {
      return 'Security';
    } else if (checkLower.includes('performance')) {
      return 'Performance';
    } else if (checkLower.includes('memory') || 
               checkLower.includes('leak') ||
               checkLower.includes('malloc') ||
               checkLower.includes('free')) {
      return 'Memory Safety';
    } else if (checkLower.includes('thread') || 
               checkLower.includes('concurrency') ||
               checkLower.includes('race')) {
      return 'Concurrency';
    } else {
      return 'Code Quality';
    }
  }

  /**
   * Format check name for display
   */
  formatCheckName(checkName) {
    if (!checkName) return 'ClangTidy Issue';
    
    // Remove prefixes and format nicely
    return checkName
      .replace(/^(bugprone|clang-analyzer|cppcoreguidelines|performance|readability)-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get remediation advice for a specific check
   */
  getRemediationForCheck(checkName) {
    if (!checkName) {
      return 'Review the issue and fix according to C++ best practices.';
    }
    
    const remediations = {
      'bugprone-use-after-move': 'Don\'t use objects after they have been moved. Initialize the variable after the move operation.',
      'bugprone-sizeof-expression': 'Check your sizeof expressions carefully. Make sure you\'re getting the size of the intended type.',
      'bugprone-use-after-free': 'Don\'t access memory after it has been freed. Set pointers to NULL after freeing.',
      'bugprone-infinite-loop': 'Ensure loop conditions can eventually become false to prevent infinite loops.',
      'cppcoreguidelines-no-malloc': 'Use C++ memory management (new/delete) or smart pointers instead of malloc/free.',
      'cppcoreguidelines-owning-memory': 'Use RAII and smart pointers to manage resource ownership.',
      'cppcoreguidelines-pro-bounds-array-to-pointer-decay': 'Use containers or gsl::span instead of raw arrays.',
      'clang-analyzer-security.insecureAPI': 'Use secure alternatives to the insecure API functions.',
      'clang-analyzer-deadcode': 'Remove or fix the dead code to improve maintainability.',
      'clang-analyzer-cplusplus.NewDelete': 'Ensure proper matching of new and delete operations to prevent memory leaks.',
      'clang-analyzer-unix.Malloc': 'Ensure proper malloc/free handling to prevent memory leaks.',
      'performance-unnecessary-copy-initialization': 'Use const references or move semantics to avoid unnecessary copies.',
      'performance-for-range-copy': 'Use const references in range-based for loops to avoid copying.',
      'readability-inconsistent-declaration-parameter-name': 'Use consistent parameter names between declaration and definition.',
      'readability-misleading-indentation': 'Fix indentation to match the intended control flow.'
    };
    
    // Check for exact matches first
    if (remediations[checkName]) {
      return remediations[checkName];
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(remediations)) {
      if (checkName.includes(key) || key.includes(checkName)) {
        return value;
      }
    }
    
    // Category-based remediations
    if (checkName.includes('performance')) {
      return 'Optimize the code according to the suggestions for better performance.';
    } else if (checkName.includes('readability')) {
      return 'Improve code readability by following the suggested guidelines.';
    } else if (checkName.includes('bugprone')) {
      return 'Fix the potential bug to improve code reliability.';
    } else if (checkName.includes('cppcoreguidelines')) {
      return 'Follow C++ Core Guidelines recommendations for better code quality.';
    }
    
    return 'Review the issue and fix according to C++ best practices.';
  }
}

module.exports = new ClangTidyScanner();