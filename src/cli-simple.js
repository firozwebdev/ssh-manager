#!/usr/bin/env node

const { Command } = require('commander');
const SSHManager = require('./utils/ssh');
const ClipboardManager = require('./utils/clipboard-simple');

// Simple first-run check and setup
async function ensureSetup() {
  // Only do basic setup, no heavy installation
  try {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    // Ensure SSH directory exists
    const sshDir = path.join(os.homedir(), '.ssh');
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { mode: 0o700 });
    }
  } catch (error) {
    // Ignore setup errors, continue with CLI
  }
}

// Helper function to handle existing SSH keys
async function handleExistingKey(keyPath, keyName, options) {
  const fs = require('fs');
  const path = require('path');
  const inquirer = require('inquirer');

  const privateKeyPath = keyPath;
  const publicKeyPath = `${keyPath}.pub`;

  // Check if either key exists
  const privateExists = fs.existsSync(privateKeyPath);
  const publicExists = fs.existsSync(publicKeyPath);

  if (!privateExists && !publicExists) {
    return { proceed: true, backup: false };
  }

  // If force option is used, proceed with overwrite
  if (options.force) {
    return { proceed: true, backup: false };
  }

  console.log(`\n⚠️  SSH key already exists: ${keyName}`);
  if (privateExists) console.log(`   Private key: ${privateKeyPath}`);
  if (publicExists) console.log(`   Public key: ${publicKeyPath}`);

  // Interactive prompt for what to do
  const choices = [
    { name: '🔄 Create new key with different name', value: 'rename' },
    { name: '💾 Backup existing and create new', value: 'backup' },
    { name: '⚠️  Overwrite existing key', value: 'overwrite' },
    { name: '❌ Cancel operation', value: 'cancel' }
  ];

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: choices,
      default: 'rename'
    }
  ]);

  switch (answer.action) {
  case 'rename':
    // Suggest a new name
    const timestamp = new Date().toISOString().slice(0, 10);
    const newName = await inquirer.prompt([
      {
        type: 'input',
        name: 'keyName',
        message: 'Enter new key name:',
        default: `${keyName}_${timestamp}`,
        validate: (input) => {
          if (!input.trim()) return 'Key name cannot be empty';
          const newPath = path.join(path.dirname(keyPath), input);
          if (fs.existsSync(newPath) || fs.existsSync(`${newPath}.pub`)) {
            return 'A key with this name already exists';
          }
          return true;
        }
      }
    ]);
    return { proceed: true, backup: false, newName: newName.keyName };

  case 'backup':
    return { proceed: true, backup: true };

  case 'overwrite':
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '⚠️  Are you sure you want to overwrite the existing key? This cannot be undone.',
        default: false
      }
    ]);
    return { proceed: confirm.confirmed, backup: false };

  case 'cancel':
  default:
    return { proceed: false, backup: false };
  }
}
const SystemSetup = require('./utils/system-setup');
const config = require('../config/default.json');

const program = new Command();
const sshManager = new SSHManager(config.ssh);
const clipboardManager = new ClipboardManager(config.clipboard);
const systemSetup = new SystemSetup();

// Utility functions
const log = {
  success: (msg) => console.log('✓', msg),
  error: (msg) => console.log('✗', msg),
  warning: (msg) => console.log('⚠', msg),
  info: (msg) => console.log('ℹ', msg),
  dim: (msg) => console.log(msg),
};

// Program configuration
program
  .name('ssh-manager')
  .description('A robust SSH key manager with clipboard integration')
  .version('1.0.0')
  .option('-v, --verbose', 'enable verbose output');

// Generate command
program
  .command('generate')
  .alias('gen')
  .description('Generate a new SSH key pair and copy public key to clipboard')
  .option('-t, --type <type>', 'key type (rsa, ed25519, ecdsa)', 'ed25519')
  .option('-b, --bits <bits>', 'key size in bits', '4096')
  .option('-n, --name <name>', 'key name (without extension)')
  .option('-c, --comment <comment>', 'key comment')
  .option('-f, --force', 'overwrite existing key')
  .action(async (options) => {
    try {
      console.log('🔐 SSH Manager - Automatic Setup & Key Generation\n');

      // Auto-setup system if needed
      console.log('🔧 Checking system requirements...');
      if (!systemSetup.checkSSHKeygen()) {
        console.log('⚠️  OpenSSH not found. Setting up automatically...\n');

        const setupSuccess = await systemSetup.setupSystem();
        if (!setupSuccess) {
          log.error(
            'System setup failed. Please install OpenSSH manually and try again.'
          );
          process.exit(1);
        }
        console.log('');
      } else {
        console.log('✅ OpenSSH is available!\n');
      }

      console.log('🔑 Generating SSH key pair...');

      // Set defaults with better defaults
      const defaultKeyName = options.name || (options.type === 'ed25519' ? 'id_ed25519' :
        options.type === 'ecdsa' ? 'id_ecdsa' : 'id_rsa');

      const keyOptions = {
        keyType: options.type || 'ed25519', // Default to ed25519 (more secure)
        keySize: parseInt(options.bits) || (options.type === 'rsa' ? 4096 : undefined),
        keyName: defaultKeyName,
        comment:
          options.comment ||
          `${require('os').userInfo().username}@${require('os').hostname()}`,
        overwrite: false, // We'll handle this ourselves
        passphrase: '', // No passphrase for simplicity
      };

      // Check for existing keys and handle appropriately
      const sshDir = require('path').join(require('os').homedir(), '.ssh');
      const keyPath = require('path').join(sshDir, keyOptions.keyName);

      const keyDecision = await handleExistingKey(keyPath, keyOptions.keyName, options);

      if (!keyDecision.proceed) {
        console.log('❌ Key generation cancelled');
        return;
      }

      // Update key name if user chose to rename
      if (keyDecision.newName) {
        keyOptions.keyName = keyDecision.newName;
        console.log(`📝 Using new key name: ${keyOptions.keyName}`);
      }

      // Backup existing key if requested
      if (keyDecision.backup) {
        console.log('💾 Backing up existing key...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupSuffix = `.backup.${timestamp}`;

        const fs = require('fs');
        const originalKeyPath = require('path').join(sshDir, keyOptions.keyName);

        if (fs.existsSync(originalKeyPath)) {
          fs.copyFileSync(originalKeyPath, `${originalKeyPath}${backupSuffix}`);
          console.log(`   Private key backed up to: ${originalKeyPath}${backupSuffix}`);
        }
        if (fs.existsSync(`${originalKeyPath}.pub`)) {
          fs.copyFileSync(`${originalKeyPath}.pub`, `${originalKeyPath}.pub${backupSuffix}`);
          console.log(`   Public key backed up to: ${originalKeyPath}.pub${backupSuffix}`);
        }
      }

      // Set overwrite to true since we've handled the decision
      keyOptions.overwrite = true;

      console.log('⏳ Generating key...');
      const result = await sshManager.generateKeyPair(keyOptions);

      log.success('SSH key pair generated successfully');
      log.info(`Key type: ${result.keyType.toUpperCase()}`);
      log.info(`Key size: ${result.keySize} bits`);
      log.info(`Private key: ${result.privateKeyPath}`);
      log.info(`Public key: ${result.publicKeyPath}`);
      log.info(`Fingerprint: ${result.fingerprint}`);

      // Copy public key to clipboard
      console.log('\n⏳ Copying public key to clipboard...');
      const publicKey = sshManager.getPublicKey(result.publicKeyPath);

      try {
        const clipResult = await clipboardManager.copyWithNotification(
          publicKey,
          'SSH public key'
        );

        if (clipResult.success) {
          log.success(clipResult.message);
          log.dim(`Key length: ${clipResult.length} characters`);
        } else {
          // Manual copy case
          log.warning('Clipboard copy not available');
          if (clipResult.text) {
            console.log('\n📋 Your SSH public key:');
            console.log('─'.repeat(50));
            console.log(clipResult.text);
            console.log('─'.repeat(50));
            log.dim('Copy the text above to use your SSH key');
          }
        }
      } catch (clipError) {
        log.warning(
          'Clipboard copy failed, but key was generated successfully'
        );
        log.dim(
          'You can manually copy the public key from: ' + result.publicKeyPath
        );
      }

      console.log('\n🎉 Done! Your SSH key is ready to use.');
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Copy command
program
  .command('copy')
  .alias('cp')
  .description('Copy existing SSH public key to clipboard')
  .option('-n, --name <name>', 'key name to copy')
  .action(async (options) => {
    try {
      const keys = sshManager.listKeys();

      if (keys.length === 0) {
        log.warning(
          'No SSH keys found. Generate one first with: ssh-manager generate'
        );
        return;
      }

      let selectedKey;

      if (options.name) {
        // Find key by name
        selectedKey = keys.find((key) => key.name === options.name);
        if (!selectedKey) {
          log.error(`Key not found: ${options.name}`);
          log.info('Available keys:');
          keys.forEach((key) => log.dim(`  - ${key.name} (${key.type})`));
          return;
        }
      } else {
        // Use first available key
        selectedKey = keys[0];
        if (keys.length > 1) {
          log.info(`Multiple keys found, using: ${selectedKey.name}`);
          log.dim('Use --name to specify a different key');
        }
      }

      console.log('⏳ Copying public key to clipboard...');

      try {
        const publicKey = sshManager.getPublicKey(selectedKey.publicKeyPath);
        const clipResult = await clipboardManager.copyWithNotification(
          publicKey,
          'SSH public key'
        );

        if (clipResult.success) {
          log.success('Public key copied to clipboard');
          log.info(
            `Key: ${selectedKey.name} (${selectedKey.type.toUpperCase()})`
          );
          log.dim(`Length: ${clipResult.length} characters`);
        } else {
          // Manual copy case
          log.warning('Clipboard copy not available');
          log.info(
            `Key: ${selectedKey.name} (${selectedKey.type.toUpperCase()})`
          );
          if (clipResult.text) {
            console.log('\n📋 Your SSH public key:');
            console.log('─'.repeat(50));
            console.log(clipResult.text);
            console.log('─'.repeat(50));
            log.dim('Copy the text above to use your SSH key');
          }
        }
      } catch (clipError) {
        log.error('Failed to copy key to clipboard');
        log.dim('Manual copy from: ' + selectedKey.publicKeyPath);
      }
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .alias('ls')
  .description('List all SSH keys')
  .option('-d, --detailed', 'show detailed information')
  .action(async (options) => {
    try {
      const keys = sshManager.listKeys();

      if (keys.length === 0) {
        log.warning('No SSH keys found');
        log.info('Generate your first key with: ssh-manager generate');
        return;
      }

      console.log('\n🔑 SSH Keys:\n');

      for (const key of keys) {
        const status = key.exists ? '✓' : '✗';
        const keyType = key.type.toUpperCase().padEnd(8);
        const keyName = key.name;

        console.log(`${status} ${keyType} ${keyName}`);

        if (options.detailed) {
          log.dim(`    Public:  ${key.publicKeyPath}`);
          log.dim(
            `    Private: ${key.privateKeyPath} ${
              key.exists ? '' : '(missing)'
            }`
          );
          log.dim(`    Created: ${key.created.toLocaleDateString()}`);
          log.dim(`    Size:    ${key.size} bytes`);
          console.log();
        }
      }

      if (!options.detailed) {
        log.dim('\nUse --detailed for more information');
      }
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Delete command
program
  .command('delete')
  .alias('del')
  .description('Delete SSH key pair')
  .option('-n, --name <name>', 'key name to delete')
  .option('-f, --force', 'skip confirmation')
  .action(async (options) => {
    try {
      const keys = sshManager.listKeys();

      if (keys.length === 0) {
        log.warning('No SSH keys found');
        return;
      }

      let selectedKey;

      if (!options.name) {
        log.error(
          'Key name is required. Use --name to specify which key to delete'
        );
        log.info('Available keys:');
        keys.forEach((key) => log.dim(`  - ${key.name} (${key.type})`));
        return;
      }

      selectedKey = keys.find((key) => key.name === options.name);
      if (!selectedKey) {
        log.error(`Key not found: ${options.name}`);
        return;
      }

      // Simple confirmation
      if (!options.force) {
        log.warning(
          `This will delete key "${selectedKey.name}". Use --force to confirm.`
        );
        return;
      }

      const result = sshManager.deleteKey(selectedKey.name);
      log.success(
        `Deleted ${result.deleted.join(' and ')} key(s): ${result.keyName}`
      );
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .alias('st')
  .description('Show SSH manager and system status')
  .action(async () => {
    try {
      console.log('\n🔐 SSH Manager Status\n');

      // SSH Directory Status
      console.log('📁 SSH Directory');
      const sshDir = sshManager.config.defaultDirectory;
      const fs = require('fs');

      if (fs.existsSync(sshDir)) {
        log.success(`Directory exists: ${sshDir}`);
      } else {
        log.error(`Directory not found: ${sshDir}`);
      }

      // Keys Status
      console.log('\n🔑 SSH Keys');
      const keys = sshManager.listKeys();

      if (keys.length === 0) {
        log.warning('No SSH keys found');
      } else {
        log.success(`Found ${keys.length} key(s)`);
        keys.forEach((key) => {
          const status = key.exists ? '✓' : '✗';
          console.log(
            `  ${status} ${key.type.toUpperCase().padEnd(8)} ${key.name}`
          );
        });
      }

      // System Status
      console.log('\n⚙️  System');

      // Check ssh-keygen availability
      try {
        const { execSync } = require('child_process');
        execSync('ssh-keygen -?', { stdio: 'pipe' });
        log.success('ssh-keygen available');
      } catch (error) {
        // ssh-keygen -? returns non-zero but shows usage if available
        if (error.stderr && error.stderr.includes('usage: ssh-keygen')) {
          log.success('ssh-keygen available');
        } else if (error.stdout && error.stdout.includes('usage: ssh-keygen')) {
          log.success('ssh-keygen available');
        } else {
          log.error('ssh-keygen not found');
          log.dim('Install OpenSSH to use this tool');
        }
      }

      // Platform info
      const os = require('os');
      log.success(`Platform: ${os.platform()} ${os.arch()}`);
      log.success(`Node.js: ${process.version}`);

      console.log();
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Handle direct command aliases
const scriptName = require('path').basename(process.argv[1], '.js');

// Auto-execute commands based on script name
if (scriptName === 'ssh-gen') {
  // Auto-run generate command
  process.argv.splice(2, 0, 'generate');
} else if (scriptName === 'ssh-copy') {
  // Auto-run copy command
  process.argv.splice(2, 0, 'copy');
} else if (scriptName === 'ssh-list') {
  // Auto-run list command
  process.argv.splice(2, 0, 'list');
}

// Run setup and parse command line arguments
(async () => {
  await ensureSetup();

  // Parse command line arguments
  program.parse();

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
})();
