// src/config/database.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectToDatabase = async () => {
  try {
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
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = {
  connectToDatabase
};

