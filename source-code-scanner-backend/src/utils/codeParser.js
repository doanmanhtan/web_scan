const path = require('path');
const fs = require('fs-extra');
const logger = require('./logger'); // Changed to default import

const parseCodeFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath);
    const lines = content.split('\n');
    return {
      filePath,
      fileName,
      fileExt,
      size: stats.size,
      lines: lines.length,
      content,
      lastModified: stats.mtime
    };
  } catch (error) {
    logger.error(`Error parsing code file ${filePath}: ${error.message}`);
    throw new Error(`Failed to parse code file: ${filePath}`);
  }
};

const getCodeSnippet = async (filePath, lineNumber, contextLines = 3) => {
  try {
    const { content } = await parseCodeFile(filePath);
    const codeLines = content.split('\n');
    const startLine = Math.max(0, lineNumber - contextLines - 1);
    const endLine = Math.min(codeLines.length - 1, lineNumber + contextLines - 1);
    const snippet = [];
    for (let i = startLine; i <= endLine; i++) {
      snippet.push({
        lineNumber: i + 1,
        content: codeLines[i],
        isHighlighted: i + 1 === lineNumber
      });
    }
    return {
      filePath,
      lineNumber,
      snippet
    };
  } catch (error) {
    logger.error(`Error getting code snippet: ${error.message}`);
    throw new Error('Failed to get code snippet');
  }
};

const countLinesOfCode = async (filePaths) => {
  try {
    let totalLines = 0;
    let totalFiles = 0;
    const fileStats = [];
    for (const filePath of filePaths) {
      const { fileName, lines } = await parseCodeFile(filePath);
      totalLines += lines;
      totalFiles++;
      fileStats.push({
        fileName,
        lines
      });
    }
    return {
      totalFiles,
      totalLines,
      fileStats
    };
  } catch (error) {
    logger.error(`Error counting lines of code: ${error.message}`);
    throw new Error('Failed to count lines of code');
  }
};

module.exports = {
  parseCodeFile,
  getCodeSnippet,
  countLinesOfCode
};