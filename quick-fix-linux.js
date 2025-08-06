#!/usr/bin/env node

/**
 * Quick Fix for Linux Clipboard Issue
 * Installs xclip and xsel immediately
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 SSH Manager - Quick Linux Clipboard Fix\n');

// Detect Linux distribution
function detectDistro() {
  try {
    if (fs.existsSync('/etc/os-release')) {
      const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
      const idMatch = osRelease.match(/^ID=(.*)$/m);
      const nameMatch = osRelease.match(/^NAME=(.*)$/m);
      
      const id = idMatch ? idMatch[1].replace(/"/g, '') : '';
      const name = nameMatch ? nameMatch[1].replace(/"/g, '') : '';
      
      if (id === 'ubuntu' || name.includes('Ubuntu')) return 'ubuntu';
      if (id === 'debian' || name.includes('Debian')) return 'debian';
      if (id === 'fedora' || name.includes('Fedora')) return 'fedora';
      if (id === 'centos' || name.includes('CentOS')) return 'centos';
      if (id === 'rhel' || name.includes('Red Hat')) return 'rhel';
      if (id === 'arch' || name.includes('Arch')) return 'arch';
      if (id === 'manjaro' || name.includes('Manjaro')) return 'manjaro';
      if (id === 'opensuse' || name.includes('openSUSE')) return 'opensuse';
      if (id === 'alpine' || name.includes('Alpine')) return 'alpine';
      if (id === 'kali' || name.includes('Kali')) return 'kali';
      if (id === 'mint' || name.includes('Mint')) return 'mint';
      if (id === 'pop' || name.includes('Pop!_OS')) return 'pop';
      
      return id || 'unknown';
    }
    
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Check if tools are already installed
function checkTools() {
  try {
    execSync('which xclip', { stdio: 'ignore' });
    console.log('✅ xclip is already installed');
    return true;
  } catch (error) {
    // xclip not found
  }
  
  try {
    execSync('which xsel', { stdio: 'ignore' });
    console.log('✅ xsel is already installed');
    return true;
  } catch (error) {
    // xsel not found
  }
  
  return false;
}

// Install clipboard tools
function installTools(distro) {
  console.log(`📦 Detected distribution: ${distro}`);
  console.log('🔧 Installing clipboard tools...\n');
  
  try {
    switch (distro) {
      case 'ubuntu':
      case 'debian':
      case 'mint':
      case 'pop':
      case 'kali':
        console.log('Installing via apt...');
        execSync('sudo apt update', { stdio: 'inherit' });
        execSync('sudo apt install -y xclip xsel', { stdio: 'inherit' });
        break;
        
      case 'fedora':
      case 'centos':
      case 'rhel':
        console.log('Installing via dnf/yum...');
        try {
          execSync('sudo dnf install -y xclip xsel', { stdio: 'inherit' });
        } catch {
          execSync('sudo yum install -y xclip xsel', { stdio: 'inherit' });
        }
        break;
        
      case 'arch':
      case 'manjaro':
        console.log('Installing via pacman...');
        execSync('sudo pacman -S --noconfirm xclip xsel', { stdio: 'inherit' });
        break;
        
      case 'opensuse':
        console.log('Installing via zypper...');
        execSync('sudo zypper install -y xclip xsel', { stdio: 'inherit' });
        break;
        
      case 'alpine':
        console.log('Installing via apk...');
        execSync('sudo apk add xclip xsel', { stdio: 'inherit' });
        break;
        
      default:
        console.log('Unknown distribution, trying common package managers...');
        
        // Try apt first (most common)
        try {
          execSync('sudo apt update && sudo apt install -y xclip xsel', { stdio: 'inherit' });
          return true;
        } catch (error) {
          // apt failed, try dnf
          try {
            execSync('sudo dnf install -y xclip xsel', { stdio: 'inherit' });
            return true;
          } catch (error2) {
            // dnf failed, try pacman
            try {
              execSync('sudo pacman -S --noconfirm xclip xsel', { stdio: 'inherit' });
              return true;
            } catch (error3) {
              throw new Error('No supported package manager found');
            }
          }
        }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    return false;
  }
}

// Verify installation
function verifyInstallation() {
  console.log('\n🔍 Verifying installation...');
  
  let toolsFound = 0;
  
  try {
    execSync('which xclip', { stdio: 'ignore' });
    console.log('✅ xclip installed successfully');
    toolsFound++;
  } catch (error) {
    console.log('❌ xclip not found');
  }
  
  try {
    execSync('which xsel', { stdio: 'ignore' });
    console.log('✅ xsel installed successfully');
    toolsFound++;
  } catch (error) {
    console.log('❌ xsel not found');
  }
  
  return toolsFound > 0;
}

// Test clipboard functionality
function testClipboard() {
  console.log('\n🧪 Testing clipboard functionality...');
  
  try {
    // Test xclip
    execSync('echo "SSH Manager Test" | xclip -selection clipboard', { stdio: 'pipe' });
    const result = execSync('xclip -selection clipboard -o', { encoding: 'utf8' });
    
    if (result.trim() === 'SSH Manager Test') {
      console.log('✅ Clipboard test successful!');
      return true;
    } else {
      console.log('⚠️  Clipboard test failed - content mismatch');
      return false;
    }
  } catch (error) {
    console.log('❌ Clipboard test failed:', error.message);
    return false;
  }
}

// Main function
function main() {
  // Check if already installed
  if (checkTools()) {
    console.log('\n🎉 Clipboard tools are already available!');
    
    if (testClipboard()) {
      console.log('\n✅ SSH Manager clipboard functionality should work now!');
      console.log('\nTry running: sshm copy');
    }
    
    return;
  }
  
  // Detect distribution
  const distro = detectDistro();
  
  if (distro === 'unknown') {
    console.log('⚠️  Could not detect Linux distribution');
    console.log('\nPlease install manually:');
    console.log('  Ubuntu/Debian: sudo apt install xclip xsel');
    console.log('  Fedora/CentOS: sudo dnf install xclip xsel');
    console.log('  Arch Linux: sudo pacman -S xclip xsel');
    return;
  }
  
  // Install tools
  const installed = installTools(distro);
  
  if (!installed) {
    console.log('\n❌ Installation failed');
    return;
  }
  
  // Verify installation
  if (verifyInstallation()) {
    console.log('\n🎉 Installation successful!');
    
    if (testClipboard()) {
      console.log('\n✅ SSH Manager clipboard functionality is now working!');
      console.log('\nTry running: sshm copy');
    }
  } else {
    console.log('\n❌ Installation verification failed');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { detectDistro, checkTools, installTools, verifyInstallation, testClipboard };
