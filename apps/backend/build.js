#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appDir = __dirname;
const rootDir = path.resolve(appDir, '../../');

try {
  // Build backend
  console.log('🏗️  Building backend application...');
  execSync('nest build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
