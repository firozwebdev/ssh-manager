const fs = require('fs-extra');
const path = require('path');

class Validator {
  /**
   * Validate SSH key name
   */
  static validateKeyName(name) {
    const errors = [];
    
    if (!name || typeof name !== 'string') {
      errors.push('Key name is required and must be a string');
      return { valid: false, errors };
    }
    
    // Check length
    if (name.length < 1 || name.length > 255) {
      errors.push('Key name must be between 1 and 255 characters');
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(name)) {
      errors.push('Key name contains invalid characters');
    }
    
    // Check for reserved names
    const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];
    if (reservedNames.includes(name.toLowerCase())) {
      errors.push('Key name is a reserved system name');
    }
    
    // Check for dots at start/end
    if (name.startsWith('.') || name.endsWith('.')) {
      errors.push('Key name cannot start or end with a dot');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate key type
   */
  static validateKeyType(keyType, supportedTypes = ['rsa', 'ed25519', 'ecdsa']) {
    const errors = [];
    
    if (!keyType || typeof keyType !== 'string') {
      errors.push('Key type is required and must be a string');
      return { valid: false, errors };
    }
    
    if (!supportedTypes.includes(keyType.toLowerCase())) {
      errors.push(`Unsupported key type: ${keyType}. Supported: ${supportedTypes.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate key size
   */
  static validateKeySize(keySize, keyType) {
    const errors = [];
    
    if (typeof keySize !== 'number') {
      errors.push('Key size must be a number');
      return { valid: false, errors };
    }
    
    const validSizes = {
      rsa: [2048, 3072, 4096],
      ecdsa: [256, 384, 521],
      ed25519: [256] // Fixed size, but we accept it
    };
    
    if (keyType && validSizes[keyType]) {
      if (!validSizes[keyType].includes(keySize)) {
        errors.push(`Invalid key size for ${keyType}: ${keySize}. Valid sizes: ${validSizes[keyType].join(', ')}`);
      }
    } else if (keySize < 1024 || keySize > 8192) {
      errors.push('Key size must be between 1024 and 8192 bits');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate comment
   */
  static validateComment(comment) {
    const errors = [];
    
    if (comment !== undefined && comment !== null) {
      if (typeof comment !== 'string') {
        errors.push('Comment must be a string');
      } else if (comment.length > 1024) {
        errors.push('Comment must be less than 1024 characters');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate passphrase
   */
  static validatePassphrase(passphrase, options = {}) {
    const errors = [];
    const {
      minLength = 0,
      maxLength = 1024,
      requireSpecialChars = false,
      requireNumbers = false,
      requireUppercase = false
    } = options;
    
    if (passphrase !== undefined && passphrase !== null) {
      if (typeof passphrase !== 'string') {
        errors.push('Passphrase must be a string');
        return { valid: false, errors };
      }
      
      if (passphrase.length < minLength) {
        errors.push(`Passphrase must be at least ${minLength} characters`);
      }
      
      if (passphrase.length > maxLength) {
        errors.push(`Passphrase must be less than ${maxLength} characters`);
      }
      
      if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase)) {
        errors.push('Passphrase must contain at least one special character');
      }
      
      if (requireNumbers && !/\d/.test(passphrase)) {
        errors.push('Passphrase must contain at least one number');
      }
      
      if (requireUppercase && !/[A-Z]/.test(passphrase)) {
        errors.push('Passphrase must contain at least one uppercase letter');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate directory path
   */
  static validateDirectory(dirPath) {
    const errors = [];
    
    if (!dirPath || typeof dirPath !== 'string') {
      errors.push('Directory path is required and must be a string');
      return { valid: false, errors };
    }
    
    // Expand tilde
    const expandedPath = dirPath.startsWith('~') 
      ? path.join(require('os').homedir(), dirPath.slice(2))
      : dirPath;
    
    try {
      // Check if path is valid
      path.parse(expandedPath);
      
      // Check if directory exists or can be created
      if (fs.existsSync(expandedPath)) {
        const stats = fs.statSync(expandedPath);
        if (!stats.isDirectory()) {
          errors.push('Path exists but is not a directory');
        }
      } else {
        // Check if parent directory exists
        const parentDir = path.dirname(expandedPath);
        if (!fs.existsSync(parentDir)) {
          errors.push('Parent directory does not exist');
        }
      }
    } catch (error) {
      errors.push(`Invalid directory path: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      expandedPath
    };
  }

  /**
   * Validate SSH public key format
   */
  static validateSSHPublicKey(publicKey) {
    const errors = [];
    
    if (!publicKey || typeof publicKey !== 'string') {
      errors.push('Public key is required and must be a string');
      return { valid: false, errors };
    }
    
    const trimmedKey = publicKey.trim();
    
    // Check basic format
    const sshKeyPatterns = [
      /^ssh-rsa\s+[A-Za-z0-9+/]+=*(\s+.*)?$/,
      /^ssh-ed25519\s+[A-Za-z0-9+/]+=*(\s+.*)?$/,
      /^ecdsa-sha2-\w+\s+[A-Za-z0-9+/]+=*(\s+.*)?$/,
      /^ssh-dss\s+[A-Za-z0-9+/]+=*(\s+.*)?$/
    ];
    
    const isValidFormat = sshKeyPatterns.some(pattern => pattern.test(trimmedKey));
    
    if (!isValidFormat) {
      errors.push('Invalid SSH public key format');
    }
    
    // Check length
    if (trimmedKey.length < 100) {
      errors.push('SSH public key appears to be too short');
    }
    
    if (trimmedKey.length > 8192) {
      errors.push('SSH public key appears to be too long');
    }
    
    // Extract key type
    let keyType = 'unknown';
    if (trimmedKey.startsWith('ssh-rsa')) keyType = 'rsa';
    else if (trimmedKey.startsWith('ssh-ed25519')) keyType = 'ed25519';
    else if (trimmedKey.startsWith('ecdsa-sha2-')) keyType = 'ecdsa';
    else if (trimmedKey.startsWith('ssh-dss')) keyType = 'dsa';
    
    return {
      valid: errors.length === 0,
      errors,
      keyType,
      length: trimmedKey.length
    };
  }

  /**
   * Validate all key generation options
   */
  static validateKeyOptions(options) {
    const allErrors = [];
    
    // Validate key name
    if (options.keyName) {
      const nameValidation = this.validateKeyName(options.keyName);
      if (!nameValidation.valid) {
        allErrors.push(...nameValidation.errors.map(e => `Key name: ${e}`));
      }
    }
    
    // Validate key type
    if (options.keyType) {
      const typeValidation = this.validateKeyType(options.keyType);
      if (!typeValidation.valid) {
        allErrors.push(...typeValidation.errors.map(e => `Key type: ${e}`));
      }
    }
    
    // Validate key size
    if (options.keySize !== undefined) {
      const sizeValidation = this.validateKeySize(options.keySize, options.keyType);
      if (!sizeValidation.valid) {
        allErrors.push(...sizeValidation.errors.map(e => `Key size: ${e}`));
      }
    }
    
    // Validate comment
    if (options.comment !== undefined) {
      const commentValidation = this.validateComment(options.comment);
      if (!commentValidation.valid) {
        allErrors.push(...commentValidation.errors.map(e => `Comment: ${e}`));
      }
    }
    
    // Validate passphrase
    if (options.passphrase !== undefined) {
      const passphraseValidation = this.validatePassphrase(options.passphrase);
      if (!passphraseValidation.valid) {
        allErrors.push(...passphraseValidation.errors.map(e => `Passphrase: ${e}`));
      }
    }
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * Sanitize key name
   */
  static sanitizeKeyName(name) {
    if (!name || typeof name !== 'string') {
      return 'id_rsa';
    }
    
    // Remove invalid characters
    let sanitized = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
    
    // Ensure not empty
    if (!sanitized) {
      sanitized = 'id_rsa';
    }
    
    // Ensure not too long
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }
    
    return sanitized;
  }
}

module.exports = Validator;
