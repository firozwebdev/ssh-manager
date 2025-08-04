#!/usr/bin/env node

// Working demo of SSH Manager functionality
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔐 SSH Manager - Working Demo\n');

async function runDemo() {
  try {
    // Import our modules
    const SSHManager = require('./src/utils/ssh');
    const ClipboardManager = require('./src/utils/clipboard-simple');
    const Validator = require('./src/utils/validator');

    // Create demo directory
    const demoDir = path.join(os.tmpdir(), 'ssh-demo-' + Date.now());
    console.log('📁 Demo directory:', demoDir);

    // Initialize managers
    const sshManager = new SSHManager({ defaultDirectory: demoDir });
    const clipboardManager = new ClipboardManager();

    console.log('\n1. 🔑 Generating RSA SSH Key...');
    const rsaKey = await sshManager.generateKeyPair({
      keyType: 'rsa',
      keySize: 2048,
      keyName: 'demo_rsa',
      comment: 'demo@ssh-manager',
      passphrase: ''
    });

    console.log('   ✓ RSA key generated successfully');
    console.log('   📄 Private key:', rsaKey.privateKeyPath);
    console.log('   📄 Public key:', rsaKey.publicKeyPath);
    console.log('   🔍 Fingerprint:', rsaKey.fingerprint);

    console.log('\n2. 🔑 Generating Ed25519 SSH Key...');
    const ed25519Key = await sshManager.generateKeyPair({
      keyType: 'ed25519',
      keyName: 'demo_ed25519',
      comment: 'demo@ssh-manager',
      passphrase: ''
    });

    console.log('   ✓ Ed25519 key generated successfully');
    console.log('   📄 Private key:', ed25519Key.privateKeyPath);
    console.log('   📄 Public key:', ed25519Key.publicKeyPath);

    console.log('\n3. 📋 Listing all generated keys...');
    const keys = sshManager.listKeys();
    console.log(`   ✓ Found ${keys.length} keys:`);
    
    keys.forEach(key => {
      const status = key.exists ? '✓' : '✗';
      console.log(`     ${status} ${key.type.toUpperCase().padEnd(8)} ${key.name}`);
      console.log(`       Created: ${key.created.toLocaleDateString()}`);
      console.log(`       Size: ${key.size} bytes`);
    });

    console.log('\n4. 📋 Reading public key content...');
    const publicKey = sshManager.getPublicKey(rsaKey.publicKeyPath);
    console.log('   ✓ Public key loaded');
    console.log('   📏 Length:', publicKey.length, 'characters');
    console.log('   🔍 Preview:', publicKey.substring(0, 50) + '...');

    console.log('\n5. ✅ Testing key validation...');
    
    // Test key name validation
    const nameTests = [
      { name: 'valid-key', expected: true },
      { name: 'invalid<key>', expected: false },
      { name: '', expected: false }
    ];

    nameTests.forEach(test => {
      const result = Validator.validateKeyName(test.name);
      const status = result.valid === test.expected ? '✓' : '✗';
      console.log(`   ${status} Key name "${test.name}": ${result.valid ? 'valid' : 'invalid'}`);
    });

    // Test SSH key format validation
    const keyFormatResult = Validator.validateSSHPublicKey(publicKey);
    console.log(`   ✓ SSH key format validation: ${keyFormatResult.valid ? 'PASS' : 'FAIL'}`);
    console.log(`   🔍 Detected key type: ${keyFormatResult.keyType}`);

    console.log('\n6. 📋 Testing clipboard functionality...');
    try {
      const clipResult = await clipboardManager.copyWithNotification(publicKey, 'Demo SSH key');
      console.log('   ✓ Clipboard copy successful');
      console.log('   📏 Copied length:', clipResult.length, 'characters');
      console.log('   🔧 Method used:', clipResult.method);
    } catch (clipError) {
      console.log('   ⚠ Clipboard copy failed (this is normal in some environments)');
      console.log('   📝 Error:', clipError.message);
    }

    console.log('\n7. 🗑️ Testing key deletion...');
    const deleteResult = sshManager.deleteKey('demo_ed25519');
    console.log('   ✓ Key deleted successfully');
    console.log('   🗑️ Deleted:', deleteResult.deleted.join(' and '), 'key(s)');

    // Verify deletion
    const remainingKeys = sshManager.listKeys();
    console.log(`   ✓ Remaining keys: ${remainingKeys.length}`);

    console.log('\n8. 🧹 Cleaning up demo files...');
    if (fs.existsSync(demoDir)) {
      fs.rmSync(demoDir, { recursive: true, force: true });
      console.log('   ✓ Demo directory cleaned up');
    }

    console.log('\n🎉 Demo completed successfully!\n');

    console.log('📖 How to use SSH Manager:');
    console.log('');
    console.log('1. Install globally:');
    console.log('   npm link');
    console.log('');
    console.log('2. Generate a new SSH key:');
    console.log('   node src/cli-simple.js generate');
    console.log('   node src/cli-simple.js gen -t ed25519 -n my-key');
    console.log('');
    console.log('3. Copy existing key to clipboard:');
    console.log('   node src/cli-simple.js copy');
    console.log('   node src/cli-simple.js cp -n my-key');
    console.log('');
    console.log('4. List all keys:');
    console.log('   node src/cli-simple.js list');
    console.log('   node src/cli-simple.js ls --detailed');
    console.log('');
    console.log('5. Check status:');
    console.log('   node src/cli-simple.js status');
    console.log('');
    console.log('6. Delete a key:');
    console.log('   node src/cli-simple.js delete -n old-key --force');
    console.log('');

    console.log('🔐 Features:');
    console.log('✓ Generate RSA, Ed25519, and ECDSA keys');
    console.log('✓ Automatic clipboard integration');
    console.log('✓ Cross-platform support (Windows, macOS, Linux)');
    console.log('✓ Comprehensive validation and error handling');
    console.log('✓ Secure file permissions');
    console.log('✓ Multiple key management');
    console.log('✓ Backup and restore capabilities');
    console.log('✓ Configuration management');
    console.log('');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the demo
runDemo();
