// src/scanners/clangTidyScanner.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { logger } = require('../utils/logger');
const { scannerConfig } = require('../config/scanners');

/**
 * ClangTidy scanner implementation
 */
class ClangTidyScanner {
  constructor() {
    this.name = 'clangtidy';
    this.config = scannerConfig.clangTidy;
  }

  /**
   * Check if clang-tidy is installed and accessible
   * @returns {Promise<Boolean>} True if installed, false otherwise
   */
  async checkInstallation() {
    return new Promise((resolve) => {
      exec(`${this.config.path} --version`, (error) => {
        if (error) {
          logger.error(`ClangTidy installation check failed: ${error.message}`);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Scan a directory with clang-tidy
   * @param {String} directory - Directory to scan
   * @param {String} outputPath - Path to store scan results
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Scan results
   */
  async scanDirectory(directory, outputPath, options = {}) {
    try {
      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Find all C/C++ files in the directory
      const files = await this.findCppFiles(directory);
      
      if (files.length === 0) {
        logger.warn(`No C/C++ files found in ${directory}`);
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
      
      // Create a compilation database if it doesn't exist
      const compileDbPath = path.join(directory, 'compile_commands.json');
      if (!fs.existsSync(compileDbPath)) {
        await this.createCompilationDatabase(directory, files);
      }
      
      // Scan each file and collect results
      const results = [];
      
      for (const file of files) {
        try {
          const fileResult = await this.scanFile(file, directory, options);
          results.push(...fileResult);
        } catch (error) {
          logger.error(`Error scanning file ${file}: ${error.message}`);
        }
      }
      
      // Write results to output file
      fs.writeJsonSync(outputPath, { results }, { spaces: 2 });
      
      logger.info(`ClangTidy scan completed successfully, found ${results.length} issues`);
      
      return this.formatResults({ results }, directory);
    } catch (error) {
      logger.error(`ClangTidy scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all C/C++ files in a directory recursively
   * @param {String} directory - Directory to search
   * @returns {Promise<Array>} List of file paths
   */
  async findCppFiles(directory) {
    return new Promise((resolve, reject) => {
      exec(`find ${directory} -type f -name "*.c" -o -name "*.cpp" -o -name "*.cc" -o -name "*.h" -o -name "*.hpp"`, 
        { maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
        (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          
          const files = stdout.trim().split('\n').filter(Boolean);
          resolve(files);
        }
      );
    });
  }

  /**
   * Create a basic compilation database for clang-tidy
   * @param {String} directory - Base directory
   * @param {Array} files - List of files
   */
  async createCompilationDatabase(directory, files) {
    const compileDb = files.map(file => ({
      directory,
      file,
      command: `clang++ -std=c++11 -c ${file}`,
      output: `${path.basename(file, path.extname(file))}.o`
    }));
    
    fs.writeJsonSync(path.join(directory, 'compile_commands.json'), compileDb, { spaces: 2 });
    logger.info(`Created compilation database at ${path.join(directory, 'compile_commands.json')}`);
  }

  /**
   * Scan a single file with clang-tidy
   * @param {String} filePath - File to scan
   * @param {String} baseDir - Base directory
   * @param {Object} options - Scan options
   * @returns {Promise<Array>} Scan results
   */
  scanFile(filePath, baseDir, options = {}) {
    return new Promise((resolve, reject) => {
      // Prepare arguments
      const args = [...this.config.defaultArgs];
      
      // Add checks
      if (options.checks) {
        args.push(`-checks=${options.checks}`);
      } else {
        args.push('-checks=*,-clang-analyzer-*,-cppcoreguidelines-avoid-magic-numbers');
      }
      
      // Add file to scan
      args.push(filePath);
      
      // Construct command
      const command = `${this.config.path} ${args.join(' ')}`;
      
      logger.debug(`Running clang-tidy on file: ${command}`);
      
      // Execute command
      exec(command, {
        cwd: baseDir,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: this.config.timeoutMs
      }, (error, stdout, stderr) => {
        if (error && error.code !== 1) { // clang-tidy returns 1 if it finds issues
          logger.error(`ClangTidy scan failed: ${stderr}`);
          reject(new Error(`ClangTidy scan failed: ${stderr}`));
          return;
        }
        
        // Parse results
        const results = this.parseClangTidyOutput(stdout, filePath);
        resolve(results);
      });
    });
  }

  /**
   * Parse clang-tidy output
   * @param {String} output - Command output
   * @param {String} filePath - File path
   * @returns {Array} Parsed results
   */
  parseClangTidyOutput(output, filePath) {
    const results = [];
    const lines = output.split('\n');
    
    // Regular expression to match clang-tidy diagnostic lines
    // Format: file:line:column: warning/error: message [check-name]
    const diagnosticRegex = /^([^:]+):(\d+):(\d+):\s+(warning|error):\s+(.+?)\s+\[([^\]]+)\]$/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(diagnosticRegex);
      
      if (match) {
        const [, file, lineNum, column, level, message, checkName] = match;
        
        // Get code snippet if available
        let codeSnippet = '';
        if (i + 1 < lines.length && !lines[i + 1].match(diagnosticRegex) && lines[i + 1].trim()) {
          codeSnippet = lines[i + 1].trim();
          // Check for the arrow line that points to the issue
          if (i + 2 < lines.length && lines[i + 2].includes('^')) {
            i += 2; // Skip both the code line and the arrow line
          } else {
            i += 1; // Skip just the code line
          }
        }
        
        results.push({
          file,
          line: parseInt(lineNum, 10),
          column: parseInt(column, 10),
          level,
          message,
          checkName,
          codeSnippet
        });
      }
    }
    
    return results;
  }

  /**
   * Format clang-tidy results to standard format
   * @param {Object} rawResults - Raw scan results
   * @param {String} basePath - Base path for relative file paths
   * @returns {Object} Formatted results
   */
  formatResults(rawResults, basePath) {
    if (!rawResults.results || !Array.isArray(rawResults.results)) {
      logger.warn('No valid results found in ClangTidy output');
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
      // Map clang-tidy severity to our severity levels
      let severity;
      if (result.level === 'error') {
        severity = 'high';
        summary.high++;
      } else if (result.checkName.includes('security') || 
                result.checkName.includes('safety')) {
        severity = 'medium';
        summary.medium++;
      } else {
        severity = 'low';
        summary.low++;
      }
      
      summary.total++;
      
      // Determine vulnerability type
      let type;
      if (result.checkName.includes('security')) {
        type = 'Security';
      } else if (result.checkName.includes('performance')) {
        type = 'Performance';
      } else if (result.checkName.includes('memory') || 
                result.checkName.includes('leak') ||
                result.checkName.includes('buffer')) {
        type = 'Memory Safety';
      } else if (result.checkName.includes('thread') || 
                result.checkName.includes('concurrency')) {
        type = 'Concurrency';
      } else {
        type = 'Code Quality';
      }
      
      // Relative file path
      const filePath = path.isAbsolute(result.file) 
        ? result.file 
        : path.join(basePath, result.file);
      
      const relativePath = path.relative(basePath, filePath);
      
      return {
        name: result.checkName.split('.').pop().replace(/-/g, ' '),
        severity,
        type,
        tool: this.name,
        file: {
          fileName: path.basename(filePath),
          filePath: relativePath,
          fileExt: path.extname(filePath)
        },
        location: {
          line: result.line,
          column: result.column
        },
        description: result.message || 'No description provided',
        codeSnippet: {
          line: result.codeSnippet || '',
          before: [],
          after: []
        },
        remediation: {
          description: this.getRemediationForCheck(result.checkName)
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
   * Get remediation advice for a specific check
   * @param {String} checkName - Name of the check
   * @returns {String} Remediation advice
   */
  getRemediationForCheck(checkName) {
    // Common remediations for clang-tidy checks
    const remediations = {
      'bugprone-use-after-move': 'Don\'t use objects after they have been moved. Initialize the variable after the move operation.',
      'bugprone-sizeof-expression': 'Check your sizeof expressions carefully. Make sure you\'re getting the size of the intended type.',
      'cppcoreguidelines-no-malloc': 'Use C++ memory management (new/delete) or smart pointers instead of malloc/free.',
      'cppcoreguidelines-owning-memory': 'Use RAII and smart pointers to manage resource ownership.',
      'clang-analyzer-security.insecureAPI': 'Use secure alternatives to the insecure API functions.',
      'clang-analyzer-deadcode': 'Remove or fix the dead code to improve maintainability.',
      'clang-analyzer-cplusplus.NewDelete': 'Ensure proper matching of new and delete operations to prevent memory leaks.',
      'clang-analyzer-unix.Malloc': 'Ensure proper malloc/free handling to prevent memory leaks.',
      'performance': 'Optimize the code according to the suggestions for better performance.',
      'readability': 'Improve code readability by following the suggested guidelines.'
    };
    
    // Check for matches
    for (const [key, value] of Object.entries(remediations)) {
      if (checkName.includes(key)) {
        return value;
      }
    }
    
    return 'Review the issue and fix according to C++ best practices.';
  }
}

module.exports = new ClangTidyScanner();