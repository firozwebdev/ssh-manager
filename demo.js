#!/usr/bin/env node

const chalk = require('chalk');
const SSHManager = require('./src/utils/ssh');
const ClipboardManager = require('./src/utils/clipboard');
const path = require('path');
const os = require('os');

async function demo() {
  console.log(chalk.cyan.bold('\n🔐 SSH Manager Demo\n'));
  
  try {
    // Create a temporary SSH directory for demo
    const demoDir = path.join(os.tmpdir(), 'ssh-demo');
    const sshManager = new SSHManager({ defaultDirectory: demoDir });
    const clipboardManager = new ClipboardManager();

    console.log(chalk.yellow('📁 Demo SSH directory:'), demoDir);
    console.log();

    // Demo 1: Generate RSA key
    console.log(chalk.cyan('🔑 Generating RSA key...'));
    const rsaKey = await sshManager.generateKeyPair({
      keyType: 'rsa',
      keySize: 2048,
      keyName: 'demo_rsa',
      comment: 'demo@ssh-manager'
    });
    
    console.log(chalk.green('✓ RSA key generated:'));
    console.log(chalk.dim(`  Private: ${rsaKey.privateKeyPath}`));
    console.log(chalk.dim(`  Public:  ${rsaKey.publicKeyPath}`));
    console.log(chalk.dim(`  Fingerprint: ${rsaKey.fingerprint}`));
    console.log();

    // Demo 2: Generate Ed25519 key
    console.log(chalk.cyan('🔑 Generating Ed25519 key...'));
    const ed25519Key = await sshManager.generateKeyPair({
      keyType: 'ed25519',
      keyName: 'demo_ed25519',
      comment: 'demo@ssh-manager'
    });
    
    console.log(chalk.green('✓ Ed25519 key generated:'));
    console.log(chalk.dim(`  Private: ${ed25519Key.privateKeyPath}`));
    console.log(chalk.dim(`  Public:  ${ed25519Key.publicKeyPath}`));
    console.log();

    // Demo 3: List keys
    console.log(chalk.cyan('📋 Listing all keys...'));
    const keys = sshManager.listKeys();
    
    console.log(chalk.green(`✓ Found ${keys.length} keys:`));
    keys.forEach(key => {
      const status = key.exists ? chalk.green('✓') : chalk.red('✗');
      const keyType = chalk.cyan(key.type.toUpperCase().padEnd(8));
      console.log(`  ${status} ${keyType} ${key.name}`);
    });
    console.log();

    // Demo 4: Copy to clipboard
    console.log(chalk.cyan('📋 Testing clipboard functionality...'));
    const publicKey = sshManager.getPublicKey(rsaKey.publicKeyPath);
    
    try {
      const clipResult = await clipboardManager.copyWithNotification(publicKey, 'Demo RSA public key');
      console.log(chalk.green('✓'), clipResult.message);
      console.log(chalk.dim(`  Key length: ${clipResult.length} characters`));
      
      // Verify clipboard content
      const clipboardStatus = await clipboardManager.getStatus();
      if (clipboardStatus.isSSHKey) {
        console.log(chalk.green('✓ Clipboard contains valid SSH key'));
        console.log(chalk.dim(`  Key type: ${clipboardStatus.keyType}`));
      }
    } catch (error) {
      console.log(chalk.yellow('⚠ Clipboard test failed:'), error.message);
      console.log(chalk.dim('  This is normal in some environments (CI, headless systems)'));
    }
    console.log();

    // Demo 5: Key validation
    console.log(chalk.cyan('🔍 Testing key validation...'));
    const Validator = require('./src/utils/validator');
    
    const validationTests = [
      { name: 'valid-key-name', expected: true },
      { name: 'invalid<name>', expected: false },
      { name: '', expected: false }
    ];
    
    validationTests.forEach(test => {
      const result = Validator.validateKeyName(test.name);
      const status = result.valid === test.expected ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} Key name "${test.name}": ${result.valid ? 'valid' : 'invalid'}`);
    });
    console.log();

    // Demo 6: SSH key format validation
    console.log(chalk.cyan('🔍 Testing SSH key format validation...'));
    const sshKeyTests = [
      { key: publicKey, expected: true },
      { key: 'not-a-ssh-key', expected: false },
      { key: 'ssh-rsa short', expected: false }
    ];
    
    sshKeyTests.forEach((test, index) => {
      const result = Validator.validateSSHPublicKey(test.key);
      const status = result.valid === test.expected ? chalk.green('✓') : chalk.red('✗');
      const preview = test.key.length > 30 ? test.key.substring(0, 30) + '...' : test.key;
      console.log(`  ${status} SSH key ${index + 1}: ${result.valid ? 'valid' : 'invalid'} (${preview})`);
    });
    console.log();

    // Demo 7: Cleanup
    console.log(chalk.cyan('🧹 Cleaning up demo files...'));
    const fs = require('fs-extra');
    if (fs.existsSync(demoDir)) {
      fs.removeSync(demoDir);
      console.log(chalk.green('✓ Demo directory cleaned up'));
    }
    console.log();

    // Summary
    console.log(chalk.green.bold('🎉 Demo completed successfully!'));
    console.log();
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.dim('  1. Run: npm link (to install globally)'));
    console.log(chalk.dim('  2. Try: ssh-manager generate'));
    console.log(chalk.dim('  3. Try: ssh-manager copy'));
    console.log(chalk.dim('  4. Try: ssh-manager status'));
    console.log();

  } catch (error) {
    console.error(chalk.red('✗ Demo failed:'), error.message);
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demo();
}

module.exports = demo;
