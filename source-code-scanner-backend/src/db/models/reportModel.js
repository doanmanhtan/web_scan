// // src/db/models/reportModel.js
// const mongoose = require('mongoose');

// const reportSchema = new mongoose.Schema({
//   reportId: {
//     type: String,
//     required: true,
//     unique: true,
//     index: true
//   },
//   scan: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Scan',
//     required: true,
//     index: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   format: {
//     type: String,
//     enum: ['pdf', 'json', 'html', 'csv'],
//     default: 'pdf'
//   },
//   filePath: {
//     type: String,
//     required: true
//   },
//   fileSize: {
//     type: Number
//   },
//   generatedAt: {
//     type: Date,
//     default: Date.now
//   },
//   includeOptions: {
//     details: { type: Boolean, default: true },
//     code: { type: Boolean, default: true },
//     charts: { type: Boolean, default: true },
//     remediation: { type: Boolean, default: true }
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     index: true
//   },
//   shared: {
//     type: Boolean,
//     default: false
//   },
//   shareLink: {
//     type: String
//   },
//   shareExpiry: {
//     type: Date
//   }
// }, {
//   timestamps: true
// });

// // Index for faster queries
// reportSchema.index({ reportId: 1 });
// reportSchema.index({ scan: 1 });
// reportSchema.index({ createdBy: 1 });
// reportSchema.index({ createdAt: -1 });

// const Report = mongoose.model('Report', reportSchema);

// module.exports = Report;

// src/db/models/reportModel.js - FINAL FIXED VERSION
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
    // REMOVED: index: true (duplicate with schema.index below)
  },
  scan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
    required: true
    // REMOVED: index: true (duplicate with schema.index below)
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  format: {
    type: String,
    enum: ['json', 'html', 'csv'], // UPDATED: Removed 'pdf' as not implemented
    default: 'json'
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
    // REMOVED: index: true (duplicate with schema.index below)
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

// FIXED: Only use schema.index() to avoid duplicate warnings
reportSchema.index({ reportId: 1 });
reportSchema.index({ scan: 1 });
reportSchema.index({ createdBy: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;