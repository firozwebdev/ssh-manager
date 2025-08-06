const { execSync, spawn } = require('child_process');
const os = require('os');

class SimpleClipboardManager {
  constructor(config = {}) {
    this.config = {
      timeout: 5000,
      fallbackMethods: this.getFallbackMethods(),
      ...config
    };
  }

  /**
   * Get platform-specific fallback methods with enhanced detection
   */
  getFallbackMethods() {
    const platform = os.platform();

    switch (platform) {
    case 'darwin': // macOS
      return this.getMacOSMethods();
    case 'linux':
      return this.getLinuxMethods();
    case 'win32': // Windows
      return this.getWindowsMethods();
    default:
      return [];
    }
  }

  /**
   * Get macOS clipboard methods
   */
  getMacOSMethods() {
    const methods = [];

    // Check for pbcopy (standard macOS)
    try {
      require('child_process').execSync('which pbcopy', { stdio: 'ignore' });
      methods.push('pbcopy');
    } catch (error) {
      // pbcopy not available
    }

    return methods.length > 0 ? methods : ['pbcopy']; // fallback
  }

  /**
   * Get Linux clipboard methods with comprehensive detection
   */
  getLinuxMethods() {
    const methods = [];
    const { execSync } = require('child_process');

    // WSL detection and Windows clipboard integration (highest priority)
    if (this.isWSL()) {
      methods.push('wsl-clipboard');
      return methods; // WSL can use Windows clipboard directly
    }

    // Check for various Linux clipboard tools
    const linuxTools = [
      'xclip',           // Most common
      'xsel',            // Alternative
      'wl-copy',         // Wayland
      'termux-clipboard-set', // Termux (Android)
      'pbcopy'           // Some Linux systems have pbcopy
    ];

    for (const tool of linuxTools) {
      try {
        execSync(`which ${tool}`, { stdio: 'ignore' });
        methods.push(tool);
      } catch (error) {
        // Tool not available
      }
    }

    // Check for desktop environment specific methods
    const desktopEnv = process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || '';

    if (desktopEnv.toLowerCase().includes('kde')) {
      try {
        execSync('which qdbus', { stdio: 'ignore' });
        methods.push('kde-clipboard');
      } catch (error) {
        // KDE clipboard not available
      }
    }

    if (desktopEnv.toLowerCase().includes('gnome')) {
      try {
        execSync('which gdbus', { stdio: 'ignore' });
        methods.push('gnome-clipboard');
      } catch (error) {
        // GNOME clipboard not available
      }
    }

    return methods; // Return empty array if no tools found - this will trigger auto-installation
  }

  /**
   * Get Windows clipboard methods
   */
  getWindowsMethods() {
    const methods = [];
    const { execSync } = require('child_process');

    // PowerShell is preferred
    try {
      execSync('powershell -Command "Get-Command Set-Clipboard"', { stdio: 'ignore' });
      methods.push('powershell-clipboard');
    } catch (error) {
      // PowerShell clipboard not available
    }

    // Traditional clip command
    try {
      execSync('where clip', { stdio: 'ignore' });
      methods.push('clip');
    } catch (error) {
      // clip not available
    }

    return methods.length > 0 ? methods : ['powershell-clipboard', 'clip']; // fallback
  }

  /**
   * Detect if running in WSL
   */
  isWSL() {
    try {
      const fs = require('fs');
      const release = fs.readFileSync('/proc/version', 'utf8');
      return release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl');
    } catch (error) {
      return false;
    }
  }

  /**
   * Copy text to clipboard using platform-specific methods
   */
  async copy(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text provided for clipboard copy');
    }

    // Get current platform methods
    const methods = this.getFallbackMethods();

    // Special handling for Linux - auto-install if no tools available
    if (os.platform() === 'linux') {
      // Check if we actually have working clipboard tools
      const hasWorkingTools = await this.checkLinuxClipboardTools();

      if (!hasWorkingTools) {
        console.log('📋 Setting up clipboard functionality...');
        const installed = await this.installLinuxClipboardToolsQuietly();

        if (installed) {
          // Get methods again after installation
          const newMethods = this.getLinuxMethods();
          if (newMethods.length > 0) {
            for (const method of newMethods) {
              try {
                await this.copyWithFallback(text, method);
                return { method, success: true };
              } catch (retryError) {
                // Continue to next method
              }
            }
          }
        }

        // If installation failed, provide manual instructions
        return this.handleClipboardFailure(text);
      }
    }

    // Try available methods
    for (const method of methods) {
      try {
        await this.copyWithFallback(text, method);
        return { method, success: true };
      } catch (fallbackError) {
        // On Linux, if this is a "command not found" error, try auto-installation
        if (os.platform() === 'linux' && fallbackError.message.includes('Command not found')) {
          console.log('🔧 Installing missing clipboard tools...');
          const installed = await this.installLinuxClipboardToolsQuietly();

          if (installed) {
            // Retry this method after installation
            try {
              await this.copyWithFallback(text, method);
              return { method, success: true };
            } catch (retryError) {
              // Installation didn't help, continue to next method
            }
          }
        }
      }
    }

    // Final fallback: provide manual copy instructions
    return this.handleClipboardFailure(text);
  }

  /**
   * Copy using platform-specific fallback methods
   */
  async copyWithFallback(text, method) {
    return new Promise((resolve, reject) => {
      // Handle PowerShell clipboard method for Windows
      if (method === 'powershell-clipboard') {
        try {
          // Use PowerShell Set-Clipboard cmdlet
          const escapedText = text.replace(/'/g, '\'\''); // Escape single quotes
          const command = `powershell -Command "Set-Clipboard -Value '${escapedText}'"`;
          execSync(command, { stdio: 'pipe', timeout: this.config.timeout });
          resolve();
          return;
        } catch (error) {
          reject(new Error(`PowerShell clipboard failed: ${error.message}`));
          return;
        }
      }

      // Handle special clipboard methods
      if (method === 'wsl-clipboard') {
        try {
          // Use Windows clipboard from WSL
          const command = 'clip.exe';
          const child = spawn(command, [], { stdio: ['pipe', 'pipe', 'pipe'] });
          child.stdin.write(text);
          child.stdin.end();

          child.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`WSL clipboard failed with code ${code}`));
            }
          });

          child.on('error', (error) => {
            reject(new Error(`WSL clipboard error: ${error.message}`));
          });

          return;
        } catch (error) {
          reject(new Error(`WSL clipboard failed: ${error.message}`));
          return;
        }
      }

      if (method === 'kde-clipboard') {
        try {
          const command = `qdbus org.kde.klipper /klipper setClipboardContents "${text.replace(/"/g, '\\"')}"`;
          execSync(command, { stdio: 'pipe', timeout: this.config.timeout });
          resolve();
          return;
        } catch (error) {
          reject(new Error(`KDE clipboard failed: ${error.message}`));
          return;
        }
      }

      if (method === 'gnome-clipboard') {
        try {
          const escapedText = text.replace(/'/g, '\'"\'"\'');
          const command = `gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval "global.display.set_selection('${escapedText}')"`;
          execSync(command, { stdio: 'pipe', timeout: this.config.timeout });
          resolve();
          return;
        } catch (error) {
          reject(new Error(`GNOME clipboard failed: ${error.message}`));
          return;
        }
      }

      let command;
      let checkCommand;

      switch (method) {
      case 'pbcopy': // macOS
        command = 'pbcopy';
        checkCommand = 'which pbcopy';
        break;
      case 'xclip': // Linux
        command = 'xclip -selection clipboard';
        checkCommand = 'which xclip';
        break;
      case 'xsel': // Linux alternative
        command = 'xsel --clipboard --input';
        checkCommand = 'which xsel';
        break;
      case 'wl-copy': // Wayland
        command = 'wl-copy';
        checkCommand = 'which wl-copy';
        break;
      case 'termux-clipboard-set': // Termux (Android)
        command = 'termux-clipboard-set';
        checkCommand = 'which termux-clipboard-set';
        break;
      case 'clip': // Windows
        command = 'clip';
        checkCommand = 'where clip';
        break;
      default:
        reject(new Error(`Unknown fallback method: ${method}`));
        return;
      }

      try {
        // Check if command exists
        execSync(checkCommand, { stdio: 'ignore' });
      } catch (error) {
        reject(new Error(`Command not found: ${method}`));
        return;
      }

      const child = spawn(command, [], {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';
      let stdout = '';

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${method} failed with code ${code}: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`${method} process error: ${error.message}`));
      });

      // Write text to stdin
      try {
        child.stdin.write(text);
        child.stdin.end();
      } catch (writeError) {
        reject(new Error(`Failed to write to ${method}: ${writeError.message}`));
        return;
      }

      // Set timeout
      const timeoutId = setTimeout(() => {
        child.kill();
        reject(new Error(`${method} operation timed out`));
      }, this.config.timeout);

      // Clear timeout on successful completion
      child.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Read from clipboard
   */
  async read() {
    const platform = os.platform();

    try {
      switch (platform) {
      case 'win32':
        // Try PowerShell first
        try {
          const result = execSync('powershell -Command "Get-Clipboard"', {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: this.config.timeout
          });
          return result.trim();
        } catch (psError) {
          // Fallback: Windows doesn't have a simple command-line clipboard read
          return '';
        }

      case 'darwin':
        const macResult = execSync('pbpaste', {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: this.config.timeout
        });
        return macResult.trim();

      case 'linux':
        return await this.readLinuxClipboard();

      default:
        return '';
      }
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if clipboard contains SSH key
   */
  async containsSSHKey() {
    try {
      const content = await this.read();
      return this.isSSHKey(content);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate if text is an SSH key
   */
  isSSHKey(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const sshKeyPatterns = [
      /^ssh-rsa\s+[A-Za-z0-9+/]+=*\s*.*/,
      /^ssh-ed25519\s+[A-Za-z0-9+/]+=*\s*.*/,
      /^ecdsa-sha2-\w+\s+[A-Za-z0-9+/]+=*\s*.*/,
      /^ssh-dss\s+[A-Za-z0-9+/]+=*\s*.*/
    ];

    return sshKeyPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Clear clipboard
   */
  async clear() {
    try {
      await this.copy('');
      return true;
    } catch (error) {
      throw new Error(`Failed to clear clipboard: ${error.message}`);
    }
  }

  /**
   * Get clipboard status and info
   */
  async getStatus() {
    try {
      const content = await this.read();
      const isSSHKey = this.isSSHKey(content);
      
      return {
        hasContent: content.length > 0,
        contentLength: content.length,
        isSSHKey,
        keyType: isSSHKey ? this.detectKeyType(content) : null,
        preview: content.length > 50 ? content.substring(0, 50) + '...' : content
      };
    } catch (error) {
      return {
        hasContent: false,
        contentLength: 0,
        isSSHKey: false,
        keyType: null,
        preview: '',
        error: error.message
      };
    }
  }

  /**
   * Detect SSH key type from content
   */
  detectKeyType(content) {
    if (content.startsWith('ssh-rsa')) return 'RSA';
    if (content.startsWith('ssh-ed25519')) return 'Ed25519';
    if (content.startsWith('ecdsa-sha2-')) return 'ECDSA';
    if (content.startsWith('ssh-dss')) return 'DSA';
    return 'Unknown';
  }

  /**
   * Read clipboard content on Linux with multiple fallbacks
   */
  async readLinuxClipboard() {
    const methods = [
      { cmd: 'xclip -selection clipboard -o', name: 'xclip' },
      { cmd: 'xsel --clipboard --output', name: 'xsel' },
      { cmd: 'wl-paste', name: 'wl-paste' },
      { cmd: 'termux-clipboard-get', name: 'termux' }
    ];

    // Try WSL clipboard first if in WSL
    if (this.isWSL()) {
      try {
        const result = execSync('powershell.exe -Command "Get-Clipboard"', {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: this.config.timeout
        });
        return result.trim();
      } catch (error) {
        // WSL clipboard failed, try Linux methods
      }
    }

    // Try each Linux clipboard method
    for (const method of methods) {
      try {
        const result = execSync(method.cmd, {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: this.config.timeout
        });
        return result.trim();
      } catch (error) {
        continue;
      }
    }

    // Try desktop environment specific methods
    try {
      const desktopEnv = process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || '';

      if (desktopEnv.toLowerCase().includes('kde')) {
        const result = execSync('qdbus org.kde.klipper /klipper getClipboardContents', {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: this.config.timeout
        });
        return result.trim();
      }
    } catch (error) {
      // Desktop environment method failed
    }

    return '';
  }

  /**
   * Check if Linux clipboard tools are actually working
   */
  async checkLinuxClipboardTools() {
    if (os.platform() !== 'linux') return true;

    // WSL can use Windows clipboard
    if (this.isWSL()) {
      try {
        const { execSync } = require('child_process');
        execSync('echo "test" | clip.exe', { stdio: 'pipe', timeout: 5000 });
        return true;
      } catch (error) {
        return false;
      }
    }

    // Check if any clipboard tool actually works
    const tools = ['xclip', 'xsel', 'wl-copy'];

    for (const tool of tools) {
      try {
        const { execSync } = require('child_process');

        // Check if tool exists
        execSync(`which ${tool}`, { stdio: 'ignore' });

        // Test if it actually works
        if (tool === 'xclip') {
          execSync('echo "test" | xclip -selection clipboard', { stdio: 'pipe', timeout: 5000 });
          const result = execSync('xclip -selection clipboard -o', { encoding: 'utf8', timeout: 5000 });
          if (result.trim() === 'test') return true;
        } else if (tool === 'xsel') {
          execSync('echo "test" | xsel --clipboard --input', { stdio: 'pipe', timeout: 5000 });
          const result = execSync('xsel --clipboard --output', { encoding: 'utf8', timeout: 5000 });
          if (result.trim() === 'test') return true;
        } else if (tool === 'wl-copy') {
          execSync('echo "test" | wl-copy', { stdio: 'pipe', timeout: 5000 });
          const result = execSync('wl-paste', { encoding: 'utf8', timeout: 5000 });
          if (result.trim() === 'test') return true;
        }
      } catch (error) {
        // Tool doesn't exist or doesn't work, continue to next
        continue;
      }
    }

    return false;
  }

  /**
   * Install Linux clipboard tools automatically (quiet version)
   */
  async installLinuxClipboardToolsQuietly() {
    try {
      const { execSync } = require('child_process');

      // Detect Linux distribution
      const distro = this.detectLinuxDistro();

      console.log('🔧 Installing clipboard tools automatically...');
      console.log('   📋 This will install xclip and xsel for clipboard functionality');
      console.log('   🔐 You may be prompted for your sudo password');
      console.log('');

      // Try to install with full user interaction for sudo
      switch (distro) {
      case 'ubuntu':
      case 'debian':
      case 'mint':
      case 'pop':
      case 'kali':
        try {
          console.log('   📦 Installing xclip and xsel directly...');
          // Skip apt update and install directly (more reliable with broken repos)
          execSync('sudo apt install -y xclip xsel', {
            stdio: 'inherit',  // Full interaction for sudo
            timeout: 60000
          });
        } catch (error) {
          // Try alternative installation methods for broken repositories
          console.log('   🔄 Trying with repository fixes...');
          try {
            // Try fixing repository issues and installing
            execSync('sudo apt update --fix-missing 2>/dev/null || true', {
              stdio: 'inherit',
              timeout: 60000
            });
            execSync('sudo apt install -y xclip xsel', {
              stdio: 'inherit',
              timeout: 60000
            });
          } catch (error2) {
            // Try with non-interactive mode
            try {
              console.log('   🔄 Trying non-interactive installation...');
              execSync('sudo DEBIAN_FRONTEND=noninteractive apt install -y xclip xsel', {
                stdio: 'inherit',
                timeout: 60000
              });
            } catch (error3) {
              // Try installing from main repository only
              try {
                console.log('   🔄 Trying main repository installation...');
                execSync('sudo apt install -y --no-install-recommends xclip xsel', {
                  stdio: 'inherit',
                  timeout: 60000
                });
              } catch (error4) {
                // Final fallback - try individual packages
                try {
                  console.log('   🔄 Trying individual package installation...');
                  execSync('sudo apt install -y xclip || true', { stdio: 'inherit', timeout: 30000 });
                  execSync('sudo apt install -y xsel || true', { stdio: 'inherit', timeout: 30000 });
                } catch (error5) {
                  throw error; // Re-throw original error
                }
              }
            }
          }
        }
        break;

      case 'fedora':
      case 'centos':
      case 'rhel':
        console.log('   📦 Installing via dnf/yum...');
        try {
          execSync('sudo dnf install -y xclip xsel', {
            stdio: 'inherit',  // Full interaction for sudo
            timeout: 60000
          });
        } catch {
          execSync('sudo yum install -y xclip xsel', {
            stdio: 'inherit',  // Full interaction for sudo
            timeout: 60000
          });
        }
        break;

      case 'arch':
      case 'manjaro':
        console.log('   📦 Installing via pacman...');
        execSync('sudo pacman -S --noconfirm xclip xsel', {
          stdio: 'inherit',  // Full interaction for sudo
          timeout: 60000
        });
        break;

      case 'opensuse':
        console.log('   Installing via zypper...');
        execSync('sudo zypper install -y xclip xsel', {
          stdio: ['inherit', 'pipe', 'pipe'],
          timeout: 60000
        });
        break;

      case 'alpine':
        console.log('   Installing via apk...');
        execSync('sudo apk add xclip xsel', {
          stdio: ['inherit', 'pipe', 'pipe'],
          timeout: 60000
        });
        break;

      default:
        // Try common package managers quietly
        const managers = [
          'sudo apt update -qq && sudo apt install -y -qq xclip xsel',
          'sudo dnf install -y -q xclip xsel',
          'sudo yum install -y -q xclip xsel',
          'sudo pacman -S --noconfirm --quiet xclip xsel'
        ];

        for (const cmd of managers) {
          try {
            execSync(cmd, { stdio: 'pipe', timeout: 60000 });
            break;
          } catch (error) {
            continue;
          }
        }
      }

      // Verify installation by actually testing the tools
      console.log('   Verifying installation...');

      // Wait a moment for installation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test if tools actually work
      const working = await this.checkLinuxClipboardTools();

      if (working) {
        console.log('✅ Clipboard tools installed and working');
        return true;
      } else {
        console.log('⚠️  Installation completed but tools not working properly');
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Install Linux clipboard tools automatically (verbose version)
   */
  async installLinuxClipboardTools() {
    console.log('📦 Installing clipboard tools for Linux...');

    try {
      const { execSync } = require('child_process');

      // Detect Linux distribution
      const distro = this.detectLinuxDistro();
      console.log(`   Detected distribution: ${distro}`);

      switch (distro) {
      case 'ubuntu':
      case 'debian':
      case 'mint':
      case 'pop':
      case 'kali':
        console.log('   Installing via apt...');
        execSync('sudo apt update && sudo apt install -y xclip xsel', {
          stdio: 'inherit',
          timeout: 60000
        });
        break;

      case 'fedora':
      case 'centos':
      case 'rhel':
        console.log('   Installing via dnf/yum...');
        try {
          execSync('sudo dnf install -y xclip xsel', {
            stdio: 'inherit',
            timeout: 60000
          });
        } catch {
          execSync('sudo yum install -y xclip xsel', {
            stdio: 'inherit',
            timeout: 60000
          });
        }
        break;

      case 'arch':
      case 'manjaro':
        console.log('   Installing via pacman...');
        execSync('sudo pacman -S --noconfirm xclip xsel', {
          stdio: 'inherit',
          timeout: 60000
        });
        break;

      case 'opensuse':
        console.log('   Installing via zypper...');
        execSync('sudo zypper install -y xclip xsel', {
          stdio: 'inherit',
          timeout: 60000
        });
        break;

      case 'alpine':
        console.log('   Installing via apk...');
        execSync('sudo apk add xclip xsel', {
          stdio: 'inherit',
          timeout: 60000
        });
        break;

      default:
        console.log('   ⚠️  Unknown distribution, trying generic installation...');
        // Try common package managers
        const managers = [
          { cmd: 'sudo apt install -y xclip xsel', name: 'apt' },
          { cmd: 'sudo dnf install -y xclip xsel', name: 'dnf' },
          { cmd: 'sudo yum install -y xclip xsel', name: 'yum' },
          { cmd: 'sudo pacman -S --noconfirm xclip xsel', name: 'pacman' }
        ];

        for (const manager of managers) {
          try {
            console.log(`   Trying ${manager.name}...`);
            execSync(manager.cmd, { stdio: 'inherit', timeout: 60000 });
            break;
          } catch (error) {
            continue;
          }
        }
      }

      // Verify installation
      try {
        execSync('which xclip', { stdio: 'ignore' });
        console.log('✅ Clipboard tools installed successfully!');
        return true;
      } catch (error) {
        try {
          execSync('which xsel', { stdio: 'ignore' });
          console.log('✅ Clipboard tools installed successfully!');
          return true;
        } catch (error2) {
          console.log('⚠️  Installation completed but tools not found in PATH');
          return false;
        }
      }
    } catch (error) {
      console.log('❌ Failed to install clipboard tools:', error.message);
      return false;
    }
  }

  /**
   * Detect Linux distribution
   */
  detectLinuxDistro() {
    try {
      const fs = require('fs');

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
   * Handle clipboard failure with helpful instructions
   */
  handleClipboardFailure(text) {
    console.log('\n❌ Failed to copy to clipboard automatically');
    console.log('📋 Manual copy options:\n');

    if (os.platform() === 'linux') {
      console.log('🐧 Linux clipboard setup:');
      console.log('   Install clipboard tools:');
      console.log('   • Ubuntu/Debian: sudo apt install xclip xsel');
      console.log('   • Fedora/CentOS: sudo dnf install xclip xsel');
      console.log('   • Arch Linux: sudo pacman -S xclip xsel');
      console.log('');
      console.log('   Then copy manually:');
      console.log(`   echo "${text}" | xclip -selection clipboard`);
      console.log('');
    }

    console.log('📄 Or copy this text manually:');
    console.log('─'.repeat(50));
    console.log(text);
    console.log('─'.repeat(50));

    return {
      method: 'manual',
      success: false,
      text: text,
      instructions: 'Manual copy required - see output above'
    };
  }

  /**
   * Copy with success notification
   */
  async copyWithNotification(text, description = 'Text') {
    try {
      const result = await this.copy(text);

      if (result.success) {
        return {
          ...result,
          message: `${description} copied to clipboard successfully using ${result.method}`,
          length: text.length
        };
      } else {
        // Manual copy case
        return {
          ...result,
          message: `${description} ready for manual copy`,
          length: text.length
        };
      }
    } catch (error) {
      throw new Error(`Failed to copy ${description.toLowerCase()}: ${error.message}`);
    }
  }
}

module.exports = SimpleClipboardManager;
