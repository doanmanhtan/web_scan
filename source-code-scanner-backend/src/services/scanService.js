// src/services/scanService.js
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { createScanDirectory, getSourceCodeFiles } = require('../utils/fileUtils');
const { countLinesOfCode } = require('../utils/codeParser');
const scannerFactory = require('../scanners/scannerFactory');
const scanRepository = require('../db/repositories/scanRepository');
const vulnerabilityRepository = require('../db/repositories/vulnerabilityRepository');
const appConfig = require('../config/app');
const { maxScanThreads, defaultScanTimeout } = require('../config/scanners');

/**
 * Service for managing scans
 */
class ScanService {
  /**
   * Create a new scan
   * @param {Object} scanData - Scan data
   * @param {Array} files - Uploaded files
   * @param {String} userId - User ID
   * @returns {Object} Created scan
   */
  async createScan(scanData, files, userId) {
    try {
      // Create a unique scan directory
      const { scanId, scanDir, uploadDir, resultsDir } = createScanDirectory();
      
      // Save files to upload directory
      const uploadedFiles = [];
      
      for (const file of files) {
        const destPath = path.join(uploadDir, file.originalname);
        await fs.writeFile(destPath, file.buffer);
        
        uploadedFiles.push({
          originalName: file.originalname,
          fileName: file.originalname,
          filePath: destPath,
          fileSize: file.size,
          fileExt: path.extname(file.originalname)
        });
      }
      
      // Get supported tools
      const tools = scanData.tools || ['semgrep', 'snyk', 'clangtidy'];
      
      // Create scan record
      const scan = await scanRepository.createScan({
        scanId,
        name: scanData.name || `Scan ${new Date().toISOString()}`,
        scanType: scanData.scanType || appConfig.scans.defaultScanType,
        tools,
        uploadedFiles,
        scanDirectory: scanDir,
        createdBy: userId
      });
      
      logger.info(`Scan created: ${scanId}`);
      
      return scan;
    } catch (error) {
      logger.error(`Error creating scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start a scan
   * @param {String} scanId - Scan ID
   * @returns {Object} Updated scan
   */
  async startScan(scanId) {
    try {
      // Get scan by ID
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      if (scan.status === 'in_progress') {
        throw new Error(`Scan already in progress: ${scanId}`);
      }
      
      if (scan.status === 'completed') {
        throw new Error(`Scan already completed: ${scanId}`);
      }
      
      // Update scan status
      const startTime = new Date();
      await scanRepository.updateScan(scanId, {
        status: 'in_progress',
        progress: 0,
        startTime
      });
      
      logger.info(`Starting scan: ${scanId}`);
      
      // Start scan process asynchronously
      this.runScan(scanId).catch(error => {
        logger.error(`Error running scan ${scanId}: ${error.message}`);
        scanRepository.failScan(scanId, error);
      });
      
      return await scanRepository.getScanById(scanId);
    } catch (error) {
      logger.error(`Error starting scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run scan process
   * @param {String} scanId - Scan ID
   */
  async runScan(scanId) {
    try {
      // Get scan by ID
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      // Get upload directory and create results directory
      const uploadDir = path.join(scan.scanDirectory, 'uploads');
      const resultsDir = path.join(scan.scanDirectory, 'results');
      
      fs.ensureDirSync(resultsDir);
      
      // Find all source code files
      const scanProgress = {
        filesScanned: 0,
        progress: 0
      };
      
      // Update progress
      await this.updateScanProgress(scanId, scan, 5, scanProgress);
      
      // Get all source code files
      const allFiles = await getSourceCodeFiles(uploadDir);
      
      if (allFiles.length === 0) {
        logger.warn(`No source code files found in scan ${scanId}`);
        await scanRepository.updateScan(scanId, {
          status: 'completed',
          progress: 100,
          endTime: new Date(),
          duration: new Date() - scan.startTime,
          filesScanned: 0
        });
        return;
      }
      
      // Count lines of code
      const linesOfCodeResult = await countLinesOfCode(allFiles);
      
      // Update progress
      scanProgress.filesScanned = linesOfCodeResult.totalFiles;
      await this.updateScanProgress(scanId, scan, 10, scanProgress);
      
      // Get file extensions for scanner selection
      const fileExtensions = [...new Set(allFiles.map(file => path.extname(file)))];
      
      // Get scanners for selected tools
      const scanners = scan.tools.map(tool => scannerFactory.createScanner(tool));
      
      // Update progress
      await this.updateScanProgress(scanId, scan, 15, scanProgress);
      
      // Run scanners
      const scanResults = [];
      let completedScanners = 0;
      
      // Run scanners in parallel with a limit
      const chunkSize = maxScanThreads;
      const scannerChunks = [];
      
      for (let i = 0; i < scanners.length; i += chunkSize) {
        scannerChunks.push(scanners.slice(i, i + chunkSize));
      }
      
      for (const scannerChunk of scannerChunks) {
        const chunkPromises = scannerChunk.map(async scanner => {
          try {
            const outputPath = path.join(resultsDir, `${scanner.name}-results.json`);
            const scannerResult = await scanner.scanDirectory(uploadDir, outputPath);
            scanResults.push(scannerResult);
            
            // Update progress
            completedScanners++;
            const progressIncrement = 70 / scanners.length; // 70% of progress for scanning
            const newProgress = 15 + (progressIncrement * completedScanners);
            await this.updateScanProgress(scanId, scan, newProgress, scanProgress);
            
            return scannerResult;
          } catch (error) {
            logger.error(`Error running scanner ${scanner.name}: ${error.message}`);
            return {
              scanner: scanner.name,
              vulnerabilities: [],
              summary: {
                total: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
              },
              error: error.message
            };
          }
        });
        
        await Promise.all(chunkPromises);
      }
      
      // Update progress
      await this.updateScanProgress(scanId, scan, 85, scanProgress);
      
      // Process and save vulnerabilities
      await this.processScanResults(scanId, scanResults);
      
      // Update progress
      await this.updateScanProgress(scanId, scan, 95, scanProgress);
      
      // Complete scan
      await scanRepository.completeScan(scanId, {
        filesScanned: linesOfCodeResult.totalFiles,
        linesOfCode: linesOfCodeResult.totalLines,
        issuesCounts: this.aggregateIssueCounts(scanResults)
      });
      
      logger.info(`Scan completed: ${scanId}`);
    } catch (error) {
      logger.error(`Error running scan: ${error.message}`);
      await scanRepository.failScan(scanId, error);
      throw error;
    }
  }

  /**
   * Update scan progress
   * @param {String} scanId - Scan ID
   * @param {Object} scan - Scan object
   * @param {Number} progress - Progress percentage
   * @param {Object} scanProgress - Scan progress data
   */
  async updateScanProgress(scanId, scan, progress, scanProgress) {
    try {
      await scanRepository.updateScanProgress(scanId, 'in_progress', progress);
      
      // Log progress every 10%
      if (Math.floor(progress / 10) > Math.floor(scan.progress / 10)) {
        logger.info(`Scan ${scanId} progress: ${progress}%`);
      }
      
      scanProgress.progress = progress;
    } catch (error) {
      logger.error(`Error updating scan progress: ${error.message}`);
    }
  }

  /**
   * Process scan results and save vulnerabilities
   * @param {String} scanId - Scan ID
   * @param {Array} scanResults - Scan results from all scanners
   */
  async processScanResults(scanId, scanResults) {
    try {
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      // Delete existing vulnerabilities
      await vulnerabilityRepository.deleteVulnerabilitiesByScan(scanId);
      
      // Process vulnerabilities from all scanners
      const vulnerabilities = [];
      
      for (const result of scanResults) {
        if (result.vulnerabilities && result.vulnerabilities.length > 0) {
          for (const vuln of result.vulnerabilities) {
            vulnerabilities.push({
              scan: scanId,
              name: vuln.name,
              severity: vuln.severity,
              type: vuln.type,
              tool: vuln.tool,
              file: vuln.file,
              location: vuln.location,
              description: vuln.description,
              codeSnippet: vuln.codeSnippet,
              remediation: vuln.remediation,
              references: vuln.references,
              status: 'open'
            });
          }
        }
      }
      
      if (vulnerabilities.length > 0) {
        // Insert vulnerabilities in chunks to avoid MongoDB document size limit
        const chunkSize = 100;
        for (let i = 0; i < vulnerabilities.length; i += chunkSize) {
          const chunk = vulnerabilities.slice(i, i + chunkSize);
          await vulnerabilityRepository.createBulkVulnerabilities(chunk);
        }
        
        logger.info(`Saved ${vulnerabilities.length} vulnerabilities for scan ${scanId}`);
      } else {
        logger.info(`No vulnerabilities found for scan ${scanId}`);
      }
    } catch (error) {
      logger.error(`Error processing scan results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aggregate issue counts from all scanners
   * @param {Array} scanResults - Scan results from all scanners
   * @returns {Object} Aggregated issue counts
   */
  aggregateIssueCounts(scanResults) {
    const issuesCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0
    };
    
    for (const result of scanResults) {
      if (result.summary) {
        issuesCounts.critical += result.summary.critical || 0;
        issuesCounts.high += result.summary.high || 0;
        issuesCounts.medium += result.summary.medium || 0;
        issuesCounts.low += result.summary.low || 0;
        issuesCounts.total += result.summary.total || 0;
      }
    }
    
    return issuesCounts;
  }

  /**
   * Get scan by ID
   * @param {String} scanId - Scan ID
   * @returns {Object} Scan
   */
  async getScanById(scanId) {
    try {
      return await scanRepository.getScanById(scanId);
    } catch (error) {
      logger.error(`Error getting scan by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get scan by unique scan ID
   * @param {String} uniqueScanId - Unique scan ID
   * @returns {Object} Scan
   */
  async getScanByUniqueId(uniqueScanId) {
    try {
      return await scanRepository.getScanByUniqueId(uniqueScanId);
    } catch (error) {
      logger.error(`Error getting scan by unique ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all scans with optional filtering
   * @param {Object} filter - Filter criteria
   * @param {Number} limit - Maximum number of results
   * @param {Number} skip - Number of results to skip
   * @returns {Object} Scans with pagination
   */
  async getScans(filter = {}, limit = 10, skip = 0) {
    try {
      const scans = await scanRepository.getScans(filter, limit, skip);
      const total = await scanRepository.countScans(filter);
      
      return {
        scans,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + limit
        }
      };
    } catch (error) {
      logger.error(`Error getting scans: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete scan
   * @param {String} scanId - Scan ID
   * @returns {Boolean} Success status
   */
  async deleteScan(scanId) {
    try {
      // Get scan by ID
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      // Delete vulnerabilities
      await vulnerabilityRepository.deleteVulnerabilitiesByScan(scanId);
      
      // Delete scan record
      await scanRepository.deleteScan(scanId);
      
      // Delete scan directory
      if (scan.scanDirectory && fs.existsSync(scan.scanDirectory)) {
        await fs.remove(scan.scanDirectory);
      }
      
      logger.info(`Scan deleted: ${scanId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get vulnerabilities by scan
   * @param {String} scanId - Scan ID
   * @param {Object} filter - Filter criteria
   * @param {Number} limit - Maximum number of results
   * @param {Number} skip - Number of results to skip
   * @returns {Object} Vulnerabilities with pagination
   */

  // src/services/scanService.js (tiếp tục)
  async getVulnerabilitiesByScan(scanId, filter = {}, limit = 100, skip = 0) {
    try {
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      const vulnerabilities = await vulnerabilityRepository.getVulnerabilitiesByScan(
        scanId, filter, limit, skip
      );
      
      const total = await vulnerabilityRepository.countVulnerabilities({
        ...filter,
        scan: scanId
      });
      
      return {
        vulnerabilities,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + limit
        }
      };
    } catch (error) {
      logger.error(`Error getting vulnerabilities by scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get vulnerability statistics by scan
   * @param {String} scanId - Scan ID
   * @returns {Object} Vulnerability statistics
   */
  async getVulnerabilityStatsByScan(scanId) {
    try {
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      return await vulnerabilityRepository.getVulnerabilityStatsByScan(scanId);
    } catch (error) {
      logger.error(`Error getting vulnerability statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check scanner installation
   * @returns {Object} Installation status for each scanner
   */
  async checkScannerInstallation() {
    try {
      const scanners = scannerFactory.getAllScanners();
      const status = {};
      
      for (const [name, scanner] of Object.entries(scanners)) {
        status[name] = await scanner.checkInstallation();
      }
      
      return status;
    } catch (error) {
      logger.error(`Error checking scanner installation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get scan statistics
   * @param {Object} filter - Filter criteria
   * @returns {Object} Scan statistics
   */
  async getScanStats(filter = {}) {
    try {
      return await scanRepository.getScanStats(filter);
    } catch (error) {
      logger.error(`Error getting scan statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ScanService();