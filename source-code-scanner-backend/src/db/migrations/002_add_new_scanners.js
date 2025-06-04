// src/db/migrations/002_add_new_scanners.js
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Migration to add new scanners to existing data
 */
const addNewScanners = async () => {
  try {
    console.log('🔄 Running migration: Add new scanners support');
    
    // Connect to database
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env;

    let connectionUrl;
    if (DB_USER && DB_PASS) {
      connectionUrl = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
    } else {
      connectionUrl = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
    }

    await mongoose.connect(connectionUrl);
    console.log('✅ Connected to MongoDB');

    // Get collections
    const scansCollection = mongoose.connection.db.collection('scans');
    const vulnerabilitiesCollection = mongoose.connection.db.collection('vulnerabilities');

    // 1. Update existing scans with invalid tools
    console.log('📝 Checking existing scans for tool updates...');
    
    const scansToUpdate = await scansCollection.find({
      tools: { $in: ['clangtidy', 'clang-tidy', 'clang_tidy'] }
    }).toArray();
    
    console.log(`Found ${scansToUpdate.length} scans with old tool names`);
    
    for (const scan of scansToUpdate) {
      const updatedTools = scan.tools.map(tool => {
        switch (tool) {
          case 'clangtidy':
          case 'clang-tidy':
          case 'clang_tidy':
            return 'clangTidy';
          case 'clang-static-analyzer':
          case 'clang_static_analyzer':
            return 'clangStaticAnalyzer';
          case 'cpp-check':
          case 'cpp_check':
            return 'cppcheck';
          default:
            return tool;
        }
      });
      
      await scansCollection.updateOne(
        { _id: scan._id },
        { $set: { tools: updatedTools } }
      );
      
      console.log(`✅ Updated scan ${scan.scanId}: ${scan.tools} → ${updatedTools}`);
    }

    // 2. Update vulnerabilities with old tool names
    console.log('📝 Checking vulnerabilities for tool updates...');
    
    const vulnerabilitiesToUpdate = await vulnerabilitiesCollection.find({
      tool: { $in: ['clangtidy', 'clang-tidy', 'clang_tidy', 'clang-static-analyzer', 'cpp-check'] }
    }).toArray();
    
    console.log(`Found ${vulnerabilitiesToUpdate.length} vulnerabilities with old tool names`);
    
    for (const vuln of vulnerabilitiesToUpdate) {
      let updatedTool = vuln.tool;
      
      switch (vuln.tool) {
        case 'clangtidy':
        case 'clang-tidy':
        case 'clang_tidy':
          updatedTool = 'clangTidy';
          break;
        case 'clang-static-analyzer':
        case 'clang_static_analyzer':
          updatedTool = 'clangStaticAnalyzer';
          break;
        case 'cpp-check':
        case 'cpp_check':
          updatedTool = 'cppcheck';
          break;
      }
      
      if (updatedTool !== vuln.tool) {
        await vulnerabilitiesCollection.updateOne(
          { _id: vuln._id },
          { $set: { tool: updatedTool } }
        );
        console.log(`✅ Updated vulnerability ${vuln._id}: ${vuln.tool} → ${updatedTool}`);
      }
    }

    // 3. Record migration
    const migrationsCollection = mongoose.connection.db.collection('migrations');
    await migrationsCollection.insertOne({
      name: '002_add_new_scanners',
      description: 'Add support for cppcheck and clangStaticAnalyzer scanners',
      appliedAt: new Date()
    });

    console.log('✅ Migration completed successfully');
    console.log('📊 Summary:');
    console.log(`   - Updated ${scansToUpdate.length} scans`);
    console.log(`   - Updated ${vulnerabilitiesToUpdate.length} vulnerabilities`);
    console.log('   - Added new scanner enum values: cppcheck, clangStaticAnalyzer');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  addNewScanners()
    .then(() => {
      console.log('🎉 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { addNewScanners };