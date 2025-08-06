const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class SSHManager {
  constructor(config = {}) {
    this.config = {
      defaultKeyType: 'rsa',
      defaultKeySize: 4096,
      defaultDirectory: path.join(os.homedir(), '.ssh'),
      ...config
    };

    // Resolve tilde in directory path
    if (this.config.defaultDirectory.startsWith('~')) {
      this.config.defaultDirectory = path.join(os.homedir(), this.config.defaultDirectory.slice(2));
    }

    this.ensureSSHDirectory();
  }

  /**
   * Ensure SSH directory exists with proper permissions
   */
  ensureSSHDirectory() {
    try {
      if (!fs.existsSync(this.config.defaultDirectory)) {
        fs.mkdirSync(this.config.defaultDirectory, { recursive: true });
        // Set proper permissions (700) on Unix systems
        if (process.platform !== 'win32') {
          fs.chmodSync(this.config.defaultDirectory, 0o700);
        }
      }
    } catch (error) {
      throw new Error(`Failed to create SSH directory: ${error.message}`);
    }
  }

  /**
   * Generate SSH key pair
   */
  async generateKeyPair(options = {}) {
    const {
      keyType = this.config.defaultKeyType,
      keySize = this.config.defaultKeySize,
      keyName = 'id_' + keyType,
      comment = `${os.userInfo().username}@${os.hostname()}`,
      passphrase = '',
      overwrite = false
    } = options;

    const privateKeyPath = path.join(this.config.defaultDirectory, keyName);
    const publicKeyPath = `${privateKeyPath}.pub`;

    // Check if key already exists
    if (fs.existsSync(privateKeyPath) && !overwrite) {
      throw new Error(`Key already exists: ${privateKeyPath}. Use overwrite option to replace.`);
    }

    try {
      // Validate key type and size
      this.validateKeyParameters(keyType, keySize);

      // Build ssh-keygen command
      const command = this.buildSSHKeygenCommand({
        keyType,
        keySize,
        privateKeyPath,
        comment,
        passphrase
      });

      // Execute ssh-keygen
      execSync(command, { 
        stdio: 'pipe',
        timeout: 30000 
      });

      // Set proper permissions
      if (process.platform !== 'win32') {
        fs.chmodSync(privateKeyPath, 0o600);
        fs.chmodSync(publicKeyPath, 0o644);
      }

      // Verify key generation
      if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
        throw new Error('Key generation failed - files not created');
      }

      return {
        privateKeyPath,
        publicKeyPath,
        keyType,
        keySize,
        fingerprint: await this.getKeyFingerprint(publicKeyPath)
      };

    } catch (error) {
      throw new Error(`SSH key generation failed: ${error.message}`);
    }
  }

  /**
   * Build ssh-keygen command based on parameters
   */
  buildSSHKeygenCommand({ keyType, keySize, privateKeyPath, comment, passphrase }) {
    let command = `ssh-keygen -t ${keyType}`;
    
    // Add key size for RSA and ECDSA
    if (keyType === 'rsa' || keyType === 'ecdsa') {
      command += ` -b ${keySize}`;
    }
    
    command += ` -f "${privateKeyPath}"`;
    command += ` -C "${comment}"`;
    
    // Handle passphrase
    if (passphrase) {
      command += ` -N "${passphrase}"`;
    } else {
      command += ` -N ""`;
    }

    return command;
  }

  /**
   * Validate key type and size parameters
   */
  validateKeyParameters(keyType, keySize) {
    const supportedTypes = ['rsa', 'ed25519', 'ecdsa'];
    if (!supportedTypes.includes(keyType)) {
      throw new Error(`Unsupported key type: ${keyType}. Supported: ${supportedTypes.join(', ')}`);
    }

    if (keyType === 'rsa' && ![2048, 3072, 4096].includes(keySize)) {
      throw new Error(`Invalid RSA key size: ${keySize}. Supported: 2048, 3072, 4096`);
    }

    if (keyType === 'ecdsa' && ![256, 384, 521].includes(keySize)) {
      throw new Error(`Invalid ECDSA key size: ${keySize}. Supported: 256, 384, 521`);
    }
  }

  /**
   * Get public key content
   */
  getPublicKey(keyPath) {
    try {
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Public key not found: ${keyPath}`);
      }
      
      return fs.readFileSync(keyPath, 'utf8').trim();
    } catch (error) {
      throw new Error(`Failed to read public key: ${error.message}`);
    }
  }

  /**
   * Get key fingerprint
   */
  async getKeyFingerprint(keyPath) {
    try {
      const result = execSync(`ssh-keygen -lf "${keyPath}"`, { 
        encoding: 'utf8',
        timeout: 10000 
      });
      
      return result.trim().split(' ')[1]; // Extract fingerprint
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * List all SSH keys in the directory
   */
  listKeys() {
    try {
      const files = fs.readdirSync(this.config.defaultDirectory);
      const keys = [];

      for (const file of files) {
        if (file.endsWith('.pub')) {
          const publicKeyPath = path.join(this.config.defaultDirectory, file);
          const privateKeyPath = publicKeyPath.replace('.pub', '');
          
          const stats = fs.statSync(publicKeyPath);
          const publicKey = this.getPublicKey(publicKeyPath);
          
          keys.push({
            name: file.replace('.pub', ''),
            publicKeyPath,
            privateKeyPath,
            exists: fs.existsSync(privateKeyPath),
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: this.detectKeyType(publicKey),
            fingerprint: null // Will be populated async if needed
          });
        }
      }

      return keys;
    } catch (error) {
      throw new Error(`Failed to list keys: ${error.message}`);
    }
  }

  /**
   * Detect key type from public key content
   */
  detectKeyType(publicKey) {
    if (publicKey.startsWith('ssh-rsa')) return 'rsa';
    if (publicKey.startsWith('ssh-ed25519')) return 'ed25519';
    if (publicKey.startsWith('ecdsa-sha2-')) return 'ecdsa';
    return 'unknown';
  }

  /**
   * Delete SSH key pair
   */
  deleteKey(keyName) {
    const privateKeyPath = path.join(this.config.defaultDirectory, keyName);
    const publicKeyPath = `${privateKeyPath}.pub`;

    try {
      let deleted = [];
      
      if (fs.existsSync(privateKeyPath)) {
        fs.unlinkSync(privateKeyPath);
        deleted.push('private');
      }
      
      if (fs.existsSync(publicKeyPath)) {
        fs.unlinkSync(publicKeyPath);
        deleted.push('public');
      }

      if (deleted.length === 0) {
        throw new Error(`Key not found: ${keyName}`);
      }

      return { deleted, keyName };
    } catch (error) {
      throw new Error(`Failed to delete key: ${error.message}`);
    }
  }

  /**
   * Backup SSH keys
   */
  async backupKeys(backupPath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(backupPath, `ssh-backup-${timestamp}`);

      // Create backup directory
      fs.mkdirSync(backupDir, { recursive: true });

      // Copy SSH directory contents
      const files = fs.readdirSync(this.config.defaultDirectory);
      for (const file of files) {
        const srcPath = path.join(this.config.defaultDirectory, file);
        const destPath = path.join(backupDir, file);
        fs.copyFileSync(srcPath, destPath);
      }

      return backupDir;
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }
}

module.exports = SSHManager;
