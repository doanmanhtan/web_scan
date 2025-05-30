// src/config/scanners.js
/**
 * Configuration for external scanner tools
 */
const path = require('path');

// Get scanner paths from environment variables or use defaults
const semgrepPath = process.env.SEMGREP_PATH || '/usr/local/bin/semgrep';
console.log('Semgrep path being used:', semgrepPath);
const scannerConfig = {
  semgrep: {
    path: process.env.SEMGREP_PATH || '/usr/local/bin/semgrep',
    defaultArgs: ['--json'],
    timeoutMs: parseInt(process.env.SEMGREP_TIMEOUT_MS) || 300000, // 5 minutes default
    supportedFileTypes: ['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go'],
    rules: process.env.SEMGREP_RULES_PATH || path.join(__dirname, '../rules/semgrep')
    // rules: path.join(__dirname, '../rules')// co thay doi
  },
  snyk: {
    path: process.env.SNYK_PATH || '/usr/local/bin/snyk',
    token: process.env.SNYK_TOKEN,
    defaultArgs: ['code', 'test', '--json'],
    timeoutMs: parseInt(process.env.SNYK_TIMEOUT_MS) || 800000,
    supportedFileTypes: ['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go'],
    rules: null, // Snyk uses its own rule set
    command: 'code test' // Thêm command cụ thể cho Snyk
  },
  // clangTidy: {
  //   path: process.env.CLANGTIDY_PATH || '/usr/bin/clang-tidy',
  //   defaultArgs: ['-p', '.', '--export-fixes=clang-fixes.yaml'],
  //   timeoutMs: parseInt(process.env.CLANGTIDY_TIMEOUT_MS) || 300000,
  //   supportedFileTypes: ['.c', '.cpp', '.h', '.hpp'],
  //   rules: path.join(__dirname, '../rules/quality')
  // }
  clangTidy: {
    path: process.env.CLANGTIDY_PATH || '/usr/bin/clang-tidy',
    defaultArgs: [],
    timeoutMs: parseInt(process.env.CLANGTIDY_TIMEOUT_MS) || 300000,
    supportedFileTypes: ['.c', '.cpp', '.h', '.hpp']
    // NO RULES - ClangTidy uses built-in checks
  }
};

// Maximum threads for parallel scanning
const maxScanThreads = parseInt(process.env.MAX_SCAN_THREADS) || 4;

// Default scan timeout in seconds
const defaultScanTimeout = parseInt(process.env.DEFAULT_SCAN_TIMEOUT) || 300;

module.exports = {
  scannerConfig,
  maxScanThreads,
  defaultScanTimeout
};
