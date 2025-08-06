#!/usr/bin/env node

/**
 * SSH Manager - Complete Automatic Setup
 * Handles everything automatically: permissions, global commands, dependencies
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AutoSetup {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    this.projectDir = process.cwd();
    this.homeDir = os.homedir();
  }

  /**
   * Main setup process - handles everything automatically
   */
  async setup() {
    console.log('🚀 SSH Manager - Automatic Setup');
    console.log('   Setting up everything automatically...\n');

    try {
      // Step 1: Fix file permissions
      await this.fixPermissions();

      // Step 2: Install Node.js dependencies
      await this.installDependencies();

      // Step 3: Setup global commands
      await this.setupGlobalCommands();

      // Step 4: Install system dependencies (clipboard tools, etc.)
      await this.installSystemDependencies();

      // Step 5: Verify everything works
      await this.verifySetup();

      console.log('\n🎉 Setup Complete!');
      console.log('\n📋 Available commands:');
      console.log('  sshm generate    # Generate SSH key');
      console.log('  sshm list        # List SSH keys');
      console.log('  sshm copy        # Copy key to clipboard');
      console.log('  sshm status      # Show system status');
      console.log('\n🔗 Quick start:');
      console.log('  sshm generate -t ed25519 -n github');

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\n🔧 Manual fallback:');
      console.log('  node src/cli-simple.js [command]');
      process.exit(1);
    }
  }

  /**
   * Fix file permissions automatically
   */
  async fixPermissions() {
    console.log('🔧 Fixing file permissions...');

    try {
      // Make CLI scripts executable
      const scripts = ['src/cli-simple.js', 'src/cli.js'];
      
      for (const script of scripts) {
        if (fs.existsSync(script)) {
          if (!this.isWindows) {
            execSync(`chmod +x ${script}`, { stdio: 'pipe' });
          }
          console.log(`   ✅ ${script} is executable`);
        }
      }

      // Fix any existing global command permissions
      try {
        const globalPath = execSync('npm bin -g', { encoding: 'utf8' }).trim();
        const sshManagerPath = path.join(globalPath, 'sshm');
        
        if (fs.existsSync(sshManagerPath) && !this.isWindows) {
          execSync(`chmod +x ${sshManagerPath}`, { stdio: 'pipe' });
          console.log('   ✅ Global command permissions fixed');
        }
      } catch (error) {
        // Global command doesn't exist yet, that's fine
      }

    } catch (error) {
      console.log('   ⚠️  Permission fix failed (non-critical)');
    }
  }

  /**
   * Install Node.js dependencies
   */
  async installDependencies() {
    console.log('📦 Installing Node.js dependencies...');

    try {
      // Check if package.json exists
      if (!fs.existsSync('package.json')) {
        throw new Error('package.json not found');
      }

      // Install dependencies
      execSync('npm install', { stdio: 'pipe' });
      console.log('   ✅ Node.js dependencies installed');

    } catch (error) {
      throw new Error(`Failed to install Node.js dependencies: ${error.message}`);
    }
  }

  /**
   * Setup global commands automatically
   */
  async setupGlobalCommands() {
    console.log('🔗 Setting up global commands...');

    try {
      // Method 1: Try npm link
      try {
        // Clean up any existing links
        execSync('npm unlink 2>/dev/null || true', { stdio: 'pipe' });
        
        // Create new link
        execSync('npm link', { stdio: 'pipe' });
        
        // Test if it works
        execSync('sshm --help', { stdio: 'pipe' });
        console.log('   ✅ Global commands installed via npm link');
        return;
        
      } catch (npmError) {
        console.log('   ⚠️  npm link failed, trying alternative methods...');
      }

      // Method 2: Create system-wide script
      if (!this.isWindows) {
        try {
          const scriptContent = `#!/bin/bash\nnode "${this.projectDir}/src/cli-simple.js" "$@"\n`;
          
          // Try /usr/local/bin first
          try {
            fs.writeFileSync('/usr/local/bin/sshm', scriptContent);
            execSync('chmod +x /usr/local/bin/sshm', { stdio: 'pipe' });
            execSync('sshm --help', { stdio: 'pipe' });
            console.log('   ✅ Global commands installed in /usr/local/bin');
            return;
          } catch (error) {
            // Need sudo for /usr/local/bin
            console.log('   🔐 Installing global command (may require password)...');
            execSync(`echo '${scriptContent}' | sudo tee /usr/local/bin/sshm > /dev/null`, { stdio: 'inherit' });
            execSync('sudo chmod +x /usr/local/bin/sshm', { stdio: 'inherit' });
            execSync('sshm --help', { stdio: 'pipe' });
            console.log('   ✅ Global commands installed in /usr/local/bin');
            return;
          }
        } catch (systemError) {
          console.log('   ⚠️  System-wide installation failed, trying user-specific...');
        }
      }

      // Method 3: User-specific installation
      await this.setupUserCommands();

    } catch (error) {
      console.log('   ⚠️  Global command setup failed, commands available as: node src/cli-simple.js');
    }
  }

  /**
   * Setup user-specific commands
   */
  async setupUserCommands() {
    try {
      // Create user bin directory
      const userBin = path.join(this.homeDir, '.local', 'bin');
      fs.mkdirSync(userBin, { recursive: true });

      // Create script
      const scriptPath = path.join(userBin, 'sshm');
      const scriptContent = this.isWindows 
        ? `@echo off\nnode "${this.projectDir}\\src\\cli-simple.js" %*\n`
        : `#!/bin/bash\nnode "${this.projectDir}/src/cli-simple.js" "$@"\n`;

      fs.writeFileSync(scriptPath, scriptContent);
      
      if (!this.isWindows) {
        execSync(`chmod +x ${scriptPath}`, { stdio: 'pipe' });
      }

      // Add to PATH if not already there
      await this.addToPath(userBin);

      console.log('   ✅ User-specific commands installed');

    } catch (error) {
      throw new Error(`User command setup failed: ${error.message}`);
    }
  }

  /**
   * Add directory to PATH
   */
  async addToPath(directory) {
    try {
      const shellConfig = this.getShellConfig();
      const pathLine = `export PATH="${directory}:$PATH"`;

      // Check if already in PATH
      if (process.env.PATH && process.env.PATH.includes(directory)) {
        return;
      }

      // Check if already in shell config
      if (fs.existsSync(shellConfig)) {
        const content = fs.readFileSync(shellConfig, 'utf8');
        if (content.includes(pathLine)) {
          return;
        }
      }

      // Add to shell config
      fs.appendFileSync(shellConfig, `\n# SSH Manager\n${pathLine}\n`);
      console.log(`   ✅ Added to PATH in ${shellConfig}`);

    } catch (error) {
      console.log('   ⚠️  PATH update failed (non-critical)');
    }
  }

  /**
   * Get shell configuration file
   */
  getShellConfig() {
    const shell = process.env.SHELL || '';
    
    if (shell.includes('zsh')) {
      return path.join(this.homeDir, '.zshrc');
    } else if (shell.includes('fish')) {
      return path.join(this.homeDir, '.config', 'fish', 'config.fish');
    } else {
      return path.join(this.homeDir, '.bashrc');
    }
  }

  /**
   * Install system dependencies
   */
  async installSystemDependencies() {
    console.log('🔧 Installing system dependencies...');

    if (this.isLinux) {
      await this.installLinuxDependencies();
    } else if (this.isMacOS) {
      await this.installMacOSDependencies();
    } else if (this.isWindows) {
      await this.installWindowsDependencies();
    }
  }

  /**
   * Install Linux dependencies
   */
  async installLinuxDependencies() {
    try {
      // Check if OpenSSH is available
      try {
        execSync('ssh-keygen -?', { stdio: 'pipe' });
        console.log('   ✅ OpenSSH already available');
      } catch (error) {
        console.log('   📦 Installing OpenSSH...');
        await this.installOpenSSHLinux();
      }

      // Check if clipboard tools are available
      try {
        execSync('which xclip', { stdio: 'ignore' });
        console.log('   ✅ Clipboard tools already available');
      } catch (error) {
        console.log('   📋 Installing clipboard tools...');
        await this.installClipboardLinux();
      }

    } catch (error) {
      console.log('   ⚠️  Some system dependencies may be missing (will auto-install when needed)');
    }
  }

  /**
   * Install OpenSSH on Linux
   */
  async installOpenSSHLinux() {
    const distro = this.detectLinuxDistro();
    
    try {
      switch (distro) {
        case 'ubuntu':
        case 'debian':
          execSync('sudo apt update && sudo apt install -y openssh-client', { stdio: 'inherit' });
          break;
        case 'fedora':
          execSync('sudo dnf install -y openssh-clients', { stdio: 'inherit' });
          break;
        case 'arch':
          execSync('sudo pacman -S --noconfirm openssh', { stdio: 'inherit' });
          break;
        default:
          console.log('   ⚠️  Unknown distribution, OpenSSH will be installed when needed');
      }
    } catch (error) {
      console.log('   ⚠️  OpenSSH installation failed (will retry when needed)');
    }
  }

  /**
   * Install clipboard tools on Linux
   */
  async installClipboardLinux() {
    const distro = this.detectLinuxDistro();
    
    try {
      switch (distro) {
        case 'ubuntu':
        case 'debian':
          execSync('sudo apt install -y xclip xsel', { stdio: 'inherit' });
          break;
        case 'fedora':
          execSync('sudo dnf install -y xclip xsel', { stdio: 'inherit' });
          break;
        case 'arch':
          execSync('sudo pacman -S --noconfirm xclip xsel', { stdio: 'inherit' });
          break;
        default:
          console.log('   ⚠️  Unknown distribution, clipboard tools will be installed when needed');
      }
    } catch (error) {
      console.log('   ⚠️  Clipboard tools installation failed (will retry when needed)');
    }
  }

  /**
   * Detect Linux distribution
   */
  detectLinuxDistro() {
    try {
      if (fs.existsSync('/etc/os-release')) {
        const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
        if (osRelease.includes('Ubuntu')) return 'ubuntu';
        if (osRelease.includes('Debian')) return 'debian';
        if (osRelease.includes('Fedora')) return 'fedora';
        if (osRelease.includes('Arch')) return 'arch';
      }
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Install macOS dependencies
   */
  async installMacOSDependencies() {
    console.log('   ✅ macOS dependencies are built-in');
  }

  /**
   * Install Windows dependencies
   */
  async installWindowsDependencies() {
    console.log('   ✅ Windows dependencies will be installed when needed');
  }

  /**
   * Verify setup works
   */
  async verifySetup() {
    console.log('🧪 Verifying setup...');

    try {
      // Test if sshm command works
      try {
        execSync('sshm --help', { stdio: 'pipe' });
        console.log('   ✅ Global sshm command working');
      } catch (error) {
        console.log('   ⚠️  Global command not available, using direct execution');
      }

      // Test SSH Manager functionality
      execSync('node src/cli-simple.js status', { stdio: 'pipe' });
      console.log('   ✅ SSH Manager functionality working');

    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new AutoSetup();
  setup.setup().catch(error => {
    console.error('❌ Auto-setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = AutoSetup;
