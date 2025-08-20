// debug-scanners.js
const scannerFactory = require('./src/scanners/scannerFactory');

async function debugScanners() {
  console.log('🔍 Debugging Scanner Factory...\n');
  
  try {
    // 1. Check available scanners
    const available = scannerFactory.getAvailableScanners();
    console.log('📋 Available scanners:', available);
    
    // 2. Check if cppcheckCustom is registered
    const hasCppcheckCustom = available.includes('cppcheckCustom');
    console.log('🎯 cppcheckCustom registered:', hasCppcheckCustom);
    
    // 3. Try to create cppcheckCustom scanner
    if (hasCppcheckCustom) {
      try {
        const scanner = scannerFactory.createScanner('cppcheckCustom');
        console.log('✅ cppcheckCustom scanner created:', scanner.name);
        
        // Check installation
        const isInstalled = await scanner.checkInstallation();
        console.log('🔧 cppcheckCustom installation check:', isInstalled);
      } catch (createError) {
        console.error('❌ Error creating cppcheckCustom:', createError.message);
      }
    }
    
    // 4. Check installation status of all scanners
    console.log('\n📊 Installation Status:');
    const status = await scannerFactory.checkAllScannersInstallation();
    Object.entries(status).forEach(([name, info]) => {
      const icon = info.installed ? '✅' : '❌';
      console.log(`${icon} ${name}: ${info.installed ? 'INSTALLED' : 'NOT INSTALLED'}`);
      if (info.error) console.log(`   Error: ${info.error}`);
    });
    
  } catch (error) {
    console.error('💥 Debug error:', error.message);
  }
}

debugScanners();