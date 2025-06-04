// // src/scanners/scannerFactory.js
// const { scannerConfig } = require('../config/scanners');
// const semgrepScanner = require('./semgrepScanner');
// const snykScanner = require('./snykScanner');
// const clangTidyScanner = require('./clangTidyScanner');
// const cppcheckScanner = require('./cppcheckScanner'); // NEW
// const clangStaticAnalyzerScanner = require('./clangStaticAnalyzerScanner'); // NEW
// const logger = require('../utils/logger');

// /**
//  * Factory class for creating scanner instances
//  */
// class ScannerFactory {
//   /**
//    * Create scanner by name
//    * @param {String} scannerName - Name of the scanner
//    * @returns {Object} Scanner instance
//    */
//   createScanner(scannerName) {
//     switch (scannerName.toLowerCase()) {
//       case 'semgrep':
//         return semgrepScanner;
//       case 'snyk':
//         return snykScanner;
//       case 'clangtidy':
//         return clangTidyScanner;
//       case 'cppcheck': // NEW
//         return cppcheckScanner;
//       case 'clang_static_analyzer': // NEW
//       case 'clangstaticanalyzer':
//       case 'clang-static-analyzer':
//         return clangStaticAnalyzerScanner;
//       default:
//         logger.error(`Unknown scanner: ${scannerName}`);
//         throw new Error(`Unknown scanner: ${scannerName}`);
//     }
//   }

//  /**
//    * Get all available scanners
//    * @returns {Object} Object with scanner instances
//    */
//  getAllScanners() {
//   return {
//     semgrep: semgrepScanner,
//     snyk: snykScanner,
//     clangtidy: clangTidyScanner,
//     cppcheck: cppcheckScanner, // NEW
//     'clang-static-analyzer': clangStaticAnalyzerScanner // NEW
//   };
// }

// /**
//  * Get scanners for specific file types
//  * @param {Array} fileExtensions - Array of file extensions
//  * @returns {Array} Array of scanner instances
//  */
// getScannersForFileTypes(fileExtensions) {
//   const supportedScanners = [];
  
//   Object.entries(scannerConfig).forEach(([scannerName, config]) => {
//     // Check if any of the file extensions is supported by this scanner
//     const isSupported = fileExtensions.some(ext => 
//       config.supportedFileTypes.includes(ext.toLowerCase())
//     );
    
//     if (isSupported) {
//       try {
//         const scanner = this.createScanner(scannerName);
//         supportedScanners.push({ scanner, name: scannerName });
//       } catch (error) {
//         logger.warn(`Could not create scanner ${scannerName}: ${error.message}`);
//       }
//     }
//   });
  
//   return supportedScanners;
// }

// /**
//  * Get recommended scanners for C/C++ files
//  * @returns {Array} Array of recommended scanner names
//  */
// getRecommendedCppScanners() {
//   return ['semgrep', 'cppcheck', 'clang-static-analyzer', 'clangtidy'];
// }

// /**
//  * Get recommended scanners for JavaScript files
//  * @returns {Array} Array of recommended scanner names
//  */
// getRecommendedJsScanners() {
//   return ['semgrep', 'snyk'];
// }

// /**
//  * Get recommended scanners based on scan type
//  * @param {String} scanType - Type of scan (all, security, quality, etc.)
//  * @returns {Array} Array of recommended scanner names
//  */
// getRecommendedScanners(scanType) {
//   switch (scanType) {
//     case 'security':
//       return ['semgrep', 'snyk', 'cppcheck'];
//     case 'quality':
//       return ['clangtidy', 'cppcheck', 'clang-static-analyzer'];
//     case 'performance':
//       return ['clangtidy', 'clang-static-analyzer'];
//     case 'all':
//     default:
//       return ['semgrep', 'snyk', 'cppcheck', 'clang-static-analyzer', 'clangtidy'];
//   }
// }

// /**
//  * Get all C/C++ specific scanners
//  * @returns {Array} Array of C/C++ scanner instances
//  */
// getCppScanners() {
//   return [
//     cppcheckScanner,
//     clangStaticAnalyzerScanner,
//     clangTidyScanner,
//     semgrepScanner
//   ];
// }

// /**
//  * Check if scanner supports file type
//  * @param {String} scannerName - Scanner name
//  * @param {String} fileExtension - File extension
//  * @returns {Boolean} True if supported
//  */
// supportsFileType(scannerName, fileExtension) {
//   const config = scannerConfig[scannerName];
//   if (!config) return false;
  
//   return config.supportedFileTypes.includes(fileExtension.toLowerCase());
// }

// /**
//  * Get scanner configuration
//  * @param {String} scannerName - Scanner name
//  * @returns {Object|null} Scanner configuration
//  */
// getScannerConfig(scannerName) {
//   return scannerConfig[scannerName] || null;
// }

// /**
//  * Get scanner information including status
//  * @param {String} scannerName - Scanner name
//  * @returns {Object} Scanner information
//  */
// getScannerInfo(scannerName) {
//   const config = scannerConfig[scannerName];
//   if (!config) {
//     throw new Error(`Scanner ${scannerName} not found`);
//   }

//   return {
//     name: scannerName,
//     path: config.path,
//     supportedFileTypes: config.supportedFileTypes,
//     timeoutMs: config.timeoutMs,
//     hasRules: !!config.rules,
//     description: this.getScannerDescription(scannerName)
//   };
// }

// /**
//  * Get scanner description
//  * @param {String} scannerName - Scanner name
//  * @returns {String} Scanner description
//  */
// getScannerDescription(scannerName) {
//   const descriptions = {
//     semgrep: 'Static analysis tool for finding bugs, security issues, and anti-patterns',
//     snyk: 'Security scanner for vulnerabilities and license issues',
//     clangtidy: 'Clang-based C++ linter and static analyzer',
//     cppcheck: 'Static analysis tool specifically for C/C++ code',
//     clangStaticAnalyzer: 'Clang Static Analyzer for finding bugs in C/C++ code'
//   };
  
//   return descriptions[scannerName] || 'Code analysis scanner';
// }

// /**
//  * Get all available scanner names
//  * @returns {Array} Array of scanner names
//  */
// getAvailableScannerNames() {
//   return Object.keys(scannerConfig);
// }

// /**
//  * Get scanner installation status for all scanners
//  * @returns {Object} Installation status for each scanner
//  */
// async checkAllScannersInstallation() {
//   const scanners = this.getAllScanners();
//   const status = {};
  
//   for (const [name, scanner] of Object.entries(scanners)) {
//     try {
//       status[name] = await scanner.checkInstallation();
//     } catch (error) {
//       logger.error(`Error checking ${name} installation: ${error.message}`);
//       status[name] = false;
//     }
//   }
  
//   return status;
// }

// /**
//  * Validate scanner configuration
//  * @param {String} scannerName - Scanner name
//  * @returns {Object} Validation result
//  */
// validateScannerConfig(scannerName) {
//   const config = scannerConfig[scannerName];
  
//   if (!config) {
//     return {
//       valid: false,
//       error: `Scanner ${scannerName} not found in configuration`
//     };
//   }

//   const requiredFields = ['path', 'supportedFileTypes', 'timeoutMs'];
//   const missingFields = requiredFields.filter(field => !config[field]);
  
//   if (missingFields.length > 0) {
//     return {
//       valid: false,
//       error: `Missing required fields: ${missingFields.join(', ')}`
//     };
//   }

//   return {
//     valid: true,
//     config
//   };
// }
// }

// module.exports = new ScannerFactory();



// // src/scanners/scannerFactory.js - UPDATED VERSION
// const logger = require('../utils/logger');

// // Import all scanner classes
// const SnykScanner = require('./SnykScanner');
// const SemgrepScanner = require('./SemgrepScanner');
// const ClangTidyScanner = require('./ClangTidyScanner');
// const CppcheckScanner = require('./CppcheckScanner');               // NEW
// const ClangStaticAnalyzerScanner = require('./ClangStaticAnalyzerScanner'); // NEW

// /**
//  * Scanner Factory - Creates scanner instances
//  */
// class ScannerFactory {
//   constructor() {
//     // Register all available scanners
//     this.scanners = new Map();
//     this.registerScanners();
//   }

//   /**
//    * Register all available scanner types
//    */
//   registerScanners() {
//     console.log('🔧 Registering scanners in factory...');
    
//     // Register each scanner
//     this.scanners.set('snyk', SnykScanner);
//     this.scanners.set('semgrep', SemgrepScanner);
//     this.scanners.set('clangTidy', ClangTidyScanner);
//     this.scanners.set('cppcheck', CppcheckScanner);                           // NEW
//     this.scanners.set('clangStaticAnalyzer', ClangStaticAnalyzerScanner);     // NEW
    
//     console.log(`✅ Registered ${this.scanners.size} scanners:`);
//     for (const [name, ScannerClass] of this.scanners) {
//       console.log(`   - ${name}: ${ScannerClass.name}`);
//     }
//   }

//   /**
//    * Create a scanner instance
//    * @param {string} scannerType - Type of scanner to create
//    * @returns {Object} Scanner instance
//    */
//   createScanner(scannerType) {
//     try {
//       console.log(`🏭 Creating scanner: ${scannerType}`);
      
//       if (!scannerType || typeof scannerType !== 'string') {
//         throw new Error(`Invalid scanner type: ${scannerType}`);
//       }

//       // Normalize scanner name (handle variations)
//       const normalizedType = this.normalizeScannerName(scannerType);
//       console.log(`📝 Normalized scanner name: ${scannerType} -> ${normalizedType}`);

//       const ScannerClass = this.scanners.get(normalizedType);
      
//       if (!ScannerClass) {
//         const availableTypes = Array.from(this.scanners.keys()).join(', ');
//         const errorMsg = `Unknown scanner: ${scannerType}. Available: ${availableTypes}`;
//         console.error(`❌ ${errorMsg}`);
//         logger.error(errorMsg);
//         throw new Error(errorMsg);
//       }

//       console.log(`✅ Found scanner class: ${ScannerClass.name}`);
//       const scannerInstance = new ScannerClass();
//       console.log(`🎯 Created scanner instance: ${scannerInstance.name || scannerType}`);
      
//       return scannerInstance;
      
//     } catch (error) {
//       console.error(`💥 Error creating scanner ${scannerType}:`, error.message);
//       logger.error(`Error creating scanner ${scannerType}: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Normalize scanner name to handle variations
//    * @param {string} scannerType - Scanner type input
//    * @returns {string} Normalized scanner name
//    */
//   normalizeScannerName(scannerType) {
//     const name = scannerType.toLowerCase().trim();
    
//     // Handle common variations
//     const nameMap = {
//       // Clang variations
//       'clangtidy': 'clangTidy',
//       'clang-tidy': 'clangTidy',
//       'clang_tidy': 'clangTidy',
//       'clangtidyscanner': 'clangTidy',
      
//       // Clang Static Analyzer variations
//       'clangstaticanalyzer': 'clangStaticAnalyzer',
//       'clang-static-analyzer': 'clangStaticAnalyzer',
//       'clang_static_analyzer': 'clangStaticAnalyzer',
//       'clangstatic': 'clangStaticAnalyzer',
//       'staticanalyzer': 'clangStaticAnalyzer',
//       'static-analyzer': 'clangStaticAnalyzer',
//       'clang-analyzer': 'clangStaticAnalyzer',
      
//       // Cppcheck variations
//       'cppcheck': 'cppcheck',
//       'cpp-check': 'cppcheck',
//       'cpp_check': 'cppcheck',
//       'cppc': 'cppcheck',
      
//       // Standard scanners
//       'semgrep': 'semgrep',
//       'snyk': 'snyk'
//     };
    
//     return nameMap[name] || scannerType; // Return original if no mapping found
//   }

//   /**
//    * Get list of available scanner types
//    * @returns {Array} Array of available scanner types
//    */
//   getAvailableScanners() {
//     return Array.from(this.scanners.keys());
//   }

//   /**
//    * Check if scanner type is supported
//    * @param {string} scannerType - Scanner type to check
//    * @returns {boolean} True if supported
//    */
//   isScannerSupported(scannerType) {
//     const normalizedType = this.normalizeScannerName(scannerType);
//     return this.scanners.has(normalizedType);
//   }

//   /**
//    * Get scanner information
//    * @param {string} scannerType - Scanner type
//    * @returns {Object} Scanner information
//    */
//   getScannerInfo(scannerType) {
//     try {
//       const scanner = this.createScanner(scannerType);
//       return {
//         name: scanner.name,
//         description: scanner.config?.description || 'No description',
//         version: scanner.config?.version || '1.0',
//         supportedLanguages: scanner.config?.supportedLanguages || [],
//         website: scanner.config?.website || ''
//       };
//     } catch (error) {
//       return null;
//     }
//   }

//   /**
//    * Check installation status of all scanners
//    * @returns {Promise<Object>} Installation status for all scanners
//    */
//   async checkAllScannersInstallation() {
//     console.log('🔍 Checking installation status of all scanners...');
    
//     const results = {};
//     const availableScanners = this.getAvailableScanners();
    
//     for (const scannerType of availableScanners) {
//       try {
//         console.log(`\n🔧 Checking ${scannerType}...`);
//         const scanner = this.createScanner(scannerType);
        
//         if (scanner.checkInstallation) {
//           const isInstalled = await scanner.checkInstallation();
//           results[scannerType] = {
//             installed: isInstalled,
//             name: scanner.name || scannerType,
//             version: scanner.config?.version || 'unknown'
//           };
//           console.log(`   ${scannerType}: ${isInstalled ? '✅ INSTALLED' : '❌ NOT INSTALLED'}`);
//         } else {
//           results[scannerType] = {
//             installed: true, // Assume installed if no check method
//             name: scanner.name || scannerType,
//             version: scanner.config?.version || 'unknown',
//             note: 'No installation check available'
//           };
//           console.log(`   ${scannerType}: ✅ ASSUMED INSTALLED (no check method)`);
//         }
//       } catch (error) {
//         results[scannerType] = {
//           installed: false,
//           error: error.message,
//           name: scannerType
//         };
//         console.log(`   ${scannerType}: ❌ ERROR - ${error.message}`);
//       }
//     }
    
//     const installedCount = Object.values(results).filter(r => r.installed).length;
//     console.log(`\n📊 Installation Summary: ${installedCount}/${availableScanners.length} scanners installed`);
    
//     return results;
//   }

//   /**
//    * Get scanners that are ready to use
//    * @returns {Promise<Array>} Array of ready scanner types
//    */
//   async getReadyScanners() {
//     const installationStatus = await this.checkAllScannersInstallation();
//     return Object.keys(installationStatus).filter(scannerType => 
//       installationStatus[scannerType].installed
//     );
//   }
// }

// // Export singleton instance
// module.exports = new ScannerFactory();

// src/scanners/scannerFactory.js - UNIFIED VERSION (supports both old and new patterns)
const logger = require('../utils/logger');

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
    
    console.log(`✅ Registered ${this.scanners.size} scanners:`);
    for (const [name, config] of this.scanners) {
      const scannerName = config.type === 'class' ? config.scanner.name : config.scanner.name || name;
      console.log(`   - ${name}: ${scannerName} (${config.type})`);
    }
  }

  /**
   * Create a scanner instance (unified for both patterns)
   * @param {string} scannerType - Type of scanner to create
   * @returns {Object} Scanner instance
   */
  createScanner(scannerType) {
    try {
      console.log(`🏭 Creating scanner: ${scannerType}`);
      
      if (!scannerType || typeof scannerType !== 'string') {
        throw new Error(`Invalid scanner type: ${scannerType}`);
      }

      // Normalize scanner name
      const normalizedType = this.normalizeScannerName(scannerType);
      console.log(`📝 Normalized scanner name: ${scannerType} -> ${normalizedType}`);

      const config = this.scanners.get(normalizedType);
      
      if (!config) {
        const availableTypes = Array.from(this.scanners.keys()).join(', ');
        const errorMsg = `Unknown scanner: ${scannerType}. Available: ${availableTypes}`;
        console.error(`❌ ${errorMsg}`);
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      let scannerInstance;
      
      if (config.type === 'class') {
        // NEW pattern: Instantiate class
        console.log(`✅ Creating class instance: ${config.scanner.name}`);
        scannerInstance = new config.scanner();
      } else if (config.type === 'object') {
        // OLD pattern: Return object directly
        console.log(`✅ Using object instance: ${config.scanner.name || normalizedType}`);
        scannerInstance = config.scanner;
      } else {
        throw new Error(`Unknown scanner pattern type: ${config.type}`);
      }
      
      console.log(`🎯 Created scanner instance: ${scannerInstance.name || scannerType}`);
      return scannerInstance;
      
    } catch (error) {
      console.error(`💥 Error creating scanner ${scannerType}:`, error.message);
      logger.error(`Error creating scanner ${scannerType}: ${error.message}`);
      throw error;
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