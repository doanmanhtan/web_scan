// src/scanners/scannerFactory.js
const { scannerConfig } = require('../config/scanners');
const semgrepScanner = require('./semgrepScanner');
const snykScanner = require('./snykScanner');
const clangTidyScanner = require('./clangTidyScanner');
const logger = require('../utils/logger');

/**
 * Factory class for creating scanner instances
 */
class ScannerFactory {
  /**
   * Create scanner by name
   * @param {String} scannerName - Name of the scanner
   * @returns {Object} Scanner instance
   */
  createScanner(scannerName) {
    switch (scannerName.toLowerCase()) {
      case 'semgrep':
        return semgrepScanner;
      case 'snyk':
        return snykScanner;
      case 'clangtidy':
        return clangTidyScanner;
      default:
        logger.error(`Unknown scanner: ${scannerName}`);
        throw new Error(`Unknown scanner: ${scannerName}`);
    }
  }

  /**
   * Get all available scanners
   * @returns {Object} Object with scanner instances
   */
  getAllScanners() {
    return {
      semgrep: semgrepScanner,
      snyk: snykScanner,
      clangtidy: clangTidyScanner
    };
  }

  /**
   * Get scanners for specific file types
   * @param {Array} fileExtensions - Array of file extensions
   * @returns {Array} Array of scanner instances
   */
  getScannersForFileTypes(fileExtensions) {
    const supportedScanners = [];
    
    Object.entries(scannerConfig).forEach(([scannerName, config]) => {
      // Check if any of the file extensions is supported by this scanner
      const isSupported = fileExtensions.some(ext => 
        config.supportedFileTypes.includes(ext.toLowerCase())
      );
      
      if (isSupported) {
        supportedScanners.push(this.createScanner(scannerName));
      }
    });
    
    return supportedScanners;
  }
}

module.exports = new ScannerFactory();



