#!/usr/bin/env node

/**
 * Lightweight postinstall script
 * Only fixes permissions - no heavy setup
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function fixPermissions() {
  try {
    // Only run on Unix-like systems
    if (os.platform() === 'win32') {
      console.log('✅ SSH Manager Pro installed successfully');
      console.log('📋 Available commands: sshm generate, sshm list, sshm copy, sshm status');
      return;
    }

    // Fix CLI script permissions
    const cliPath = path.join(__dirname, '..', 'src', 'cli-simple.js');
    if (fs.existsSync(cliPath)) {
      fs.chmodSync(cliPath, 0o755);
    }

    // Fix binary permissions - try multiple possible locations
    const possibleBinPaths = [
      // npm global bin directory
      path.join(process.env.npm_config_prefix || '/usr/local', 'bin', 'sshm'),
      // nvm bin directory
      process.env.NVM_BIN ? path.join(process.env.NVM_BIN, 'sshm') : null,
      // User's node bin directory
      process.env.npm_config_prefix ? path.join(process.env.npm_config_prefix, 'bin', 'sshm') : null,
      // Common locations
      '/usr/local/bin/sshm',
      path.join(os.homedir(), '.npm-global', 'bin', 'sshm')
    ].filter(Boolean);

    for (const binPath of possibleBinPaths) {
      try {
        if (fs.existsSync(binPath)) {
          fs.chmodSync(binPath, 0o755);
          break; // Success, stop trying
        }
      } catch (error) {
        // Continue to next path
      }
    }

    // Also try to fix permissions using process.execPath location
    try {
      const nodeDir = path.dirname(process.execPath);
      const sshBinPath = path.join(nodeDir, 'sshm');
      if (fs.existsSync(sshBinPath)) {
        fs.chmodSync(sshBinPath, 0o755);
      }
    } catch (error) {
      // Ignore
    }

    console.log('✅ SSH Manager Pro installed successfully');
    console.log('📋 Available commands: sshm generate, sshm list, sshm copy, sshm status');
    console.log('🔧 If permission issues persist, run: chmod +x $(which sshm)');

  } catch (error) {
    // Don't fail installation for permission issues
    console.log('✅ SSH Manager Pro installed');
    console.log('🔧 If sshm command fails, run: chmod +x $(which sshm)');
  }
}

// Run permission fix
fixPermissions();
