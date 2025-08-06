#!/usr/bin/env node

/**
 * Cross-Platform SSH Manager Installer
 * Automatically detects OS and installs required dependencies
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class CrossPlatformInstaller {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    this.isWSL = this.detectWSL();
    this.distro = this.isLinux ? this.detectLinuxDistro() : null;
  }

  /**
   * Detect if running in WSL
   */
  detectWSL() {
    if (!this.isLinux) return false;
    
    try {
      const release = fs.readFileSync('/proc/version', 'utf8');
      return release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl');
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect Linux distribution
   */
  detectLinuxDistro() {
    if (!this.isLinux) return null;
    
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

  /**
   * Main installation process
   */
  async install() {
    console.log('🚀 SSH Manager Cross-Platform Installer\n');
    
    this.displaySystemInfo();
    
    console.log('📦 Installing dependencies...\n');
    
    // Install OpenSSH
    await this.installOpenSSH();
    
    // Install clipboard tools
    await this.installClipboardTools();
    
    // Install Node.js dependencies
    await this.installNodeDependencies();
    
    // Setup global commands
    await this.setupGlobalCommands();
    
    console.log('\n🎉 Installation complete!');
    console.log('\n📋 Available commands:');
    console.log('  ssh-manager generate    # Generate SSH key');
    console.log('  ssh-manager list        # List SSH keys');
    console.log('  ssh-manager copy        # Copy key to clipboard');
    console.log('  ssh-manager status      # Show system status');
    console.log('\n🔗 Quick start:');
    console.log('  ssh-manager generate -t ed25519 -n github');
  }

  /**
   * Display system information
   */
  displaySystemInfo() {
    console.log('🖥️  System Information:');
    
    if (this.isWindows) {
      console.log('   🪟 Platform: Windows');
    } else if (this.isMacOS) {
      console.log('   🍎 Platform: macOS');
    } else if (this.isLinux) {
      if (this.isWSL) {
        console.log('   🐧 Platform: Linux (WSL)');
      } else {
        console.log('   🐧 Platform: Linux');
      }
      console.log(`   📦 Distribution: ${this.distro}`);
    }
    
    console.log(`   🏗️  Architecture: ${this.arch}`);
    console.log(`   📍 Node.js: ${process.version}`);
    console.log('');
  }

  /**
   * Install OpenSSH
   */
  async installOpenSSH() {
    console.log('🔐 Installing OpenSSH...');
    
    try {
      execSync('ssh-keygen -?', { stdio: 'pipe' });
      console.log('   ✅ OpenSSH already installed');
      return;
    } catch (error) {
      // OpenSSH not found, install it
    }

    if (this.isWindows) {
      await this.installOpenSSHWindows();
    } else if (this.isMacOS) {
      await this.installOpenSSHMacOS();
    } else if (this.isLinux) {
      await this.installOpenSSHLinux();
    }
  }

  /**
   * Install OpenSSH on Windows
   */
  async installOpenSSHWindows() {
    console.log('   🪟 Installing OpenSSH on Windows...');
    
    // Try Windows Features first
    try {
      execSync('powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"', {
        stdio: 'inherit'
      });
      console.log('   ✅ OpenSSH installed via Windows Features');
      return;
    } catch (error) {
      console.log('   ⚠️  Windows Features method failed (may need admin rights)');
    }

    // Try winget
    try {
      execSync('winget install Git.Git --accept-package-agreements --accept-source-agreements', {
        stdio: 'inherit'
      });
      console.log('   ✅ Git for Windows installed (includes OpenSSH)');
      return;
    } catch (error) {
      console.log('   ⚠️  Winget installation failed');
    }

    console.log('   ❌ Automatic installation failed');
    console.log('   💡 Please install Git for Windows manually: https://git-scm.com/download/win');
  }

  /**
   * Install OpenSSH on macOS
   */
  async installOpenSSHMacOS() {
    console.log('   🍎 Installing OpenSSH on macOS...');
    
    // Try Homebrew
    try {
      execSync('brew install openssh', { stdio: 'inherit' });
      console.log('   ✅ OpenSSH installed via Homebrew');
      return;
    } catch (error) {
      console.log('   ⚠️  Homebrew method failed');
    }

    // Try Xcode Command Line Tools
    try {
      execSync('xcode-select --install', { stdio: 'inherit' });
      console.log('   ✅ Xcode Command Line Tools installed');
      return;
    } catch (error) {
      console.log('   ⚠️  Xcode installation failed');
    }

    console.log('   ❌ Automatic installation failed');
    console.log('   💡 Please install Homebrew: https://brew.sh/');
  }

  /**
   * Install OpenSSH on Linux
   */
  async installOpenSSHLinux() {
    console.log('   🐧 Installing OpenSSH on Linux...');
    
    try {
      switch (this.distro) {
        case 'ubuntu':
        case 'debian':
        case 'mint':
        case 'pop':
        case 'kali':
          execSync('sudo apt update && sudo apt install -y openssh-client', { stdio: 'inherit' });
          break;
          
        case 'fedora':
        case 'centos':
        case 'rhel':
          try {
            execSync('sudo dnf install -y openssh-clients', { stdio: 'inherit' });
          } catch {
            execSync('sudo yum install -y openssh-clients', { stdio: 'inherit' });
          }
          break;
          
        case 'arch':
        case 'manjaro':
          execSync('sudo pacman -Sy --noconfirm openssh', { stdio: 'inherit' });
          break;
          
        case 'opensuse':
          execSync('sudo zypper install -y openssh', { stdio: 'inherit' });
          break;
          
        case 'alpine':
          execSync('sudo apk add openssh-client', { stdio: 'inherit' });
          break;
          
        default:
          throw new Error(`Unsupported distribution: ${this.distro}`);
      }
      
      console.log('   ✅ OpenSSH installed successfully');
    } catch (error) {
      console.log('   ❌ OpenSSH installation failed:', error.message);
    }
  }

  /**
   * Install clipboard tools
   */
  async installClipboardTools() {
    console.log('📋 Installing clipboard tools...');
    
    if (this.isWindows) {
      console.log('   ✅ Windows clipboard tools already available');
    } else if (this.isMacOS) {
      console.log('   ✅ macOS clipboard tools already available');
    } else if (this.isLinux) {
      await this.installLinuxClipboardTools();
    }
  }

  /**
   * Install Linux clipboard tools
   */
  async installLinuxClipboardTools() {
    console.log('   🐧 Installing Linux clipboard tools...');
    
    if (this.isWSL) {
      console.log('   ✅ WSL detected - will use Windows clipboard');
      return;
    }

    try {
      switch (this.distro) {
        case 'ubuntu':
        case 'debian':
        case 'mint':
        case 'pop':
        case 'kali':
          execSync('sudo apt install -y xclip xsel', { stdio: 'inherit' });
          break;
          
        case 'fedora':
        case 'centos':
        case 'rhel':
          try {
            execSync('sudo dnf install -y xclip xsel', { stdio: 'inherit' });
          } catch {
            execSync('sudo yum install -y xclip xsel', { stdio: 'inherit' });
          }
          break;
          
        case 'arch':
        case 'manjaro':
          execSync('sudo pacman -S --noconfirm xclip xsel', { stdio: 'inherit' });
          break;
          
        case 'opensuse':
          execSync('sudo zypper install -y xclip xsel', { stdio: 'inherit' });
          break;
          
        case 'alpine':
          execSync('sudo apk add xclip xsel', { stdio: 'inherit' });
          break;
          
        default:
          console.log('   ⚠️  Unknown distribution, skipping clipboard tools');
          return;
      }
      
      console.log('   ✅ Clipboard tools installed successfully');
    } catch (error) {
      console.log('   ⚠️  Clipboard tools installation failed (non-critical)');
    }
  }

  /**
   * Install Node.js dependencies
   */
  async installNodeDependencies() {
    console.log('📦 Installing Node.js dependencies...');
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('   ✅ Node.js dependencies installed');
    } catch (error) {
      console.log('   ❌ Failed to install Node.js dependencies:', error.message);
    }
  }

  /**
   * Setup global commands
   */
  async setupGlobalCommands() {
    console.log('🔗 Setting up global commands...');
    
    try {
      execSync('npm link', { stdio: 'inherit' });
      console.log('   ✅ Global commands setup complete');
    } catch (error) {
      console.log('   ⚠️  Global setup failed (may need sudo/admin rights)');
      console.log('   💡 You can still use: node src/cli-simple.js');
    }
  }
}

// Run installer
if (require.main === module) {
  const installer = new CrossPlatformInstaller();
  installer.install().catch(error => {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  });
}

module.exports = CrossPlatformInstaller;
