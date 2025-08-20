// Tạo file: src/scripts/testCppcheckCustom.js
const testCppcheckCustom = async () => {
    const fs = require('fs-extra');
    const path = require('path');
    const CppcheckCustomScanner = require('../scanners/cppcheckCustomScanner');
  
    try {
      console.log('🧪 Testing Cppcheck Custom Scanner...');
  
      // Create test files
      const testDir = path.join(__dirname, '../test-files');
      fs.ensureDirSync(testDir);
  
      const testCode = `#include <stdio.h>
  #include <string.h>
  #include <stdlib.h>
  
  int main() {
      char buffer[10];
      char* source = "This is a very long string that will overflow";
      
      // This should trigger buffer overflow rule
      strcpy(buffer, source);
      
      // This should trigger memory leak rule
      char* ptr = malloc(100);
      // No free() - memory leak
      
      printf("Test completed\\n");
      return 0;
  }`;
  
      const testFilePath = path.join(testDir, 'test.c');
      await fs.writeFile(testFilePath, testCode);
      console.log('✅ Created test file');
  
      // Test scanner
      const scanner = new CppcheckCustomScanner();
      
      // Check installation
      const isInstalled = await scanner.checkInstallation();
      if (!isInstalled) {
        throw new Error('Scanner installation check failed');
      }
      console.log('✅ Installation check passed');
  
      // Run scan
      const outputPath = path.join(testDir, 'results.json');
      const results = await scanner.scanDirectory(testDir, outputPath);
      
      console.log('✅ Scan completed');
      console.log(`📊 Found ${results.summary.total} issues:`);
      console.log(`  - Critical: ${results.summary.critical}`);
      console.log(`  - High: ${results.summary.high}`);
      console.log(`  - Medium: ${results.summary.medium}`);
      console.log(`  - Low: ${results.summary.low}`);
  
      // Show some vulnerabilities
      if (results.vulnerabilities.length > 0) {
        console.log('\n📋 Sample vulnerabilities:');
        results.vulnerabilities.slice(0, 3).forEach((vuln, index) => {
          console.log(`  ${index + 1}. ${vuln.name} (${vuln.severity})`);
          console.log(`     File: ${vuln.file.fileName}:${vuln.location.line}`);
          console.log(`     Description: ${vuln.description}`);
        });
      }
  
      // Cleanup
      await fs.remove(testDir);
      console.log('✅ Test completed successfully');
  
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  };
  