const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger'); // Changed to default import
require('dotenv').config();

/**
 * Install external dependencies
 */
const installDependencies = async () => {
  try {
    logger.info('Starting installation of external dependencies');

    // Check if Semgrep is installed
    await checkAndInstallSemgrep();

    // Check if Snyk is installed
    await checkAndInstallSnyk();

    // Check if ClangTidy is installed
    await checkAndInstallClangTidy();

    logger.info('External dependencies installation completed successfully');
  } catch (error) {
    logger.error(`Error installing external dependencies: ${error.message}`);
    throw error;
  }
};

/**
 * Check and install Semgrep if needed
 */
const checkAndInstallSemgrep = async () => {
  try {
    logger.info('Checking Semgrep installation');

    // Check if Semgrep is installed
    await execCommand('semgrep --version');
    logger.info('Semgrep is already installed');
  } catch (error) {
    logger.info('Semgrep is not installed, installing now');

    // Install Semgrep
    try {
      await execCommand('pip install semgrep');
      logger.info('Semgrep installed successfully');
    } catch (pipError) {
      logger.warn(`Error installing Semgrep with pip: ${pipError.message}`);
      logger.info('Trying alternative installation method');

      try {
        await execCommand('python -m pip install semgrep');
        logger.info('Semgrep installed successfully with alternative method');
      } catch (altError) {
        logger.error(`Error installing Semgrep: ${altError.message}`);
        logger.info('Please install Semgrep manually: https://semgrep.dev/docs/getting-started/');
      }
    }
  }
};

/**
 * Check and install Snyk if needed
 */
const checkAndInstallSnyk = async () => {
  try {
    logger.info('Checking Snyk installation');

    // Check if Snyk is installed
    await execCommand('snyk --version');
    logger.info('Snyk is already installed');
  } catch (error) {
    logger.info('Snyk is not installed, installing now');

    // Install Snyk
    try {
      await execCommand('npm install -g snyk');
      logger.info('Snyk installed successfully');
    } catch (npmError) {
      logger.error(`Error installing Snyk: ${npmError.message}`);
      logger.info('Please install Snyk manually: https://docs.snyk.io/snyk-cli/install-the-snyk-cli');
    }
  }
};

/**
 * Check and install ClangTidy if needed
 */
const checkAndInstallClangTidy = async () => {
  try {
    logger.info('Checking ClangTidy installation');

    // Check if ClangTidy is installed
    await execCommand('clang-tidy --version');
    logger.info('ClangTidy is already installed');
  } catch (error) {
    logger.info('ClangTidy is not installed');
    logger.info('Please install ClangTidy manually based on your operating system:');
    logger.info('- Ubuntu/Debian: sudo apt-get install clang-tidy');
    logger.info('- macOS: brew install llvm');
    logger.info('- Windows: Install LLVM from https://llvm.org/builds/');
  }
};

/**
 * Execute shell command as promise
 * @param {String} command - Command to execute
 * @returns {Promise} Promise that resolves with stdout or rejects with error
 */
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};

// Run installation if this script is run directly
if (require.main === module) {
  installDependencies()
    .then(() => {
      logger.info('Dependencies installation script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Dependencies installation script failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = installDependencies;