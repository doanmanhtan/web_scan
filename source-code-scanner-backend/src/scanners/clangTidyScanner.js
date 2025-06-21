// src/scanners/clangTidyScanner.js - FIXED TOOL NAME
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class ClangTidyScanner {
  constructor() {
    // FIXED: Use camelCase tool name to match database enum
    this.name = 'clangTidy'; // Changed from 'clangtidy' to 'clangTidy'
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
    try {
      fs.ensureDirSync(path.dirname(outputPath));
      
      // ABSOLUTE PATH để tránh confusion
      const absoluteDir = path.resolve(directory);
      
      // Find C files
      const files = fs.readdirSync(absoluteDir).filter(f => f.endsWith('.c') || f.endsWith('.cpp'));
      
      if (files.length === 0) {
        fs.writeFileSync(outputPath, JSON.stringify({scanner: 'clangTidy', issues: []}));
        return {scanner: 'clangTidy', vulnerabilities: [], summary: {total: 0, high: 0, medium: 0, low: 0}};
      }
      
      const allIssues = [];
      
      for (const file of files) {
        const absoluteFilePath = path.join(absoluteDir, file);
        
        // CHẠY TỪ ROOT DIRECTORY, không phải từ uploads directory
        const command = `clang-tidy "${absoluteFilePath}"`;
        
        try {
          const { stdout, stderr } = await this.runCommand(command, process.cwd());
          const output = stdout + stderr;
          
          // Parse issues from output
          this.parseIssues(output, file, allIssues);
          
        } catch (error) {
          const output = error.stdout + error.stderr;
          
          // Parse issues from error output too
          this.parseIssues(output, file, allIssues);
        }
      }
      
      console.log(`\n✅ CLANGTIDY SCAN COMPLETED`);
      console.log(`ClangTidy found ${allIssues.length} total issues`);
      
      // Save to JSON
      const result = {
        scanner: 'clangTidy', // FIXED: Use camelCase
        timestamp: new Date().toISOString(),
        totalIssues: allIssues.length,
        issues: allIssues
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      
      // Format for service
      const vulnerabilities = allIssues.map(issue => ({
        name: issue.message || 'ClangTidy Issue',
        severity: issue.level === 'error' ? 'high' : 'medium',
        type: this.getIssueType(issue.message),
        tool: 'clangTidy', // FIXED: Use camelCase to match database enum
        file: {
          fileName: issue.file,
          filePath: issue.file,
          fileExt: path.extname(issue.file)
        },
        location: { line: issue.line, column: issue.column || 1 },
        description: issue.message || 'No description provided',
        codeSnippet: { 
          line: 'Code snippet not available', // FIXED: Provide default value
          before: [], 
          after: [] 
        },
        remediation: { description: this.getRemediation(issue.message) },
        references: [ // FIXED: Provide as string array
          'https://clang.llvm.org/extra/clang-tidy/',
          'https://clang.llvm.org/extra/clang-tidy/checks/list.html'
        ],
        status: 'open'
      }));
      
      console.log(`📊 ClangTidy Summary: Total=${vulnerabilities.length}, High=${vulnerabilities.filter(v => v.severity === 'high').length}, Medium=${vulnerabilities.filter(v => v.severity === 'medium').length}`);
      
      return {
        scanner: 'clangTidy', // FIXED: Use camelCase
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
      return {scanner: 'clangTidy', vulnerabilities: [], summary: {total: 0, high: 0, medium: 0, low: 0}};
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