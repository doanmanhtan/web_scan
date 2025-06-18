// // src/services/scanService.js
// const path = require('path');
// const fs = require('fs-extra');
// const { v4: uuidv4 } = require('uuid');
// const logger = require('../utils/logger');
// const { createScanDirectory, getSourceCodeFiles } = require('../utils/fileUtils');
// const { countLinesOfCode } = require('../utils/codeParser');
// const scannerFactory = require('../scanners/scannerFactory');
// const scanRepository = require('../db/repositories/scanRepository');
// const vulnerabilityRepository = require('../db/repositories/vulnerabilityRepository');
// const appConfig = require('../config/app');
// const { maxScanThreads, defaultScanTimeout } = require('../config/scanners');

// /**
//  * Service for managing scans
//  */
// class ScanService {
//   /**
//    * Create a new scan
//    * @param {Object} scanData - Scan data
//    * @param {Array} files - Uploaded files
//    * @param {String} userId - User ID
//    * @returns {Object} Created scan
//    */
//   async createScan(scanData, files, userId) {
//     try {
//       console.log('====== Starting createScan ======');
//       // Create a unique scan directory
//       const { scanId, scanDir, uploadDir, resultsDir } = createScanDirectory();
      
//       // Save files to upload directory
//       const uploadedFiles = [];
      
//       for (const file of files) {
//         const destPath = path.join(uploadDir, file.originalname);
//         await fs.writeFile(destPath, file.buffer);
        
//         uploadedFiles.push({
//           originalName: file.originalname,
//           fileName: file.originalname,
//           filePath: destPath,
//           fileSize: file.size,
//           fileExt: path.extname(file.originalname)
//         });
//       }
      
//       // Get supported tools
//       let tools = ['semgrep', 'snyk', 'clangtidy']; // Default
//       if (scanData.tools) {
//         try {
//           if (typeof scanData.tools === 'string') {
//             let cleanTools = scanData.tools.trim();
            
//             if (cleanTools.startsWith('`') && cleanTools.endsWith('`')) {
//               cleanTools = cleanTools.slice(1, -1);
//             }
//             if (cleanTools.startsWith('"') && cleanTools.endsWith('"')) {
//               cleanTools = cleanTools.slice(1, -1);
//             }
//             if (cleanTools.startsWith("'") && cleanTools.endsWith("'")) {
//               cleanTools = cleanTools.slice(1, -1);
//             }
            
//             if (cleanTools.startsWith('[') && cleanTools.endsWith(']')) {
//               try {
//                 const parsed = JSON.parse(cleanTools.replace(/'/g, '"'));
//                 if (Array.isArray(parsed)) {
//                   tools = parsed;
//                 } else {
//                   tools = cleanTools.split(',').map(t => t.trim());
//                 }
//               } catch (e) {
//                 tools = cleanTools.split(',').map(t => t.trim());
//               }
//             } else {
//               tools = cleanTools.split(',').map(t => t.trim());
//             }
//           } else if (Array.isArray(scanData.tools)) {
//             tools = scanData.tools;
//           }
          
//           console.log('Final tools to use:', tools);
//         } catch (toolError) {
//           console.error('Error processing tools:', toolError);
//         }
//       }
      
//       // Create scan record
//       const scan = await scanRepository.createScan({
//         scanId,
//         name: scanData.name || `Scan ${new Date().toISOString()}`,
//         scanType: scanData.scanType || appConfig.scans.defaultScanType,
//         tools,
//         uploadedFiles,
//         scanDirectory: scanDir,
//         createdBy: userId
//       });
//       console.log('====== Scan record created successfully ======');
//       logger.info(`Scan created: ${scanId}`);
      
//       return scan;
//     } catch (err) {
//       console.log("Error object:", err);
//       console.log("Error type:", typeof err);
//       console.log("Error properties:", Object.keys(err || {}));
      
//       const errorMessage = err?.message || 'Unknown error';
//       logger.error(`Error creating scan: ${errorMessage}`);
//       throw new Error(`Lỗi khi tạo quét: ${errorMessage}`);
//     }
//   }

//   /**
//    * Start a scan
//    * @param {String} scanId - Scan ID
//    * @returns {Object} Updated scan
//    */
//   async startScan(scanId) {
//     try {
//       // Get scan by ID
//       const scan = await scanRepository.getScanById(scanId);
      
//       if (!scan) {
//         throw new Error(`Scan not found: ${scanId}`);
//       }
      
//       // Check scan status
//       if (scan.status === 'in_progress') {
//         const scanStartTime = new Date(scan.updatedAt);
//         const now = new Date();
//         const diffMinutes = (now - scanStartTime) / (1000 * 60);
        
//         if (diffMinutes > 30) {
//           console.log(`Scan ${scanId} has been running for too long, resetting status`);
//           await scanRepository.updateScan(scanId, { status: 'pending' });
//         } else {
//           throw new Error(`Scan already in progress: ${scanId}`);
//         }
//       }
      
//       if (scan.status === 'completed') {
//         throw new Error(`Scan already completed: ${scanId}`);
//       }
      
//       // Update scan status to in_progress
//       await scanRepository.updateScan(scanId, { 
//         status: 'in_progress',
//         startTime: new Date(), // FIXED: Use startTime instead of startedAt
//         progress: 0
//       });
      
//       // Start scan process
//       this.runScan(scanId).catch(error => {
//         console.error(`Error running scan ${scanId}:`, error);
//         // Update scan status to failed if there's an error
//         scanRepository.updateScan(scanId, { 
//           status: 'failed',
//           error: error.message,
//           endTime: new Date()
//         });
//       });
      
//       return scan;
//     } catch (error) {
//       console.error('Error in startScan:', error);
//       throw error;
//     }
//   }

//   /**
//    * Run scan process with improved error handling
//    * @param {String} scanId - Scan ID
//    */
//   async runScan(scanId) {
//     try {
//       // Get scan by ID
//       const scan = await scanRepository.getScanById(scanId);
      
//       if (!scan) {
//         throw new Error(`Scan not found: ${scanId}`);
//       }
      
//       console.log(`🚀 Starting scan execution for ${scanId}`);
//       console.log(`📁 Scan directory: ${scan.scanDirectory}`);
//       console.log(`🔧 Tools to use: ${scan.tools.join(', ')}`);
      
//       // Get upload directory and create results directory
//       const uploadDir = path.join(scan.scanDirectory, 'uploads');
//       const resultsDir = path.join(scan.scanDirectory, 'results');
      
//       // Validate directories exist
//       if (!fs.existsSync(uploadDir)) {
//         throw new Error(`Upload directory not found: ${uploadDir}`);
//       }
      
//       fs.ensureDirSync(resultsDir);
      
//       // Update progress: 5%
//       await this.updateScanProgress(scanId, 5);
      
//       // Get all source code files
//       const allFiles = await getSourceCodeFiles(uploadDir);
//       console.log(`📄 Found ${allFiles.length} source code files to scan`);
      
//       if (allFiles.length === 0) {
//         console.warn(`⚠️ No source code files found in scan ${scanId}`);
//         await this.completeScanWithNoFiles(scanId);
//         return;
//       }
      
//       // Update progress: 10%
//       await this.updateScanProgress(scanId, 10);
      
//       // Count lines of code
//       const linesOfCodeResult = await countLinesOfCode(allFiles);
//       console.log(`📊 Total lines of code: ${linesOfCodeResult.totalLines}`);
      
//       // Update progress: 15%
//       await this.updateScanProgress(scanId, 15);
      
//       // Get scanners for selected tools with validation
//       const scanners = [];
//       const invalidTools = [];
      
//       for (const tool of scan.tools) {
//         try {
//           const scanner = scannerFactory.createScanner(tool);
          
//           // Check if scanner is properly installed
//           const isInstalled = await scanner.checkInstallation();
//           if (isInstalled) {
//             scanners.push({ scanner, tool });
//             console.log(`✅ ${tool} scanner is ready`);
//           } else {
//             console.warn(`❌ ${tool} scanner is not properly installed, skipping`);
//             invalidTools.push(tool);
//           }
//         } catch (error) {
//           console.error(`❌ Error initializing ${tool} scanner:`, error.message);
//           invalidTools.push(tool);
//         }
//       }
      
//       if (scanners.length === 0) {
//         throw new Error(`No valid scanners available. Invalid tools: ${invalidTools.join(', ')}`);
//       }
      
//       console.log(`🎯 Using ${scanners.length} scanners: ${scanners.map(s => s.tool).join(', ')}`);
      
//       // Update progress: 20%
//       await this.updateScanProgress(scanId, 20);
      
//       // Run scanners with improved error handling
//       const scanResults = [];
//       let completedScanners = 0;
      
//       // Process scanners sequentially to avoid resource conflicts
//       for (const { scanner, tool } of scanners) {
//         try {
//           console.log(`\n🔍 === Starting ${tool} scan ===`);
//           const startTime = Date.now();
          
//           const outputPath = path.join(resultsDir, `${scanner.name}-results.json`);
//           const scannerResult = await this.runScannerWithTimeout(scanner, uploadDir, outputPath, tool);
          
//           const duration = Date.now() - startTime;
//           console.log(`⏱️ ${tool} scan completed in ${(duration/1000).toFixed(2)}s`);
//           console.log(`🎯 ${tool} found ${scannerResult.vulnerabilities?.length || 0} issues`);
          
//           scanResults.push(scannerResult);
          
//           // Update progress (20% + 60% for scanning)
//           completedScanners++;
//           const progressIncrement = 60 / scanners.length;
//           const newProgress = 20 + (progressIncrement * completedScanners);
//           await this.updateScanProgress(scanId, newProgress);
          
//         } catch (scannerError) {
//           console.error(`❌ Error running ${tool} scanner:`, scannerError.message);
          
//           // Add empty result for failed scanner
//           scanResults.push({
//             scanner: tool,
//             vulnerabilities: [],
//             summary: {
//               total: 0,
//               critical: 0,
//               high: 0,
//               medium: 0,
//               low: 0
//             },
//             error: scannerError.message
//           });
          
//           // Still update progress
//           completedScanners++;
//           const progressIncrement = 60 / scanners.length;
//           const newProgress = 20 + (progressIncrement * completedScanners);
//           await this.updateScanProgress(scanId, newProgress);
//         }
//       }
      
//       // Update progress: 85%
//       await this.updateScanProgress(scanId, 85);
      
//       // Process and save vulnerabilities
//       console.log(`\n💾 Processing and saving scan results...`);
//       await this.processScanResults(scanId, scanResults);
      
//       // Update progress: 95%
//       await this.updateScanProgress(scanId, 95);
      
//       // Complete scan
//       const issuesCounts = this.aggregateIssueCounts(scanResults);
//       console.log(`\n🎉 Scan completed with ${issuesCounts.total} total issues:`);
//       console.log(`   - Critical: ${issuesCounts.critical}`);
//       console.log(`   - High: ${issuesCounts.high}`);
//       console.log(`   - Medium: ${issuesCounts.medium}`);
//       console.log(`   - Low: ${issuesCounts.low}`);
      
//       await scanRepository.completeScan(scanId, {
//         filesScanned: linesOfCodeResult.totalFiles,
//         linesOfCode: linesOfCodeResult.totalLines,
//         issuesCounts
//       });
      
//       console.log(`✅ Scan ${scanId} completed successfully!`);
//       logger.info(`Scan completed: ${scanId}`);
      
//     } catch (error) {
//       console.error(`💥 Error running scan ${scanId}:`, error.message);
//       logger.error(`Error running scan: ${error?.message || 'Unknown error'}`);
      
//       // Ensure error object exists before passing to failScan
//       const errorToReport = error || new Error('Unknown scan error');
//       await scanRepository.failScan(scanId, errorToReport);
//       throw errorToReport;
//     }
//   }

//   /**
//    * Complete scan when no files are found
//    * @param {String} scanId - Scan ID
//    */
//   async completeScanWithNoFiles(scanId) {
//     await scanRepository.updateScan(scanId, {
//       status: 'completed',
//       progress: 100,
//       endTime: new Date(),
//       filesScanned: 0,
//       linesOfCode: 0,
//       issuesCounts: {
//         critical: 0,
//         high: 0,
//         medium: 0,
//         low: 0,
//         total: 0
//       }
//     });
//     logger.info(`Scan ${scanId} completed with no files`);
//   }

//   /**
//    * FIXED: Simplified update scan progress method
//    * @param {String} scanId - Scan ID
//    * @param {Number} progress - Progress percentage
//    */
//   async updateScanProgress(scanId, progress) {
//     try {
//       await scanRepository.updateScanProgress(scanId, 'in_progress', progress);
//       console.log(`📈 Progress updated: ${progress}%`);
//     } catch (error) {
//       console.error(`Error updating scan progress:`, error.message);
//       logger.error(`Error updating scan progress: ${error.message}`);
//     }
//   }

//   /**
//    * Run a scanner with timeout and better error handling
//    * @param {Object} scanner - Scanner instance
//    * @param {String} uploadDir - Upload directory
//    * @param {String} outputPath - Output file path
//    * @param {String} toolName - Tool name for logging
//    * @returns {Promise<Object>} Scanner results
//    */
//   async runScannerWithTimeout(scanner, uploadDir, outputPath, toolName) {
//     return new Promise(async (resolve, reject) => {
//       // Set up timeout
//       const timeout = setTimeout(() => {
//         reject(new Error(`${toolName} scan timed out after ${scanner.config.timeoutMs || 300000}ms`));
//       }, scanner.config.timeoutMs || 300000);
      
//       try {
//         console.log(`🏃 Running ${toolName} scanner on ${uploadDir}`);
//         const result = await scanner.scanDirectory(uploadDir, outputPath);
        
//         clearTimeout(timeout);
        
//         // Validate result structure
//         if (!result || typeof result !== 'object') {
//           throw new Error(`${toolName} returned invalid result format`);
//         }
        
//         // Ensure required properties exist
//         if (!result.vulnerabilities) {
//           result.vulnerabilities = [];
//         }
        
//         if (!result.summary) {
//           result.summary = {
//             total: result.vulnerabilities.length,
//             critical: 0,
//             high: 0,
//             medium: 0,
//             low: 0
//           };
          
//           // Calculate summary from vulnerabilities if missing
//           result.vulnerabilities.forEach(vuln => {
//             if (vuln.severity && result.summary[vuln.severity] !== undefined) {
//               result.summary[vuln.severity]++;
//             }
//           });
//         }
        
//         // LOG DETAILED STATS FOR EACH SCANNER
//         console.log(`\n=== ${toolName.toUpperCase()} SCAN RESULTS ===`);
//         console.log(`${toolName} scan completed with ${result.summary.total} total issues:`);
//         console.log(`- Critical: ${result.summary.critical}`);
//         console.log(`- High: ${result.summary.high}`);
//         console.log(`- Medium: ${result.summary.medium}`);
//         console.log(`- Low: ${result.summary.low}`);
        
//         if (result.vulnerabilities.length > 0) {
//           console.log(`\n${toolName} found issues in:`);
//           const fileStats = {};
//           result.vulnerabilities.forEach(vuln => {
//             const fileName = vuln.file?.fileName || 'unknown';
//             fileStats[fileName] = (fileStats[fileName] || 0) + 1;
//           });
          
//           Object.entries(fileStats).forEach(([file, count]) => {
//             console.log(`  - ${file}: ${count} issues`);
//           });
//         } else {
//           console.log(`${toolName} found no issues`);
//         }
//         console.log(`=== END ${toolName.toUpperCase()} RESULTS ===\n`);
        
//         resolve(result);
//       } catch (error) {
//         clearTimeout(timeout);
//         console.error(`❌ ${toolName} scanner error:`, error.message);
//         reject(error);
//       }
//     });
//   }

//   /**
//    * FIXED: Enhanced error handling for process scan results
//    * @param {String} scanId - Scan ID
//    * @param {Array} scanResults - Scan results from all scanners
//    */
//   async processScanResults(scanId, scanResults) {
//     try {
//       const scan = await scanRepository.getScanById(scanId);
      
//       if (!scan) {
//         throw new Error(`Scan not found: ${scanId}`);
//       }
      
//       console.log(`💾 Processing results from ${scanResults.length} scanners`);
      
//       // Delete existing vulnerabilities
//       const deleteResult = await vulnerabilityRepository.deleteVulnerabilitiesByScan(scanId);
//       console.log(`🗑️ Deleted ${deleteResult.deletedCount || 0} existing vulnerabilities`);
      
//       // Process vulnerabilities from all scanners
//       const vulnerabilities = [];
//       let totalProcessed = 0;
      
//       for (const result of scanResults) {
//         if (!result.vulnerabilities || !Array.isArray(result.vulnerabilities)) {
//           console.warn(`⚠️ Invalid vulnerabilities array from ${result.scanner || 'unknown'} scanner`);
//           continue;
//         }
        
//         console.log(`🔍 Processing ${result.vulnerabilities.length} vulnerabilities from ${result.scanner || 'unknown'}`);
        
//         for (const vuln of result.vulnerabilities) {
//           try {
//             // FIXED: More comprehensive validation
//             if (!vuln.name || !vuln.severity || !vuln.tool) {
//               console.warn('⚠️ Skipping invalid vulnerability:', {
//                 name: vuln.name,
//                 severity: vuln.severity,
//                 tool: vuln.tool,
//                 hasName: !!vuln.name,
//                 hasSeverity: !!vuln.severity,
//                 hasTool: !!vuln.tool
//               });
//               continue;
//             }
            
//             // FIXED: Ensure proper ObjectId conversion for scan field
//             const vulnerabilityDoc = {
//               scan: scanId, // This should be the MongoDB ObjectId
//               name: vuln.name,
//               severity: vuln.severity,
//               type: vuln.type || 'Unknown',
//               tool: vuln.tool,
//               file: vuln.file || { fileName: 'unknown', filePath: 'unknown', fileExt: '' },
//               location: vuln.location || { line: 1, column: 1 },
//               description: vuln.description || 'No description provided',
//               codeSnippet: vuln.codeSnippet || { line: '', before: [], after: [] },
//               remediation: vuln.remediation || { description: 'No remediation provided' },
//               references: vuln.references || [],
//               status: 'open',
//               createdAt: new Date(),
//               updatedAt: new Date()
//             };
            
//             vulnerabilities.push(vulnerabilityDoc);
//             totalProcessed++;
//           } catch (vulnError) {
//             console.error('❌ Error processing vulnerability:', vulnError.message, vuln);
//           }
//         }
//       }
      
//       console.log(`✅ Processed ${totalProcessed} vulnerabilities total`);
      
//       if (vulnerabilities.length > 0) {
//         console.log(`💾 Saving ${vulnerabilities.length} vulnerabilities to database...`);
        
//         // FIXED: Insert vulnerabilities in smaller chunks with better error handling
//         const chunkSize = 50; // Reduced chunk size
//         let insertedCount = 0;
//         let errorCount = 0;
        
//         for (let i = 0; i < vulnerabilities.length; i += chunkSize) {
//           const chunk = vulnerabilities.slice(i, i + chunkSize);
//           try {
//             console.log(`💾 Inserting chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(vulnerabilities.length/chunkSize)} (${chunk.length} items)...`);
            
//             const insertResult = await vulnerabilityRepository.createBulkVulnerabilities(chunk);
//             insertedCount += chunk.length;
            
//             console.log(`✅ Successfully inserted chunk: ${insertedCount}/${vulnerabilities.length} vulnerabilities`);
//           } catch (insertError) {
//             errorCount += chunk.length;
//             console.error(`❌ Error inserting vulnerability chunk ${i}-${i + chunkSize}:`, insertError.message);
            
//             // Try inserting individually to identify problematic records
//             for (const vuln of chunk) {
//               try {
//                 await vulnerabilityRepository.createVulnerability(vuln);
//                 insertedCount++;
//                 errorCount--;
//               } catch (singleError) {
//                 console.error(`❌ Failed to insert individual vulnerability:`, singleError.message, vuln.name);
//               }
//             }
//           }
//         }
        
//         console.log(`🎯 Database save complete: ${insertedCount} inserted, ${errorCount} failed`);
//         logger.info(`Saved ${insertedCount} vulnerabilities for scan ${scanId}`);
        
//         // Verify insertion by counting
//         const savedCount = await vulnerabilityRepository.countVulnerabilities({ scan: scanId });
//         console.log(`✅ Verification: ${savedCount} vulnerabilities now in database for scan ${scanId}`);
//       } else {
//         console.log(`ℹ️ No vulnerabilities to save for scan ${scanId}`);
//         logger.info(`No vulnerabilities found for scan ${scanId}`);
//       }
//     } catch (error) {
//       console.error(`💥 Error processing scan results for ${scanId}:`, error.message);
//       console.error(`Stack trace:`, error.stack);
//       logger.error(`Error processing scan results: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Aggregate issue counts from all scanners
//    * @param {Array} scanResults - Scan results from all scanners
//    * @returns {Object} Aggregated issue counts
//    */
//   aggregateIssueCounts(scanResults) {
//     const issuesCounts = {
//       critical: 0,
//       high: 0,
//       medium: 0,
//       low: 0,
//       total: 0
//     };
    
//     console.log('\n=== AGGREGATING RESULTS FROM ALL SCANNERS ===');
    
//     const scannerBreakdown = {};
    
//     for (const result of scanResults) {
//       if (result.summary) {
//         const scannerName = result.scanner || 'unknown';
        
//         scannerBreakdown[scannerName] = {
//           critical: result.summary.critical || 0,
//           high: result.summary.high || 0,
//           medium: result.summary.medium || 0,
//           low: result.summary.low || 0,
//           total: result.summary.total || 0
//         };
        
//         issuesCounts.critical += result.summary.critical || 0;
//         issuesCounts.high += result.summary.high || 0;
//         issuesCounts.medium += result.summary.medium || 0;
//         issuesCounts.low += result.summary.low || 0;
//         issuesCounts.total += result.summary.total || 0;
//       }
//     }
    
//     // LOG BREAKDOWN BY SCANNER
//     console.log('\nIssues breakdown by scanner:');
//     Object.entries(scannerBreakdown).forEach(([scanner, counts]) => {
//       console.log(`\n📊 ${scanner.toUpperCase()}:`);
//       console.log(`  - Critical: ${counts.critical}`);
//       console.log(`  - High: ${counts.high}`);
//       console.log(`  - Medium: ${counts.medium}`);
//       console.log(`  - Low: ${counts.low}`);
//       console.log(`  - Total: ${counts.total}`);
//     });
    
//     console.log('\n🔢 COMBINED TOTALS:');
//     console.log(`  - Critical: ${issuesCounts.critical}`);
//     console.log(`  - High: ${issuesCounts.high}`);
//     console.log(`  - Medium: ${issuesCounts.medium}`);
//     console.log(`  - Low: ${issuesCounts.low}`);
//     console.log(`  - GRAND TOTAL: ${issuesCounts.total}`);
//     console.log('=== END AGGREGATION ===\n');
    
//     return issuesCounts;
//   }

//   /**
//    * Get scan by ID
//    * @param {String} scanId - Scan ID
//    * @returns {Object} Scan
//    */
//   async getScanById(scanId) {
//     try {
//       return await scanRepository.getScanById(scanId);
//     } catch (error) {
//       logger.error(`Error getting scan by ID: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Get scan by unique scan ID
//    * @param {String} uniqueScanId - Unique scan ID
//    * @returns {Object} Scan
//    */
//   async getScanByUniqueId(uniqueScanId) {
//     try {
//       return await scanRepository.getScanByUniqueId(uniqueScanId);
//     } catch (error) {
//       logger.error(`Error getting scan by unique ID: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Get all scans with optional filtering
//    * @param {Object} filter - Filter criteria
//    * @param {Number} limit - Maximum number of results
//    * @param {Number} skip - Number of results to skip
//    * @returns {Object} Scans with pagination
//    */
//   async getScans(filter = {}, limit = 10, skip = 0) {
//     try {
//       const scans = await scanRepository.getScans(filter, limit, skip);
//       const total = await scanRepository.countScans(filter);
      
//       return {
//         scans,
//         pagination: {
//           total,
//           limit,
//           skip,
//           hasMore: total > skip + limit
//         }
//       };
//     } catch (error) {
//       logger.error(`Error getting scans: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Delete scan
//    * @param {String} scanId - Scan ID
//    * @returns {Boolean} Success status
//    */
//   async deleteScan(scanId) {
//     try {
//       // Get scan by ID
//       const scan = await scanRepository.getScanById(scanId);
      
//       if (!scan) {
//         throw new Error(`Scan not found: ${scanId}`);
//       }
      
//       // Delete vulnerabilities
//       await vulnerabilityRepository.deleteVulnerabilitiesByScan(scanId);
      
//       // Delete scan record
//       await scanRepository.deleteScan(scanId);
      
//       // Delete scan directory
//       if (scan.scanDirectory && fs.existsSync(scan.scanDirectory)) {
//         await fs.remove(scan.scanDirectory);
//       }
      
//       logger.info(`Scan deleted: ${scanId}`);
      
//       return true;
//     } catch (error) {
//       logger.error(`Error deleting scan: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Get vulnerabilities by scan
//    * @param {String} scanId - Scan ID
//    * @param {Object} filter - Filter criteria
//    * @param {Number} limit - Maximum number of results
//    * @param {Number} skip - Number of results to skip
//    * @returns {Object} Vulnerabilities with pagination
//    */
//   async getVulnerabilitiesByScan(scanId, filter = {}, limit = 100, skip = 0) {
//     try {
//       const scan = await scanRepository.getScanById(scanId);
      
//       if (!scan) {
//         throw new Error(`Scan not found: ${scanId}`);
//       }
      
//       const vulnerabilities = await vulnerabilityRepository.getVulnerabilitiesByScan(
//         scanId, filter, limit, skip
//       );
      
//       const total = await vulnerabilityRepository.countVulnerabilities({
//         ...filter,
//         scan: scanId
//       });
      
//       return {
//         vulnerabilities,
//         pagination: {
//           total,
//           limit,
//           skip,
//           hasMore: total > skip + limit
//         }
//       };
//     } catch (error) {
//       logger.error(`Error getting vulnerabilities by scan: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Get vulnerability statistics by scan
//    * @param {String} scanId - Scan ID
//    * @returns {Object} Vulnerability statistics
//    */
//   async getVulnerabilityStatsByScan(scanId) {
//     try {
//       const scan = await scanRepository.getScanById(scanId);
      
//       if (!scan) {
//         throw new Error(`Scan not found: ${scanId}`);
//       }
      
//       return await vulnerabilityRepository.getVulnerabilityStatsByScan(scanId);
//     } catch (error) {
//       logger.error(`Error getting vulnerability statistics: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Check scanner installation
//    * @returns {Object} Installation status for each scanner
//    */
//   async checkScannerInstallation() {
//     try {
//       const scanners = scannerFactory.getAllScanners();
//       const status = {};
      
//       for (const [name, scanner] of Object.entries(scanners)) {
//         status[name] = await scanner.checkInstallation();
//       }
      
//       return status;
//     } catch (error) {
//       logger.error(`Error checking scanner installation: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Get scan statistics
//    * @param {Object} filter - Filter criteria
//    * @returns {Object} Scan statistics
//    */
//   async getScanStats(filter = {}) {
//     try {
//       return await scanRepository.getScanStats(filter);
//     } catch (error) {
//       logger.error(`Error getting scan statistics: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Reset stuck scan - Helper method for debugging
//    * @param {String} scanId - Scan ID
//    * @returns {Object} Updated scan
//    */
//   async resetStuckScan(scanId) {
//     try {
//       const scan = await scanRepository.getScanById(scanId);
      
//       if (!scan) {
//         throw new Error(`Scan not found: ${scanId}`);
//       }
      
//       console.log(`🔄 Resetting stuck scan ${scanId}`);
      
//       // Delete any existing vulnerabilities
//       await vulnerabilityRepository.deleteVulnerabilitiesByScan(scanId);
      
//       // Reset scan to pending state
//       await scanRepository.updateScan(scanId, {
//         status: 'pending',
//         progress: 0,
//         startTime: null,
//         endTime: null,
//         error: null,
//         filesScanned: 0,
//         linesOfCode: 0,
//         issuesCounts: {
//           critical: 0,
//           high: 0,
//           medium: 0,
//           low: 0,
//           total: 0
//         }
//       });
      
//       console.log(`✅ Scan ${scanId} has been reset to pending`);
//       logger.info(`Reset stuck scan: ${scanId}`);
      
//       return await scanRepository.getScanById(scanId);
//     } catch (error) {
//       console.error(`Error resetting stuck scan:`, error);
//       logger.error(`Error resetting stuck scan: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Force complete a scan with current results - Helper for debugging
//    * @param {String} scanId - Scan ID
//    * @returns {Object} Updated scan
//    */
//   async forceCompleteScan(scanId) {
//     try {
//       const scan = await scanRepository.getScanById(scanId);
      
//       if (!scan) {
//         throw new Error(`Scan not found: ${scanId}`);
//       }
      
//       console.log(`🏁 Force completing scan ${scanId}`);
      
//       // Count existing vulnerabilities
//       const vulnerabilityCount = await vulnerabilityRepository.countVulnerabilities({ scan: scanId });
//       const vulnerabilityStats = await vulnerabilityRepository.getVulnerabilityStatsByScan(scanId);
      
//       // Update scan to completed status with current counts
//       await scanRepository.updateScan(scanId, {
//         status: 'completed',
//         progress: 100,
//         endTime: new Date(),
//         issuesCounts: vulnerabilityStats.bySeverity || {
//           critical: 0,
//           high: 0,
//           medium: 0,
//           low: 0,
//           total: vulnerabilityCount
//         }
//       });
      
//       console.log(`✅ Scan ${scanId} force completed with ${vulnerabilityCount} vulnerabilities`);
//       logger.info(`Force completed scan: ${scanId} with ${vulnerabilityCount} vulnerabilities`);
      
//       return await scanRepository.getScanById(scanId);
//     } catch (error) {
//       console.error(`Error force completing scan:`, error);
//       logger.error(`Error force completing scan: ${error.message}`);
//       throw error;
//     }
//   }
// }

// module.exports = new ScanService();//// cai nay khi chua them cppcheck va clangtidy analist


// src/services/scanService.js - FIXED VERSION
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { createScanDirectory, getSourceCodeFiles } = require('../utils/fileUtils');
const { countLinesOfCode } = require('../utils/codeParser');
const scannerFactory = require('../scanners/scannerFactory');
const scanRepository = require('../db/repositories/scanRepository');
const vulnerabilityRepository = require('../db/repositories/vulnerabilityRepository');
const appConfig = require('../config/app');

// FIXED: Import availableScanners correctly
const { maxScanThreads, defaultScanTimeout } = require('../config/scanners');

// FIXED: Define available scanners directly
const availableScanners = ['semgrep', 'snyk', 'clangTidy', 'cppcheck', 'clangStaticAnalyzer'];

/**
 * Service for managing scans - FIXED VERSION
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
      console.log('====== Starting createScan ======');
      console.log('Scan data received:', scanData);
      
      // FIXED: Handle array name issue
      let scanName = scanData.name;
      if (Array.isArray(scanName)) {
        scanName = scanName[0]; // Take first element
      }
      // Remove quotes if present
      scanName = scanName?.replace(/^["']|["']$/g, '') || `Scan ${new Date().toISOString()}`;
      
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
      
      // Process and validate tools selection
      let tools = this.processToolsSelection(scanData.tools);
      
      // Validate tools against available scanners
      tools = this.validateAndFilterTools(tools);
      
      console.log('Final validated tools to use:', tools);
      
      // Create scan record
      const scan = await scanRepository.createScan({
        scanId,
        name: scanName, // FIXED: Use processed name
        scanType: scanData.scanType || appConfig.scans.defaultScanType,
        tools,
        uploadedFiles,
        scanDirectory: scanDir,
        createdBy: userId
      });
      
      console.log('====== Scan record created successfully ======');
      logger.info(`Scan created: ${scanId}`);
      
      return scan;
    } catch (err) {
      console.log("Error object:", err);
      console.log("Error type:", typeof err);
      console.log("Error properties:", Object.keys(err || {}));
      
      const errorMessage = err?.message || 'Unknown error';
      logger.error(`Error creating scan: ${errorMessage}`);
      throw new Error(`Lỗi khi tạo quét: ${errorMessage}`);
    }
  }

  /**
   * Process tools selection from request - FIXED
   * @param {*} toolsInput - Tools input from request
   * @returns {Array} Processed tools array
   */
  processToolsSelection(toolsInput) {
    console.log('Processing tools input:', toolsInput);
    
    // Default to all available scanners
    let tools = [...availableScanners]; // FIXED: Now works correctly
    
    if (toolsInput) {
      try {
        if (typeof toolsInput === 'string') {
          let cleanTools = toolsInput.trim();
          
          // Remove various quote types
          if (cleanTools.startsWith('`') && cleanTools.endsWith('`')) {
            cleanTools = cleanTools.slice(1, -1);
          }
          if (cleanTools.startsWith('"') && cleanTools.endsWith('"')) {
            cleanTools = cleanTools.slice(1, -1);
          }
          if (cleanTools.startsWith("'") && cleanTools.endsWith("'")) {
            cleanTools = cleanTools.slice(1, -1);
          }
          
          // Handle JSON array format
          if (cleanTools.startsWith('[') && cleanTools.endsWith(']')) {
            try {
              const parsed = JSON.parse(cleanTools.replace(/'/g, '"'));
              if (Array.isArray(parsed)) {
                tools = parsed;
              } else {
                tools = cleanTools.slice(1, -1).split(',').map(t => t.trim());
              }
            } catch (e) {
              tools = cleanTools.slice(1, -1).split(',').map(t => t.trim());
            }
          } else {
            // Comma-separated string
            tools = cleanTools.split(',').map(t => t.trim());
          }
        } else if (Array.isArray(toolsInput)) {
          tools = toolsInput;
        }
        
        console.log('Processed tools from input:', tools);
      } catch (toolError) {
        console.error('Error processing tools:', toolError);
        // Keep default tools on error
      }
    }
    
    return tools;
  }

  /**
   * Validate and filter tools against available scanners - FIXED
   * @param {Array} tools - Tools to validate
   * @returns {Array} Valid tools only
   */
  validateAndFilterTools(tools) {
    const validTools = [];
    const invalidTools = [];
    
    tools.forEach(tool => {
      const normalizedTool = tool.toLowerCase().trim();
      
      // Map common variations to actual scanner names
      const toolMapping = {
        // 'clang-static-analyzer': 'clangStaticAnalyzer',
        // 'clang_static_analyzer': 'clangStaticAnalyzer',
        // 'clang-tidy': 'clangTidy',
        // 'clang_tidy': 'clangTidy',
        // 'cpp-check': 'cppcheck',
        // 'cpp_check': 'cppcheck'
        'clangtidy': 'clangTidy',
        'clang-tidy': 'clangTidy', 
        'clang_tidy': 'clangTidy',
        'clangstaticanalyzer': 'clangStaticAnalyzer',
        'clang-static-analyzer': 'clangStaticAnalyzer',
        'clang_static_analyzer': 'clangStaticAnalyzer',
        'cppcheck': 'cppcheck',
        'cpp-check': 'cppcheck',
        'cpp_check': 'cppcheck',
        'semgrep': 'semgrep',
        'snyk': 'snyk'
      };
      
      const mappedTool = toolMapping[normalizedTool] || normalizedTool;
      
      // FIXED: Check against availableScanners array
      if (availableScanners.includes(mappedTool)) {
        validTools.push(mappedTool);
      } else {
        invalidTools.push(tool);
      }
    });
    
    if (invalidTools.length > 0) {
      console.warn('Invalid tools detected:', invalidTools);
      console.warn('Available tools:', availableScanners);
    }
    
    // Ensure at least one valid tool
    if (validTools.length === 0) {
      console.warn('No valid tools found, using default scanners');
      return ['semgrep', 'cppcheck']; // Safe defaults
    }
    
    return validTools;
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
      
      // Check scan status
      if (scan.status === 'in_progress') {
        const scanStartTime = new Date(scan.updatedAt);
        const now = new Date();
        const diffMinutes = (now - scanStartTime) / (1000 * 60);
        
        if (diffMinutes > 30) {
          console.log(`Scan ${scanId} has been running for too long, resetting status`);
          await scanRepository.updateScan(scanId, { status: 'pending' });
        } else {
          throw new Error(`Scan already in progress: ${scanId}`);
        }
      }
      
      if (scan.status === 'completed') {
        throw new Error(`Scan already completed: ${scanId}`);
      }
      
      // Update scan status to in_progress
      await scanRepository.updateScan(scanId, { 
        status: 'in_progress',
        startTime: new Date(),
        progress: 0
      });
      
      // Start scan process
      this.runScan(scanId).catch(error => {
        console.error(`Error running scan ${scanId}:`, error);
        // Update scan status to failed if there's an error
        scanRepository.updateScan(scanId, { 
          status: 'failed',
          error: error.message,
          endTime: new Date()
        });
      });
      
      return scan;
    } catch (error) {
      console.error('Error in startScan:', error);
      throw error;
    }
  }

  /**
   * Run scan process with improved error handling for 5 scanners
   * @param {String} scanId - Scan ID
   */
  async runScan(scanId) {
    try {
      // Get scan by ID
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      console.log(`🚀 Starting scan execution for ${scanId}`);
      console.log(`📁 Scan directory: ${scan.scanDirectory}`);
      console.log(`🔧 Tools to use: ${scan.tools.join(', ')}`);
      
      // Get upload directory and create results directory
      const uploadDir = path.join(scan.scanDirectory, 'uploads');
      const resultsDir = path.join(scan.scanDirectory, 'results');
      
      // Validate directories exist
      if (!fs.existsSync(uploadDir)) {
        throw new Error(`Upload directory not found: ${uploadDir}`);
      }
      
      fs.ensureDirSync(resultsDir);
      
      // Update progress: 5%
      await this.updateScanProgress(scanId, 5);
      
      // Get all source code files
      const allFiles = await getSourceCodeFiles(uploadDir);
      console.log(`📄 Found ${allFiles.length} source code files to scan`);
      
      if (allFiles.length === 0) {
        console.warn(`⚠️ No source code files found in scan ${scanId}`);
        await this.completeScanWithNoFiles(scanId);
        return;
      }
      
      // Update progress: 10%
      await this.updateScanProgress(scanId, 10);
      
      // Count lines of code
      const linesOfCodeResult = await countLinesOfCode(allFiles);
      console.log(`📊 Total lines of code: ${linesOfCodeResult.totalLines}`);
      
      // Update progress: 15%
      await this.updateScanProgress(scanId, 15);
      
      // Get and validate scanners for selected tools
      const scanners = await this.getValidatedScanners(scan.tools);
      
      if (scanners.length === 0) {
        throw new Error(`No valid scanners available for tools: ${scan.tools.join(', ')}`);
      }
      
      console.log(`🎯 Using ${scanners.length} scanners: ${scanners.map(s => s.tool).join(', ')}`);
      
      // Update progress: 20%
      await this.updateScanProgress(scanId, 20);
      
      // Run scanners with improved error handling
      const scanResults = await this.runAllScanners(scanners, uploadDir, resultsDir, scanId);
      
      // Update progress: 85%
      await this.updateScanProgress(scanId, 85);
      
      // Process and save vulnerabilities
      console.log(`\n💾 Processing and saving scan results...`);
      await this.processScanResults(scanId, scanResults);
      
      // Update progress: 95%
      await this.updateScanProgress(scanId, 95);
      
      // Complete scan
      const issuesCounts = this.aggregateIssueCounts(scanResults);
      console.log(`\n🎉 Scan completed with ${issuesCounts.total} total issues:`);
      console.log(`   - Critical: ${issuesCounts.critical}`);
      console.log(`   - High: ${issuesCounts.high}`);
      console.log(`   - Medium: ${issuesCounts.medium}`);
      console.log(`   - Low: ${issuesCounts.low}`);
      
      await scanRepository.completeScan(scanId, {
        filesScanned: linesOfCodeResult.totalFiles,
        linesOfCode: linesOfCodeResult.totalLines,
        issuesCounts
      });
      
      console.log(`✅ Scan ${scanId} completed successfully!`);
      logger.info(`Scan completed: ${scanId}`);
      
    } catch (error) {
      console.error(`💥 Error running scan ${scanId}:`, error.message);
      logger.error(`Error running scan: ${error?.message || 'Unknown error'}`);
      
      // Ensure error object exists before passing to failScan
      const errorToReport = error || new Error('Unknown scan error');
      await scanRepository.failScan(scanId, errorToReport);
      throw errorToReport;
    }
  }

  /**
 * Get validated scanners for the selected tools - ENHANCED WITH FULL LOGGING
 * @param {Array} tools - Selected tools
 * @returns {Array} Array of validated scanner objects
 */
async getValidatedScanners(tools) {
  console.log('\n🔍 =================== SCANNER VALIDATION ===================');
  console.log(`📋 Input tools to validate: [${tools.join(', ')}]`);
  
  const scanners = [];
  const invalidTools = [];
  const notInstalledTools = [];
  
  for (const tool of tools) {
    console.log(`\n🔧 Validating scanner: ${tool}`);
    
    try {
      // Step 1: Try to create scanner
      console.log(`  📦 Step 1: Creating scanner for ${tool}...`);
      const scanner = scannerFactory.createScanner(tool);
      
      if (!scanner) {
        console.log(`  ❌ Step 1 FAILED: Scanner creation returned null/undefined for ${tool}`);
        invalidTools.push(tool);
        continue;
      }
      
      console.log(`  ✅ Step 1 SUCCESS: Scanner created for ${tool}`);
      console.log(`    - Scanner name: ${scanner.name || 'unnamed'}`);
      console.log(`    - Scanner type: ${scanner.constructor.name}`);
      
      // Step 2: Check installation
      console.log(`  🔍 Step 2: Checking installation for ${tool}...`);
      
      if (!scanner.checkInstallation) {
        console.log(`  ⚠️  Step 2 WARNING: No checkInstallation method for ${tool}, assuming installed`);
        scanners.push({ scanner, tool });
        console.log(`  ✅ ${tool} scanner ADDED to scan queue (no installation check)`);
        continue;
      }
      
      try {
        const isInstalled = await scanner.checkInstallation();
        
        if (isInstalled) {
          scanners.push({ scanner, tool });
          console.log(`  ✅ Step 2 SUCCESS: ${tool} is installed and ready`);
          console.log(`  🎯 ${tool} scanner ADDED to scan queue`);
        } else {
          notInstalledTools.push(tool);
          console.log(`  ❌ Step 2 FAILED: ${tool} is not properly installed`);
          console.log(`  ⚠️  ${tool} scanner SKIPPED - installation check failed`);
        }
      } catch (installCheckError) {
        notInstalledTools.push(tool);
        console.log(`  ❌ Step 2 ERROR: Installation check failed for ${tool}`);
        console.log(`    Error: ${installCheckError.message}`);
        console.log(`  ⚠️  ${tool} scanner SKIPPED - installation error`);
      }
      
    } catch (createError) {
      invalidTools.push(tool);
      console.log(`  ❌ Step 1 ERROR: Failed to create scanner for ${tool}`);
      console.log(`    Error: ${createError.message}`);
      console.log(`  ⚠️  ${tool} scanner SKIPPED - creation error`);
    }
  }
  
  // Summary
  console.log('\n📊 =================== VALIDATION SUMMARY ===================');
  console.log(`✅ VALID SCANNERS (${scanners.length}): [${scanners.map(s => s.tool).join(', ')}]`);
  
  if (notInstalledTools.length > 0) {
    console.log(`❌ NOT INSTALLED (${notInstalledTools.length}): [${notInstalledTools.join(', ')}]`);
    console.log('   💡 FIX: Install missing tools:');
    notInstalledTools.forEach(tool => {
      if (tool === 'cppcheck') {
        console.log('      sudo apt install cppcheck');
      } else if (tool === 'clangStaticAnalyzer') {
        console.log('      sudo apt install clang-tools');
      } else if (tool === 'clangTidy') {
        console.log('      sudo apt install clang-tidy');
      }
    });
  }
  
  if (invalidTools.length > 0) {
    console.log(`💥 INVALID SCANNERS (${invalidTools.length}): [${invalidTools.join(', ')}]`);
    console.log('   💡 FIX: Check scanner files and factory registration');
  }
  
  console.log('========================================================\n');
  
  return scanners;
}

  /**
 * Run all scanners sequentially - ENHANCED WITH DETAILED LOGGING
 * @param {Array} scanners - Array of scanner objects
 * @param {String} uploadDir - Upload directory  
 * @param {String} resultsDir - Results directory
 * @param {String} scanId - Scan ID for progress updates
 * @returns {Array} Array of scan results
 */
async runAllScanners(scanners, uploadDir, resultsDir, scanId) {
  console.log('\n🚀 =================== STARTING SCAN EXECUTION ===================');
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`📁 Results directory: ${resultsDir}`);
  console.log(`🎯 Scanners to run: ${scanners.length}`);
  
  scanners.forEach((scannerObj, index) => {
    console.log(`  ${index + 1}. ${scannerObj.tool}`);
  });
  console.log('==============================================================\n');
  
  const scanResults = [];
  let completedScanners = 0;
  
  // Process scanners sequentially to avoid resource conflicts
  for (const { scanner, tool } of scanners) {
    console.log(`\n🔍 =================== SCANNER ${completedScanners + 1}/${scanners.length}: ${tool.toUpperCase()} ===================`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    try {
      const startTime = Date.now();
      console.log(`🏃 Running ${tool} scanner on ${uploadDir}`);
      
      const outputPath = path.join(resultsDir, `${scanner.name}-results.json`);
      console.log(`📄 Output will be saved to: ${outputPath}`);
      
      // Run scanner with detailed logging
      const scannerResult = await this.runScannerWithTimeout(scanner, uploadDir, outputPath, tool);
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ ${tool} scan completed in ${(duration/1000).toFixed(2)}s`);
      console.log(`🎯 ${tool} found ${scannerResult.vulnerabilities?.length || 0} issues`);
      
      // Add scanner result
      scanResults.push(scannerResult);
      
      // Show brief summary
      if (scannerResult.summary) {
        console.log(`📊 ${tool} Summary: Total=${scannerResult.summary.total}, Critical=${scannerResult.summary.critical}, High=${scannerResult.summary.high}, Medium=${scannerResult.summary.medium}, Low=${scannerResult.summary.low}`);
      }
      
      console.log(`✅ ${tool.toUpperCase()} SCAN COMPLETED`);
      
    } catch (scannerError) {
      console.log(`❌ ${tool.toUpperCase()} SCAN FAILED`);
      console.error(`💥 Error running ${tool} scanner:`, scannerError.message);
      console.error(`📋 Error details:`, scannerError.stack);
      
      // Add empty result for failed scanner
      const failedResult = {
        scanner: tool,
        vulnerabilities: [],
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        error: scannerError.message
      };
      
      scanResults.push(failedResult);
      console.log(`⚠️ Added empty result for failed ${tool} scanner`);
    }
    
    // Update progress
    completedScanners++;
    const progressIncrement = 60 / scanners.length;
    const newProgress = 20 + (progressIncrement * completedScanners);
    await this.updateScanProgress(scanId, newProgress);
    
    console.log(`📈 Progress updated: ${Math.round(newProgress)}%`);
    console.log(`================== END ${tool.toUpperCase()} SCANNER ==================\n`);
  }
  
  console.log('\n🎉 =================== ALL SCANNERS COMPLETED ===================');
  console.log(`✅ Completed scanners: ${completedScanners}/${scanners.length}`);
  console.log(`📊 Total results collected: ${scanResults.length}`);
  
  // Show quick summary of all results
  scanResults.forEach((result, index) => {
    const status = result.error ? '❌ FAILED' : '✅ SUCCESS';
    const issueCount = result.summary?.total || 0;
    console.log(`  ${index + 1}. ${result.scanner}: ${status} (${issueCount} issues)`);
  });
  
  console.log('=============================================================\n');
  
  return scanResults;
}

  // Keep all other methods unchanged from previous implementation...
  async completeScanWithNoFiles(scanId) {
    await scanRepository.updateScan(scanId, {
      status: 'completed',
      progress: 100,
      endTime: new Date(),
      filesScanned: 0,
      linesOfCode: 0,
      issuesCounts: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      }
    });
    logger.info(`Scan ${scanId} completed with no files`);
  }

  async updateScanProgress(scanId, progress) {
    try {
      await scanRepository.updateScanProgress(scanId, 'in_progress', progress);
      console.log(`📈 Progress updated: ${progress}%`);
    } catch (error) {
      console.error(`Error updating scan progress:`, error.message);
      logger.error(`Error updating scan progress: ${error.message}`);
    }
  }

  /**
 * Enhanced runScannerWithTimeout with more detailed logging
 */
async runScannerWithTimeout(scanner, uploadDir, outputPath, toolName) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log(`⏰ ${toolName} scan TIMEOUT after ${scanner.config?.timeoutMs || 300000}ms`);
      reject(new Error(`${toolName} scan timed out after ${scanner.config?.timeoutMs || 300000}ms`));
    }, scanner.config?.timeoutMs || 300000);
    
    try {
      console.log(`🏃 Running ${toolName} scanner on ${uploadDir}`);
      console.log(`📁 Scanner will process files in: ${uploadDir}`);
      console.log(`💾 Results will be saved to: ${outputPath}`);
      
      // Check if scanner has the required method
      if (!scanner.scanDirectory && !scanner.scan) {
        throw new Error(`${toolName} scanner missing scanDirectory/scan method`);
      }
      
      // Run the actual scan
      const scanMethod = scanner.scanDirectory || scanner.scan;
      console.log(`🔧 Using scan method: ${scanMethod.name || 'unnamed'}`);
      
      const result = await scanMethod.call(scanner, uploadDir, outputPath);
      
      clearTimeout(timeout);
      
      // Validate result format
      if (!result || typeof result !== 'object') {
        console.log(`⚠️ ${toolName} returned invalid result format:`, typeof result);
        throw new Error(`${toolName} returned invalid result format`);
      }
      
      // Ensure required properties exist
      if (!result.vulnerabilities) {
        console.log(`⚠️ ${toolName} result missing vulnerabilities array, creating empty array`);
        result.vulnerabilities = [];
      }
      
      if (!result.summary) {
        console.log(`⚠️ ${toolName} result missing summary, generating from vulnerabilities`);
        result.summary = {
          total: result.vulnerabilities.length,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        };
        
        result.vulnerabilities.forEach(vuln => {
          if (vuln.severity && result.summary[vuln.severity] !== undefined) {
            result.summary[vuln.severity]++;
          }
        });
      }
      
      // Add scanner name to result
      result.scanner = toolName;
      
      // Log detailed results
      console.log(`\n=== ${toolName.toUpperCase()} SCAN RESULTS ===`);
      console.log(`${toolName} scan completed with ${result.summary.total} total issues:`);
      console.log(`- Critical: ${result.summary.critical}`);
      console.log(`- High: ${result.summary.high}`);
      console.log(`- Medium: ${result.summary.medium}`);
      console.log(`- Low: ${result.summary.low}`);
      
      if (result.vulnerabilities.length > 0) {
        console.log(`\n${toolName} found issues in:`);
        const fileStats = {};
        result.vulnerabilities.forEach(vuln => {
          const fileName = vuln.file?.fileName || 'unknown';
          fileStats[fileName] = (fileStats[fileName] || 0) + 1;
        });
        
        Object.entries(fileStats).forEach(([file, count]) => {
          console.log(`  - ${file}: ${count} issues`);
        });
      } else {
        console.log(`${toolName} found no issues`);
      }
      console.log(`=== END ${toolName.toUpperCase()} RESULTS ===\n`);
      
      resolve(result);
      
    } catch (error) {
      clearTimeout(timeout);
      console.error(`❌ ${toolName} scanner error:`, error.message);
      console.error(`📋 ${toolName} error stack:`, error.stack);
      reject(error);
    }
  });
}

  async processScanResults(scanId, scanResults) {
    try {
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      console.log(`💾 Processing results from ${scanResults.length} scanners`);
      
      const deleteResult = await vulnerabilityRepository.deleteVulnerabilitiesByScan(scanId);
      console.log(`🗑️ Deleted ${deleteResult.deletedCount || 0} existing vulnerabilities`);
      
      const vulnerabilities = [];
      let totalProcessed = 0;
      
      for (const result of scanResults) {
        if (!result.vulnerabilities || !Array.isArray(result.vulnerabilities)) {
          console.warn(`⚠️ Invalid vulnerabilities array from ${result.scanner || 'unknown'} scanner`);
          continue;
        }
        
        console.log(`🔍 Processing ${result.vulnerabilities.length} vulnerabilities from ${result.scanner || 'unknown'}`);
        
        for (const vuln of result.vulnerabilities) {
          try {
            if (!vuln.name || !vuln.severity || !vuln.tool) {
              console.warn('⚠️ Skipping invalid vulnerability:', {
                name: vuln.name,
                severity: vuln.severity,
                tool: vuln.tool,
                hasName: !!vuln.name,
                hasSeverity: !!vuln.severity,
                hasTool: !!vuln.tool
              });
              continue;
            }
            
            const vulnerabilityDoc = {
              scan: scanId,
              name: vuln.name,
              severity: vuln.severity,
              type: vuln.type || 'Unknown',
              tool: vuln.tool,
              file: vuln.file || { fileName: 'unknown', filePath: 'unknown', fileExt: '' },
              location: vuln.location || { line: 1, column: 1 },
              description: vuln.description || 'No description provided',
              codeSnippet: vuln.codeSnippet || { line: '', before: [], after: [] },
              remediation: vuln.remediation || { description: 'No remediation provided' },
              references: vuln.references || [],
              status: 'open',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            vulnerabilities.push(vulnerabilityDoc);
            totalProcessed++;
          } catch (vulnError) {
            console.error('❌ Error processing vulnerability:', vulnError.message, vuln);
          }
        }
      }
      
      console.log(`✅ Processed ${totalProcessed} vulnerabilities total`);
      
      if (vulnerabilities.length > 0) {
        console.log(`💾 Saving ${vulnerabilities.length} vulnerabilities to database...`);
        
        const chunkSize = 50;
        let insertedCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < vulnerabilities.length; i += chunkSize) {
          const chunk = vulnerabilities.slice(i, i + chunkSize);
          try {
            console.log(`💾 Inserting chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(vulnerabilities.length/chunkSize)} (${chunk.length} items)...`);
            
            const insertResult = await vulnerabilityRepository.createBulkVulnerabilities(chunk);
            insertedCount += chunk.length;
            
            console.log(`✅ Successfully inserted chunk: ${insertedCount}/${vulnerabilities.length} vulnerabilities`);
          } catch (insertError) {
            errorCount += chunk.length;
            console.error(`❌ Error inserting vulnerability chunk ${i}-${i + chunkSize}:`, insertError.message);
            
            for (const vuln of chunk) {
              try {
                await vulnerabilityRepository.createVulnerability(vuln);
                insertedCount++;
                errorCount--;
              } catch (singleError) {
                console.error(`❌ Failed to insert individual vulnerability:`, singleError.message, vuln.name);
              }
            }
          }
        }
        
        console.log(`🎯 Database save complete: ${insertedCount} inserted, ${errorCount} failed`);
        logger.info(`Saved ${insertedCount} vulnerabilities for scan ${scanId}`);
        
        const savedCount = await vulnerabilityRepository.countVulnerabilities({ scan: scanId });
        console.log(`✅ Verification: ${savedCount} vulnerabilities now in database for scan ${scanId}`);
      } else {
        console.log(`ℹ️ No vulnerabilities to save for scan ${scanId}`);
        logger.info(`No vulnerabilities found for scan ${scanId}`);
      }
    } catch (error) {
      console.error(`💥 Error processing scan results for ${scanId}:`, error.message);
      console.error(`Stack trace:`, error.stack);
      logger.error(`Error processing scan results: ${error.message}`);
      throw error;
    }
  }

  aggregateIssueCounts(scanResults) {
    const issuesCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0
    };
    
    console.log('\n=== AGGREGATING RESULTS FROM ALL SCANNERS ===');
    
    const scannerBreakdown = {};
    
    for (const result of scanResults) {
      if (result.summary) {
        const scannerName = result.scanner || 'unknown';
        
        scannerBreakdown[scannerName] = {
          critical: result.summary.critical || 0,
          high: result.summary.high || 0,
          medium: result.summary.medium || 0,
          low: result.summary.low || 0,
          total: result.summary.total || 0
        };
        
        issuesCounts.critical += result.summary.critical || 0;
        issuesCounts.high += result.summary.high || 0;
        issuesCounts.medium += result.summary.medium || 0;
        issuesCounts.low += result.summary.low || 0;
        issuesCounts.total += result.summary.total || 0;
      }
    }
    
    console.log('\nIssues breakdown by scanner:');
    Object.entries(scannerBreakdown).forEach(([scanner, counts]) => {
      console.log(`\n📊 ${scanner.toUpperCase()}:`);
      console.log(`  - Critical: ${counts.critical}`);
      console.log(`  - High: ${counts.high}`);
      console.log(`  - Medium: ${counts.medium}`);
      console.log(`  - Low: ${counts.low}`);
      console.log(`  - Total: ${counts.total}`);
    });
    
    console.log('\n🔢 COMBINED TOTALS:');
    console.log(`  - Critical: ${issuesCounts.critical}`);
    console.log(`  - High: ${issuesCounts.high}`);
    console.log(`  - Medium: ${issuesCounts.medium}`);
    console.log(`  - Low: ${issuesCounts.low}`);
    console.log(`  - GRAND TOTAL: ${issuesCounts.total}`);
    console.log('=== END AGGREGATION ===\n');
    
    return issuesCounts;
  }

  // Keep all existing methods unchanged...
  async getScanById(scanId) {
    try {
      return await scanRepository.getScanById(scanId);
    } catch (error) {
      logger.error(`Error getting scan by ID: ${error.message}`);
      throw error;
    }
  }

  async getScanByUniqueId(uniqueScanId) {
    try {
      return await scanRepository.getScanByUniqueId(uniqueScanId);
    } catch (error) {
      logger.error(`Error getting scan by unique ID: ${error.message}`);
      throw error;
    }
  }

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

  async deleteScan(scanId) {
    try {
      const scan = await scanRepository.getScanById(scanId);
      
      if (!scan) {
        throw new Error(`Scan not found: ${scanId}`);
      }
      
      await vulnerabilityRepository.deleteVulnerabilitiesByScan(scanId);
      await scanRepository.deleteScan(scanId);
      
      if (scan.scanDirectory && fs.existsSync(scan.scanDirectory)) {
        await fs.remove(scan.scanDirectory);
      }
      
      logger.info(`Scan deleted: ${scanId}`);
      
      return true;
    } catch (error) {
      // Preserve the original error message if it's a "not found" error
      if (error.message && error.message.includes('not found')) {
        throw error;
      }
      logger.error(`Error deleting scan: ${error.message}`);
      throw new Error(`Error deleting scan: ${error.message}`);
    }
  }

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

  async checkScannerInstallation() {
    try {
      return await scannerFactory.checkAllScannersInstallation();
    } catch (error) {
      logger.error(`Error checking scanner installation: ${error.message}`);
      throw error;
    }
  }

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
