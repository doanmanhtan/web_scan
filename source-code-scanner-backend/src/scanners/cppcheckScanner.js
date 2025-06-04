// src/scanners/CppcheckScanner.js - FIXED VERSION WITH XML PARSING
const BaseScanner = require('./BaseScanner');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Cppcheck static analysis scanner for C/C++ code - FIXED VERSION
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
   * Scan directory with cppcheck - FIXED VERSION
   * @param {string} directory - Directory to scan
   * @param {string} outputPath - Output file path
   * @returns {Promise<Object>} Scan results
   */
  async scanDirectory(directory, outputPath) {
    try {
      console.log(`\n=== Starting FIXED Cppcheck Scan ===`);
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

      // FIXED: Build enhanced commands with better XML parsing
      const commands = [
        // MAIN: XML output with all checks enabled
        `${this.cppcheckPath} --enable=all --xml --xml-version=2 --output-file="${xmlOutputPath}" "${directory}" 2>&1`,
        
        // FALLBACK 1: Template output to stderr
        `${this.cppcheckPath} --enable=all --template="{file}:{line}:{severity}:{id}:{message}" "${directory}" 2>&1`,
        
        // FALLBACK 2: Simple text output
        `${this.cppcheckPath} --enable=all "${directory}" 2>&1`,
        
        // FALLBACK 3: Error-only scan
        `${this.cppcheckPath} --enable=error,warning "${directory}" 2>&1`
      ];

      let vulnerabilities = [];
      let scanSuccessful = false;

      // Try commands in order
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`\n🔍 Trying cppcheck strategy ${i + 1}/${commands.length}:`);
        console.log(`Command: ${command}`);

        try {
          // FIXED: Better execution with proper error handling
          const result = await this.executeCommand(command);
          
          console.log(`Strategy ${i + 1} exit code: ${result.exitCode}`);
          console.log(`Stdout length: ${result.stdout.length}`);
          console.log(`Stderr length: ${result.stderr.length}`);

          // Strategy 1: Try XML parsing first
          if (i === 0 && fs.existsSync(xmlOutputPath)) {
            console.log(`📄 XML file created: ${xmlOutputPath}`);
            const xmlStats = fs.statSync(xmlOutputPath);
            console.log(`📄 XML file size: ${xmlStats.size} bytes`);
            
            if (xmlStats.size > 100) { // XML has content
              vulnerabilities = this.parseXmlOutput(xmlOutputPath, directory);
              if (vulnerabilities.length > 0) {
                scanSuccessful = true;
                console.log(`✅ XML parsing found ${vulnerabilities.length} vulnerabilities`);
                break;
              } else {
                console.log(`⚠️ XML parsing found no vulnerabilities`);
              }
            }
          }
          
          // Fallback: Parse text output
          const textOutput = result.stderr || result.stdout;
          if (textOutput && textOutput.trim()) {
            console.log(`📝 Parsing text output (${textOutput.length} chars)...`);
            const textVulns = this.parseTextOutput(textOutput, directory);
            
            if (textVulns.length > 0) {
              vulnerabilities = textVulns;
              scanSuccessful = true;
              console.log(`✅ Text parsing found ${vulnerabilities.length} vulnerabilities`);
              break;
            } else {
              console.log(`⚠️ Text parsing found no vulnerabilities`);
            }
          }

        } catch (error) {
          console.log(`❌ Strategy ${i + 1} failed: ${error.message}`);
          
          // Even on error, try to parse any output
          if (error.stdout || error.stderr) {
            const output = error.stderr || error.stdout;
            const errorVulns = this.parseTextOutput(output, directory);
            if (errorVulns.length > 0) {
              vulnerabilities = errorVulns;
              scanSuccessful = true;
              console.log(`✅ Found ${vulnerabilities.length} vulnerabilities in error output`);
              break;
            }
          }
        }
      }

      if (!scanSuccessful || vulnerabilities.length === 0) {
        console.log(`⚠️ All strategies failed or found no issues`);
        // FIXED: Still create result with file count
        return this.createEmptyResult(sourceFiles.length);
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
          scanDuration: 0,
          tool: this.name,
          version: this.config.version
        }
      };

      // Save results to JSON file
      await fs.writeJSON(outputPath, result, { spaces: 2 });
      console.log(`Results written to: ${outputPath}`);

      console.log(`\n✅ FIXED CPPCHECK SCAN COMPLETED`);
      console.log(`Cppcheck found ${summary.total} total issues:`);
      console.log(`- Critical: ${summary.critical}`);
      console.log(`- High: ${summary.high}`);
      console.log(`- Medium: ${summary.medium}`);
      console.log(`- Low: ${summary.low}`);

      return result;

    } catch (error) {
      console.error(`💥 Fixed Cppcheck scan error:`, error.message);
      logger.error(`Fixed Cppcheck scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * FIXED: Execute command with better error handling
   * @param {string} command - Command to execute
   * @returns {Promise<Object>} Execution result
   */
  async executeCommand(command) {
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutMs,
        maxBuffer: 20 * 1024 * 1024, // 20MB buffer
        shell: true
      });

      return {
        exitCode: 0,
        stdout: stdout || '',
        stderr: stderr || ''
      };
    } catch (error) {
      // Cppcheck often returns non-zero exit code when issues found
      return {
        exitCode: error.code || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        error: error.message
      };
    }
  }

  /**
   * FIXED: Parse XML output from cppcheck with REAL implementation
   * @param {string} xmlPath - Path to XML output file
   * @param {string} baseDirectory - Base directory for relative paths
   * @returns {Array} Array of vulnerabilities
   */
  parseXmlOutput(xmlPath, baseDirectory) {
    try {
      console.log(`🔍 Parsing XML file: ${xmlPath}`);
      
      const xmlContent = fs.readFileSync(xmlPath, 'utf8');
      console.log(`📄 XML content length: ${xmlContent.length} characters`);
      
      // Simple XML parsing without external dependencies
      const vulnerabilities = [];
      
      // Find all <error> tags
      const errorMatches = xmlContent.match(/<error[^>]*>[\s\S]*?<\/error>/g);
      
      if (!errorMatches) {
        console.log(`⚠️ No <error> tags found in XML`);
        return [];
      }
      
      console.log(`🔍 Found ${errorMatches.length} error entries in XML`);
      
      for (const errorMatch of errorMatches) {
        try {
          const vuln = this.parseXmlError(errorMatch, baseDirectory);
          if (vuln) {
            vulnerabilities.push(vuln);
          }
        } catch (parseError) {
          console.warn(`Error parsing XML error entry:`, parseError.message);
        }
      }
      
      console.log(`✅ Parsed ${vulnerabilities.length} vulnerabilities from XML`);
      return vulnerabilities;
      
    } catch (error) {
      console.error(`Error parsing XML output: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse individual XML error entry
   * @param {string} errorXml - XML error entry
   * @param {string} baseDirectory - Base directory
   * @returns {Object|null} Vulnerability object
   */
  parseXmlError(errorXml, baseDirectory) {
    try {
      // Extract attributes from <error> tag
      const idMatch = errorXml.match(/id="([^"]+)"/);
      const severityMatch = errorXml.match(/severity="([^"]+)"/);
      const msgMatch = errorXml.match(/msg="([^"]+)"/);
      const verboseMatch = errorXml.match(/verbose="([^"]+)"/);
      const cweMatch = errorXml.match(/cwe="([^"]+)"/);
      
      // Extract first <location> tag
      const locationMatch = errorXml.match(/<location[^>]*>/);
      
      if (!idMatch || !severityMatch || !msgMatch || !locationMatch) {
        console.warn(`Incomplete XML error entry - missing required fields`);
        return null;
      }
      
      const id = idMatch[1];
      const severity = severityMatch[1];
      const message = this.decodeXmlEntities(msgMatch[1]);
      const verbose = verboseMatch ? this.decodeXmlEntities(verboseMatch[1]) : message;
      const cwe = cweMatch ? cweMatch[1] : null;
      
      // Extract location details
      const fileMatch = locationMatch[0].match(/file="([^"]+)"/);
      const lineMatch = locationMatch[0].match(/line="([^"]+)"/);
      const columnMatch = locationMatch[0].match(/column="([^"]+)"/);
      
      if (!fileMatch || !lineMatch) {
        console.warn(`Incomplete location info in XML error entry`);
        return null;
      }
      
      const filePath = fileMatch[1];
      const line = parseInt(lineMatch[1]) || 1;
      const column = parseInt(columnMatch ? columnMatch[1] : '1') || 1;
      
      // FIXED: Filter out information-only messages
      if (severity === 'information' && 
          (message.includes('Include file:') || 
           message.includes('not found') || 
           message.includes('checkers:'))) {
        return null;
      }
      
      return this.createVulnerability(filePath, line, severity, id, verbose, baseDirectory, { cwe, column });
      
    } catch (error) {
      console.warn(`Error parsing XML error entry:`, error.message);
      return null;
    }
  }

  /**
   * Decode XML entities
   * @param {string} str - String with XML entities
   * @returns {string} Decoded string
   */
  decodeXmlEntities(str) {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  /**
   * ENHANCED: Parse text output from cppcheck
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
        // Skip information lines
        if (line.includes('Checking ') || 
            line.includes('done') || 
            line.includes('Include file:') ||
            line.includes('not found') ||
            line.includes('checkers:')) {
          continue;
        }

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
   * ENHANCED: Create vulnerability object
   * @param {string} filePath - File path
   * @param {string|number} lineNum - Line number
   * @param {string} severity - Severity level
   * @param {string} id - Issue ID
   * @param {string} message - Issue message
   * @param {string} baseDirectory - Base directory
   * @param {Object} extra - Extra metadata (cwe, column)
   * @returns {Object|null} Vulnerability object
   */
  createVulnerability(filePath, lineNum, severity, id, message, baseDirectory, extra = {}) {
    try {
      // Clean up file path
      let cleanFilePath = filePath.trim();
      
      // Convert to relative path
      const fileName = path.basename(cleanFilePath);
      const relativePath = path.relative(baseDirectory, cleanFilePath);

      // ENHANCED: Map cppcheck severity to standard levels
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

      // ENHANCED: Determine issue type based on ID and CWE
      const issueType = this.determineIssueType(id, message, extra.cwe);

      // ENHANCED: Create detailed vulnerability object
      return {
        name: `Cppcheck: ${this.formatIssueName(id)}`,
        severity: mappedSeverity,
        type: issueType,
        tool: 'cppcheck',
        file: {
          fileName,
          filePath: relativePath,
          fileExt: path.extname(fileName)
        },
        location: {
          line: parseInt(lineNum) || 1,
          column: extra.column || 1
        },
        description: message || 'No description provided',
        codeSnippet: {
          line: '',
          before: [],
          after: []
        },
        remediation: {
          description: this.getRemediation(id, message)
        },
        references: [
          'https://cppcheck.sourceforge.io/',
          'https://cppcheck.sourceforge.io/manual.pdf'
        ],
        metadata: {
          cppcheckId: id,
          originalSeverity: severity,
          cwe: extra.cwe || null
        }
      };
    } catch (error) {
      console.warn(`Error creating vulnerability for ${filePath}:${lineNum}:`, error.message);
      return null;
    }
  }

  /**
   * Determine issue type based on ID, message, and CWE
   * @param {string} id - Issue ID
   * @param {string} message - Issue message  
   * @param {string} cwe - CWE ID
   * @returns {string} Issue type
   */
  determineIssueType(id, message, cwe) {
    const text = (id + ' ' + message).toLowerCase();
    
    // Security issues
    if (cwe || text.includes('security') || text.includes('vulnerable') || 
        text.includes('overflow') || text.includes('double') || text.includes('use after')) {
      return 'Security';
    }
    
    // Memory issues
    if (text.includes('memory') || text.includes('buffer') || text.includes('null') || 
        text.includes('uninit') || text.includes('leak') || text.includes('free')) {
      return 'Memory Safety';
    }
    
    // Performance issues
    if (text.includes('performance') || text.includes('slow') || text.includes('inefficient')) {
      return 'Performance';
    }
    
    // Style issues
    if (text.includes('style') || text.includes('unused') || text.includes('const')) {
      return 'Code Quality';
    }
    
    return 'Static Analysis';
  }

  /**
   * Format issue name from ID
   * @param {string} id - Issue ID
   * @returns {string} Formatted name
   */
  formatIssueName(id) {
    if (!id || id === 'general') {
      return 'Code Issue';
    }
    
    // Convert camelCase to readable format
    return id.replace(/([A-Z])/g, ' $1')
             .replace(/([a-z])([A-Z])/g, '$1 $2')
             .trim()
             .toLowerCase()
             .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get remediation advice based on issue
   * @param {string} id - Issue ID
   * @param {string} message - Issue message
   * @returns {string} Remediation advice
   */
  getRemediation(id, message) {
    const text = (id + ' ' + message).toLowerCase();
    
    const remediations = {
      'doublefree': 'Ensure memory is not freed multiple times. Set pointers to NULL after freeing.',
      'deallocuse': 'Do not access memory after it has been freed. Check pointer validity.',
      'memoryleak': 'Ensure all allocated memory is properly freed when no longer needed.',
      'arrayindexoutofbounds': 'Add proper bounds checking before accessing arrays.',
      'bufferaccessoutofbounds': 'Validate buffer bounds before access.',
      'uninitvar': 'Initialize all variables before use.',
      'nullpointer': 'Check for null pointers before dereferencing.',
      'unusedfunction': 'Remove unused functions or mark them as used if needed.',
      'unusedallocatedmemory': 'Use allocated memory or free it if not needed.',
      'constVariable': 'Declare variables as const when they are not modified.'
    };
    
    for (const [pattern, advice] of Object.entries(remediations)) {
      if (text.includes(pattern.toLowerCase())) {
        return advice;
      }
    }
    
    return `Fix the ${id || 'issue'} according to Cppcheck recommendations.`;
  }

  /**
   * Get source files with filtering
   * @param {string} directory - Directory to scan
   * @returns {Array} Array of source file paths
   */
  getSourceFiles(directory) {
    const supportedExtensions = this.config.supportedLanguages.map(lang => `.${lang}`);
    
    const files = [];
    const walkDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip common directories
            if (!['node_modules', '.git', 'build', 'dist'].includes(entry.name)) {
              walkDir(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (supportedExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Cannot read directory ${dir}: ${error.message}`);
      }
    };

    walkDir(directory);
    return files;
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
   * @param {number} fileCount - Number of files scanned
   * @returns {Object} Empty result object
   */
  createEmptyResult(fileCount = 0) {
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
        scannedFiles: fileCount,
        totalFiles: fileCount,
        tool: this.name,
        version: this.config.version
      }
    };
  }
}

module.exports = CppcheckScanner;