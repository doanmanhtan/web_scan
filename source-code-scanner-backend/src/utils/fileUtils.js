const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');
const logger = require('./logger'); // Changed to default import
const { v4: uuidv4 } = require('uuid');
const appConfig = require('../config/app');

// Rest of the code remains unchanged
const saveUploadedFile = async (fileBuffer, originalName, destDir = appConfig.upload.directory) => {
  try {
    fs.ensureDirSync(destDir);
    const fileExt = path.extname(originalName);
    const baseName = path.basename(originalName, fileExt);
    const uniqueName = `${baseName}_${uuidv4()}${fileExt}`;
    const filePath = path.join(destDir, uniqueName);
    await fs.writeFile(filePath, fileBuffer);
    return {
      originalName,
      fileName: uniqueName,
      filePath,
      fileSize: fileBuffer.length,
      fileExt,
      uploadDate: new Date()
    };
  } catch (error) {
    logger.error(`Error saving uploaded file: ${error.message}`);
    throw new Error('Failed to save uploaded file');
  }
};

const extractZipFile = async (zipFilePath, destDir) => {
  try {
    fs.ensureDirSync(destDir);
    const zipBuffer = await fs.readFile(zipFilePath);
    const zip = await JSZip.loadAsync(zipBuffer);
    const extractedFiles = [];
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const content = await zipEntry.async('nodebuffer');
        const filePath = path.join(destDir, filename);
        const fileDir = path.dirname(filePath);
        fs.ensureDirSync(fileDir);
        await fs.writeFile(filePath, content);
        extractedFiles.push({
          fileName: filename,
          filePath,
          fileSize: content.length,
          fileExt: path.extname(filename)
        });
      }
    }
    return extractedFiles;
  } catch (error) {
    logger.error(`Error extracting zip file: ${error.message}`);
    throw new Error('Failed to extract zip file');
  }
};

const getSourceCodeFiles = async (directory, supportedExtensions = appConfig.upload.supportedFileTypes) => {
  try {
    const files = [];
    const getFiles = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          await getFiles(fullPath);
        } else {
          const ext = path.extname(item.name).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    await getFiles(directory);
    return files;
  } catch (error) {
    logger.error(`Error getting source code files: ${error.message}`);
    throw new Error('Failed to get source code files');
  }
};

const createScanDirectory = () => {
  const scanId = uuidv4();
  const scanDir = path.join(appConfig.scans.directory, scanId);
  fs.ensureDirSync(scanDir);
  const uploadDir = path.join(scanDir, 'uploads');
  const resultsDir = path.join(scanDir, 'results');
  fs.ensureDirSync(uploadDir);
  fs.ensureDirSync(resultsDir);
  return {
    scanId,
    scanDir,
    uploadDir,
    resultsDir
  };
};

module.exports = {
  saveUploadedFile,
  extractZipFile,
  getSourceCodeFiles,
  createScanDirectory
};