// src/scripts/setupSnykConfig.js
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
require('dotenv').config();

/**
 * Setup Snyk config để bypass authentication prompt
 */
const setupSnykConfig = async () => {
  try {
    console.log('=== Setting up Snyk Config to Bypass Auth Prompt ===\n');
    
    const token = process.env.SNYK_TOKEN;
    if (!token) {
      throw new Error('SNYK_TOKEN environment variable not set');
    }
    
    // 1. Setup Snyk config trong home directory
    await setupSnykHomeConfig(token);
    
    // 2. Setup Snyk config trong project directory
    await setupSnykProjectConfig(token);
    
    // 3. Setup environment variables
    await setupEnvironmentFile(token);
    
    console.log('✅ Snyk config setup completed successfully!');
    console.log('Snyk should now work without authentication prompts.');
    
  } catch (error) {
    console.error('Error setting up Snyk config:', error.message);
    throw error;
  }
};

/**
 * Setup Snyk config trong home directory
 */
const setupSnykHomeConfig = async (token) => {
  try {
    console.log('1. Setting up Snyk home config...');
    
    // Path tới Snyk config directory
    const configDir = path.join(os.homedir(), '.config', 'configstore');
    const snykConfigPath = path.join(configDir, 'snyk.json');
    
    // Tạo directory nếu chưa có
    fs.ensureDirSync(configDir);
    
    // Tạo Snyk config
    const snykConfig = {
      api: token,
      org: null, // Có thể set organization nếu cần
      endpoint: 'https://snyk.io/api',
      disable_analytics: false
    };
    
    // Ghi config file
    fs.writeFileSync(snykConfigPath, JSON.stringify(snykConfig, null, 2));
    console.log('✓ Snyk home config created:', snykConfigPath);
    
  } catch (error) {
    console.error('Error setting up home config:', error.message);
    throw error;
  }
};

/**
 * Setup Snyk config trong project directory
 */
const setupSnykProjectConfig = async (token) => {
  try {
    console.log('2. Setting up Snyk project config...');
    
    const projectConfigPath = path.join(process.cwd(), '.snyk');
    
    // Tạo .snyk file với config
    const snykProjectConfig = `
# Snyk (https://snyk.io) policy file

version: v1.0.0

# API token configuration
api: ${token}

# Ignore rules (optional)
ignore: {}

# Language settings
language-settings:
  javascript:
    includeDevDependencies: false
`;
    
    fs.writeFileSync(projectConfigPath, snykProjectConfig.trim());
    console.log('✓ Snyk project config created:', projectConfigPath);
    
    // Thêm .snyk vào .gitignore
    await addToGitignore('.snyk');
    
  } catch (error) {
    console.error('Error setting up project config:', error.message);
    throw error;
  }
};

/**
 * Setup environment file
 */
const setupEnvironmentFile = async (token) => {
  try {
    console.log('3. Setting up environment file...');
    
    const envPath = path.join(process.cwd(), '.env.snyk');
    
    const envContent = `# Snyk Environment Configuration
SNYK_TOKEN=${token}
SNYK_API=${token}
SNYK_DISABLE_ANALYTICS=true
SNYK_CFG_API=${token}
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Snyk environment file created:', envPath);
    
    // Thêm vào .gitignore
    await addToGitignore('.env.snyk');
    
  } catch (error) {
    console.error('Error setting up environment file:', error.message);
    throw error;
  }
};

/**
 * Thêm file vào .gitignore
 */
const addToGitignore = async (filename) => {
  try {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    if (!gitignoreContent.includes(filename)) {
      gitignoreContent += `\n# Snyk config files\n${filename}\n`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log(`✓ Added ${filename} to .gitignore`);
    }
    
  } catch (error) {
    console.warn(`Warning: Could not update .gitignore for ${filename}:`, error.message);
  }
};

/**
 * Verify Snyk config
 */
const verifySnykConfig = async () => {
  try {
    console.log('\n=== Verifying Snyk Configuration ===');
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Test với environment variables
    const env = {
      ...process.env,
      SNYK_TOKEN: process.env.SNYK_TOKEN,
      SNYK_API: process.env.SNYK_TOKEN,
      SNYK_CFG_API: process.env.SNYK_TOKEN
    };
    
    // Test authentication
    const { stdout } = await execAsync('snyk whoami', { env });
    console.log('✓ Snyk authentication verified:', stdout.trim());
    
    return true;
  } catch (error) {
    console.error('Snyk config verification failed:', error.message);
    return false;
  }
};

/**
 * Clean up old auth files
 */
const cleanupOldAuth = async () => {
  try {
    console.log('4. Cleaning up old authentication files...');
    
    const oldAuthFiles = [
      path.join(os.homedir(), '.snyk', 'config'),
      path.join(os.homedir(), '.snyk-auth'),
      path.join(process.cwd(), '.snyk-auth')
    ];
    
    for (const authFile of oldAuthFiles) {
      if (fs.existsSync(authFile)) {
        fs.removeSync(authFile);
        console.log(`✓ Removed old auth file: ${authFile}`);
      }
    }
    
  } catch (error) {
    console.warn('Warning: Could not clean up old auth files:', error.message);
  }
};

// Run setup if this script is executed directly
if (require.main === module) {
  setupSnykConfig()
    .then(() => cleanupOldAuth())
    .then(() => verifySnykConfig())
    .then((success) => {
      if (success) {
        console.log('\n✅ Snyk setup completed successfully!');
        console.log('Snyk should now work without authentication prompts.');
      } else {
        console.log('\n⚠️ Setup completed but verification failed.');
        console.log('You may still need to authenticate manually.');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  setupSnykConfig,
  verifySnykConfig
};