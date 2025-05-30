
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
    
    // Try different command variations//nho sua
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
    console.log(`\n✅ SNYK SCAN COMPLETED`);
    console.log(`Snyk found ${summary.total} total issues:`);
    console.log(`- Critical: ${summary.critical}`);
    console.log(`- High: ${summary.high}`);
    console.log(`- Medium: ${summary.medium}`);
    console.log(`- Low: ${summary.low}`);
      return {
      scanner: this.name,
      vulnerabilities,
      summary
    };
  }
}

module.exports = new SnykScanner();