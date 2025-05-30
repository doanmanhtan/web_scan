// src/scanners/clangTidyScanner.js - FIXED PATH ISSUE
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class ClangTidyScanner {
  constructor() {
    this.name = 'clangtidy';
    this.config = { path: '/usr/bin/clang-tidy' };
  }

  async checkInstallation() {
    return new Promise((resolve) => {
      exec('clang-tidy --version', (error) => {
        resolve(!error);
      });
    });
  }

  async scanDirectory(directory, outputPath) {
    // console.log('ClangTidy scanning:', directory);
    
    try {
      fs.ensureDirSync(path.dirname(outputPath));
      
      // ABSOLUTE PATH để tránh confusion
      const absoluteDir = path.resolve(directory);
      // console.log('Absolute directory:', absoluteDir);
      
      // Find C files
      const files = fs.readdirSync(absoluteDir).filter(f => f.endsWith('.c') || f.endsWith('.cpp'));
      // console.log('Found files:', files);
      
      if (files.length === 0) {
        fs.writeFileSync(outputPath, JSON.stringify({scanner: 'clangtidy', issues: []}));
        return {scanner: 'clangtidy', vulnerabilities: [], summary: {total: 0, high: 0, medium: 0, low: 0}};
      }
      
      const allIssues = [];
      
      for (const file of files) {
        const absoluteFilePath = path.join(absoluteDir, file);
        // console.log(`\nScanning: ${file}`);
        // console.log(`Full path: ${absoluteFilePath}`);
        // console.log(`File exists: ${fs.existsSync(absoluteFilePath)}`);
        
        // CHẠY TỪ ROOT DIRECTORY, không phải từ uploads directory
        const command = `clang-tidy "${absoluteFilePath}"`;
        // console.log(`Running: ${command}`);
        // console.log(`Working dir: ${process.cwd()}`);
        
        try {
          const { stdout, stderr } = await this.runCommand(command, process.cwd());
          const output = stdout + stderr;
          
          // console.log('=== RAW OUTPUT ===');
          // console.log(output);
          // console.log('=== END OUTPUT ===');
          
          // Parse issues from output
          this.parseIssues(output, file, allIssues);
          
        } catch (error) {
          // console.log('Command failed but checking output...');
          const output = error.stdout + error.stderr;
          
          // console.log('=== ERROR OUTPUT ===');
          // console.log(output);
          // console.log('=== END ERROR OUTPUT ===');
          
          // Parse issues from error output too
          this.parseIssues(output, file, allIssues);
        }
      }
      
      console.log(`\nTotal issues found: ${allIssues.length}`);
      
      // Save to JSON
      const result = {
        scanner: 'clangtidy',
        timestamp: new Date().toISOString(),
        totalIssues: allIssues.length,
        issues: allIssues
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      // console.log('Results saved to:', outputPath);
      
      // Format for service
      const vulnerabilities = allIssues.map(issue => ({
        name: 'ClangTidy Issue',
        severity: issue.level === 'error' ? 'high' : 'medium',
        type: this.getIssueType(issue.message),
        tool: 'clangtidy',
        file: {
          fileName: issue.file,
          filePath: issue.file,
          fileExt: path.extname(issue.file)
        },
        location: { line: issue.line, column: issue.column || 1 },
        description: issue.message,
        codeSnippet: { line: '', before: [], after: [] },
        remediation: { description: this.getRemediation(issue.message) },
        status: 'open'
      }));
      
      return {
        scanner: 'clangtidy',
        vulnerabilities,
        summary: {
          total: vulnerabilities.length,
          critical: 0,
          high: vulnerabilities.filter(v => v.severity === 'high').length,
          medium: vulnerabilities.filter(v => v.severity === 'medium').length,
          low: 0
        }
      };
      
    } catch (error) {
      console.error('ClangTidy error:', error);
      return {scanner: 'clangtidy', vulnerabilities: [], summary: {total: 0, high: 0, medium: 0, low: 0}};
    }
  }
  
  parseIssues(output, fileName, allIssues) {
    const lines = output.split('\n');
    
    for (const line of lines) {
      // ONLY PARSE REAL CODE ISSUES - skip path/config errors
      if ((line.includes('warning:') || line.includes('error:')) && 
          !line.includes('no input files') &&
          !line.includes('no such file or directory') &&
          !line.includes('unable to handle compilation') &&
          !line.includes('Error reading configuration') &&
          line.includes(fileName)) {
        
        // console.log('FOUND REAL ISSUE:', line);
        
        // Parse: filename.c:line:col: level: message
        const match = line.match(/([^:]+):(\d+):(\d+):\s+(warning|error):\s+(.+)/);
        
        if (match) {
          const [, file, lineNum, colNum, level, message] = match;
          
          allIssues.push({
            file: fileName,
            line: parseInt(lineNum) || 1,
            column: parseInt(colNum) || 1,
            level: level,
            message: message.trim()
          });
          
          // console.log('Added issue:', {file: fileName, line: lineNum, message: message.trim()});
        }
      }
    }
  }
  
  getIssueType(message) {
    if (message.includes('overflow') || message.includes('buffer')) return 'Security';
    if (message.includes('memory') || message.includes('malloc') || message.includes('free')) return 'Memory Safety';
    if (message.includes('performance')) return 'Performance';
    return 'Code Quality';
  }
  
  getRemediation(message) {
    if (message.includes('overflow')) return 'Use safer string functions and check buffer bounds';
    if (message.includes('undeclared')) return 'Include the appropriate header file';
    if (message.includes('free')) return 'Manage memory carefully to avoid double-free or use-after-free';
    return 'Fix according to ClangTidy suggestions';
  }
  
  runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

module.exports = new ClangTidyScanner();