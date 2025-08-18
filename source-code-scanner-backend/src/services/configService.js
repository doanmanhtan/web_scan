const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Dynamic Configuration Service
 * Manages scanner configurations that can be updated at runtime
 */
class ConfigService {
  constructor() {
    this.configPath = path.join(__dirname, '../config/dynamic-scanners.json');
    this.config = null;
    this.loadConfig();
  }

  /**
   * Load configuration from file or create default
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        this.lastLoadTime = Date.now();
        // logger.info('Dynamic scanner configuration loaded from file');
      } else {
        this.createDefaultConfig();
      }
    } catch (error) {
      logger.error('Error loading dynamic config:', error);
      this.createDefaultConfig();
    }
  }

  /**
   * Create default configuration based on environment variables
   */
  createDefaultConfig() {
    // Only create default config if no config exists
    if (this.config && Object.keys(this.config).length > 0) {
      logger.info('Config already exists, not overwriting with defaults');
      return;
    }
    
    this.config = {
      semgrep: {
        path: process.env.SEMGREP_PATH || '/usr/local/bin/semgrep',
        enabled: true,
        timeoutMs: parseInt(process.env.SEMGREP_TIMEOUT_MS) || 300000,
        supportedFileTypes: ['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go'],
        rules: process.env.SEMGREP_RULES_PATH || path.join(__dirname, '../rules/semgrep'),
        defaultArgs: ['--json']
      },
      snyk: {
        path: process.env.SNYK_PATH || '/usr/local/bin/snyk',
        enabled: true,
        timeoutMs: parseInt(process.env.SNYK_TIMEOUT_MS) || 800000,
        supportedFileTypes: ['.c', '.cpp', '.h', '.hpp', '.js', '.py', '.java', '.go'],
        rules: null,
        defaultArgs: ['code', 'test', '--json'],
        command: 'code test'
      },
      clangTidy: {
        path: process.env.CLANGTIDY_PATH || '/usr/bin/clang-tidy',
        enabled: true,
        timeoutMs: parseInt(process.env.CLANGTIDY_TIMEOUT_MS) || 300000,
        supportedFileTypes: ['.c', '.cpp', '.h', '.hpp'],
        rules: null,
        defaultArgs: []
      },
      cppcheck: {
        path: process.env.CLANGTIDY_PATH || '/usr/bin/cppcheck',
        enabled: true,
        timeoutMs: parseInt(process.env.CPPCHECK_TIMEOUT_MS) || 180000,
        supportedFileTypes: ['.c', '.cpp', '.h', '.hpp'],
        rules: null,
        defaultArgs: ['--enable=all', '--xml']
      },
      clangStaticAnalyzer: {
        path: process.env.CLANG_STATIC_ANALYZER_PATH || '/usr/bin/scan-build',
        enabled: true,
        timeoutMs: parseInt(process.env.CLANG_STATIC_ANALYZER_TIMEOUT_MS) || 300000,
        supportedFileTypes: ['.c', '.cpp', '.h', '.hpp', '.m', '.mm'],
        rules: null,
        defaultArgs: ['--status-bugs']
      }
    };
    
    this.saveConfig();
    // logger.info('Default scanner configuration created');
  }

  /**
   * Save configuration to file
   */
  saveConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      fs.ensureDirSync(configDir);
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    //   logger.info('Scanner configuration saved to file');
    } catch (error) {
      logger.error('Error saving config:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get configuration for a specific scanner
   */
  getScannerConfig(scannerName) {
   // Always reload config from file to ensure latest changes
    this.reloadConfigIfNeeded();
    
    const config = this.config[scannerName] || null;
    
    return config;
  }

  /**
   * Reload config if file has been modified
   */
  reloadConfigIfNeeded() {
    try {
      if (fs.existsSync(this.configPath)) {
        const stats = fs.statSync(this.configPath);
        const currentMtime = stats.mtime.getTime();
        
        // Check if file has been modified since last load
        if (!this.lastLoadTime || currentMtime > this.lastLoadTime) {
          this.loadConfig();
          this.lastLoadTime = currentMtime;
        }
      }
    } catch (error) {
      logger.error('Error checking config file modification:', error);
    }
  }

  /**
   * Update scanner configuration
   */
  updateScannerConfig(scannerName, updates) {
    if (!this.config[scannerName]) {
      throw new Error(`Unknown scanner: ${scannerName}`);
    }

    // Update only allowed fields
    const allowedFields = ['path', 'enabled', 'timeoutMs'];
    const updatedConfig = { ...this.config[scannerName] };
    
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updatedConfig[field] = value;
      }
    }

    this.config[scannerName] = updatedConfig;
    this.saveConfig();
    return updatedConfig;
  }

  /**
   * Update multiple scanner configurations
   */
  updateMultipleScanners(updates) {
    const results = {};
    
    for (const [scannerName, scannerUpdates] of Object.entries(updates)) {
      try {
        results[scannerName] = this.updateScannerConfig(scannerName, scannerUpdates);
      } catch (error) {
        results[scannerName] = { error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Test if a scanner is accessible at the configured path
   */
  async testScannerConnection(scannerName) {
    const scannerConfig = this.getScannerConfig(scannerName);
    if (!scannerConfig) {
      throw new Error(`Unknown scanner: ${scannerName}`);
    }

    try {
      // Check if file exists and is executable
      const stats = await fs.stat(scannerConfig.path);
      const isExecutable = (stats.mode & fs.constants.X_OK) !== 0;
      
      if (!isExecutable) {
        return {
          success: false,
          message: `File exists but is not executable: ${scannerConfig.path}`,
          path: scannerConfig.path
        };
      }

      return {
        success: true,
        message: `Scanner ${scannerName} is accessible at ${scannerConfig.path}`,
        path: scannerConfig.path
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          message: `File not found: ${scannerConfig.path}`,
          path: scannerConfig.path
        };
      }
      
      return {
        success: false,
        message: `Error accessing file: ${error.message}`,
        path: scannerConfig.path
      };
    }
  }

  /**
   * Test if a scanner is accessible at a specific path
   */
  async testScannerConnectionWithPath(scannerName, testPath) {
    if (!testPath) {
      throw new Error('Test path is required');
    }

    try {
      // Check if file exists and is executable
      const stats = await fs.stat(testPath);
      const isExecutable = (stats.mode & fs.constants.X_OK) !== 0;
      
      if (!isExecutable) {
        return {
          success: false,
          message: `File exists but is not executable: ${testPath}`,
          path: testPath
        };
      }

      return {
        success: true,
        message: `Scanner ${scannerName} is accessible at ${testPath}`,
        path: testPath
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          success: false,
          message: `File not found: ${testPath}`,
          path: testPath
        };
      }
      
      return {
        success: false,
        message: `Error accessing file: ${error.message}`,
        path: testPath
      };
    }
  }

  /**
   * Reload configuration from file
   */
  reloadConfig() {
    this.loadConfig();
    // logger.info('Configuration reloaded from file');
  }

  /**
   * Force reload configuration from file (ignoring cache)
   */
  forceReloadConfig() {
    this.lastLoadTime = 0; // Reset last load time to force reload
    this.loadConfig();
    // logger.info('Configuration force reloaded from file');
  }

  /**
   * Get scanner paths for API compatibility
   */
  getScannerPaths() {
    const paths = {};
    for (const [scanner, config] of Object.entries(this.config)) {
      paths[scanner] = config.path;
    }
    return paths;
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults() {
    this.createDefaultConfig();
    logger.info('Configuration reset to defaults');
    return this.config;
  }
}

// Create singleton instance
const configService = new ConfigService();

module.exports = configService; 