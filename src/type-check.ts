// Type verification script for deployment
// This file ensures all Node.js types are properly available

// Test Node.js globals
const nodeVersion: string = process.version;
const env: string = process.env.NODE_ENV || 'development';

console.log(`Node.js version: ${nodeVersion}`);
console.log(`Environment: ${env}`);

// Test module resolution
const path = require('path');
const currentDir = path.resolve(__dirname);
console.log(`Current directory: ${currentDir}`);

// Export to make this a module
export const typeCheck = {
  nodeVersion,
  env,
  currentDir
};

console.log('✅ All Node.js types are available!');