const chalk = require('chalk');
const ora = require('ora');
const SSHManager = require('../utils/ssh');
const ClipboardManager = require('../utils/clipboard-simple');

class StatusCommand {
  constructor(config = {}) {
    this.sshManager = new SSHManager(config.ssh);
    this.clipboardManager = new ClipboardManager(config.clipboard);
  }

  async execute(options = {}) {
    try {
      console.log(chalk.bold('\n🔐 SSH Manager Status\n'));

      // SSH Directory Status
      await this.showSSHDirectoryStatus();

      // Keys Status
      await this.showKeysStatus();

      // Clipboard Status
      await this.showClipboardStatus();

      // System Status
      await this.showSystemStatus();
    } catch (error) {
      console.error(chalk.red('✗ Error getting status:'), error.message);
      throw error;
    }
  }

  async showSSHDirectoryStatus() {
    console.log(chalk.cyan('📁 SSH Directory'));
    console.log(chalk.dim('─'.repeat(40)));

    try {
      const sshDir = this.sshManager.config.defaultDirectory;
      const fs = require('fs');

      if (fs.existsSync(sshDir)) {
        const stats = fs.statSync(sshDir);
        console.log(chalk.green('✓'), `Directory exists: ${sshDir}`);
        console.log(
          chalk.dim(`  Created: ${stats.birthtime.toLocaleDateString()}`)
        );

        // Check permissions on Unix systems
        if (process.platform !== 'win32') {
          const mode = (stats.mode & parseInt('777', 8)).toString(8);
          const isSecure = mode === '700';
          console.log(
            isSecure ? chalk.green('✓') : chalk.yellow('⚠'),
            `Permissions: ${mode} ${isSecure ? '(secure)' : '(should be 700)'}`
          );
        }
      } else {
        console.log(chalk.red('✗'), `Directory not found: ${sshDir}`);
      }
    } catch (error) {
      console.log(chalk.red('✗'), `Error checking directory: ${error.message}`);
    }

    console.log();
  }

  async showKeysStatus() {
    console.log(chalk.cyan('🔑 SSH Keys'));
    console.log(chalk.dim('─'.repeat(40)));

    try {
      const keys = this.sshManager.listKeys();

      if (keys.length === 0) {
        console.log(chalk.yellow('⚠'), 'No SSH keys found');
        console.log(
          chalk.dim('  Generate your first key with: ssh-manager generate')
        );
      } else {
        console.log(chalk.green('✓'), `Found ${keys.length} key(s)`);

        for (const key of keys) {
          const status = key.exists ? chalk.green('✓') : chalk.red('✗');
          const keyType = chalk.cyan(key.type.toUpperCase().padEnd(8));

          console.log(`  ${status} ${keyType} ${key.name}`);

          if (!key.exists) {
            console.log(
              chalk.dim(`      Missing private key: ${key.privateKeyPath}`)
            );
          }
        }
      }
    } catch (error) {
      console.log(chalk.red('✗'), `Error listing keys: ${error.message}`);
    }

    console.log();
  }

  async showClipboardStatus() {
    console.log(chalk.cyan('📋 Clipboard'));
    console.log(chalk.dim('─'.repeat(40)));

    try {
      const status = await this.clipboardManager.getStatus();

      if (status.error) {
        console.log(chalk.red('✗'), `Clipboard error: ${status.error}`);
      } else if (!status.hasContent) {
        console.log(chalk.yellow('⚠'), 'Clipboard is empty');
      } else {
        console.log(
          chalk.green('✓'),
          `Content length: ${status.contentLength} characters`
        );

        if (status.isSSHKey) {
          console.log(chalk.green('✓'), `Contains SSH key (${status.keyType})`);
        } else {
          console.log(chalk.dim('  Content preview:'), status.preview);
        }
      }
    } catch (error) {
      console.log(chalk.red('✗'), `Error checking clipboard: ${error.message}`);
    }

    console.log();
  }

  async showSystemStatus() {
    console.log(chalk.cyan('⚙️  System'));
    console.log(chalk.dim('─'.repeat(40)));

    // Check ssh-keygen availability
    try {
      const { execSync } = require('child_process');
      execSync('ssh-keygen -?', { stdio: 'pipe' });
      console.log(chalk.green('✓'), 'ssh-keygen available');
    } catch (error) {
      // ssh-keygen -? returns non-zero but shows usage if available
      if (error.stderr && error.stderr.includes('usage: ssh-keygen')) {
        console.log(chalk.green('✓'), 'ssh-keygen available');
      } else if (error.stdout && error.stdout.includes('usage: ssh-keygen')) {
        console.log(chalk.green('✓'), 'ssh-keygen available');
      } else {
        console.log(chalk.red('✗'), 'ssh-keygen not found');
        console.log(chalk.dim('  Install OpenSSH to use this tool'));
      }
    }

    // Platform info
    const os = require('os');
    console.log(chalk.green('✓'), `Platform: ${os.platform()} ${os.arch()}`);
    console.log(chalk.green('✓'), `Node.js: ${process.version}`);

    // Clipboard methods
    const methods = this.clipboardManager.config.fallbackMethods;
    if (methods.length > 0) {
      console.log(chalk.green('✓'), `Clipboard methods: ${methods.join(', ')}`);
    }

    console.log();
  }
}

module.exports = StatusCommand;
