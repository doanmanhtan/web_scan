// simple-debug.js - Simple debug script
console.log('🔍 SIMPLE SCANNER DEBUG');
console.log('=======================');

// Basic directory check
const fs = require('fs');
const path = require('path');

console.log('📍 Current directory:', process.cwd());

// 1. Check basic structure
console.log('\n1️⃣ Checking Basic Structure...');
const dirs = ['src', 'src/scanners', 'src/services'];
dirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}/`);
});

// 2. List scanner files
console.log('\n2️⃣ Scanner Files:');
try {
  const scannerFiles = fs.readdirSync('./src/scanners');
  scannerFiles.forEach(file => {
    console.log(`  📄 ${file}`);
  });
} catch (error) {
  console.log('  ❌ Cannot read scanner directory:', error.message);
}

// 3. Check specific files
console.log('\n3️⃣ Checking Key Files...');
const keyFiles = [
  'src/scanners/scannerFactory.js',
  'src/scanners/clangTidyScanner.js',
  'src/scanners/cppcheckScanner.js',
  'src/scanners/clangStaticAnalyzerScanner.js',
  'src/services/scanService.js'
];

keyFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 4. Try to load scanner factory
console.log('\n4️⃣ Testing Scanner Factory...');
try {
  const scannerFactory = require('./src/scanners/scannerFactory');
  console.log('  ✅ Scanner factory loaded');
  console.log('  📋 Type:', typeof scannerFactory);
  console.log('  🔧 Methods:', Object.keys(scannerFactory));
  
  // Test creating a simple scanner
  if (scannerFactory.createScanner) {
    try {
      const semgrepScanner = scannerFactory.createScanner('semgrep');
      console.log('  ✅ Semgrep scanner created:', !!semgrepScanner);
    } catch (error) {
      console.log('  ❌ Semgrep scanner failed:', error.message);
    }
    
    try {
      const clangTidyScanner = scannerFactory.createScanner('clangTidy');
      console.log('  ✅ ClangTidy scanner created:', !!clangTidyScanner);
    } catch (error) {
      console.log('  ❌ ClangTidy scanner failed:', error.message);
    }
  } else {
    console.log('  ❌ No createScanner method found');
  }
  
} catch (error) {
  console.log('  ❌ Scanner factory error:', error.message);
}

// 5. Check package.json
console.log('\n5️⃣ Package Info...');
try {
  const pkg = require('./package.json');
  console.log('  ✅ Package name:', pkg.name);
  console.log('  ✅ Node version required:', pkg.engines?.node || 'not specified');
} catch (error) {
  console.log('  ❌ Package.json error:', error.message);
}

console.log('\n🎉 Simple debug completed!');
console.log('\n📝 If you see errors above, that explains why tools are filtered out.');