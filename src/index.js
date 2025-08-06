#!/usr/bin/env node

/**
 * SSH Manager - Main Entry Point
 * Professional SSH key management with automatic setup
 */

const SSHManager = require('./utils/ssh');
const ClipboardManager = require('./utils/clipboard-simple');
const SystemSetup = require('./utils/system-setup');
const Validator = require('./utils/validator');

// Export main classes for programmatic use
module.exports = {
  SSHManager,
  ClipboardManager,
  SystemSetup,
  Validator,
  
  // Convenience methods
  async generateKey(options = {}) {
    const sshManager = new SSHManager();
    return await sshManager.generateKeyPair(options);
  },
  
  async listKeys() {
    const sshManager = new SSHManager();
    return sshManager.listKeys();
  },
  
  async copyKey(keyName) {
    const sshManager = new SSHManager();
    const clipboardManager = new ClipboardManager();
    
    const keys = sshManager.listKeys();
    const key = keyName 
      ? keys.find(k => k.name === keyName)
      : keys[0];
      
    if (!key) {
      throw new Error('No SSH key found');
    }
    
    const publicKey = sshManager.getPublicKey(key.publicKeyPath);
    return await clipboardManager.copyWithNotification(publicKey, 'SSH public key');
  },
  
  async setupSystem() {
    const systemSetup = new SystemSetup();
    return await systemSetup.setupSystem();
  }
};

// If called directly, run CLI
if (require.main === module) {
  require('./cli-simple');
}
