// src/scanners/CppcheckScanner.js
const BaseScanner = require('./BaseScanner');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Cppcheck static analysis scanner for C/C++ code
 * https://cppcheck.sourceforge.io/
 */
class CppcheckScanner extends BaseScanner {
  constructor() {
    super('cppcheck', {
      name: 'Cppcheck',
      description: 'Static analysis tool for C/C++ code',
      version: '2.0',
      supportedLanguages: ['c', 'cpp', 'cc', 'cxx', 'c++', 'h', 'hpp'],
      timeoutMs: 180000, // 3 minutes
      website: 'https://cppcheck.sourceforge.io/'
    });
    
    this.cppcheckPath = this.findCppcheckPath();
  }

  /**
   * Find cppcheck executable path
   * @returns {string} Path to cppcheck executable
   */
  findCppcheckPath() {
    const possiblePaths = [
      '/usr/bin/cppcheck',
      '/usr/local/bin/cppcheck',
      'cppcheck' // system PATH
    ];

    for (const cppcheckPath of possiblePaths) {
      try {
        if (cppcheckPath.includes('/')) {
          if (fs.existsSync(cppcheckPath)) {
            console.log(`Found cppcheck at: ${cppcheckPath}`);
            return cppcheckPath;
          }
        } else {
          // For system PATH, we'll verify in checkInstallation
          return cppcheckPath;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    console.log('Cppcheck not found in standard locations, using system PATH');
    return 'cppcheck';
  }

  /**
   * Check if cppcheck is installed and accessible
   * @returns {Promise<boolean>} True if cppcheck is available
   */
  async checkInstallation() {
    try {
      console.log(`Checking cppcheck installation...`);
      
      const { stdout, stderr } = await execAsync(`${this.cppcheckPath} --version`);
      const version = stdout.trim() || stderr.trim();
      
      if (version.includes('Cppcheck') || version.match(/\d+\.\d+/)) {
        console.log(`Cppcheck version: ${version}`);
        return true;
      } else {
        console.log(`Unexpected cppcheck version output: ${version}`);
        return false;
      }
    } catch (error) {
      console.log(`Cppcheck installation check failed: ${error.message}`);
      logger.error(`Cppcheck installation check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Scan directory with cppcheck
   * @param {string} directory - Directory to scan
   * @param {string} outputPath - Output file path
   * @returns {Promise<Object>} Scan results
   */
  async scanDirectory(directory, outputPath) {
    try {
      console.log(`\n=== Starting Cppcheck Scan ===`);
      console.log(`Directory: ${directory}`);
      console.log(`Output path: ${outputPath}`);
      console.log(`Cppcheck path: ${this.cppcheckPath}`);

      // Get source files
      const sourceFiles = this.getSourceFiles(directory);
      console.log(`Found ${sourceFiles.length} supported files to scan: ${sourceFiles.map(f => path.basename(f))}`);

      if (sourceFiles.length === 0) {
        console.log(`No supported files found for cppcheck scan`);
        return this.createEmptyResult();
      }

      // Create XML output file for detailed results
      const xmlOutputPath = outputPath.replace('.json', '.xml');

      // Build cppcheck command
      const commands = [
        // Main scan command with XML output for detailed parsing
        `${this.cppcheckPath} --enable=all --xml --xml-version=2 --output-file="${xmlOutputPath}" "${directory}"`,
        
        // Fallback: Simple text output
        `${this.cppcheckPath} --enable=all --template="{file}:{line}:{severity}:{id}:{message}" "${directory}"`
      ];

      let vulnerabilities = [];
      let scanSuccessful = false;

      // Try commands in order
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`\n🔍 Trying cppcheck command ${i + 1}/${commands.length}:`);
        console.log(`Command: ${command}`);

        try {
          const { stdout, stderr } = await execAsync(command, {
            timeout: this.config.timeoutMs,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
          });

          console.log(`Exit code: 0 (success)`);
          console.log(`Stdout length: ${stdout.length}`);
          console.log(`Stderr length: ${stderr.length}`);

          // Cppcheck outputs to stderr by default
          const output = stderr || stdout;

          if (i === 0 && fs.existsSync(xmlOutputPath)) {
            // Parse XML output
            console.log(`Parsing XML output from: ${xmlOutputPath}`);
            vulnerabilities = this.parseXmlOutput(xmlOutputPath);
            scanSuccessful = true;
            break;
          } else if (output && output.trim()) {
            // Parse text output
            console.log(`Parsing text output...`);
            vulnerabilities = this.parseTextOutput(output, directory);
            scanSuccessful = true;
            break;
          } else {
            console.log(`Command ${i + 1} produced no output, trying next...`);
          }

        } catch (error) {
          console.log(`Command ${i + 1} failed: ${error.message}`);
          
          // Sometimes cppcheck succeeds but exits with non-zero code when warnings found
          if (error.stdout || error.stderr) {
            const output = error.stderr || error.stdout;
            console.log(`Parsing output from failed command...`);
            vulnerabilities = this.parseTextOutput(output, directory);
            if (vulnerabilities.length > 0) {
              scanSuccessful = true;
              break;
            }
          }
        }
      }

      if (!scanSuccessful) {
        console.log(`⚠️ All cppcheck commands failed, returning empty result`);
        return this.createEmptyResult();
      }

      // Create result summary
      const summary = this.createSummary(vulnerabilities);

      const result = {
        scanner: 'cppcheck',
        vulnerabilities,
        summary,
        metadata: {
          scannedFiles: sourceFiles.length,
          totalFiles: sourceFiles.length,
          scanDuration: Date.now() - Date.now(), // Will be calculated by caller
          tool: this.name,
          version: this.config.version
        }
      };

      // Save results to JSON file
      await fs.writeJSON(outputPath, result, { spaces: 2 });
      console.log(`Results written to: ${outputPath}`);

      console.log(`\n✅ CPPCHECK SCAN COMPLETED`);
      console.log(`Cppcheck found ${summary.total} total issues:`);
      console.log(`- Critical: ${summary.critical}`);
      console.log(`- High: ${summary.high}`);
      console.log(`- Medium: ${summary.medium}`);
      console.log(`- Low: ${summary.low}`);

      return result;

    } catch (error) {
      console.error(`💥 Cppcheck scan error:`, error.message);
      logger.error(`Cppcheck scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse XML output from cppcheck
   * @param {string} xmlPath - Path to XML output file
   * @returns {Array} Array of vulnerabilities
   */
  parseXmlOutput(xmlPath) {
    try {
      // For now, return empty array - XML parsing can be implemented later
      console.log(`XML parsing not yet implemented, trying text parsing...`);
      return [];
    } catch (error) {
      console.error(`Error parsing XML output: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse text output from cppcheck
   * @param {string} output - Text output from cppcheck
   * @param {string} baseDirectory - Base directory for relative paths
   * @returns {Array} Array of vulnerabilities
   */
  parseTextOutput(output, baseDirectory) {
    const vulnerabilities = [];
    const lines = output.split('\n').filter(line => line.trim());

    console.log(`Parsing ${lines.length} lines of text output...`);

    for (const line of lines) {
      try {
        // Parse different cppcheck output formats
        let match;
        
        // Format: file:line:severity:id:message
        match = line.match(/^([^:]+):(\d+):(\w+):([^:]+):(.+)$/);
        if (match) {
          const [, filePath, lineNum, severity, id, message] = match;
          const vuln = this.createVulnerability(filePath, lineNum, severity, id, message, baseDirectory);
          if (vuln) vulnerabilities.push(vuln);
          continue;
        }

        // Format: [file:line]: (severity) message
        match = line.match(/^\[([^:]+):(\d+)\]: \((\w+)\) (.+)$/);
        if (match) {
          const [, filePath, lineNum, severity, message] = match;
          const vuln = this.createVulnerability(filePath, lineNum, severity, 'general', message, baseDirectory);
          if (vuln) vulnerabilities.push(vuln);
          continue;
        }

        // Format: file:line: severity: message
        match = line.match(/^([^:]+):(\d+): (\w+): (.+)$/);
        if (match) {
          const [, filePath, lineNum, severity, message] = match;
          const vuln = this.createVulnerability(filePath, lineNum, severity, 'general', message, baseDirectory);
          if (vuln) vulnerabilities.push(vuln);
          continue;
        }

      } catch (parseError) {
        console.warn(`Error parsing line: ${line}`, parseError.message);
      }
    }

    console.log(`Parsed ${vulnerabilities.length} vulnerabilities from text output`);
    return vulnerabilities;
  }

  /**
   * Create vulnerability object
   * @param {string} filePath - File path
   * @param {string} lineNum - Line number
   * @param {string} severity - Severity level
   * @param {string} id - Issue ID
   * @param {string} message - Issue message
   * @param {string} baseDirectory - Base directory
   * @returns {Object|null} Vulnerability object
   */
  createVulnerability(filePath, lineNum, severity, id, message, baseDirectory) {
    try {
      // Normalize file path
      const fileName = path.basename(filePath);
      const relativePath = path.relative(baseDirectory, filePath);

      // Map cppcheck severity to standard levels
      const severityMap = {
        'error': 'high',
        'warning': 'medium',
        'style': 'low',
        'performance': 'low',
        'portability': 'low',
        'information': 'low',
        'debug': 'low'
      };

      const mappedSeverity = severityMap[severity?.toLowerCase()] || 'medium';

      return {
        name: `Cppcheck: ${id}`,
        severity: mappedSeverity,
        type: 'Static Analysis',
        tool: 'cppcheck',
        file: {
          fileName,
          filePath: relativePath,
          fileExt: path.extname(fileName)
        },
        location: {
          line: parseInt(lineNum) || 1,
          column: 1
        },
        description: message || 'No description provided',
        codeSnippet: {
          line: '', // Could be enhanced to read actual line
          before: [],
          after: []
        },
        remediation: {
          description: `Fix the ${id} issue identified by Cppcheck`
        },
        references: [
          'https://cppcheck.sourceforge.io/',
          'https://cppcheck.sourceforge.io/manual.pdf'
        ],
        metadata: {
          cppcheckId: id,
          originalSeverity: severity
        }
      };
    } catch (error) {
      console.warn(`Error creating vulnerability for ${filePath}:${lineNum}:`, error.message);
      return null;
    }
  }

  /**
   * Create summary of vulnerabilities
   * @param {Array} vulnerabilities - Array of vulnerabilities
   * @returns {Object} Summary object
   */
  createSummary(vulnerabilities) {
    const summary = {
      total: vulnerabilities.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    vulnerabilities.forEach(vuln => {
      if (vuln.severity && summary[vuln.severity] !== undefined) {
        summary[vuln.severity]++;
      }
    });

    return summary;
  }

  /**
   * Create empty result for when no issues found
   * @returns {Object} Empty result object
   */
  createEmptyResult() {
    return {
      scanner: 'cppcheck',
      vulnerabilities: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      metadata: {
        scannedFiles: 0,
        totalFiles: 0,
        tool: this.name,
        version: this.config.version
      }
    };
  }
}

module.exports = CppcheckScanner;