
// src/scanners/scannerFactory.js - UNIFIED VERSION (supports both old and new patterns)
const logger = require('../utils/logger');
const configService = require('../services/configService');

// Import OLD pattern scanners (objects)
const snykScanner = require('./snykScanner');           // old object pattern
const semgrepScanner = require('./semgrepScanner');     // old object pattern  
const clangTidyScanner = require('./clangTidyScanner'); // old object pattern

// Import NEW pattern scanners (classes) - with fallback
let CppcheckScanner, ClangStaticAnalyzerScanner;
try {
  CppcheckScanner = require('./cppcheckScanner');
} catch (error) {
  console.warn('⚠️ CppcheckScanner not found:', error.message);
}

try {
  ClangStaticAnalyzerScanner = require('./clangStaticAnalyzerScanner');
} catch (error) {
  console.warn('⚠️ ClangStaticAnalyzerScanner not found:', error.message);
}

/**
 * Unified Scanner Factory - Works with both old and new scanner patterns
 */
class ScannerFactory {
  constructor() {
    this.scanners = new Map();
    this.registerScanners();
  }

  /**
   * Register all available scanner types (mixed patterns)
   */
  registerScanners() {
    console.log('🔧 Registering scanners in unified factory...');
    
    // Register OLD pattern scanners (objects)
    this.scanners.set('snyk', { type: 'object', scanner: snykScanner });
    this.scanners.set('semgrep', { type: 'object', scanner: semgrepScanner });
    this.scanners.set('clangTidy', { type: 'object', scanner: clangTidyScanner });
    
    // Register NEW pattern scanners (classes) - if available
    if (CppcheckScanner) {
      this.scanners.set('cppcheck', { type: 'class', scanner: CppcheckScanner });
    } else {
      console.warn('⚠️ cppcheck scanner not available');
    }
    
    if (ClangStaticAnalyzerScanner) {
      this.scanners.set('clangStaticAnalyzer', { type: 'class', scanner: ClangStaticAnalyzerScanner });
    } else {
      console.warn('⚠️ clangStaticAnalyzer scanner not available');
    }
    
    for (const [name, config] of this.scanners) {
      const scannerName = config.type === 'class' ? config.scanner.name : config.scanner.name || name;
    }
  }

  /**
   * Create a scanner instance (unified for both patterns)
   * @param {string} scannerType - Type of scanner to create
   * @returns {Object} Scanner instance
   */
  createScanner(scannerType) {
    
    if (!this.scanners.has(scannerType)) {
      throw new Error(`Unknown scanner type: ${scannerType}`);
    }
    
    const scannerConfig = this.scanners.get(scannerType);
    const dynamicConfig = configService.getScannerConfig(scannerType);
    
    if (!dynamicConfig || !dynamicConfig.enabled) {
      throw new Error(`Scanner ${scannerType} is not enabled or configured`);
    }

    
    if (scannerConfig.type === 'class') {
      // NEW pattern: Class-based scanner
      const ScannerClass = scannerConfig.scanner;
      return new ScannerClass(dynamicConfig);
    } else {
      // OLD pattern: Object-based scanner
      const scanner = scannerConfig.scanner;
      // Update scanner config with dynamic values
      scanner.config = { ...scanner.config, ...dynamicConfig };
      return scanner;
    }
  }

  /**
   * Normalize scanner name to handle variations
   * @param {string} scannerType - Scanner type input
   * @returns {string} Normalized scanner name
   */
  normalizeScannerName(scannerType) {
    const name = scannerType.toLowerCase().trim();
    
    // Handle common variations
    const nameMap = {
      // Clang variations
      'clangtidy': 'clangTidy',
      'clang-tidy': 'clangTidy',
      'clang_tidy': 'clangTidy',
      'clangtidyscanner': 'clangTidy',
      
      // Clang Static Analyzer variations
      'clangstaticanalyzer': 'clangStaticAnalyzer',
      'clang-static-analyzer': 'clangStaticAnalyzer',
      'clang_static_analyzer': 'clangStaticAnalyzer',
      'clangstatic': 'clangStaticAnalyzer',
      'staticanalyzer': 'clangStaticAnalyzer',
      'static-analyzer': 'clangStaticAnalyzer',
      'clang-analyzer': 'clangStaticAnalyzer',
      
      // Cppcheck variations
      'cppcheck': 'cppcheck',
      'cpp-check': 'cppcheck',
      'cpp_check': 'cppcheck',
      'cppc': 'cppcheck',
      
      // Standard scanners
      'semgrep': 'semgrep',
      'snyk': 'snyk'
    };
    
    return nameMap[name] || scannerType;
  }

  /**
   * Get list of available scanner types
   * @returns {Array} Array of available scanner types
   */
  getAvailableScanners() {
    return Array.from(this.scanners.keys());
  }

  /**
   * Check if scanner type is supported
   * @param {string} scannerType - Scanner type to check
   * @returns {boolean} True if supported
   */
  isScannerSupported(scannerType) {
    const normalizedType = this.normalizeScannerName(scannerType);
    return this.scanners.has(normalizedType);
  }

  /**
   * Get scanner information (unified)
   * @param {string} scannerType - Scanner type
   * @returns {Object} Scanner information
   */
  getScannerInfo(scannerType) {
    try {
      const config = this.scanners.get(this.normalizeScannerName(scannerType));
      if (!config) return null;

      if (config.type === 'class') {
        // NEW pattern: Create instance to get info
        const scanner = new config.scanner();
        return {
          name: scanner.name,
          description: scanner.config?.description || 'No description',
          version: scanner.config?.version || '1.0',
          supportedLanguages: scanner.config?.supportedLanguages || [],
          website: scanner.config?.website || '',
          pattern: 'class'
        };
      } else {
        // OLD pattern: Extract info from object
        const scanner = config.scanner;
        return {
          name: scanner.name || scannerType,
          description: scanner.description || 'Legacy scanner',
          version: scanner.version || '1.0',
          supportedLanguages: scanner.supportedLanguages || [],
          website: scanner.website || '',
          pattern: 'object'
        };
      }
    } catch (error) {
      console.warn(`Error getting scanner info for ${scannerType}:`, error.message);
      return null;
    }
  }

  /**
   * Check installation status of all scanners (unified)
   * @returns {Promise<Object>} Installation status for all scanners
   */
  async checkAllScannersInstallation() {
    console.log('🔍 Checking installation status of all scanners...');
    
    const results = {};
    const availableScanners = this.getAvailableScanners();
    
    for (const scannerType of availableScanners) {
      try {
        console.log(`\n🔧 Checking ${scannerType}...`);
        const config = this.scanners.get(scannerType);
        
        if (!config) {
          results[scannerType] = {
            installed: false,
            error: 'Scanner not found',
            name: scannerType
          };
          continue;
        }

        let scanner;
        if (config.type === 'class') {
          scanner = new config.scanner();
        } else {
          scanner = config.scanner;
        }
        
        if (scanner.checkInstallation) {
          const isInstalled = await scanner.checkInstallation();
          results[scannerType] = {
            installed: isInstalled,
            name: scanner.name || scannerType,
            version: scanner.config?.version || scanner.version || 'unknown',
            pattern: config.type
          };
          console.log(`   ${scannerType}: ${isInstalled ? '✅ INSTALLED' : '❌ NOT INSTALLED'} (${config.type})`);
        } else {
          results[scannerType] = {
            installed: true, // Assume installed if no check method
            name: scanner.name || scannerType,
            version: scanner.config?.version || scanner.version || 'unknown',
            note: 'No installation check available',
            pattern: config.type
          };
          console.log(`   ${scannerType}: ✅ ASSUMED INSTALLED (no check method, ${config.type})`);
        }
      } catch (error) {
        results[scannerType] = {
          installed: false,
          error: error.message,
          name: scannerType
        };
        console.log(`   ${scannerType}: ❌ ERROR - ${error.message}`);
      }
    }
    
    const installedCount = Object.values(results).filter(r => r.installed).length;
    console.log(`\n📊 Installation Summary: ${installedCount}/${availableScanners.length} scanners installed`);
    
    return results;
  }

  /**
   * Get scanners that are ready to use
   * @returns {Promise<Array>} Array of ready scanner types
   */
  async getReadyScanners() {
    const installationStatus = await this.checkAllScannersInstallation();
    return Object.keys(installationStatus).filter(scannerType => 
      installationStatus[scannerType].installed
    );
  }

  /**
   * Legacy compatibility method
   * @param {String} scannerName - Name of the scanner
   * @returns {Object} Scanner instance
   */
  createScannerLegacy(scannerName) {
    // Map legacy names to new names
    const legacyMap = {
      'clangtidy': 'clangTidy',
      'clang_static_analyzer': 'clangStaticAnalyzer',
      'clangstaticanalyzer': 'clangStaticAnalyzer',
      'clang-static-analyzer': 'clangStaticAnalyzer'
    };
    
    const normalizedName = legacyMap[scannerName.toLowerCase()] || scannerName;
    return this.createScanner(normalizedName);
  }

  /**
   * Get all scanners (legacy compatibility)
   * @returns {Object} Object with scanner instances
   */
  getAllScanners() {
    const result = {};
    
    for (const [name, config] of this.scanners) {
      try {
        if (config.type === 'class') {
          result[name] = new config.scanner();
        } else {
          result[name] = config.scanner;
        }
      } catch (error) {
        console.warn(`Error getting scanner ${name}:`, error.message);
      }
    }
    
    return result;
  }
}

// Export singleton instance
module.exports = new ScannerFactory();