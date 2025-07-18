#!/usr/bin/env node

/**
 * Setup script to handle Bun and Anchor compatibility
 * This script ensures both Bun and Yarn work together for the PoD Protocol
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

function runCommand(command, options = {}) {
  try {
    console.log(`Running: ${command}`);
    return execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'development' },
      ...options 
    });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    if (options.exitOnError !== false) {
      process.exit(1);
    }
    return null;
  }
}

function checkPackageManager(manager) {
  try {
    execSync(`${manager} --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkNodePackage(pkg) {
  try {
    require.resolve(pkg);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔧 Setting up package managers for PoD Protocol...');
  
  const hasBun = checkPackageManager('bun');
  const hasYarn = checkPackageManager('yarn');
  
  console.log(`Bun available: ${hasBun}`);
  console.log(`Yarn available: ${hasYarn}`);
  
  if (!hasYarn) {
    console.log('📦 Installing Yarn...');
    runCommand('npm install -g yarn');
  }
  
  console.log('📦 Installing dependencies with Yarn (for Anchor compatibility)...');
  runCommand('yarn install', { exitOnError: false });

  if (!checkNodePackage('@coral-xyz/anchor')) {
    console.log('📦 Installing @coral-xyz/anchor...');
    runCommand('yarn add -D @coral-xyz/anchor', { exitOnError: false });
  }

  // Install workspace dependencies with Bun for faster builds
  if (hasBun) {
    console.log('📦 Installing workspace dependencies with Bun...');
    runCommand('cd sdk && bun install', { exitOnError: false });
    runCommand('cd cli && bun install', { exitOnError: false });
    if (!checkNodePackage('@coral-xyz/anchor')) {
      runCommand('bun add -D @coral-xyz/anchor', { exitOnError: false });
    }
  }
  
  console.log('✅ Package manager setup complete!');
  console.log('📋 Usage:');
  console.log('  - Use "yarn" for Anchor commands (build, deploy, test)');
  console.log('  - Use "bun" for workspace development (faster builds)');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
