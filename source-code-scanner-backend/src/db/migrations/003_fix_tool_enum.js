// src/db/migrations/003_fix_tool_enum.js
const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Migration để fix tool enum issues
 */
const fixToolEnum = async () => {
  try {
    console.log('🔄 Running migration: Fix tool enum for all scanners');
    
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

    // 1. Check current tool usage in vulnerabilities
    console.log('📊 Current vulnerability tools:');
    const toolStats = await vulnerabilitiesCollection.aggregate([
      { $group: { _id: '$tool', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    toolStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} vulnerabilities`);
    });

    // 2. Update scans with old tool names
    console.log('📝 Updating scans with old tool names...');
    
    const scansToUpdate = await scansCollection.find({
      tools: { $in: ['clangtidy', 'clang-tidy', 'clang_tidy', 'clangstaticanalyzer', 'clang-static-analyzer'] }
    }).toArray();
    
    console.log(`Found ${scansToUpdate.length} scans with old tool names`);
    
    for (const scan of scansToUpdate) {
      const updatedTools = scan.tools.map(tool => {
        const normalizedTool = tool.toLowerCase().trim();
        const toolMapping = {
          'clangtidy': 'clangTidy',
          'clang-tidy': 'clangTidy',
          'clang_tidy': 'clangTidy',
          'clangstaticanalyzer': 'clangStaticAnalyzer',
          'clang-static-analyzer': 'clangStaticAnalyzer',
          'clang_static_analyzer': 'clangStaticAnalyzer',
          'cpp-check': 'cppcheck',
          'cpp_check': 'cppcheck'
        };
        
        return toolMapping[normalizedTool] || tool;
      });
      
      await scansCollection.updateOne(
        { _id: scan._id },
        { $set: { tools: updatedTools } }
      );
      
      console.log(`✅ Updated scan ${scan.scanId}: [${scan.tools.join(', ')}] → [${updatedTools.join(', ')}]`);
    }

    // 3. Update vulnerabilities with old tool names
    console.log('📝 Updating vulnerabilities with old tool names...');
    
    const vulnerabilitiesToUpdate = await vulnerabilitiesCollection.find({
      tool: { $in: ['clangtidy', 'clang-tidy', 'clang_tidy', 'clangstaticanalyzer', 'clang-static-analyzer'] }
    }).toArray();
    
    console.log(`Found ${vulnerabilitiesToUpdate.length} vulnerabilities with old tool names`);
    
    for (const vuln of vulnerabilitiesToUpdate) {
      const normalizedTool = vuln.tool.toLowerCase().trim();
      const toolMapping = {
        'clangtidy': 'clangTidy',
        'clang-tidy': 'clangTidy', 
        'clang_tidy': 'clangTidy',
        'clangstaticanalyzer': 'clangStaticAnalyzer',
        'clang-static-analyzer': 'clangStaticAnalyzer',
        'clang_static_analyzer': 'clangStaticAnalyzer',
        'cpp-check': 'cppcheck',
        'cpp_check': 'cppcheck'
      };
      
      const updatedTool = toolMapping[normalizedTool] || vuln.tool;
      
      if (updatedTool !== vuln.tool) {
        await vulnerabilitiesCollection.updateOne(
          { _id: vuln._id },
          { $set: { tool: updatedTool } }
        );
        console.log(`✅ Updated vulnerability ${vuln._id}: ${vuln.tool} → ${updatedTool}`);
      }
    }

    // 4. Record migration
    const migrationsCollection = mongoose.connection.db.collection('migrations');
    await migrationsCollection.insertOne({
      name: '003_fix_tool_enum',
      description: 'Fix tool enum to support all 5 scanners consistently',
      appliedAt: new Date()
    });

    // 5. Final verification
    console.log('📊 Final tool statistics:');
    const finalStats = await vulnerabilitiesCollection.aggregate([
      { $group: { _id: '$tool', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    finalStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} vulnerabilities`);
    });

    console.log('✅ Migration completed successfully');

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
  fixToolEnum()
    .then(() => {
      console.log('🎉 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fixToolEnum };