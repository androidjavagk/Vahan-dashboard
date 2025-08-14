#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(' Setting up Vehicle Registration Dashboard...\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(` ${message}`, 'green');
}

function logError(message) {
  log(` ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ  ${message}`, 'yellow');
}

// Check if Node.js is installed
function checkNodeVersion() {
  try {
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    
    if (majorVersion < 16) {
      logError('Node.js version 16 or higher is required');
      process.exit(1);
    }
    
    logSuccess(`Node.js ${version} detected`);
    return true;
  } catch (error) {
    logError('Node.js is not installed. Please install Node.js 16 or higher');
    process.exit(1);
  }
}

// Install dependencies
function installDependencies() {
  logInfo('Installing dependencies...');
  
  try {
    // Install root dependencies
    log('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Install server dependencies
    log('Installing server dependencies...');
    execSync('cd server && npm install', { stdio: 'inherit' });
    
    // Install client dependencies
    log('Installing client dependencies...');
    execSync('cd client && npm install', { stdio: 'inherit' });
    
    logSuccess('All dependencies installed successfully');
  } catch (error) {
    logError('Failed to install dependencies');
    console.error(error);
    process.exit(1);
  }
}

// Create .env file if it doesn't exist
function createEnvFile() {
  const envPath = path.join(__dirname, 'server', '.env');
  
  if (!fs.existsSync(envPath)) {
    const envContent = `PORT=5000
NODE_ENV=development`;
    
    fs.writeFileSync(envPath, envContent);
    logSuccess('Created .env file');
  } else {
    logInfo('.env file already exists');
  }
}

// Start the server and initialize database
function initializeDatabase() {
  logInfo('Starting server and initializing database...');
  
  try {
    // Start server in background
    const serverProcess = execSync('cd server && npm run dev', { 
      stdio: 'pipe',
      timeout: 10000 
    });
    
    // Wait a moment for server to start
    setTimeout(() => {
      try {
        // Initialize database
        execSync('curl -X POST http://localhost:5000/api/data/init', { 
          stdio: 'inherit',
          timeout: 30000 
        });
        logSuccess('Database initialized successfully');
      } catch (error) {
        logError('Failed to initialize database. Please run manually:');
        log('curl -X POST http://localhost:5000/api/data/init', 'yellow');
      }
    }, 5000);
    
  } catch (error) {
    logError('Failed to start server');
    logInfo('Please start the server manually: npm run server');
  }
}

// Main setup function
async function setup() {
  log(' Vehicle Registration Dashboard Setup\n', 'blue');
  
  // Check prerequisites
  checkNodeVersion();
  
  // Install dependencies
  installDependencies();
  
  // Create environment file
  createEnvFile();
  
  logSuccess('Setup completed successfully!');
  
  log('\n Next steps:', 'blue');
  log('1. Start the development server: npm run dev', 'yellow');
  log('2. Open your browser to: http://localhost:3000', 'yellow');
  log('3. Initialize the database: curl -X POST http://localhost:5000/api/data/init', 'yellow');
  
  log('\n For more information, see README.md', 'blue');
  log('🔧 For issues, check the troubleshooting section in README.md', 'blue');
}

// Run setup
setup().catch(error => {
  logError('Setup failed');
  console.error(error);
  process.exit(1);
});
