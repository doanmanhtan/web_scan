
const mongoose = require('mongoose');
const fs = require('fs-extra'); // Ensure only one declaration of fs
const path = require('path');
const logger = require('../utils/logger'); // Changed to default import
require('dotenv').config();

// Import migrations
const migrations = [
  require('../db/migrations/001_initial_setup'),
  require('../db/migrations/002_add_admin_user')
];

/**
 * Run database setup
 */
const setupDatabase = async () => {
  try {
    logger.info('Starting database setup');

    // Connect to database
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS } = process.env;

    // Construct connection URL
    let connectionUrl;
    if (DB_USER && DB_PASS) {
      connectionUrl = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
    } else {
      connectionUrl = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
    }

    await mongoose.connect(connectionUrl);
    logger.info('Connected to MongoDB');

    // Create migrations collection if it doesn't exist
    const collections = await mongoose.connection.db.collections();
    const collectionNames = collections.map((c) => c.collectionName);

    if (!collectionNames.includes('migrations')) {
      await mongoose.connection.db.createCollection('migrations');
      logger.info('Created migrations collection');
    }

    // Get migration collection
    const migrationsCollection = mongoose.connection.db.collection('migrations');

    // Run migrations
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      const migrationName = `migration_${i + 1}`;

      // Check if migration has already been run
      const existingMigration = await migrationsCollection.findOne({ name: migrationName });

      if (!existingMigration) {
        logger.info(`Running migration: ${migrationName}`);
        await migration.up(mongoose.connection.db);

        // Record migration
        await migrationsCollection.insertOne({
          name: migrationName,
          appliedAt: new Date()
        });

        logger.info(`Migration completed: ${migrationName}`);
      } else {
        logger.info(`Migration already applied: ${migrationName}`);
      }
    }

    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error(`Error in database setup: ${error.message}`);
    throw error;
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Database connection closed');
    }
  }
};

// Run setup if this script is run directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info('Database setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Database setup script failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = setupDatabase;