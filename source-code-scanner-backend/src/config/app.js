// src/config/app.js
/**
 * Application configuration
 */
const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  
  // File upload settings
  upload: {
    directory: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 1024 * 1024 * 50, // 50MB default
    supportedFileTypes: ['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go']
  },
  
  // Report settings
  reports: {
    directory: process.env.REPORTS_DIR || './reports',
    formats: ['pdf', 'json', 'html', 'csv']
  },
  
  // Scan settings
  scans: {
    directory: process.env.SCAN_RESULTS_DIR || './scans',
    defaultScanType: 'all' // 'all', 'security', 'quality', 'performance'
  }
};

module.exports = appConfig;