"use strict";
// Type verification script for deployment
// This file ensures all Node.js types are properly available
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeCheck = void 0;
// Test Node.js globals
const nodeVersion = process.version;
const env = process.env.NODE_ENV || 'development';
console.log(`Node.js version: ${nodeVersion}`);
console.log(`Environment: ${env}`);
// Test module resolution
const path = require('path');
const currentDir = path.resolve(__dirname);
console.log(`Current directory: ${currentDir}`);
// Export to make this a module
exports.typeCheck = {
    nodeVersion,
    env,
    currentDir
};
console.log('✅ All Node.js types are available!');
