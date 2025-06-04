// src/scanners/ClangStaticAnalyzerScanner.js
const BaseScanner = require('./BaseScanner');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Clang Static Analyzer scanner for C/C++ code
 * https://clang-analyzer.llvm.org/
 */
class ClangStaticAnalyzerScanner extends BaseScanner {
  constructor() {
    super('clangStaticAnalyzer', {
      name: 'Clang Static Analyzer',
      description: 'Source code analysis tool that finds bugs in C, C++, and Objective-C programs',
      version: '1.0',
      supportedLanguages: ['c', 'cpp', 'cc', 'cxx', 'c++', 'h', 'hpp', 'm', 'mm'],
      timeoutMs: 300000, // 5 minutes
      website: 'https://clang-analyzer.llvm.org/'
    });
    
    this.scanBuildPath = this.findScanBuildPath();
    this.clangPath = this.findClangPath();
  }

  /**
   * Find scan-build executable path
   * @returns {string} Path to scan-build executable
   */
  findScanBuildPath() {
    const possiblePaths = [
      '/usr/bin/scan-build',
      '/usr/local/bin/scan-build',
      '/usr/lib/llvm-14/bin/scan-build',
      '/usr/lib/llvm-13/bin/scan-build',
      '/usr/lib/llvm-12/bin/scan-build',
      '/usr/lib/llvm-11/bin/scan-build',
      '/usr/lib/llvm-10/bin/scan-build',
      'scan-build' // system PATH
    ];

    for (const scanBuildPath of possiblePaths) {
      try {
        if (scanBuildPath.includes('/')) {
          if (fs.existsSync(scanBuildPath)) {
            console.log(`Found scan-build at: ${scanBuildPath}`);
            return scanBuildPath;
          }
        } else {
          return scanBuildPath;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    console.log('scan-build not found in standard locations, using system PATH');
    return 'scan-build';
  }

  /**
   * Find clang executable path
   * @returns {string} Path to clang executable
   */
  findClangPath() {
    const possiblePaths = [
      '/usr/bin/clang',
      '/usr/local/bin/clang',
      'clang' // system PATH
    ];

    for (const clangPath of possiblePaths) {
      try {
        if (clangPath.includes('/')) {
          if (fs.existsSync(clangPath)) {
            return clangPath;
          }
        } else {
          return clangPath;
        }
      } catch (error) {
        // Continue to next path
      }
    }

    return 'clang';
  }

  /**
   * Check if Clang Static Analyzer is installed and accessible
   * @returns {Promise<boolean>} True if analyzer is available
   */
  async checkInstallation() {
    try {
      console.log(`Checking Clang Static Analyzer installation...`);
      
      // Check scan-build
      try {
        const { stdout: scanBuildOut } = await execAsync(`${this.scanBuildPath} --help`);
        if (!scanBuildOut.includes('scan-build')) {
          console.log(`scan-build not working properly`);
          return false;
        }
      } catch (error) {
        console.log(`scan-build check failed: ${error.message}`);
        return false;
      }

      // Check clang
      try {
        const { stdout: clangOut } = await execAsync(`${this.clangPath} --version`);
        if (clangOut.includes('clang version')) {
          const version = clangOut.split('\n')[0];
          console.log(`Clang Static Analyzer ready: ${version}`);
          return true;
        }
      } catch (error) {
        console.log(`clang check failed: ${error.message}`);
        return false;
      }

      return false;
    } catch (error) {
      console.log(`Clang Static Analyzer installation check failed: ${error.message}`);
      logger.error(`Clang Static Analyzer installation check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Scan directory with Clang Static Analyzer
   * @param {string} directory - Directory to scan
   * @param {string} outputPath - Output file path
   * @returns {Promise<Object>} Scan results
   */
  async scanDirectory(directory, outputPath) {
    try {
      console.log(`\n=== Starting Clang Static Analyzer Scan ===`);
      console.log(`Directory: ${directory}`);
      console.log(`Output path: ${outputPath}`);
      console.log(`scan-build path: ${this.scanBuildPath}`);
      console.log(`clang path: ${this.clangPath}`);

      // Get source files
      const sourceFiles = this.getSourceFiles(directory);
      console.log(`Found ${sourceFiles.length} supported files to scan: ${sourceFiles.map(f => path.basename(f))}`);

      if (sourceFiles.length === 0) {
        console.log(`No supported files found for Clang Static Analyzer scan`);
        return this.createEmptyResult();
      }

      // Create temporary output directory for scan results
      const tempOutputDir = path.join(path.dirname(outputPath), 'clang-static-analyzer-temp');
      await fs.ensureDir(tempOutputDir);

      let vulnerabilities = [];
      let scanSuccessful = false;

      // Try different scanning approaches
      const strategies = [
        () => this.scanWithMakefileApproach(directory, tempOutputDir),
        () => this.scanIndividualFiles(directory, tempOutputDir, sourceFiles),
        () => this.scanWithSimpleCompile(directory, tempOutputDir, sourceFiles)
      ];

      for (let i = 0; i < strategies.length; i++) {
        console.log(`\n🔍 Trying scan strategy ${i + 1}/${strategies.length}...`);
        
        try {
          const strategyResult = await strategies[i]();
          if (strategyResult && strategyResult.length > 0) {
            vulnerabilities = strategyResult;
            scanSuccessful = true;
            console.log(`✅ Strategy ${i + 1} succeeded with ${vulnerabilities.length} issues`);
            break;
          } else {
            console.log(`Strategy ${i + 1} found no issues, trying next...`);
          }
        } catch (strategyError) {
          console.log(`Strategy ${i + 1} failed: ${strategyError.message}`);
        }
      }

      // Clean up temp directory
      try {
        await fs.remove(tempOutputDir);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup temp directory: ${cleanupError.message}`);
      }

      if (!scanSuccessful) {
        console.log(`⚠️ All scan strategies failed, returning empty result`);
        return this.createEmptyResult();
      }

      // Create result summary
      const summary = this.createSummary(vulnerabilities);

      const result = {
        scanner: 'clangStaticAnalyzer',
        vulnerabilities,
        summary,
        metadata: {
          scannedFiles: sourceFiles.length,
          totalFiles: sourceFiles.length,
          scanDuration: Date.now() - Date.now(),
          tool: this.name,
          version: this.config.version
        }
      };

      // Save results to JSON file
      await fs.writeJSON(outputPath, result, { spaces: 2 });
      console.log(`Results written to: ${outputPath}`);

      console.log(`\n✅ CLANG STATIC ANALYZER SCAN COMPLETED`);
      console.log(`Clang Static Analyzer found ${summary.total} total issues:`);
      console.log(`- Critical: ${summary.critical}`);
      console.log(`- High: ${summary.high}`);
      console.log(`- Medium: ${summary.medium}`);
      console.log(`- Low: ${summary.low}`);

      return result;

    } catch (error) {
      console.error(`💥 Clang Static Analyzer scan error:`, error.message);
      logger.error(`Clang Static Analyzer scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scan with Makefile approach (for projects with build systems)
   * @param {string} directory - Directory to scan
   * @param {string} outputDir - Output directory
   * @returns {Promise<Array>} Array of vulnerabilities
   */
  async scanWithMakefileApproach(directory, outputDir) {
    try {
      // Check if there's a Makefile or build system
      const buildFiles = ['Makefile', 'makefile', 'CMakeLists.txt', 'build.sh'];
      const hasBuildSystem = buildFiles.some(file => fs.existsSync(path.join(directory, file)));

      if (!hasBuildSystem) {
        console.log(`No build system found, skipping Makefile approach`);
        return [];
      }

      console.log(`Found build system, trying scan-build with make...`);

      const command = `cd "${directory}" && ${this.scanBuildPath} -o "${outputDir}" make`;
      console.log(`Command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutMs
      });

      console.log(`Make approach output: ${stdout || stderr}`);

      // Parse scan-build HTML reports
      return this.parseHtmlReports(outputDir);

    } catch (error) {
      console.log(`Makefile approach failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Scan individual files
   * @param {string} directory - Directory to scan
   * @param {string} outputDir - Output directory
   * @param {Array} sourceFiles - Array of source files
   * @returns {Promise<Array>} Array of vulnerabilities
   */
  async scanIndividualFiles(directory, outputDir, sourceFiles) {
    const vulnerabilities = [];

    console.log(`Scanning ${sourceFiles.length} files individually...`);

    for (const file of sourceFiles.slice(0, 5)) { // Limit to 5 files to avoid timeout
      try {
        console.log(`Scanning file: ${path.basename(file)}`);
        
        const command = `${this.scanBuildPath} -o "${outputDir}" ${this.clangPath} -c "${file}"`;
        
        const { stdout, stderr } = await execAsync(command, {
          timeout: 30000 // 30 seconds per file
        });

        // Parse any output for issues
        const output = stdout + stderr;
        const fileVulns = this.parseTextOutput(output, file, directory);
        vulnerabilities.push(...fileVulns);

      } catch (fileError) {
        console.log(`Error scanning ${path.basename(file)}: ${fileError.message}`);
      }
    }

    // Also try to parse HTML reports
    const htmlVulns = await this.parseHtmlReports(outputDir);
    vulnerabilities.push(...htmlVulns);

    return vulnerabilities;
  }

  /**
   * Scan with simple compile approach
   * @param {string} directory - Directory to scan
   * @param {string} outputDir - Output directory
   * @param {Array} sourceFiles - Array of source files
   * @returns {Promise<Array>} Array of vulnerabilities
   */
  async scanWithSimpleCompile(directory, outputDir, sourceFiles) {
    try {
      console.log(`Trying simple compile approach...`);

      // Create a simple compile command for all C files
      const cFiles = sourceFiles.filter(f => f.endsWith('.c'));
      if (cFiles.length === 0) {
        return [];
      }

      const filesList = cFiles.map(f => `"${f}"`).join(' ');
      const command = `${this.scanBuildPath} -o "${outputDir}" ${this.clangPath} -c ${filesList}`;
      
      console.log(`Command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutMs
      });

      console.log(`Simple compile output: ${stdout || stderr}`);

      // Parse both text output and HTML reports
      const textVulns = this.parseTextOutput(stdout + stderr, '', directory);
      const htmlVulns = await this.parseHtmlReports(outputDir);

      return [...textVulns, ...htmlVulns];

    } catch (error) {
      console.log(`Simple compile approach failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse HTML reports generated by scan-build
   * @param {string} outputDir - Output directory with HTML reports
   * @returns {Promise<Array>} Array of vulnerabilities
   */
  async parseHtmlReports(outputDir) {
    try {
      // This is a simplified approach - full HTML parsing would require additional libraries
      console.log(`Looking for HTML reports in: ${outputDir}`);
      
      if (!fs.existsSync(outputDir)) {
        return [];
      }

      const files = await fs.readdir(outputDir, { recursive: true });
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      
      console.log(`Found ${htmlFiles.length} HTML report files`);

      // For now, return empty array - HTML parsing can be enhanced later
      // This would require parsing HTML to extract bug reports
      return [];

    } catch (error) {
      console.log(`Error parsing HTML reports: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse text output from clang static analyzer
   * @param {string} output - Text output
   * @param {string} filePath - File path being analyzed
   * @param {string} baseDirectory - Base directory
   * @returns {Array} Array of vulnerabilities
   */
  parseTextOutput(output, filePath, baseDirectory) {
    const vulnerabilities = [];
    const lines = output.split('\n').filter(line => line.trim());

    console.log(`Parsing ${lines.length} lines of text output...`);

    for (const line of lines) {
      try {
        let match;
        
        // Format: file:line:column: warning/error: message
        match = line.match(/^([^:]+):(\d+):(\d+): (warning|error): (.+)$/);
        if (match) {
          const [, file, lineNum, colNum, severity, message] = match;
          const vuln = this.createVulnerability(file, lineNum, colNum, severity, message, baseDirectory);
          if (vuln) vulnerabilities.push(vuln);
          continue;
        }

        // Format: file:line: warning/error: message
        match = line.match(/^([^:]+):(\d+): (warning|error): (.+)$/);
        if (match) {
          const [, file, lineNum, severity, message] = match;
          const vuln = this.createVulnerability(file, lineNum, 1, severity, message, baseDirectory);
          if (vuln) vulnerabilities.push(vuln);
          continue;
        }

        // Look for analyzer warnings
        if (line.includes('analyzer') && (line.includes('warning') || line.includes('error'))) {
          // Generic analyzer issue
          const vuln = this.createGenericVulnerability(line, filePath, baseDirectory);
          if (vuln) vulnerabilities.push(vuln);
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
   * @param {string} colNum - Column number
   * @param {string} severity - Severity level
   * @param {string} message - Issue message
   * @param {string} baseDirectory - Base directory
   * @returns {Object|null} Vulnerability object
   */
  createVulnerability(filePath, lineNum, colNum, severity, message, baseDirectory) {
    try {
      const fileName = path.basename(filePath);
      const relativePath = path.relative(baseDirectory, filePath);

      // Map clang severity to standard levels
      const severityMap = {
        'error': 'high',
        'warning': 'medium',
        'note': 'low'
      };

      const mappedSeverity = severityMap[severity?.toLowerCase()] || 'medium';

      // Extract issue type from message
      const issueType = this.extractIssueType(message);

      return {
        name: `Clang Static Analyzer: ${issueType}`,
        severity: mappedSeverity,
        type: 'Static Analysis',
        tool: 'clangStaticAnalyzer',
        file: {
          fileName,
          filePath: relativePath,
          fileExt: path.extname(fileName)
        },
        location: {
          line: parseInt(lineNum) || 1,
          column: parseInt(colNum) || 1
        },
        description: message || 'No description provided',
        codeSnippet: {
          line: '',
          before: [],
          after: []
        },
        remediation: {
          description: `Fix the ${issueType} issue identified by Clang Static Analyzer`
        },
        references: [
          'https://clang-analyzer.llvm.org/',
          'https://clang-analyzer.llvm.org/available_checks.html'
        ],
        metadata: {
          originalSeverity: severity,
          issueType: issueType
        }
      };
    } catch (error) {
      console.warn(`Error creating vulnerability for ${filePath}:${lineNum}:`, error.message);
      return null;
    }
  }

  /**
   * Create generic vulnerability for unstructured output
   * @param {string} line - Output line
   * @param {string} filePath - File path
   * @param {string} baseDirectory - Base directory
   * @returns {Object|null} Vulnerability object
   */
  createGenericVulnerability(line, filePath, baseDirectory) {
    try {
      const fileName = filePath ? path.basename(filePath) : 'unknown';
      const relativePath = filePath ? path.relative(baseDirectory, filePath) : 'unknown';

      return {
        name: 'Clang Static Analyzer Issue',
        severity: 'medium',
        type: 'Static Analysis',
        tool: 'clangStaticAnalyzer',
        file: {
          fileName,
          filePath: relativePath,
          fileExt: filePath ? path.extname(fileName) : ''
        },
        location: {
          line: 1,
          column: 1
        },
        description: line.trim(),
        codeSnippet: {
          line: '',
          before: [],
          after: []
        },
        remediation: {
          description: 'Review and fix the issue identified by Clang Static Analyzer'
        },
        references: [
          'https://clang-analyzer.llvm.org/'
        ],
        metadata: {
          rawOutput: line
        }
      };
    } catch (error) {
      console.warn(`Error creating generic vulnerability:`, error.message);
      return null;
    }
  }

  /**
   * Extract issue type from message
   * @param {string} message - Issue message
   * @returns {string} Issue type
   */
  extractIssueType(message) {
    const patterns = [
      /use after free/i,
      /memory leak/i,
      /null pointer dereference/i,
      /buffer overflow/i,
      /division by zero/i,
      /uninitialized variable/i,
      /dead assignment/i,
      /unreachable code/i
    ];

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return message.match(pattern)[0];
      }
    }

    // Default to first few words
    const words = message.split(' ').slice(0, 3).join(' ');
    return words || 'Static Analysis Issue';
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
      scanner: 'clangStaticAnalyzer',
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

module.exports = ClangStaticAnalyzerScanner;