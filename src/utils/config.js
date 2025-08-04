const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.ssh-manager');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = require('../../config/default.json');
    this.config = null;
    
    this.ensureConfigDirectory();
    this.loadConfig();
  }

  /**
   * Ensure configuration directory exists
   */
  ensureConfigDirectory() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
        
        // Set proper permissions on Unix systems
        if (process.platform !== 'win32') {
          fs.chmodSync(this.configDir, 0o700);
        }
      }
    } catch (error) {
      throw new Error(`Failed to create config directory: ${error.message}`);
    }
  }

  /**
   * Load configuration from file or create default
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const userConfig = fs.readJsonSync(this.configFile);
        this.config = this.mergeConfig(this.defaultConfig, userConfig);
      } else {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
      }
    } catch (error) {
      console.warn(`Warning: Failed to load config, using defaults: ${error.message}`);
      this.config = { ...this.defaultConfig };
    }
  }

  /**
   * Deep merge configuration objects
   */
  mergeConfig(defaultConfig, userConfig) {
    const merged = { ...defaultConfig };
    
    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
          merged[key] = this.mergeConfig(defaultConfig[key] || {}, userConfig[key]);
        } else {
          merged[key] = userConfig[key];
        }
      }
    }
    
    return merged;
  }

  /**
   * Save configuration to file
   */
  saveConfig() {
    try {
      fs.writeJsonSync(this.configFile, this.config, { spaces: 2 });
      
      // Set proper permissions on Unix systems
      if (process.platform !== 'win32') {
        fs.chmodSync(this.configFile, 0o600);
      }
    } catch (error) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  /**
   * Get configuration value by path
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }

  /**
   * Set configuration value by path
   */
  set(path, value) {
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    this.saveConfig();
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Reset configuration to defaults
   */
  reset() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
  }

  /**
   * Get SSH directory path
   */
  getSSHDirectory() {
    const sshDir = this.get('ssh.defaultDirectory', '~/.ssh');
    return sshDir.startsWith('~') 
      ? path.join(os.homedir(), sshDir.slice(2))
      : sshDir;
  }

  /**
   * Set SSH directory path
   */
  setSSHDirectory(directory) {
    this.set('ssh.defaultDirectory', directory);
  }

  /**
   * Get supported key types
   */
  getSupportedKeyTypes() {
    return this.get('ssh.supportedKeyTypes', ['rsa', 'ed25519', 'ecdsa']);
  }

  /**
   * Get key sizes for a specific type
   */
  getKeySizes(keyType) {
    return this.get(`ssh.keySizes.${keyType}`, []);
  }

  /**
   * Get default key type
   */
  getDefaultKeyType() {
    return this.get('ssh.defaultKeyType', 'rsa');
  }

  /**
   * Set default key type
   */
  setDefaultKeyType(keyType) {
    const supported = this.getSupportedKeyTypes();
    if (!supported.includes(keyType)) {
      throw new Error(`Unsupported key type: ${keyType}. Supported: ${supported.join(', ')}`);
    }
    this.set('ssh.defaultKeyType', keyType);
  }

  /**
   * Get default key size
   */
  getDefaultKeySize() {
    return this.get('ssh.defaultKeySize', 4096);
  }

  /**
   * Set default key size
   */
  setDefaultKeySize(keySize) {
    this.set('ssh.defaultKeySize', keySize);
  }

  /**
   * Enable/disable colors
   */
  setColors(enabled) {
    this.set('ui.colors', enabled);
  }

  /**
   * Enable/disable animations
   */
  setAnimations(enabled) {
    this.set('ui.animations', enabled);
  }

  /**
   * Enable/disable verbose output
   */
  setVerbose(enabled) {
    this.set('ui.verbose', enabled);
  }

  /**
   * Get configuration file path
   */
  getConfigPath() {
    return this.configFile;
  }

  /**
   * Export configuration to file
   */
  exportConfig(filePath) {
    try {
      fs.writeJsonSync(filePath, this.config, { spaces: 2 });
      return filePath;
    } catch (error) {
      throw new Error(`Failed to export config: ${error.message}`);
    }
  }

  /**
   * Import configuration from file
   */
  importConfig(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Config file not found: ${filePath}`);
      }
      
      const importedConfig = fs.readJsonSync(filePath);
      this.config = this.mergeConfig(this.defaultConfig, importedConfig);
      this.saveConfig();
      
      return this.config;
    } catch (error) {
      throw new Error(`Failed to import config: ${error.message}`);
    }
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    
    // Validate SSH directory
    const sshDir = this.getSSHDirectory();
    if (!path.isAbsolute(sshDir) && !sshDir.startsWith('~')) {
      errors.push('SSH directory must be an absolute path or start with ~');
    }
    
    // Validate key type
    const keyType = this.getDefaultKeyType();
    const supportedTypes = this.getSupportedKeyTypes();
    if (!supportedTypes.includes(keyType)) {
      errors.push(`Invalid default key type: ${keyType}`);
    }
    
    // Validate key size
    const keySize = this.getDefaultKeySize();
    if (typeof keySize !== 'number' || keySize < 1024) {
      errors.push(`Invalid default key size: ${keySize}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = ConfigManager;
