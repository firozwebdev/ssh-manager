const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SystemSetup {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
  }

  /**
   * Check if ssh-keygen is available
   */
  checkSSHKeygen() {
    try {
      execSync('ssh-keygen --help', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Auto-install OpenSSH based on platform
   */
  async autoInstallOpenSSH() {
    console.log('🔧 OpenSSH not found. Installing automatically...\n');

    try {
      if (this.isWindows) {
        return await this.installOpenSSHWindows();
      } else if (this.isMacOS) {
        return await this.installOpenSSHMacOS();
      } else if (this.isLinux) {
        return await this.installOpenSSHLinux();
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`);
      }
    } catch (error) {
      console.error('❌ Auto-installation failed:', error.message);
      this.showManualInstructions();
      return false;
    }
  }

  /**
   * Install OpenSSH on Windows
   */
  async installOpenSSHWindows() {
    console.log('🪟 Installing OpenSSH on Windows...');

    // Method 1: Try PowerShell Add-WindowsCapability
    try {
      console.log('   Trying Windows Features installation...');
      execSync('powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"', {
        stdio: 'inherit'
      });
      
      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully via Windows Features!');
        return true;
      }
    } catch (error) {
      console.log('   Windows Features method failed (may need admin rights)');
    }

    // Method 2: Try Chocolatey
    try {
      console.log('   Trying Chocolatey installation...');
      execSync('choco install openssh -y', { stdio: 'inherit' });
      
      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully via Chocolatey!');
        return true;
      }
    } catch (error) {
      console.log('   Chocolatey method failed (chocolatey not installed)');
    }

    // Method 3: Try Winget
    try {
      console.log('   Trying Winget installation...');
      execSync('winget install Microsoft.OpenSSH.Beta', { stdio: 'inherit' });
      
      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully via Winget!');
        return true;
      }
    } catch (error) {
      console.log('   Winget method failed');
    }

    // Method 4: Download and install Git for Windows (includes OpenSSH)
    try {
      console.log('   Trying to download Git for Windows (includes OpenSSH)...');
      await this.downloadAndInstallGitWindows();
      
      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully via Git for Windows!');
        return true;
      }
    } catch (error) {
      console.log('   Git for Windows installation failed');
    }

    return false;
  }

  /**
   * Install OpenSSH on macOS
   */
  async installOpenSSHMacOS() {
    console.log('🍎 Installing OpenSSH on macOS...');

    // Method 1: Try Homebrew
    try {
      console.log('   Trying Homebrew installation...');
      execSync('brew install openssh', { stdio: 'inherit' });
      
      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully via Homebrew!');
        return true;
      }
    } catch (error) {
      console.log('   Homebrew method failed (homebrew not installed)');
    }

    // Method 2: Install Xcode Command Line Tools
    try {
      console.log('   Installing Xcode Command Line Tools...');
      execSync('xcode-select --install', { stdio: 'inherit' });
      
      // Wait a moment for installation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH available via Xcode Command Line Tools!');
        return true;
      }
    } catch (error) {
      console.log('   Xcode Command Line Tools installation failed');
    }

    return false;
  }

  /**
   * Install OpenSSH on Linux
   */
  async installOpenSSHLinux() {
    console.log('🐧 Installing OpenSSH on Linux...');

    // Detect Linux distribution
    const distro = this.detectLinuxDistro();
    console.log(`   Detected distribution: ${distro}`);

    try {
      switch (distro) {
        case 'ubuntu':
        case 'debian':
          console.log('   Installing via apt...');
          execSync('sudo apt update && sudo apt install -y openssh-client', { stdio: 'inherit' });
          break;
          
        case 'centos':
        case 'rhel':
        case 'fedora':
          console.log('   Installing via yum/dnf...');
          try {
            execSync('sudo dnf install -y openssh-clients', { stdio: 'inherit' });
          } catch {
            execSync('sudo yum install -y openssh-clients', { stdio: 'inherit' });
          }
          break;
          
        case 'arch':
          console.log('   Installing via pacman...');
          execSync('sudo pacman -S --noconfirm openssh', { stdio: 'inherit' });
          break;
          
        default:
          throw new Error(`Unsupported Linux distribution: ${distro}`);
      }

      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully!');
        return true;
      }
    } catch (error) {
      console.log('   Package manager installation failed');
    }

    return false;
  }

  /**
   * Detect Linux distribution
   */
  detectLinuxDistro() {
    try {
      const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
      
      if (osRelease.includes('Ubuntu')) return 'ubuntu';
      if (osRelease.includes('Debian')) return 'debian';
      if (osRelease.includes('CentOS')) return 'centos';
      if (osRelease.includes('Red Hat')) return 'rhel';
      if (osRelease.includes('Fedora')) return 'fedora';
      if (osRelease.includes('Arch')) return 'arch';
      
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Download and install Git for Windows
   */
  async downloadAndInstallGitWindows() {
    console.log('   📥 Downloading Git for Windows...');
    
    // This would require additional implementation for downloading
    // For now, we'll provide instructions
    throw new Error('Automatic Git download not implemented yet');
  }

  /**
   * Show manual installation instructions
   */
  showManualInstructions() {
    console.log('\n📖 Manual Installation Instructions:\n');

    if (this.isWindows) {
      console.log('🪟 Windows:');
      console.log('1. Run PowerShell as Administrator');
      console.log('2. Run: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0');
      console.log('3. Or download Git for Windows: https://git-scm.com/download/win');
    } else if (this.isMacOS) {
      console.log('🍎 macOS:');
      console.log('1. Install Homebrew: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
      console.log('2. Run: brew install openssh');
      console.log('3. Or install Xcode Command Line Tools: xcode-select --install');
    } else if (this.isLinux) {
      console.log('🐧 Linux:');
      console.log('Ubuntu/Debian: sudo apt install openssh-client');
      console.log('CentOS/RHEL/Fedora: sudo dnf install openssh-clients');
      console.log('Arch: sudo pacman -S openssh');
    }

    console.log('\n🔄 After installation, restart your terminal and try again.');
  }

  /**
   * Setup complete system environment
   */
  async setupSystem() {
    console.log('🔧 Setting up SSH Manager environment...\n');

    // Check if ssh-keygen is available
    if (this.checkSSHKeygen()) {
      console.log('✅ OpenSSH is already installed and working!');
      return true;
    }

    // Try to auto-install
    console.log('⚠️  OpenSSH not found. Attempting automatic installation...\n');
    
    const success = await this.autoInstallOpenSSH();
    
    if (success) {
      console.log('\n🎉 System setup complete! SSH Manager is ready to use.');
      return true;
    } else {
      console.log('\n❌ Automatic installation failed. Please install OpenSSH manually.');
      return false;
    }
  }

  /**
   * Check if running with admin privileges (Windows)
   */
  isRunningAsAdmin() {
    if (!this.isWindows) return true;
    
    try {
      execSync('net session', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Prompt for admin privileges if needed
   */
  async requestAdminIfNeeded() {
    if (this.isWindows && !this.isRunningAsAdmin()) {
      console.log('⚠️  Administrator privileges may be required for OpenSSH installation.');
      console.log('💡 Consider running this command as Administrator for best results.');
      console.log('');
    }
  }
}

module.exports = SystemSetup;
