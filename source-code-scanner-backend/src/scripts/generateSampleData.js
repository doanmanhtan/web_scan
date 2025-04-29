const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger'); // Changed to default import
const { hashPassword } = require('../utils/securityUtils');
require('dotenv').config();

// Create sample data
const generateSampleData = async () => {
  try {
    logger.info('Starting sample data generation');

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

    // Create sample users
    await createSampleUsers();

    // Create sample scans
    const sampleScans = await createSampleScans();

    // Create sample vulnerabilities
    await createSampleVulnerabilities(sampleScans);

    // Create sample reports
    await createSampleReports();

    logger.info('Sample data generation completed successfully');
  } catch (error) {
    logger.error(`Error generating sample data: ${error.message}`);
    throw error;
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Database connection closed');
    }
  }
};

/**
 * Create sample users
 */
const createSampleUsers = async () => {
  const usersCollection = mongoose.connection.db.collection('users');

  // Create sample users if they don't already exist
  const sampleUsers = [
    {
      username: 'dev_user',
      email: 'dev@example.com',
      password: await hashPassword('DevPass123!'),
      firstName: 'Developer',
      lastName: 'User',
      role: 'dev_team',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'security_user',
      email: 'security@example.com',
      password: await hashPassword('SecPass123!'),
      firstName: 'Security',
      lastName: 'User',
      role: 'security_team',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'normal_user',
      email: 'user@example.com',
      password: await hashPassword('UserPass123!'),
      firstName: 'Normal',
      lastName: 'User',
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const user of sampleUsers) {
    const existingUser = await usersCollection.findOne({ username: user.username });

    if (!existingUser) {
      await usersCollection.insertOne(user);
      logger.info(`Created sample user: ${user.username}`);
    } else {
      logger.info(`Sample user already exists: ${user.username}`);
    }
  }
};

/**
 * Create sample scans
 */
const createSampleScans = async () => {
  const scansCollection = mongoose.connection.db.collection('scans');
  const usersCollection = mongoose.connection.db.collection('users');

  // Get user IDs
  const admin = await usersCollection.findOne({ username: 'admin' });
  const devUser = await usersCollection.findOne({ username: 'dev_user' });
  const securityUser = await usersCollection.findOne({ username: 'security_user' });

  // Sample scan data
  const sampleScans = [
    {
      scanId: uuidv4(),
      name: 'Project Alpha Full Scan',
      status: 'completed',
      scanType: 'all',
      tools: ['semgrep', 'snyk', 'clangtidy'],
      uploadedFiles: [
        {
          originalName: 'main.cpp',
          fileName: 'main.cpp',
          filePath: '/virtual/path/main.cpp',
          fileSize: 2048,
          fileExt: '.cpp'
        },
        {
          originalName: 'utils.c',
          fileName: 'utils.c',
          filePath: '/virtual/path/utils.c',
          fileSize: 4096,
          fileExt: '.c'
        }
      ],
      scanDirectory: '/virtual/path/scan-1',
      progress: 100,
      startTime: new Date(Date.now() - 1000000),
      endTime: new Date(Date.now() - 900000),
      duration: 100000,
      filesScanned: 42,
      linesOfCode: 12480,
      issuesCounts: {
        critical: 2,
        high: 8,
        medium: 10,
        low: 3,
        total: 23
      },
      createdBy: admin._id,
      createdAt: new Date(Date.now() - 1100000),
      updatedAt: new Date(Date.now() - 900000)
    },
    {
      scanId: uuidv4(),
      name: 'Security Audit - Module A',
      status: 'completed',
      scanType: 'security',
      tools: ['semgrep', 'snyk'],
      uploadedFiles: [
        {
          originalName: 'auth.js',
          fileName: 'auth.js',
          filePath: '/virtual/path/auth.js',
          fileSize: 1024,
          fileExt: '.js'
        }
      ],
      scanDirectory: '/virtual/path/scan-2',
      progress: 100,
      startTime: new Date(Date.now() - 800000),
      endTime: new Date(Date.now() - 750000),
      duration: 50000,
      filesScanned: 15,
      linesOfCode: 5240,
      issuesCounts: {
        critical: 1,
        high: 4,
        medium: 7,
        low: 0,
        total: 12
      },
      createdBy: securityUser._id,
      createdAt: new Date(Date.now() - 850000),
      updatedAt: new Date(Date.now() - 750000)
    },
    {
      scanId: uuidv4(),
      name: 'Code Quality Review',
      status: 'completed',
      scanType: 'quality',
      tools: ['clangtidy'],
      uploadedFiles: [
        {
          originalName: 'parser.cpp',
          fileName: 'parser.cpp',
          filePath: '/virtual/path/parser.cpp',
          fileSize: 8192,
          fileExt: '.cpp'
        }
      ],
      scanDirectory: '/virtual/path/scan-3',
      progress: 100,
      startTime: new Date(Date.now() - 600000),
      endTime: new Date(Date.now() - 570000),
      duration: 30000,
      filesScanned: 8,
      linesOfCode: 3200,
      issuesCounts: {
        critical: 0,
        high: 5,
        medium: 9,
        low: 3,
        total: 17
      },
      createdBy: devUser._id,
      createdAt: new Date(Date.now() - 650000),
      updatedAt: new Date(Date.now() - 570000)
    },
    {
      scanId: uuidv4(),
      name: 'Memory Safety Check',
      status: 'in_progress',
      scanType: 'all',
      tools: ['semgrep', 'clangtidy'],
      uploadedFiles: [
        {
          originalName: 'memory.c',
          fileName: 'memory.c',
          filePath: '/virtual/path/memory.c',
          fileSize: 4096,
          fileExt: '.c'
        }
      ],
      scanDirectory: '/virtual/path/scan-4',
      progress: 65,
      startTime: new Date(Date.now() - 300000),
      filesScanned: 3,
      linesOfCode: 1500,
      issuesCounts: {
        critical: 1,
        high: 3,
        medium: 2,
        low: 1,
        total: 7
      },
      createdBy: admin._id,
      createdAt: new Date(Date.now() - 350000),
      updatedAt: new Date(Date.now() - 290000)
    }
  ];

  // Insert sample scans
  for (const scan of sampleScans) {
    const existingScan = await scansCollection.findOne({ scanId: scan.scanId });

    if (!existingScan) {
      const result = await scansCollection.insertOne(scan);
      scan._id = result.insertedId; // Save ID for creating vulnerabilities
      logger.info(`Created sample scan: ${scan.name}`);
    } else {
      logger.info(`Sample scan already exists: ${scan.name}`);
      scan._id = existingScan._id; // Save ID for creating vulnerabilities
    }
  }

  return sampleScans;
};

/**
 * Create sample vulnerabilities
 */
const createSampleVulnerabilities = async (sampleScans) => {
  const vulnerabilitiesCollection = mongoose.connection.db.collection('vulnerabilities');
  const scansCollection = mongoose.connection.db.collection('scans');

  // Get scans if not provided
  if (!sampleScans) {
    sampleScans = await scansCollection.find({}).toArray();
  }

  // Sample vulnerability templates
  const vulnerabilityTemplates = [
    {
      name: 'Buffer Overflow',
      severity: 'high',
      type: 'Memory Safety',
      tool: 'semgrep',
      file: {
        fileName: 'main.cpp',
        filePath: 'main.cpp',
        fileExt: '.cpp'
      },
      location: {
        line: 42,
        column: 15
      },
      description: 'Potential buffer overflow vulnerability detected. Missing bounds check before memory access.',
      codeSnippet: {
        line: 'strcpy(buffer, input);  // Vulnerable code here',
        before: ['// Previous code'],
        after: ['// Next code']
      },
      remediation: {
        description: 'Use strncpy() instead of strcpy() and ensure the buffer size is respected.'
      },
      status: 'open'
    },
    {
      name: 'Memory Leak',
      severity: 'medium',
      type: 'Memory Safety',
      tool: 'clangtidy',
      file: {
        fileName: 'utils.c',
        filePath: 'utils.c',
        fileExt: '.c'
      },
      location: {
        line: 87,
        column: 10
      },
      description: 'Memory allocated but never freed, causing memory leak.',
      codeSnippet: {
        line: 'char* data = malloc(100);  // Memory allocated but never freed',
        before: ['// Previous code'],
        after: ['// Next code']
      },
      remediation: {
        description: 'Ensure all allocated memory is properly freed when no longer needed.'
      },
      status: 'open'
    },
    {
      name: 'Use After Free',
      severity: 'high',
      type: 'Memory Safety',
      tool: 'snyk',
      file: {
        fileName: 'parser.cpp',
        filePath: 'parser.cpp',
        fileExt: '.cpp'
      },
      location: {
        line: 124,
        column: 8
      },
      description: 'Accessing memory after it has been freed.',
      codeSnippet: {
        line: 'free(ptr); return ptr->value;  // Using freed memory',
        before: ['// Previous code'],
        after: ['// Next code']
      },
      remediation: {
        description: 'Do not access memory after it has been freed. Set pointers to NULL after freeing.'
      },
      status: 'in_progress'
    },
    {
      name: 'Format String Vulnerability',
      severity: 'critical',
      type: 'Security',
      tool: 'semgrep',
      file: {
        fileName: 'logger.c',
        filePath: 'logger.c',
        fileExt: '.c'
      },
      location: {
        line: 53,
        column: 5
      },
      description: 'Format string vulnerability that could lead to arbitrary code execution.',
      codeSnippet: {
        line: 'printf(user_input);  // Format string vulnerability',
        before: ['// Previous code'],
        after: ['// Next code']
      },
      remediation: {
        description: 'Always use format string literals with proper placeholders. Never pass user input directly as format string.'
      },
      status: 'open'
    },
    {
      name: 'Integer Overflow',
      severity: 'medium',
      type: 'Security',
      tool: 'clangtidy',
      file: {
        fileName: 'math.cpp',
        filePath: 'math.cpp',
        fileExt: '.cpp'
      },
      location: {
        line: 74,
        column: 12
      },
      description: 'Potential integer overflow when performing arithmetic operation.',
      codeSnippet: {
        line: 'int result = value1 * value2;  // No overflow check before multiplication',
        before: ['// Previous code'],
        after: ['// Next code']
      },
      remediation: {
        description: 'Check for potential overflow before performing arithmetic operations. Consider using safer integer types.'
      },
      status: 'fixed'
    },
    {
      name: 'Uninitialized Variable',
      severity: 'low',
      type: 'Code Quality',
      tool: 'semgrep',
      file: {
        fileName: 'config.c',
        filePath: 'config.c',
        fileExt: '.c'
      },
      location: {
        line: 32,
        column: 20
      },
      description: 'Variable may be used before initialization.',
      codeSnippet: {
        line: 'int value; func(value);  // Value used before initialization',
        before: ['// Previous code'],
        after: ['// Next code']
      },
      remediation: {
        description: 'Initialize all variables before use. Enable compiler warnings for uninitialized variables.'
      },
      status: 'open'
    },
    {
      name: 'Insecure Random',
      severity: 'medium',
      type: 'Security',
      tool: 'snyk',
      file: {
        fileName: 'crypto.js',
        filePath: 'crypto.js',
        fileExt: '.js'
      },
      location: {
        line: 56,
        column: 15
      },
      description: 'Using weak random number generator for security-sensitive operation.',
      codeSnippet: {
        line: 'const key = Math.random().toString();  // Weak random number generator',
        before: ['// Previous code'],
        after: ['// Next code']
      },
      remediation: {
        description: 'Use cryptographically secure random number generators for security-sensitive operations.'
      },
      status: 'open'
    }
  ];

  // Create sample vulnerabilities for each scan
  for (const scan of sampleScans) {
    // Check if scan already has vulnerabilities
    const existingVulns = await vulnerabilitiesCollection.countDocuments({ scan: scan._id });

    if (existingVulns > 0) {
      logger.info(`Scan ${scan.name} already has vulnerabilities, skipping`);
      continue;
    }

    // Create 5-15 vulnerabilities for each scan
    const numVulnerabilities = Math.floor(Math.random() * 10) + 5;
    const vulnerabilities = [];

    for (let i = 0; i < numVulnerabilities; i++) {
      // Select a random vulnerability template
      const template = vulnerabilityTemplates[Math.floor(Math.random() * vulnerabilityTemplates.length)];

      // Create a new vulnerability from the template
      const vulnerability = {
        ...template,
        scan: scan._id,
        createdAt: new Date(scan.createdAt.getTime() + 60000), // 1 minute after scan created
        updatedAt: new Date(scan.createdAt.getTime() + 60000)
      };

      vulnerabilities.push(vulnerability);
    }

    // Insert vulnerabilities
    if (vulnerabilities.length > 0) {
      await vulnerabilitiesCollection.insertMany(vulnerabilities);
      logger.info(`Created ${vulnerabilities.length} sample vulnerabilities for scan: ${scan.name}`);
    }
  }
};

/**
 * Create sample reports
 */
const createSampleReports = async () => {
  const reportsCollection = mongoose.connection.db.collection('reports');
  const scansCollection = mongoose.connection.db.collection('scans');

  // Get completed scans
  const completedScans = await scansCollection.find({ status: 'completed' }).toArray();

  // Sample report formats
  const formats = ['json', 'html', 'csv'];

  for (const scan of completedScans) {
    // Check if scan already has reports
    const existingReports = await reportsCollection.countDocuments({ scan: scan._id });

    if (existingReports > 0) {
      logger.info(`Scan ${scan.name} already has reports, skipping`);
      continue;
    }

    // Create 1-3 reports for each scan
    const numReports = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numReports; i++) {
      // Select a random format
      const format = formats[Math.floor(Math.random() * formats.length)];

      // Create a report
      const report = {
        reportId: uuidv4(),
        scan: scan._id,
        name: `${scan.name} Report (${format.toUpperCase()})`,
        format,
        filePath: `/virtual/path/reports/${uuidv4()}.${format}`,
        fileSize: Math.floor(Math.random() * 500000) + 10000, // Random file size between 10KB and 500KB
        generatedAt: new Date(scan.endTime.getTime() + 60000), // 1 minute after scan completed
        includeOptions: {
          details: true,
          code: Math.random() > 0.3, // 70% chance of including code
          charts: Math.random() > 0.3, // 70% chance of including charts
          remediation: Math.random() > 0.3 // 70% chance of including remediation
        },
        createdBy: scan.createdBy,
        shared: Math.random() > 0.7, // 30% chance of being shared
        createdAt: new Date(scan.endTime.getTime() + 60000),
        updatedAt: new Date(scan.endTime.getTime() + 60000)
      };

      // Add share information if shared
      if (report.shared) {
        report.shareLink = `share-${uuidv4()}`;
        report.shareExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      }

      // Insert report
      await reportsCollection.insertOne(report);
      logger.info(`Created sample report: ${report.name}`);
    }
  }
};

// Run data generation if this script is run directly
if (require.main === module) {
  generateSampleData()
    .then(() => {
      logger.info('Sample data generation script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Sample data generation script failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = generateSampleData;