// src/db/models/reportModel.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  scan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  format: {
    type: String,
    enum: ['pdf', 'json', 'html', 'csv'],
    default: 'pdf'
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  includeOptions: {
    details: { type: Boolean, default: true },
    code: { type: Boolean, default: true },
    charts: { type: Boolean, default: true },
    remediation: { type: Boolean, default: true }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shared: {
    type: Boolean,
    default: false
  },
  shareLink: {
    type: String
  },
  shareExpiry: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
reportSchema.index({ reportId: 1 });
reportSchema.index({ scan: 1 });
reportSchema.index({ createdBy: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;

