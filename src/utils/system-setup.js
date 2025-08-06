const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SystemSetup {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    this.isWSL = this.detectWSL();
    this.distro = this.isLinux ? this.detectLinuxDistro() : null;
    this.packageManager = this.detectPackageManager();

    // Display platform info
    this.displayPlatformInfo();
  }

  /**
   * Detect if running in Windows Subsystem for Linux
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
   * Display detected platform information
   */
  displayPlatformInfo() {
    console.log('🖥️  Platform Detection:');

    if (this.isWindows) {
      console.log('   🪟 Windows detected');
    } else if (this.isMacOS) {
      console.log('   🍎 macOS detected');
    } else if (this.isLinux) {
      if (this.isWSL) {
        console.log('   🐧 Linux (WSL) detected');
      } else {
        console.log('   🐧 Linux detected');
      }
      if (this.distro) {
        console.log(`   📦 Distribution: ${this.distro}`);
      }
    }

    console.log(`   🏗️  Architecture: ${this.arch}`);
    if (this.packageManager) {
      console.log(`   📦 Package Manager: ${this.packageManager}`);
    }
    console.log('');
  }

  /**
   * Detect available package manager
   */
  detectPackageManager() {
    if (this.isWindows) {
      // Check for Windows package managers
      const managers = ['winget', 'choco', 'scoop'];
      for (const manager of managers) {
        try {
          execSync(`${manager} --version`, { stdio: 'ignore' });
          return manager;
        } catch (error) {
          continue;
        }
      }
      return null;
    } else if (this.isMacOS) {
      // Check for macOS package managers
      const managers = ['brew', 'port'];
      for (const manager of managers) {
        try {
          execSync(`which ${manager}`, { stdio: 'ignore' });
          return manager;
        } catch (error) {
          continue;
        }
      }
      return null;
    } else if (this.isLinux) {
      // Check for Linux package managers
      const managers = ['apt', 'dnf', 'yum', 'pacman', 'zypper', 'apk'];
      for (const manager of managers) {
        try {
          execSync(`which ${manager}`, { stdio: 'ignore' });
          return manager;
        } catch (error) {
          continue;
        }
      }
      return null;
    }

    return null;
  }

  /**
   * Check if ssh-keygen is available
   */
  checkSSHKeygen() {
    try {
      // Use ssh-keygen with invalid option to get usage (this should fail but show usage)
      execSync('ssh-keygen -?', { stdio: 'pipe', encoding: 'utf8', timeout: 5000 });
      return true;
    } catch (error) {
      // ssh-keygen -? returns non-zero but shows usage
      if (error.stderr && error.stderr.includes('usage: ssh-keygen')) {
        return true;
      }
      if (error.stdout && error.stdout.includes('usage: ssh-keygen')) {
        return true;
      }

      // Try alternative locations on Windows
      if (this.isWindows) {
        return this.checkSSHKeygenWindows();
      }
      return false;
    }
  }

  /**
   * Check for ssh-keygen in common Windows locations
   */
  checkSSHKeygenWindows() {
    const commonPaths = [
      'C:\\Windows\\System32\\OpenSSH\\ssh-keygen.exe',
      'C:\\Program Files\\OpenSSH-Win64\\ssh-keygen.exe',
      'C:\\Program Files (x86)\\OpenSSH-Win64\\ssh-keygen.exe',
      'C:\\Program Files\\Git\\usr\\bin\\ssh-keygen.exe',
      'C:\\Program Files (x86)\\Git\\usr\\bin\\ssh-keygen.exe'
    ];

    for (const sshPath of commonPaths) {
      if (fs.existsSync(sshPath)) {
        try {
          // Test ssh-keygen with invalid option to get usage
          execSync(`"${sshPath}" -?`, { stdio: 'pipe', encoding: 'utf8', timeout: 5000 });
          console.log(`✅ Found ssh-keygen at: ${sshPath}`);

          // Add to PATH for current session
          const sshDir = path.dirname(sshPath);
          if (!process.env.PATH.includes(sshDir)) {
            process.env.PATH = `${sshDir};${process.env.PATH}`;
            console.log(`   Added to PATH: ${sshDir}`);
          }

          return true;
        } catch (error) {
          // ssh-keygen -? returns non-zero but shows usage
          if (error.stderr && error.stderr.includes('usage: ssh-keygen')) {
            console.log(`✅ Found ssh-keygen at: ${sshPath}`);

            // Add to PATH for current session
            const sshDir = path.dirname(sshPath);
            if (!process.env.PATH.includes(sshDir)) {
              process.env.PATH = `${sshDir};${process.env.PATH}`;
              console.log(`   Added to PATH: ${sshDir}`);
            }

            return true;
          }
          if (error.stdout && error.stdout.includes('usage: ssh-keygen')) {
            console.log(`✅ Found ssh-keygen at: ${sshPath}`);

            // Add to PATH for current session
            const sshDir = path.dirname(sshPath);
            if (!process.env.PATH.includes(sshDir)) {
              process.env.PATH = `${sshDir};${process.env.PATH}`;
              console.log(`   Added to PATH: ${sshDir}`);
            }

            return true;
          }
          continue;
        }
      }
    }
    return false;
  }

  /**
   * Auto-install OpenSSH based on platform
   */
  async autoInstallOpenSSH() {
    console.log('🔧 OpenSSH not found. Installing automatically...\n');

    try {
      let success = false;

      if (this.isWindows) {
        success = await this.installOpenSSHWindows();
      } else if (this.isMacOS) {
        success = await this.installOpenSSHMacOS();
      } else if (this.isLinux) {
        success = await this.installOpenSSHLinux();
      } else {
        throw new Error(`Unsupported platform: ${this.platform}`);
      }

      if (success) {
        // Refresh environment after successful installation
        this.refreshEnvironment();

        // Final check
        if (this.checkSSHKeygen()) {
          return true;
        } else {
          console.log('⚠️  Installation completed but ssh-keygen still not accessible.');
          console.log('💡 You may need to restart your terminal or add OpenSSH to your PATH manually.');
        }
      }

      return success;
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

    // First, check if it's already installed but not in PATH
    if (this.checkSSHKeygenWindows()) {
      console.log('✅ OpenSSH found in system! Added to PATH.');
      return true;
    }

    // Method 1: Try PowerShell Add-WindowsCapability (most reliable)
    try {
      console.log('   Trying Windows Features installation...');
      const result = execSync('powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"', {
        stdio: 'pipe',
        encoding: 'utf8'
      });

      console.log('   Windows Features installation output:', result);

      // Wait a moment for installation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully via Windows Features!');
        return true;
      }
    } catch (error) {
      console.log('   Windows Features method failed:', error.message);
      if (error.message.includes('Access is denied')) {
        console.log('   💡 Try running as Administrator for Windows Features installation');
      }
    }

    // Method 2: Try Winget (corrected package names)
    try {
      console.log('   Trying Winget installation...');

      // Try different OpenSSH package names
      const wingetPackages = [
        'Microsoft.OpenSSH.Beta',
        'Git.Git', // Git for Windows includes OpenSSH
        'OpenSSH.OpenSSH'
      ];

      for (const pkg of wingetPackages) {
        try {
          console.log(`   Trying winget package: ${pkg}`);
          execSync(`winget install ${pkg} --accept-package-agreements --accept-source-agreements`, {
            stdio: 'pipe',
            timeout: 60000
          });

          await new Promise(resolve => setTimeout(resolve, 3000));

          if (this.checkSSHKeygen()) {
            console.log(`✅ OpenSSH installed successfully via Winget (${pkg})!`);
            return true;
          }
        } catch (pkgError) {
          console.log(`   Package ${pkg} failed:`, pkgError.message);
          continue;
        }
      }
    } catch (error) {
      console.log('   Winget method failed:', error.message);
    }

    // Method 3: Try Chocolatey
    try {
      console.log('   Trying Chocolatey installation...');
      execSync('choco install openssh -y', {
        stdio: 'pipe',
        timeout: 60000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully via Chocolatey!');
        return true;
      }
    } catch (error) {
      console.log('   Chocolatey method failed (chocolatey not installed or other error)');
    }

    // Method 4: Download and install Git for Windows (includes OpenSSH)
    try {
      console.log('   Trying to download Git for Windows (includes OpenSSH)...');
      const gitInstalled = await this.downloadAndInstallGitWindows();

      if (gitInstalled) {
        // Wait a moment for PATH to be updated
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (this.checkSSHKeygen()) {
          console.log('✅ OpenSSH found via Git for Windows!');
          return true;
        } else {
          console.log('   SSH-keygen found in Git but not accessible via PATH');
          // Try to add it manually
          this.refreshEnvironment();
          if (this.checkSSHKeygen()) {
            console.log('✅ OpenSSH accessible after PATH refresh!');
            return true;
          }
        }
      }
    } catch (error) {
      console.log('   Git for Windows installation failed:', error.message);
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
   * Install OpenSSH on Linux with enhanced distribution support
   */
  async installOpenSSHLinux() {
    console.log('🐧 Installing OpenSSH on Linux...');

    if (this.isWSL) {
      console.log('   🔍 WSL detected - using Linux package managers');
    }

    console.log(`   📦 Distribution: ${this.distro}`);
    console.log(`   🛠️  Package Manager: ${this.packageManager}`);

    // Check if already installed
    if (this.checkSSHKeygen()) {
      console.log('✅ OpenSSH is already installed!');
      return true;
    }

    try {
      // Try package manager-specific installation
      switch (this.packageManager) {
        case 'apt':
          await this.installWithApt();
          break;
        case 'dnf':
          await this.installWithDnf();
          break;
        case 'yum':
          await this.installWithYum();
          break;
        case 'pacman':
          await this.installWithPacman();
          break;
        case 'zypper':
          await this.installWithZypper();
          break;
        case 'apk':
          await this.installWithApk();
          break;
        default:
          // Fallback to distribution-based installation
          await this.installByDistribution();
      }

      // Verify installation
      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed successfully!');
        return true;
      } else {
        console.log('⚠️  Installation completed but ssh-keygen not found');
        return false;
      }
    } catch (error) {
      console.log('   Package manager installation failed:', error.message);

      // Try alternative installation methods
      return await this.tryAlternativeLinuxInstallation();
    }
  }

  /**
   * Install OpenSSH using apt (Debian/Ubuntu)
   */
  async installWithApt() {
    console.log('   📦 Installing via apt...');
    execSync('sudo apt update', { stdio: 'inherit' });
    execSync('sudo apt install -y openssh-client openssh-server', { stdio: 'inherit' });
  }

  /**
   * Install OpenSSH using dnf (Fedora/RHEL 8+)
   */
  async installWithDnf() {
    console.log('   📦 Installing via dnf...');
    execSync('sudo dnf install -y openssh-clients openssh-server', { stdio: 'inherit' });
  }

  /**
   * Install OpenSSH using yum (CentOS/RHEL 7)
   */
  async installWithYum() {
    console.log('   📦 Installing via yum...');
    execSync('sudo yum install -y openssh-clients openssh-server', { stdio: 'inherit' });
  }

  /**
   * Install OpenSSH using pacman (Arch Linux)
   */
  async installWithPacman() {
    console.log('   📦 Installing via pacman...');
    execSync('sudo pacman -Sy --noconfirm openssh', { stdio: 'inherit' });
  }

  /**
   * Install OpenSSH using zypper (openSUSE)
   */
  async installWithZypper() {
    console.log('   📦 Installing via zypper...');
    execSync('sudo zypper install -y openssh', { stdio: 'inherit' });
  }

  /**
   * Install OpenSSH using apk (Alpine Linux)
   */
  async installWithApk() {
    console.log('   📦 Installing via apk...');
    execSync('sudo apk add openssh-client openssh-server', { stdio: 'inherit' });
  }

  /**
   * Fallback installation by distribution
   */
  async installByDistribution() {
    console.log('   🔄 Trying distribution-specific installation...');

    switch (this.distro) {
      case 'ubuntu':
      case 'debian':
      case 'mint':
      case 'pop':
      case 'kali':
        execSync('sudo apt update && sudo apt install -y openssh-client openssh-server', { stdio: 'inherit' });
        break;

      case 'fedora':
      case 'centos':
      case 'rhel':
        try {
          execSync('sudo dnf install -y openssh-clients openssh-server', { stdio: 'inherit' });
        } catch {
          execSync('sudo yum install -y openssh-clients openssh-server', { stdio: 'inherit' });
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
        execSync('sudo apk add openssh-client openssh-server', { stdio: 'inherit' });
        break;

      default:
        throw new Error(`Unsupported Linux distribution: ${this.distro}`);
    }
  }

  /**
   * Try alternative installation methods for Linux
   */
  async tryAlternativeLinuxInstallation() {
    console.log('   🔄 Trying alternative installation methods...');

    // Try snap if available
    try {
      execSync('which snap', { stdio: 'ignore' });
      console.log('   📦 Trying snap installation...');
      execSync('sudo snap install openssh', { stdio: 'inherit' });

      if (this.checkSSHKeygen()) {
        console.log('✅ OpenSSH installed via snap!');
        return true;
      }
    } catch (error) {
      console.log('   Snap installation failed');
    }

    // Try flatpak if available
    try {
      execSync('which flatpak', { stdio: 'ignore' });
      console.log('   📦 Trying flatpak installation...');
      // Note: OpenSSH typically isn't available via flatpak, but we try anyway
      console.log('   ⚠️  OpenSSH not typically available via flatpak');
    } catch (error) {
      // Flatpak not available
    }

    return false;
  }

  /**
   * Detect Linux distribution with enhanced detection
   */
  detectLinuxDistro() {
    if (!this.isLinux) return null;

    try {
      // Try /etc/os-release first (most reliable)
      if (fs.existsSync('/etc/os-release')) {
        const osRelease = fs.readFileSync('/etc/os-release', 'utf8');

        // Extract ID and ID_LIKE fields
        const idMatch = osRelease.match(/^ID=(.*)$/m);
        const idLikeMatch = osRelease.match(/^ID_LIKE=(.*)$/m);
        const nameMatch = osRelease.match(/^NAME=(.*)$/m);

        const id = idMatch ? idMatch[1].replace(/"/g, '') : '';
        const idLike = idLikeMatch ? idLikeMatch[1].replace(/"/g, '') : '';
        const name = nameMatch ? nameMatch[1].replace(/"/g, '') : '';

        // Specific distributions
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

        // Check ID_LIKE for family detection
        if (idLike.includes('debian')) return 'debian';
        if (idLike.includes('ubuntu')) return 'ubuntu';
        if (idLike.includes('fedora')) return 'fedora';
        if (idLike.includes('rhel')) return 'rhel';
        if (idLike.includes('arch')) return 'arch';

        return id || 'unknown';
      }

      // Fallback methods
      const fallbackChecks = [
        { file: '/etc/debian_version', distro: 'debian' },
        { file: '/etc/redhat-release', distro: 'rhel' },
        { file: '/etc/fedora-release', distro: 'fedora' },
        { file: '/etc/arch-release', distro: 'arch' },
        { file: '/etc/alpine-release', distro: 'alpine' },
        { file: '/etc/SuSE-release', distro: 'opensuse' }
      ];

      for (const check of fallbackChecks) {
        if (fs.existsSync(check.file)) {
          return check.distro;
        }
      }

      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Download and install Git for Windows
   */
  async downloadAndInstallGitWindows() {
    console.log('   📥 Attempting Git for Windows installation...');

    try {
      // Check if Git is already installed
      try {
        execSync('git --version', { stdio: 'ignore' });
        console.log('   Git is already installed, checking for OpenSSH...');

        // Git for Windows usually includes OpenSSH in usr/bin
        const gitPath = execSync('where git', { encoding: 'utf8' }).trim();
        const gitDir = path.dirname(gitPath);
        const possibleSSHPaths = [
          path.join(gitDir, '..', 'usr', 'bin', 'ssh-keygen.exe'),
          path.join(gitDir, 'usr', 'bin', 'ssh-keygen.exe')
        ];

        for (const sshPath of possibleSSHPaths) {
          if (fs.existsSync(sshPath)) {
            const sshDir = path.dirname(sshPath);
            process.env.PATH = `${sshDir};${process.env.PATH}`;
            console.log(`   Found ssh-keygen in Git installation: ${sshPath}`);
            console.log(`   Added to PATH: ${sshDir}`);

            // Test that it works
            try {
              execSync('ssh-keygen -?', { stdio: 'pipe', encoding: 'utf8', timeout: 5000 });
              console.log(`   ✅ ssh-keygen is now accessible via PATH`);
              return true;
            } catch (testError) {
              // ssh-keygen -? returns non-zero but shows usage
              if (testError.stderr && testError.stderr.includes('usage: ssh-keygen')) {
                console.log(`   ✅ ssh-keygen is now accessible via PATH`);
                return true;
              }
              if (testError.stdout && testError.stdout.includes('usage: ssh-keygen')) {
                console.log(`   ✅ ssh-keygen is now accessible via PATH`);
                return true;
              }
              console.log(`   ⚠️  ssh-keygen found but not working properly`);
              console.log(`   Error: ${testError.message}`);
            }
          }
        }
      } catch (error) {
        // Git not installed, continue with installation
      }

      // Try to install Git using winget (most reliable method)
      try {
        console.log('   Installing Git for Windows via winget...');
        execSync('winget install Git.Git --accept-package-agreements --accept-source-agreements', {
          stdio: 'pipe',
          timeout: 120000 // 2 minutes timeout for download
        });

        // Wait for installation to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Refresh PATH and check again
        return this.checkSSHKeygenWindows();
      } catch (wingetError) {
        console.log('   Winget Git installation failed:', wingetError.message);
      }

      // Fallback: Provide download instructions
      console.log('   ⚠️  Automatic installation failed.');
      console.log('   📖 Please manually download Git for Windows from: https://git-scm.com/download/win');
      console.log('   💡 During installation, ensure "Use Git and optional Unix tools from Command Prompt" is selected');

      return false;
    } catch (error) {
      console.log('   Git installation error:', error.message);
      return false;
    }
  }

  /**
   * Show manual installation instructions
   */
  showManualInstructions() {
    console.log('\n📖 Manual Installation Instructions:\n');

    if (this.isWindows) {
      console.log('🪟 Windows (choose one method):');
      console.log('');
      console.log('Method 1 - Windows Features (Recommended):');
      console.log('1. Run PowerShell as Administrator');
      console.log('2. Run: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0');
      console.log('');
      console.log('Method 2 - Git for Windows (Easiest):');
      console.log('1. Download: https://git-scm.com/download/win');
      console.log('2. During installation, select "Use Git and optional Unix tools from Command Prompt"');
      console.log('');
      console.log('Method 3 - Winget:');
      console.log('1. Run: winget install Git.Git');
      console.log('');
      console.log('Method 4 - Chocolatey (if installed):');
      console.log('1. Run: choco install openssh');
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
    console.log('💡 If you continue having issues, try running: ssh-manager status');
  }

  /**
   * Setup complete system environment
   */
  async setupSystem() {
    console.log('🔧 Setting up SSH Manager environment...\n');

    // Check admin privileges if needed
    await this.requestAdminIfNeeded();

    // Check if ssh-keygen is available
    if (this.checkSSHKeygen()) {
      console.log('✅ OpenSSH is already installed and working!');
      return true;
    }

    // Refresh environment in case it was recently installed
    this.refreshEnvironment();

    // Check again after refresh
    if (this.checkSSHKeygen()) {
      console.log('✅ OpenSSH found after environment refresh!');
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
      console.log('⚠️  Administrator privileges may be required for some installation methods.');
      console.log('💡 If installation fails, try running as Administrator or use Git for Windows method.');
      console.log('');
    }
  }

  /**
   * Refresh environment variables and PATH
   */
  refreshEnvironment() {
    if (this.isWindows) {
      try {
        // Refresh PATH from registry
        const result = execSync('powershell -Command "[Environment]::GetEnvironmentVariable(\'PATH\', \'Machine\') + \';\' + [Environment]::GetEnvironmentVariable(\'PATH\', \'User\')"', {
          encoding: 'utf8',
          stdio: 'pipe'
        });

        if (result && result.trim()) {
          process.env.PATH = result.trim();
          console.log('   Environment refreshed');
        }
      } catch (error) {
        // Ignore refresh errors
      }
    }
  }
}

module.exports = SystemSetup;
