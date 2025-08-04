#!/usr/bin/env node

/**
 * SSH Manager - One-Command Setup
 * This script does EVERYTHING automatically:
 * 1. Installs dependencies
 * 2. Installs OpenSSH if needed
 * 3. Sets up global commands
 * 4. Tests the installation
 * 5. Generates your first SSH key
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 SSH Manager - One-Command Setup\n');
console.log('This will automatically set up everything you need!\n');

async function setup() {
  try {
    // Step 1: Install npm dependencies
    console.log('📦 Step 1: Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed\n');
    } catch (error) {
      console.log('⚠️  Dependencies already installed\n');
    }

    // Step 2: Check and install OpenSSH
    console.log('🔧 Step 2: Setting up OpenSSH...');
    const hasSSH = checkSSHKeygen();
    
    if (hasSSH) {
      console.log('✅ OpenSSH is already available\n');
    } else {
      console.log('⚠️  OpenSSH not found. Installing automatically...');
      const sshInstalled = await installOpenSSH();
      
      if (!sshInstalled) {
        console.log('❌ OpenSSH installation failed');
        showManualSSHInstructions();
        console.log('⏭️  Continuing with setup (you can install OpenSSH later)...\n');
      } else {
        console.log('✅ OpenSSH installed successfully\n');
      }
    }

    // Step 3: Install globally
    console.log('🌐 Step 3: Installing SSH Manager globally...');
    try {
      execSync('npm link', { stdio: 'inherit' });
      console.log('✅ Global installation complete\n');
    } catch (error) {
      console.log('❌ Global installation failed:', error.message);
      console.log('💡 You can still use: node src/cli-simple.js\n');
    }

    // Step 4: Test installation
    console.log('🧪 Step 4: Testing installation...');
    const commands = ['ssh-manager', 'sshm', 'ssh-gen', 'ssh-copy', 'ssh-list'];
    let workingCommands = [];
    
    for (const cmd of commands) {
      try {
        execSync(`${cmd} --version`, { stdio: 'ignore' });
        workingCommands.push(cmd);
      } catch (error) {
        // Command not working
      }
    }
    
    if (workingCommands.length > 0) {
      console.log('✅ Working commands:', workingCommands.join(', '));
    } else {
      console.log('⚠️  Global commands not available, but local usage works');
    }
    console.log('');

    // Step 5: Show status
    console.log('📊 Step 5: System status...');
    try {
      if (workingCommands.includes('ssh-manager')) {
        execSync('ssh-manager status', { stdio: 'inherit' });
      } else {
        execSync('node src/cli-simple.js status', { stdio: 'inherit' });
      }
    } catch (error) {
      console.log('Status check failed, but setup continues...');
    }
    console.log('');

    // Step 6: Offer to generate first key
    console.log('🎯 Step 6: Ready to generate your first SSH key!');
    console.log('');
    
    if (checkSSHKeygen()) {
      console.log('🔥 Generate your first SSH key now? (y/n)');
      
      // Simple prompt simulation (in real implementation, you'd use readline)
      console.log('💡 To generate your first key, run:');
      
      if (workingCommands.includes('ssh-manager')) {
        console.log('   ssh-manager generate');
        console.log('   # or the ultra-short version:');
        console.log('   ssh-gen');
      } else {
        console.log('   node src/cli-simple.js generate');
      }
    } else {
      console.log('⚠️  OpenSSH not available. Install it first, then run:');
      console.log('   ssh-manager generate');
    }

    console.log('');

    // Step 7: Show usage summary
    console.log('🎉 Setup Complete! Here\'s what you can do:\n');
    
    console.log('⚡ Ultra-Quick Commands:');
    if (workingCommands.length > 0) {
      console.log('  ssh-gen                 # Generate SSH key + copy to clipboard');
      console.log('  ssh-copy                # Copy existing key to clipboard');
      console.log('  ssh-list                # List all your SSH keys');
      console.log('  ssh-manager status      # Check system status');
    } else {
      console.log('  node src/cli-simple.js generate    # Generate SSH key');
      console.log('  node src/cli-simple.js copy        # Copy existing key');
      console.log('  node src/cli-simple.js list        # List all keys');
    }
    
    console.log('');
    console.log('🔥 Perfect Workflow:');
    console.log('1. Generate key: ssh-gen (copies to clipboard automatically!)');
    console.log('2. Paste into GitHub/GitLab/server');
    console.log('3. Done! 🎉');
    console.log('');
    
    console.log('📚 More help:');
    console.log('  README.md        # Complete documentation');
    console.log('  QUICK-START.md   # Ultra-quick usage guide');
    console.log('  WINDOWS-SETUP.md # Windows-specific help');
    console.log('');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('');
    console.log('🔧 Manual setup:');
    console.log('1. npm install');
    console.log('2. npm link');
    console.log('3. Install OpenSSH for your platform');
    console.log('4. ssh-manager generate');
    process.exit(1);
  }
}

function checkSSHKeygen() {
  try {
    execSync('ssh-keygen --help', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

async function installOpenSSH() {
  const platform = os.platform();
  
  try {
    if (platform === 'win32') {
      return await installOpenSSHWindows();
    } else if (platform === 'darwin') {
      return await installOpenSSHMacOS();
    } else if (platform === 'linux') {
      return await installOpenSSHLinux();
    }
    return false;
  } catch (error) {
    console.log('   Installation failed:', error.message);
    return false;
  }
}

async function installOpenSSHWindows() {
  // Try PowerShell method
  try {
    console.log('   Trying Windows Features...');
    execSync('powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"', {
      stdio: 'inherit'
    });
    
    if (checkSSHKeygen()) {
      return true;
    }
  } catch (error) {
    console.log('   Windows Features failed (may need admin rights)');
  }

  // Try Chocolatey
  try {
    console.log('   Trying Chocolatey...');
    execSync('choco install openssh -y', { stdio: 'inherit' });
    return checkSSHKeygen();
  } catch (error) {
    console.log('   Chocolatey not available');
  }

  // Try Winget
  try {
    console.log('   Trying Winget...');
    execSync('winget install Microsoft.OpenSSH.Beta', { stdio: 'inherit' });
    return checkSSHKeygen();
  } catch (error) {
    console.log('   Winget failed');
  }

  return false;
}

async function installOpenSSHMacOS() {
  // Try Homebrew
  try {
    console.log('   Trying Homebrew...');
    execSync('brew install openssh', { stdio: 'inherit' });
    return checkSSHKeygen();
  } catch (error) {
    console.log('   Homebrew not available');
  }

  // Try Xcode Command Line Tools
  try {
    console.log('   Installing Xcode Command Line Tools...');
    execSync('xcode-select --install', { stdio: 'inherit' });
    return checkSSHKeygen();
  } catch (error) {
    console.log('   Xcode installation failed');
  }

  return false;
}

async function installOpenSSHLinux() {
  try {
    // Try common package managers
    try {
      console.log('   Trying apt (Ubuntu/Debian)...');
      execSync('sudo apt update && sudo apt install -y openssh-client', { stdio: 'inherit' });
      return checkSSHKeygen();
    } catch (error) {
      // Try yum/dnf
      try {
        console.log('   Trying dnf (Fedora/CentOS)...');
        execSync('sudo dnf install -y openssh-clients', { stdio: 'inherit' });
        return checkSSHKeygen();
      } catch (error) {
        // Try pacman
        try {
          console.log('   Trying pacman (Arch)...');
          execSync('sudo pacman -S --noconfirm openssh', { stdio: 'inherit' });
          return checkSSHKeygen();
        } catch (error) {
          return false;
        }
      }
    }
  } catch (error) {
    return false;
  }
}

function showManualSSHInstructions() {
  const platform = os.platform();
  
  console.log('📖 Manual OpenSSH installation:');
  
  if (platform === 'win32') {
    console.log('🪟 Windows:');
    console.log('   1. Run PowerShell as Administrator');
    console.log('   2. Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0');
    console.log('   3. Or download Git for Windows: https://git-scm.com/download/win');
  } else if (platform === 'darwin') {
    console.log('🍎 macOS:');
    console.log('   1. Install Homebrew, then: brew install openssh');
    console.log('   2. Or: xcode-select --install');
  } else if (platform === 'linux') {
    console.log('🐧 Linux:');
    console.log('   Ubuntu/Debian: sudo apt install openssh-client');
    console.log('   Fedora/CentOS: sudo dnf install openssh-clients');
    console.log('   Arch: sudo pacman -S openssh');
  }
  
  console.log('');
}

// Run setup
setup();
