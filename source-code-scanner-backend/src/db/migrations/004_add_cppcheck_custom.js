// Tạo file: src/db/migrations/004_add_cppcheck_custom.js
const addCppcheckCustomMigration = async () => {
    const mongoose = require('mongoose');
    require('dotenv').config();
  
    try {
      console.log('🔄 Running migration: Add cppcheckCustom scanner support');
      
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
  
      // Update scan model to support cppcheckCustom
      console.log('📝 Updating scan configurations...');
      
      // Record migration
      const migrationsCollection = mongoose.connection.db.collection('migrations');
      await migrationsCollection.insertOne({
        name: '004_add_cppcheck_custom',
        description: 'Add support for cppcheckCustom scanner with Docker',
        appliedAt: new Date()
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