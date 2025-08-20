// // src/scanners/cppcheckCustomScanner.js
// const { exec } = require('child_process');
// const path = require('path');
// const fs = require('fs-extra');
// const logger = require('../utils/logger');
// const { promisify } = require('util');
// const execAsync = promisify(exec);

// /**
//  * Cppcheck Custom Docker scanner for C/C++ code with custom rules
//  * Uses neszt/cppcheck-docker image with custom rule files
//  */
// class CppcheckCustomScanner {
//   constructor() {
//     this.name = 'cppcheckCustom';
//     this.config = {
//       name: 'Cppcheck Custom Docker',
//       description: 'Custom Cppcheck scanner using Docker with custom rule files',
//       version: '1.0',
//       supportedLanguages: ['c', 'cpp', 'cc', 'cxx', 'c++', 'h', 'hpp'],
//       timeoutMs: 300000, // 5 minutes
//       website: 'https://cppcheck.sourceforge.io/',
//       dockerImage: 'neszt/cppcheck-docker',
//       rulesPath: process.env.CPPCHECK_CUSTOM_RULES_PATH || path.join(__dirname, '../rules/cppcheck-custom')
//     };
//   }

//   /**
//    * Check if Docker and Cppcheck image are available
//    * @returns {Promise<boolean>} True if available
//    */
//   async checkInstallation() {
//     try {
//       console.log('🔍 Checking Cppcheck Custom Docker installation...');
      
//       // Step 1: Check if Docker is available
//       try {
//         const { stdout: dockerVersion } = await execAsync('docker --version');
//         console.log(`✅ Docker found: ${dockerVersion.trim()}`);
//       } catch (dockerError) {
//         console.log('❌ Docker not available:', dockerError.message);
//         return false;
//       }
      
//       // Step 2: Check if Cppcheck Docker image exists
//       try {
//         const { stdout: imageList } = await execAsync(`docker images ${this.config.dockerImage}`);
//         if (imageList.includes(this.config.dockerImage)) {
//           console.log(`✅ Cppcheck Docker image found: ${this.config.dockerImage}`);
//         } else {
//           console.log(`⚠️ Cppcheck Docker image not found, will pull on first use: ${this.config.dockerImage}`);
//         }
//       } catch (imageError) {
//         console.log('⚠️ Could not check Docker images:', imageError.message);
//       }
      
//       // Step 3: Check if custom rules directory exists
//       if (fs.existsSync(this.config.rulesPath)) {
//         const ruleFiles = fs.readdirSync(this.config.rulesPath).filter(f => 
//           f.endsWith('.xml') || f.endsWith('.rule') || f.endsWith('.cfg')
//         );
//         console.log(`✅ Custom rules directory found with ${ruleFiles.length} rule files`);
//         console.log(`📁 Rules path: ${this.config.rulesPath}`);
//       } else {
//         console.log(`⚠️ Custom rules directory not found: ${this.config.rulesPath}`);
//         // Create default rules directory
//         fs.ensureDirSync(this.config.rulesPath);
//         await this.createDefaultRules();
//       }
      
//       console.log('✅ Cppcheck Custom Docker scanner ready');
//       return true;
      
//     } catch (error) {
//       console.log(`❌ Cppcheck Custom Docker installation check failed: ${error.message}`);
//       logger.error(`Cppcheck Custom installation check failed: ${error.message}`);
//       return false;
//     }
//   }

//   /**
//    * Scan directory with Cppcheck Custom Docker
//    * @param {string} directory - Directory to scan
//    * @param {string} outputPath - Output file path
//    * @returns {Promise<Object>} Scan results
//    */
//   async scanDirectory(directory, outputPath) {
//     try {
//       console.log(`\n=== Starting Cppcheck Custom Docker Scan ===`);
//       console.log(`📁 Directory: ${directory}`);
//       console.log(`📄 Output path: ${outputPath}`);
  
//       // Ensure output directory exists
//       fs.ensureDirSync(path.dirname(outputPath));
  
//       // Get source files
//       const sourceFiles = this.getSourceFiles(directory);
//       console.log(`📄 Found ${sourceFiles.length} supported files to scan`);
  
//       if (sourceFiles.length === 0) {
//         console.log(`⚠️ No supported files found for Cppcheck Custom scan`);
//         return this.createEmptyResult();
//       }
  
//       // Validate directories exist
//       if (!fs.existsSync(directory)) {
//         throw new Error(`Source directory not found: ${directory}`);
//       }
  
//       if (!fs.existsSync(this.config.rulesPath)) {
//         throw new Error(`Rules directory not found: ${this.config.rulesPath}`);
//       }
  
//       // Convert to absolute paths for Docker
//       const absoluteDirectory = path.resolve(directory);
//       const absoluteRulesPath = path.resolve(this.config.rulesPath);
//       const absoluteOutputPath = path.resolve(outputPath);
//       const outputDir = path.dirname(absoluteOutputPath);
//       const outputFileName = path.basename(absoluteOutputPath);
  
//       console.log(`📁 Absolute source directory: ${absoluteDirectory}`);
//       console.log(`📋 Absolute rules directory: ${absoluteRulesPath}`);
  
//       // Try scanning strategies
//       const strategies = [
//         () => this.scanWithCustomRules(absoluteDirectory, absoluteRulesPath, outputDir, outputFileName),
//         () => this.scanWithBuiltinRules(absoluteDirectory, outputDir, outputFileName),
//         () => this.scanIndividualFiles(absoluteDirectory, absoluteRulesPath, outputDir, outputFileName, sourceFiles.slice(0, 5))
//       ];
  
//       let vulnerabilities = [];
//       let scanSuccessful = false;
  
//       for (let i = 0; i < strategies.length; i++) {
//         console.log(`\n🔍 Trying Cppcheck strategy ${i + 1}/${strategies.length}...`);
        
//         try {
//           const strategyResult = await strategies[i]();
//           if (strategyResult && strategyResult.length > 0) {
//             vulnerabilities = strategyResult;
//             scanSuccessful = true;
//             console.log(`✅ Strategy ${i + 1} succeeded with ${vulnerabilities.length} issues`);
//             break;
//           } else {
//             console.log(`Strategy ${i + 1} found no issues, trying next...`);
//           }
//         } catch (strategyError) {
//           console.log(`❌ Strategy ${i + 1} failed: ${strategyError.message}`);
//         }
//       }
  
//       if (!scanSuccessful) {
//         console.log(`⚠️ All strategies failed, returning empty result`);
//         return this.createEmptyResult();
//       }
  
//       // FIXED: Create proper result format matching other scanners
//       const summary = this.createSummary(vulnerabilities);
  
//       const result = {
//         scanner: 'cppcheckCustom',
//         vulnerabilities,
//         summary,
//         metadata: {
//           scannedFiles: sourceFiles.length,
//           totalFiles: sourceFiles.length,
//           scanDuration: 0,
//           tool: this.name,
//           version: this.config.version,
//           dockerImage: this.config.dockerImage
//         }
//       };
  
//       // FIXED: Save results as proper JSON
//       await fs.writeJSON(outputPath, result, { spaces: 2 });
//       console.log(`📄 Results written to: ${outputPath}`);
  
//       console.log(`\n✅ CPPCHECK CUSTOM DOCKER SCAN COMPLETED`);
//       console.log(`🔍 Cppcheck Custom found ${summary.total} total issues:`);
//       console.log(`  - Critical: ${summary.critical}`);
//       console.log(`  - High: ${summary.high}`);
//       console.log(`  - Medium: ${summary.medium}`);
//       console.log(`  - Low: ${summary.low}`);
  
//       return result;
  
//     } catch (error) {
//       console.error(`💥 Cppcheck Custom Docker scan error:`, error.message);
//       throw error;
//     }
//   }

//   /**
//  * Scan with custom rules using Docker
//  * @param {string} sourceDir - Source directory
//  * @param {string} rulesDir - Rules directory
//  * @param {string} outputDir - Output directory
//  * @param {string} outputFileName - Output file name
//  * @returns {Promise<Array>} Array of vulnerabilities
//  */
//   async scanWithCustomRules(sourceDir, rulesDir, outputDir, outputFileName) {
//     try {
//       console.log(`🔧 Scanning with custom rules...`);

//       // Get custom rule files
//       const ruleFiles = fs.readdirSync(rulesDir).filter(f => 
//         f.endsWith('.xml') || f.endsWith('.rule') || f.endsWith('.cfg')
//       );

//       if (ruleFiles.length === 0) {
//         console.log(`⚠️ No custom rule files found in ${rulesDir}`);
//         return [];
//       }

//       console.log(`📋 Using ${ruleFiles.length} custom rule files: ${ruleFiles.join(', ')}`);

//       // FIXED: Create XML output file first, then convert to JSON
//       const xmlOutputFileName = outputFileName.replace('.json', '.xml');
//       const ruleArgs = ruleFiles.map(file => `--rule-file=/rules/${file}`).join(' ');
      
//       const command = `docker run --rm \
//         -v "${sourceDir}:/src" \
//         -v "${rulesDir}:/rules" \
//         -v "${outputDir}:/output" \
//         ${this.config.dockerImage} \
//         cppcheck ${ruleArgs} --xml --xml-version=2 --enable=all \
//         --output-file=/output/${xmlOutputFileName} /src 2>&1`;

//       console.log(`🐳 Docker command: ${command}`);

//       const { stdout, stderr } = await execAsync(command, {
//         timeout: this.config.timeoutMs,
//         maxBuffer: 20 * 1024 * 1024 // 20MB buffer
//       });

//       console.log(`📋 Docker output: ${stdout || stderr || 'No output'}`);

//       // FIXED: Parse XML output and convert to standard format
//       const xmlOutputPath = path.join(outputDir, xmlOutputFileName);
//       if (fs.existsSync(xmlOutputPath)) {
//         const vulnerabilities = this.parseXmlOutput(xmlOutputPath, sourceDir);
        
//         // Save as proper JSON format
//         const jsonOutputPath = path.join(outputDir, outputFileName);
//         const jsonResult = {
//           scanner: 'cppcheckCustom',
//           vulnerabilities,
//           summary: this.createSummary(vulnerabilities),
//           metadata: {
//             scannedFiles: 0,
//             totalFiles: 0,
//             scanDuration: 0,
//             tool: this.name,
//             version: this.config.version,
//             dockerImage: this.config.dockerImage
//           }
//         };
        
//         await fs.writeJSON(jsonOutputPath, jsonResult, { spaces: 2 });
//         console.log(`✅ Converted XML to JSON: ${jsonOutputPath}`);
        
//         return vulnerabilities;
//       } else {
//         // Parse text output if no XML file
//         return this.parseTextOutput(stdout + stderr, sourceDir);
//       }

//     } catch (error) {
//       console.log(`❌ Custom rules scanning failed: ${error.message}`);
//       return [];
//     }
//   }

//   /**
//    * Scan with built-in rules as fallback
//    */
//   async scanWithBuiltinRules(sourceDir, outputDir, outputFileName) {
//     try {
//       console.log(`🔧 Scanning with built-in rules (fallback)...`);

//       const command = `docker run --rm \
//         -v "${sourceDir}:/src" \
//         -v "${outputDir}:/output" \
//         ${this.config.dockerImage} \
//         cppcheck --xml --xml-version=2 --enable=all \
//         --output-file=/output/${outputFileName} /src 2>&1`;

//       console.log(`🐳 Docker command: ${command}`);

//       const { stdout, stderr } = await execAsync(command, {
//         timeout: this.config.timeoutMs,
//         maxBuffer: 20 * 1024 * 1024
//       });

//       console.log(`📋 Built-in rules output: ${stdout || stderr || 'No output'}`);

//       // Parse results
//       const outputFilePath = path.join(outputDir, outputFileName);
//       if (fs.existsSync(outputFilePath)) {
//         return this.parseXmlOutput(outputFilePath, sourceDir);
//       } else {
//         return this.parseTextOutput(stdout + stderr, sourceDir);
//       }

//     } catch (error) {
//       console.log(`❌ Built-in rules scanning failed: ${error.message}`);
//       return [];
//     }
//   }

//   /**
//    * Scan individual files (last resort)
//    */
//   async scanIndividualFiles(sourceDir, rulesDir, outputDir, outputFileName, fileList) {
//     try {
//       console.log(`🔧 Scanning individual files...`);

//       const vulnerabilities = [];

//       for (const file of fileList.slice(0, 3)) { // Limit to 3 files
//         try {
//           const relativeFile = path.relative(sourceDir, file);
//           console.log(`📄 Scanning file: ${relativeFile}`);

//           const command = `docker run --rm \
//             -v "${sourceDir}:/src" \
//             -v "${rulesDir}:/rules" \
//             ${this.config.dockerImage} \
//             cppcheck --enable=all --xml /src/${relativeFile} 2>&1`;

//           const { stdout, stderr } = await execAsync(command, {
//             timeout: 30000 // 30 seconds per file
//           });

//           const fileVulns = this.parseTextOutput(stdout + stderr, sourceDir);
//           vulnerabilities.push(...fileVulns);

//         } catch (fileError) {
//           console.log(`❌ Error scanning file ${file}: ${fileError.message}`);
//         }
//       }

//       return vulnerabilities;

//     } catch (error) {
//       console.log(`❌ Individual file scanning failed: ${error.message}`);
//       return [];
//     }
//   }

//   /**
//  * ENHANCED: Parse XML output from Cppcheck and convert to standard vulnerability format
//  */
//   parseXmlOutput(xmlPath, baseDirectory) {
//     try {
//       console.log(`📄 Parsing XML output: ${xmlPath}`);

//       const xmlContent = fs.readFileSync(xmlPath, 'utf8');
//       console.log(`📄 XML content length: ${xmlContent.length} characters`);

//       const vulnerabilities = [];

//       // ENHANCED: Parse XML more robustly
//       const errorRegex = /<error\s+([^>]*?)(?:\s*\/>|>[\s\S]*?<\/error>)/g;
//       let errorMatch;

//       while ((errorMatch = errorRegex.exec(xmlContent)) !== null) {
//         try {
//           const errorAttributes = this.parseXmlAttributes(errorMatch[1]);
          
//           // Find all location tags within this error
//           const fullErrorText = errorMatch[0];
//           const locationRegex = /<location\s+([^>]*?)\s*\/?>/g;
//           let locationMatch;
//           const locations = [];
          
//           while ((locationMatch = locationRegex.exec(fullErrorText)) !== null) {
//             const locationAttributes = this.parseXmlAttributes(locationMatch[1]);
//             if (locationAttributes.file && locationAttributes.line) {
//               locations.push(locationAttributes);
//             }
//           }
          
//           // Use first location or create default
//           const location = locations[0] || { file: 'unknown', line: '1', column: '1' };
          
//           // Skip certain types of errors
//           if (this.shouldSkipError(errorAttributes)) {
//             continue;
//           }
          
//           // ENHANCED: Create properly formatted vulnerability
//           const vuln = this.createVulnerabilityFromXml(errorAttributes, location, baseDirectory);
//           if (vuln) {
//             vulnerabilities.push(vuln);
//           }
          
//         } catch (parseError) {
//           console.warn(`⚠️ Error parsing XML error entry:`, parseError.message);
//         }
//       }

//       console.log(`✅ Parsed ${vulnerabilities.length} vulnerabilities from XML`);
//       return vulnerabilities;

//     } catch (error) {
//       console.error(`❌ Error parsing XML output: ${error.message}`);
//       return [];
//     }
//   }

//   /**
//  * NEW: Create vulnerability from XML attributes in standard format
//  */
// createVulnerabilityFromXml(errorAttributes, locationAttributes, baseDirectory) {
//   try {
//     const fileName = path.basename(locationAttributes.file);
//     const filePath = path.relative(baseDirectory, locationAttributes.file);
    
//     // Enhanced severity mapping
//     const severityMap = {
//       'error': 'high',
//       'warning': 'medium', 
//       'style': 'low',
//       'performance': 'medium',
//       'portability': 'low',
//       'information': 'low'
//     };
    
//     const severity = severityMap[errorAttributes.severity?.toLowerCase()] || 'medium';
    
//     // Enhanced type detection
//     const id = errorAttributes.id || 'unknown';
//     const message = this.decodeXmlEntities(errorAttributes.msg || 'No description');
    
//     return {
//       name: `Cppcheck Custom: ${this.formatIssueName(id)}`,
//       severity,
//       type: this.determineIssueType(id, message),
//       tool: 'cppcheckCustom',
//       file: {
//         fileName,
//         filePath,
//         fileExt: path.extname(fileName)
//       },
//       location: {
//         line: parseInt(locationAttributes.line) || 1,
//         column: parseInt(locationAttributes.column) || 1,
//         endLine: parseInt(locationAttributes.line) || 1,
//         endColumn: parseInt(locationAttributes.column) || 1
//       },
//       description: message,
//       codeSnippet: {
//         line: '', // Will be filled later by getVulnerabilitiesWithSnippet
//         before: [],
//         after: []
//       },
//       remediation: {
//         description: this.getRemediation(id, message)
//       },
//       references: [
//         'https://cppcheck.sourceforge.io/',
//         'https://github.com/neszt/cppcheck-docker'
//       ],
//       status: 'open',
//       metadata: {
//         cppcheckId: id,
//         originalSeverity: errorAttributes.severity,
//         dockerImage: this.config.dockerImage,
//         cwe: errorAttributes.cwe || null,
//         inconclusive: errorAttributes.inconclusive === 'true'
//       }
//     };
    
//   } catch (error) {
//     console.warn(`⚠️ Error creating vulnerability from XML:`, error.message);
//     return null;
//   }
// }

//   /**
//    * Parse individual XML error entry
//    */
//   parseXmlError(errorXml, baseDirectory) {
//     try {
//       // Extract attributes from <error> tag
//       const idMatch = errorXml.match(/id="([^"]+)"/);
//       const severityMatch = errorXml.match(/severity="([^"]+)"/);
//       const msgMatch = errorXml.match(/msg="([^"]+)"/);
//       const verboseMatch = errorXml.match(/verbose="([^"]+)"/);

//       // Extract first <location> tag
//       const locationMatch = errorXml.match(/<location[^>]*>/);

//       if (!idMatch || !severityMatch || !msgMatch || !locationMatch) {
//         return null;
//       }

//       const id = idMatch[1];
//       const severity = severityMatch[1];
//       const message = this.decodeXmlEntities(msgMatch[1]);
//       const verbose = verboseMatch ? this.decodeXmlEntities(verboseMatch[1]) : message;

//       // Extract location details
//       const fileMatch = locationMatch[0].match(/file="([^"]+)"/);
//       const lineMatch = locationMatch[0].match(/line="([^"]+)"/);
//       const columnMatch = locationMatch[0].match(/column="([^"]+)"/);

//       if (!fileMatch || !lineMatch) {
//         return null;
//       }

//       const filePath = fileMatch[1];
//       const line = parseInt(lineMatch[1]) || 1;
//       const column = parseInt(columnMatch ? columnMatch[1] : '1') || 1;

//       // Filter out information messages
//       if (severity === 'information' && 
//           (message.includes('Include file:') || message.includes('not found'))) {
//         return null;
//       }

//       return this.createVulnerability(filePath, line, severity, id, verbose, baseDirectory, { column });

//     } catch (error) {
//       console.warn(`⚠️ Error parsing XML error entry:`, error.message);
//       return null;
//     }
//   }

//   /**
//    * Parse text output when XML parsing fails
//    */
//   parseTextOutput(output, baseDirectory) {
//     const vulnerabilities = [];
//     const lines = output.split('\n').filter(line => line.trim());

//     console.log(`📄 Parsing ${lines.length} lines of text output...`);

//     for (const line of lines) {
//       try {
//         // Skip information lines
//         if (line.includes('Checking ') || line.includes('done') || 
//             line.includes('Include file:') || line.includes('not found')) {
//           continue;
//         }

//         let match;

//         // Format: file:line:severity:id:message
//         match = line.match(/^([^:]+):(\d+):(\w+):([^:]+):(.+)$/);
//         if (match) {
//           const [, filePath, lineNum, severity, id, message] = match;
//           const vuln = this.createVulnerability(filePath, lineNum, severity, id, message, baseDirectory);
//           if (vuln) vulnerabilities.push(vuln);
//           continue;
//         }

//         // Format: [file:line]: (severity) message
//         match = line.match(/^\[([^:]+):(\d+)\]: \((\w+)\) (.+)$/);
//         if (match) {
//           const [, filePath, lineNum, severity, message] = match;
//           const vuln = this.createVulnerability(filePath, lineNum, severity, 'general', message, baseDirectory);
//           if (vuln) vulnerabilities.push(vuln);
//           continue;
//         }

//       } catch (parseError) {
//         console.warn(`⚠️ Error parsing line: ${line}`, parseError.message);
//       }
//     }

//     console.log(`📄 Parsed ${vulnerabilities.length} vulnerabilities from text output`);
//     return vulnerabilities;
//   }

//   /**
//    * Create vulnerability object
//    */
//   createVulnerability(filePath, lineNum, severity, id, message, baseDirectory, extra = {}) {
//     try {
//       const fileName = path.basename(filePath);
//       const relativePath = path.relative(baseDirectory, filePath);

//       // Map severity levels
//       const severityMap = {
//         'error': 'high',
//         'warning': 'medium',
//         'style': 'low',
//         'performance': 'low',
//         'portability': 'low',
//         'information': 'low'
//       };

//       const mappedSeverity = severityMap[severity?.toLowerCase()] || 'medium';

//       return {
//         name: `Cppcheck Custom: ${this.formatIssueName(id)}`,
//         severity: mappedSeverity,
//         type: this.determineIssueType(id, message),
//         tool: 'cppcheckCustom',
//         file: {
//           fileName,
//           filePath: relativePath,
//           fileExt: path.extname(fileName)
//         },
//         location: {
//           line: parseInt(lineNum) || 1,
//           column: extra.column || 1
//         },
//         description: message || 'No description provided',
//         codeSnippet: {
//           line: 'Code snippet not available',
//           before: [],
//           after: []
//         },
//         remediation: {
//           description: this.getRemediation(id, message)
//         },
//         references: [
//           'https://cppcheck.sourceforge.io/',
//           'https://github.com/neszt/cppcheck-docker'
//         ],
//         status: 'open',
//         metadata: {
//           cppcheckId: id,
//           originalSeverity: severity,
//           dockerImage: this.config.dockerImage
//         }
//       };
//     } catch (error) {
//       console.warn(`⚠️ Error creating vulnerability for ${filePath}:${lineNum}:`, error.message);
//       return null;
//     }
//   }

//   /**
//    * Determine issue type based on ID and message
//    */
//   determineIssueType(id, message) {
//     const text = (id + ' ' + message).toLowerCase();

//     if (text.includes('security') || text.includes('overflow') || text.includes('double')) {
//       return 'Security';
//     }
//     if (text.includes('memory') || text.includes('buffer') || text.includes('leak')) {
//       return 'Memory Safety';
//     }
//     if (text.includes('performance')) {
//       return 'Performance';
//     }
//     return 'Code Quality';
//   }

//   /**
//    * Format issue name from ID
//    */
//   formatIssueName(id) {
//     if (!id || id === 'general') {
//       return 'Code Issue';
//     }
//     return id.replace(/([A-Z])/g, ' $1').trim().toLowerCase()
//              .replace(/\b\w/g, l => l.toUpperCase());
//   }

//   /**
//    * Get remediation advice
//    */
//   getRemediation(id, message) {
//     const text = (id + ' ' + message).toLowerCase();

//     if (text.includes('doublefree')) {
//       return 'Ensure memory is not freed multiple times. Set pointers to NULL after freeing.';
//     }
//     if (text.includes('memoryleak')) {
//       return 'Ensure all allocated memory is properly freed when no longer needed.';
//     }
//     if (text.includes('nullpointer')) {
//       return 'Check for null pointers before dereferencing.';
//     }
//     return `Fix the ${id || 'issue'} according to Cppcheck recommendations.`;
//   }

//   /**
//    * Decode XML entities
//    */
//   decodeXmlEntities(str) {
//     return str
//       .replace(/&lt;/g, '<')
//       .replace(/&gt;/g, '>')
//       .replace(/&quot;/g, '"')
//       .replace(/&apos;/g, "'")
//       .replace(/&amp;/g, '&');
//   }

//   /**
//    * Get source files
//    */
//   getSourceFiles(directory) {
//     const supportedExtensions = this.config.supportedLanguages.map(lang => `.${lang}`);
    
//     const files = [];
//     const walkDir = (dir) => {
//       try {
//         const entries = fs.readdirSync(dir, { withFileTypes: true });
        
//         for (const entry of entries) {
//           const fullPath = path.join(dir, entry.name);
          
//           if (entry.isDirectory()) {
//             if (!['node_modules', '.git', 'build', 'dist'].includes(entry.name)) {
//               walkDir(fullPath);
//             }
//           } else if (entry.isFile()) {
//             const ext = path.extname(entry.name).toLowerCase();
//             if (supportedExtensions.includes(ext)) {
//               files.push(fullPath);
//             }
//           }
//         }
//       } catch (error) {
//         console.warn(`⚠️ Cannot read directory ${dir}: ${error.message}`);
//       }
//     };

//     walkDir(directory);
//     return files;
//   }

//   /**
//    * Create summary of vulnerabilities
//    */
//   createSummary(vulnerabilities) {
//     const summary = {
//       total: vulnerabilities.length,
//       critical: 0,
//       high: 0,
//       medium: 0,
//       low: 0
//     };

//     vulnerabilities.forEach(vuln => {
//       if (vuln.severity && summary[vuln.severity] !== undefined) {
//         summary[vuln.severity]++;
//       }
//     });

//     return summary;
//   }

//   /**
//    * Create empty result
//    */
//   createEmptyResult() {
//     return {
//       scanner: 'cppcheckCustom',
//       vulnerabilities: [],
//       summary: {
//         total: 0,
//         critical: 0,
//         high: 0,
//         medium: 0,
//         low: 0
//       },
//       metadata: {
//         scannedFiles: 0,
//         totalFiles: 0,
//         tool: this.name,
//         version: this.config.version,
//         dockerImage: this.config.dockerImage
//       }
//     };
//   }

//   /**
//    * Create default custom rules if none exist
//    */
//   async createDefaultRules() {
//     try {
//       console.log(`📋 Creating default custom rules...`);

//       const defaultRuleContent = `<?xml version="1.0" encoding="UTF-8"?>
// <rule version="1">
//   <tokenlist>
//     <token str="strcpy"/>
//     <token str="("/>
//   </tokenlist>
//   <pattern>strcpy ( %var% , %str% )</pattern>
//   <message>
//     <id>customBufferOverflow</id>
//     <severity>error</severity>
//     <msg>Potential buffer overflow with strcpy. Use strncpy instead.</msg>
//   </message>
// </rule>`;

//       const defaultRulePath = path.join(this.config.rulesPath, 'default-buffer-overflow.xml');
//       await fs.writeFile(defaultRulePath, defaultRuleContent);
//       console.log(`✅ Created default rule: ${defaultRulePath}`);

//     } catch (error) {
//       console.warn(`⚠️ Could not create default rules: ${error.message}`);
//     }
//   }
// }

// module.exports = CppcheckCustomScanner;


// src/scanners/cppcheckCustomScanner.js - FIXED to match CppcheckScanner pattern
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Cppcheck Custom Docker scanner for C/C++ code with custom rules
 * Uses neszt/cppcheck-docker image with custom rule files
 * FIXED to output XML first, then convert to JSON like CppcheckScanner
 */
class CppcheckCustomScanner {
  constructor() {
    this.name = 'cppcheckCustom';
    this.config = {
      name: 'Cppcheck Custom Docker',
      description: 'Custom Cppcheck scanner using Docker with custom rule files',
      version: '1.0',
      supportedLanguages: ['c', 'cpp', 'cc', 'cxx', 'c++', 'h', 'hpp'],
      timeoutMs: 300000, // 5 minutes
      website: 'https://cppcheck.sourceforge.io/',
      dockerImage: 'neszt/cppcheck-docker',
      rulesPath: process.env.CPPCHECK_CUSTOM_RULES_PATH || 
                 path.join(process.cwd(), 'src', 'rules', 'cppcheck-custom')
    };
  }

  /**
   * Check if Docker and Cppcheck image are available
   * @returns {Promise<boolean>} True if available
   */
  async checkInstallation() {
    try {
      console.log('🔍 Checking Cppcheck Custom Docker installation...');
      
      // Step 1: Check if Docker is available
      try {
        const { stdout: dockerVersion } = await execAsync('docker --version');
        console.log(`✅ Docker found: ${dockerVersion.trim()}`);
      } catch (dockerError) {
        console.log('❌ Docker not available:', dockerError.message);
        return false;
      }
      
      // Step 2: Check if Cppcheck Docker image exists
      try {
        const { stdout: imageList } = await execAsync(`docker images ${this.config.dockerImage}`);
        if (imageList.includes(this.config.dockerImage)) {
          console.log(`✅ Cppcheck Docker image found: ${this.config.dockerImage}`);
        } else {
          console.log(`⚠️ Cppcheck Docker image not found, will pull on first use: ${this.config.dockerImage}`);
        }
      } catch (imageError) {
        console.log('⚠️ Could not check Docker images:', imageError.message);
      }
      
      // Step 3: Check if custom rules directory exists
      if (fs.existsSync(this.config.rulesPath)) {
        const ruleFiles = fs.readdirSync(this.config.rulesPath).filter(f => 
          f.endsWith('.xml') || f.endsWith('.rule') || f.endsWith('.cfg')
        );
        console.log(`✅ Custom rules directory found with ${ruleFiles.length} rule files`);
        console.log(`📁 Rules path: ${this.config.rulesPath}`);
      } else {
        console.log(`⚠️ Custom rules directory not found: ${this.config.rulesPath}`);
        // Create default rules directory
        fs.ensureDirSync(this.config.rulesPath);
        await this.createDefaultRules();
      }
      
      console.log('✅ Cppcheck Custom Docker scanner ready');
      return true;
      
    } catch (error) {
      console.log(`❌ Cppcheck Custom Docker installation check failed: ${error.message}`);
      logger.error(`Cppcheck Custom installation check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Scan directory with Cppcheck Custom Docker - FIXED to match CppcheckScanner pattern
   * @param {string} directory - Directory to scan
   * @param {string} outputPath - Output file path (.json)
   * @returns {Promise<Object>} Scan results
   */
  async scanDirectory(directory, outputPath) {
    try {
      console.log(`\n=== Starting Cppcheck Custom Docker Scan ===`);
      console.log(`📁 Directory: ${directory}`);
      console.log(`📄 Output path: ${outputPath}`);
      console.log(`🐳 Docker image: ${this.config.dockerImage}`);

      // Get source files
      const sourceFiles = this.getSourceFiles(directory);
      console.log(`📄 Found ${sourceFiles.length} supported files to scan`);

      if (sourceFiles.length === 0) {
        console.log(`⚠️ No supported files found for Cppcheck Custom scan`);
        return this.createEmptyResult();
      }

      // Validate directories exist
      if (!fs.existsSync(directory)) {
        throw new Error(`Source directory not found: ${directory}`);
      }

      if (!fs.existsSync(this.config.rulesPath)) {
        console.log(`⚠️ Rules directory not found, creating: ${this.config.rulesPath}`);
        fs.ensureDirSync(this.config.rulesPath);
        await this.createDefaultRules();
      }

      // FIXED: Create XML output file first (like CppcheckScanner)
      const xmlOutputPath = outputPath.replace('.json', '.xml');
      
      // Convert to absolute paths for Docker
      const absoluteDirectory = path.resolve(directory);
      const absoluteRulesPath = path.resolve(this.config.rulesPath);
      const outputDir = path.dirname(path.resolve(outputPath));
      const xmlFileName = path.basename(xmlOutputPath);

      console.log(`📁 Absolute source directory: ${absoluteDirectory}`);
      console.log(`📋 Absolute rules directory: ${absoluteRulesPath}`);
      console.log(`📄 XML output will be: ${xmlOutputPath}`);

      // FIXED: Try multiple scanning strategies like CppcheckScanner
      const strategies = [
        () => this.scanWithCustomRulesXML(absoluteDirectory, absoluteRulesPath, outputDir, xmlFileName),
        () => this.scanWithBuiltinRulesXML(absoluteDirectory, outputDir, xmlFileName),
        () => this.scanBasicXML(absoluteDirectory, outputDir, xmlFileName)
      ];

      let vulnerabilities = [];
      let scanSuccessful = false;

      for (let i = 0; i < strategies.length; i++) {
        console.log(`\n🔍 Trying Cppcheck Custom strategy ${i + 1}/${strategies.length}...`);
        
        try {
          const strategyResult = await strategies[i]();
          
          // Check if XML file was created and parse it
          if (fs.existsSync(xmlOutputPath)) {
            const xmlStats = fs.statSync(xmlOutputPath);
            console.log(`📄 XML file created: ${xmlOutputPath} (${xmlStats.size} bytes)`);
            
            if (xmlStats.size > 100) { // XML has meaningful content
              vulnerabilities = this.parseXmlOutput(xmlOutputPath, directory);
              if (vulnerabilities.length > 0) {
                scanSuccessful = true;
                console.log(`✅ Strategy ${i + 1} succeeded with ${vulnerabilities.length} issues from XML`);
                break;
              } else {
                console.log(`⚠️ Strategy ${i + 1} XML parsing found no vulnerabilities`);
              }
            }
          }
          
          // Fallback: try to parse any text output
          if (strategyResult && strategyResult.textOutput) {
            const textVulns = this.parseTextOutput(strategyResult.textOutput, directory);
            if (textVulns.length > 0) {
              vulnerabilities = textVulns;
              scanSuccessful = true;
              console.log(`✅ Strategy ${i + 1} succeeded with ${vulnerabilities.length} issues from text`);
              break;
            }
          }
          
        } catch (strategyError) {
          console.log(`❌ Strategy ${i + 1} failed: ${strategyError.message}`);
        }
      }

      if (!scanSuccessful) {
        console.log(`⚠️ All strategies failed, returning empty result`);
        return this.createEmptyResult(sourceFiles.length);
      }

      // FIXED: Create result summary like CppcheckScanner
      const summary = this.createSummary(vulnerabilities);

      const result = {
        scanner: 'cppcheckCustom',
        vulnerabilities,
        summary,
        metadata: {
          scannedFiles: sourceFiles.length,
          totalFiles: sourceFiles.length,
          scanDuration: 0,
          tool: this.name,
          version: this.config.version,
          dockerImage: this.config.dockerImage
        }
      };

      // FIXED: Save results to JSON file like CppcheckScanner
      await fs.writeJSON(outputPath, result, { spaces: 2 });
      console.log(`📄 Results written to: ${outputPath}`);

      console.log(`\n✅ CPPCHECK CUSTOM DOCKER SCAN COMPLETED`);
      console.log(`🔍 Cppcheck Custom found ${summary.total} total issues:`);
      console.log(`  - Critical: ${summary.critical}`);
      console.log(`  - High: ${summary.high}`);
      console.log(`  - Medium: ${summary.medium}`);
      console.log(`  - Low: ${summary.low}`);

      return result;

    } catch (error) {
      console.error(`💥 Cppcheck Custom Docker scan error:`, error.message);
      logger.error(`Cppcheck Custom scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * FIXED: Scan with custom rules and output XML
   * @param {string} sourceDir - Source directory
   * @param {string} rulesDir - Rules directory  
   * @param {string} outputDir - Output directory
   * @param {string} xmlFileName - XML output file name
   * @returns {Promise<Object>} Strategy result
   */
  async scanWithCustomRulesXML(sourceDir, rulesDir, outputDir, xmlFileName) {
    try {
      console.log(`🔧 Scanning with custom rules (XML output)...`);

      // Get custom rule files
      const ruleFiles = fs.readdirSync(rulesDir).filter(f => 
        f.endsWith('.xml') || f.endsWith('.rule') || f.endsWith('.cfg')
      );

      if (ruleFiles.length === 0) {
        console.log(`⚠️ No custom rule files found in ${rulesDir}`);
        throw new Error('No custom rule files found');
      }

      console.log(`📋 Using ${ruleFiles.length} custom rule files: ${ruleFiles.join(', ')}`);

      // FIXED: Build Docker command to output XML like cppcheck
      const ruleArgs = ruleFiles.map(file => `--rule-file=/rules/${file}`).join(' ');
      
      const command = `docker run --rm \
        -v "${sourceDir}:/src" \
        -v "${rulesDir}:/rules" \
        -v "${outputDir}:/output" \
        ${this.config.dockerImage} \
        cppcheck ${ruleArgs} --xml --xml-version=2 --enable=all \
        --output-file=/output/${xmlFileName} /src 2>&1`;

      console.log(`🐳 Docker command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutMs,
        maxBuffer: 20 * 1024 * 1024 // 20MB buffer
      });

      console.log(`📋 Docker completed. Output: ${(stdout + stderr).substring(0, 200)}...`);

      return {
        success: true,
        textOutput: stdout + stderr
      };

    } catch (error) {
      console.log(`❌ Custom rules XML scanning failed: ${error.message}`);
      return {
        success: false,
        textOutput: error.stdout || error.stderr || '',
        error: error.message
      };
    }
  }

  /**
   * Scan with built-in rules and output XML (fallback)
   */
  async scanWithBuiltinRulesXML(sourceDir, outputDir, xmlFileName) {
    try {
      console.log(`🔧 Scanning with built-in rules (XML output)...`);

      const command = `docker run --rm \
        -v "${sourceDir}:/src" \
        -v "${outputDir}:/output" \
        ${this.config.dockerImage} \
        cppcheck --xml --xml-version=2 --enable=all \
        --output-file=/output/${xmlFileName} /src 2>&1`;

      console.log(`🐳 Docker command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutMs,
        maxBuffer: 20 * 1024 * 1024
      });

      console.log(`📋 Built-in rules completed. Output: ${(stdout + stderr).substring(0, 200)}...`);

      return {
        success: true,
        textOutput: stdout + stderr
      };

    } catch (error) {
      console.log(`❌ Built-in rules XML scanning failed: ${error.message}`);
      return {
        success: false,
        textOutput: error.stdout || error.stderr || '',
        error: error.message
      };
    }
  }

  /**
   * Basic scan without custom rules (last resort)
   */
  async scanBasicXML(sourceDir, outputDir, xmlFileName) {
    try {
      console.log(`🔧 Basic scanning (XML output)...`);

      const command = `docker run --rm \
        -v "${sourceDir}:/src" \
        -v "${outputDir}:/output" \
        ${this.config.dockerImage} \
        cppcheck --xml --enable=error,warning \
        --output-file=/output/${xmlFileName} /src 2>&1`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutMs,
        maxBuffer: 20 * 1024 * 1024
      });

      return {
        success: true,
        textOutput: stdout + stderr
      };

    } catch (error) {
      console.log(`❌ Basic XML scanning failed: ${error.message}`);
      return {
        success: false,
        textOutput: error.stdout || error.stderr || '',
        error: error.message
      };
    }
  }

  /**
   * COPIED FROM CppcheckScanner: Parse XML output from cppcheck
   * @param {string} xmlPath - Path to XML output file
   * @param {string} baseDirectory - Base directory for relative paths
   * @returns {Array} Array of vulnerabilities
   */
  parseXmlOutput(xmlPath, baseDirectory) {
    try {
      console.log(`🔍 Parsing XML file: ${xmlPath}`);
      
      const xmlContent = fs.readFileSync(xmlPath, 'utf8');
      console.log(`📄 XML content length: ${xmlContent.length} characters`);
      
      // Simple XML parsing without external dependencies
      const vulnerabilities = [];
      
      // Find all <error> tags
      const errorMatches = xmlContent.match(/<error[^>]*>[\s\S]*?<\/error>/g);
      
      if (!errorMatches) {
        console.log(`⚠️ No <error> tags found in XML`);
        return [];
      }
      
      console.log(`🔍 Found ${errorMatches.length} error entries in XML`);
      
      for (const errorMatch of errorMatches) {
        try {
          const vuln = this.parseXmlError(errorMatch, baseDirectory);
          if (vuln) {
            vulnerabilities.push(vuln);
          }
        } catch (parseError) {
          console.warn(`Error parsing XML error entry:`, parseError.message);
        }
      }
      
      console.log(`✅ Parsed ${vulnerabilities.length} vulnerabilities from XML`);
      return vulnerabilities;
      
    } catch (error) {
      console.error(`Error parsing XML output: ${error.message}`);
      return [];
    }
  }

  /**
   * COPIED FROM CppcheckScanner: Parse individual XML error entry
   */
  parseXmlError(errorXml, baseDirectory) {
    try {
      // Extract attributes from <error> tag
      const idMatch = errorXml.match(/id="([^"]+)"/);
      const severityMatch = errorXml.match(/severity="([^"]+)"/);
      const msgMatch = errorXml.match(/msg="([^"]+)"/);
      const verboseMatch = errorXml.match(/verbose="([^"]+)"/);
      const cweMatch = errorXml.match(/cwe="([^"]+)"/);
      
      // Extract first <location> tag
      const locationMatch = errorXml.match(/<location[^>]*>/);
      
      if (!idMatch || !severityMatch || !msgMatch || !locationMatch) {
        console.warn(`Incomplete XML error entry - missing required fields`);
        return null;
      }
      
      const id = idMatch[1];
      const severity = severityMatch[1];
      const message = this.decodeXmlEntities(msgMatch[1]);
      const verbose = verboseMatch ? this.decodeXmlEntities(verboseMatch[1]) : message;
      const cwe = cweMatch ? cweMatch[1] : null;
      
      // Extract location details
      const fileMatch = locationMatch[0].match(/file="([^"]+)"/);
      const lineMatch = locationMatch[0].match(/line="([^"]+)"/);
      const columnMatch = locationMatch[0].match(/column="([^"]+)"/);
      
      if (!fileMatch || !lineMatch) {
        console.warn(`Incomplete location info in XML error entry`);
        return null;
      }
      
      const filePath = fileMatch[1];
      const line = parseInt(lineMatch[1]) || 1;
      const column = parseInt(columnMatch ? columnMatch[1] : '1') || 1;
      
      // Filter out information-only messages
      if (severity === 'information' && 
          (message.includes('Include file:') || 
           message.includes('not found') || 
           message.includes('checkers:'))) {
        return null;
      }
      
      return this.createVulnerability(filePath, line, severity, id, verbose, baseDirectory, { cwe, column });
      
    } catch (error) {
      console.warn(`Error parsing XML error entry:`, error.message);
      return null;
    }
  }

  /**
   * COPIED FROM CppcheckScanner: Create vulnerability object
   */
  createVulnerability(filePath, lineNum, severity, id, message, baseDirectory, extra = {}) {
    try {
      // Clean up file path
      let cleanFilePath = filePath.trim();
      
      // Handle Docker internal paths
      if (cleanFilePath.startsWith('/src/')) {
        cleanFilePath = cleanFilePath.substring(5); // Remove '/src/' prefix
      }
      
      // Convert to relative path
      const fileName = path.basename(cleanFilePath);
      const relativePath = path.relative(baseDirectory, path.resolve(baseDirectory, cleanFilePath));

      // Map cppcheck severity to standard levels
      const severityMap = {
        'error': 'high',
        'warning': 'medium',
        'style': 'low',
        'performance': 'low',
        'portability': 'low',
        'information': 'low',
        'debug': 'low'
      };

      const mappedSeverity = severityMap[severity?.toLowerCase()] || 'medium';

      // Determine issue type
      const issueType = this.determineIssueType(id, message, extra.cwe);

      return {
        name: `Cppcheck Custom: ${this.formatIssueName(id)}`,
        severity: mappedSeverity,
        type: issueType,
        tool: 'cppcheckCustom',
        file: {
          fileName,
          filePath: relativePath,
          fileExt: path.extname(fileName)
        },
        location: {
          line: parseInt(lineNum) || 1,
          column: extra.column || 1
        },
        description: message || 'No description provided',
        codeSnippet: {
          line: 'Code snippet not available',
          before: [],
          after: []
        },
        remediation: {
          description: this.getRemediation(id, message)
        },
        references: [
          'https://cppcheck.sourceforge.io/',
          'https://github.com/neszt/cppcheck-docker'
        ],
        status: 'open',
        metadata: {
          cppcheckId: id,
          originalSeverity: severity,
          dockerImage: this.config.dockerImage,
          cwe: extra.cwe || null
        }
      };
    } catch (error) {
      console.warn(`Error creating vulnerability for ${filePath}:${lineNum}:`, error.message);
      return null;
    }
  }

  // Copy all helper methods from CppcheckScanner...
  decodeXmlEntities(str) {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }

  determineIssueType(id, message, cwe) {
    const text = (id + ' ' + message).toLowerCase();
    
    if (cwe || text.includes('security') || text.includes('vulnerable') || 
        text.includes('overflow') || text.includes('double') || text.includes('use after')) {
      return 'Security';
    }
    
    if (text.includes('memory') || text.includes('buffer') || text.includes('null') || 
        text.includes('uninit') || text.includes('leak') || text.includes('free')) {
      return 'Memory Safety';
    }
    
    if (text.includes('performance') || text.includes('slow') || text.includes('inefficient')) {
      return 'Performance';
    }
    
    if (text.includes('style') || text.includes('unused') || text.includes('const')) {
      return 'Code Quality';
    }
    
    return 'Static Analysis';
  }

  formatIssueName(id) {
    if (!id || id === 'general') {
      return 'Code Issue';
    }
    
    return id.replace(/([A-Z])/g, ' $1')
             .replace(/([a-z])([A-Z])/g, '$1 $2')
             .trim()
             .toLowerCase()
             .replace(/\b\w/g, l => l.toUpperCase());
  }

  getRemediation(id, message) {
    const text = (id + ' ' + message).toLowerCase();
    
    const remediations = {
      'doublefree': 'Ensure memory is not freed multiple times. Set pointers to NULL after freeing.',
      'deallocuse': 'Do not access memory after it has been freed. Check pointer validity.',
      'memoryleak': 'Ensure all allocated memory is properly freed when no longer needed.',
      'arrayindexoutofbounds': 'Add proper bounds checking before accessing arrays.',
      'bufferaccessoutofbounds': 'Validate buffer bounds before access.',
      'uninitvar': 'Initialize all variables before use.',
      'nullpointer': 'Check for null pointers before dereferencing.',
      'unusedfunction': 'Remove unused functions or mark them as used if needed.',
      'unusedallocatedmemory': 'Use allocated memory or free it if not needed.',
      'constVariable': 'Declare variables as const when they are not modified.'
    };
    
    for (const [pattern, advice] of Object.entries(remediations)) {
      if (text.includes(pattern.toLowerCase())) {
        return advice;
      }
    }
    
    return `Fix the ${id || 'issue'} according to Cppcheck recommendations.`;
  }

  parseTextOutput(output, baseDirectory) {
    const vulnerabilities = [];
    const lines = output.split('\n').filter(line => line.trim());

    console.log(`Parsing ${lines.length} lines of text output...`);

    for (const line of lines) {
      try {
        if (line.includes('Checking ') || line.includes('done') || 
            line.includes('Include file:') || line.includes('not found')) {
          continue;
        }

        let match;
        
        // Parse different formats
        match = line.match(/^([^:]+):(\d+):(\w+):([^:]+):(.+)$/);
        if (match) {
          const [, filePath, lineNum, severity, id, message] = match;
          const vuln = this.createVulnerability(filePath, lineNum, severity, id, message, baseDirectory);
          if (vuln) vulnerabilities.push(vuln);
          continue;
        }

        match = line.match(/^\[([^:]+):(\d+)\]: \((\w+)\) (.+)$/);
        if (match) {
          const [, filePath, lineNum, severity, message] = match;
          const vuln = this.createVulnerability(filePath, lineNum, severity, 'general', message, baseDirectory);
          if (vuln) vulnerabilities.push(vuln);
          continue;
        }

      } catch (parseError) {
        console.warn(`Error parsing line: ${line}`, parseError.message);
      }
    }

    console.log(`Parsed ${vulnerabilities.length} vulnerabilities from text output`);
    return vulnerabilities;
  }

  getSourceFiles(directory) {
    const supportedExtensions = this.config.supportedLanguages.map(lang => `.${lang}`);
    
    const files = [];
    const walkDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'build', 'dist'].includes(entry.name)) {
              walkDir(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (supportedExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Cannot read directory ${dir}: ${error.message}`);
      }
    };

    walkDir(directory);
    return files;
  }

  createSummary(vulnerabilities) {
    const summary = {
      total: vulnerabilities.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    vulnerabilities.forEach(vuln => {
      if (vuln.severity && summary[vuln.severity] !== undefined) {
        summary[vuln.severity]++;
      }
    });

    return summary;
  }

  createEmptyResult(fileCount = 0) {
    return {
      scanner: 'cppcheckCustom',
      vulnerabilities: [],
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      metadata: {
        scannedFiles: fileCount,
        totalFiles: fileCount,
        tool: this.name,
        version: this.config.version,
        dockerImage: this.config.dockerImage
      }
    };
  }

  async createDefaultRules() {
    try {
      console.log(`📋 Creating default custom rules...`);

      const defaultRuleContent = `<?xml version="1.0" encoding="UTF-8"?>
<rule version="1">
  <tokenlist>strcpy ( %var% , %str% )</tokenlist>
  <message>
    <id>customBufferOverflow</id>
    <severity>error</severity>
    <msg>Potential buffer overflow with strcpy. Use strncpy instead.</msg>
  </message>
</rule>`;

      const defaultRulePath = path.join(this.config.rulesPath, 'default-buffer-overflow.xml');
      await fs.writeFile(defaultRulePath, defaultRuleContent);
      console.log(`✅ Created default rule: ${defaultRulePath}`);

    } catch (error) {
      console.warn(`⚠️ Could not create default rules: ${error.message}`);
    }
  }
}

module.exports = CppcheckCustomScanner;