// src/db/models/scanModel.js
const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  scanId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  scanType: {
    type: String,
    enum: ['all', 'security', 'quality', 'performance', 'custom'],
    default: 'all'
  },
  tools: [{
    type: String,
    enum: ['semgrep', 'snyk', 'clangtidy']
  }],
  uploadedFiles: [{
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    fileExt: String
  }],
  scanDirectory: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // Duration in milliseconds
  },
  filesScanned: {
    type: Number,
    default: 0
  },
  linesOfCode: {
    type: Number,
    default: 0
  },
  issuesCounts: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  error: {
    message: String,
    stack: String
  }
}, {
  timestamps: true
});

// Virtual for total issues
scanSchema.virtual('totalIssues').get(function() {
  return this.issuesCounts.total;
});

// Virtual for scan duration
scanSchema.virtual('scanDuration').get(function() {
  if (!this.startTime || !this.endTime) return null;
  return this.endTime - this.startTime;
});

// Index for faster queries
scanSchema.index({ scanId: 1 });
scanSchema.index({ createdBy: 1 });
scanSchema.index({ status: 1 });
scanSchema.index({ createdAt: -1 });

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;

