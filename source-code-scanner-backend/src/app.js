require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');

const { connectToDatabase } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./api/middleware/errorHandler');

// Routes
const scanRoutes = require('./api/routes/scanRoutes');
const reportRoutes = require('./api/routes/reportRoutes');
const userRoutes = require('./api/routes/userRoutes');
const settingsRoutes = require('./api/routes/settingsRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Create necessary directories
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const scanResultsDir = process.env.SCAN_RESULTS_DIR || './scans';
const reportsDir = process.env.REPORTS_DIR || './reports';

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(scanResultsDir);
fs.ensureDirSync(reportsDir);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// Request logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// API Routes
app.use(`${API_PREFIX}/scans`, scanRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API available at ${API_PREFIX}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

startServer();

module.exports = app; // For testing