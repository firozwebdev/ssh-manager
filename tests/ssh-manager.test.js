const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const SSHManager = require('../src/utils/ssh');
const ClipboardManager = require('../src/utils/clipboard');
const Validator = require('../src/utils/validator');

describe('SSH Manager', () => {
  let tempDir;
  let sshManager;

  beforeEach(() => {
    // Create temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-test-'));
    sshManager = new SSHManager({ defaultDirectory: tempDir });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
  });

  describe('SSH Key Generation', () => {
    test('should generate RSA key pair', async () => {
      const options = {
        keyType: 'rsa',
        keySize: 2048,
        keyName: 'test_rsa',
        comment: 'test@example.com'
      };

      const result = await sshManager.generateKeyPair(options);

      expect(result).toHaveProperty('privateKeyPath');
      expect(result).toHaveProperty('publicKeyPath');
      expect(result.keyType).toBe('rsa');
      expect(result.keySize).toBe(2048);
      expect(fs.existsSync(result.privateKeyPath)).toBe(true);
      expect(fs.existsSync(result.publicKeyPath)).toBe(true);
    });

    test('should generate Ed25519 key pair', async () => {
      const options = {
        keyType: 'ed25519',
        keyName: 'test_ed25519',
        comment: 'test@example.com'
      };

      const result = await sshManager.generateKeyPair(options);

      expect(result.keyType).toBe('ed25519');
      expect(fs.existsSync(result.privateKeyPath)).toBe(true);
      expect(fs.existsSync(result.publicKeyPath)).toBe(true);
    });

    test('should fail when key already exists without overwrite', async () => {
      const options = {
        keyType: 'rsa',
        keyName: 'test_existing',
        overwrite: false
      };

      // Generate first key
      await sshManager.generateKeyPair(options);

      // Try to generate again without overwrite
      await expect(sshManager.generateKeyPair(options)).rejects.toThrow('Key already exists');
    });

    test('should overwrite existing key when overwrite is true', async () => {
      const options = {
        keyType: 'rsa',
        keyName: 'test_overwrite',
        overwrite: false
      };

      // Generate first key
      const first = await sshManager.generateKeyPair(options);
      const firstContent = fs.readFileSync(first.publicKeyPath, 'utf8');

      // Generate again with overwrite
      options.overwrite = true;
      const second = await sshManager.generateKeyPair(options);
      const secondContent = fs.readFileSync(second.publicKeyPath, 'utf8');

      expect(firstContent).not.toBe(secondContent);
    });
  });

  describe('Key Management', () => {
    beforeEach(async () => {
      // Generate test keys
      await sshManager.generateKeyPair({ keyType: 'rsa', keyName: 'test_rsa' });
      await sshManager.generateKeyPair({ keyType: 'ed25519', keyName: 'test_ed25519' });
    });

    test('should list all keys', () => {
      const keys = sshManager.listKeys();

      expect(keys).toHaveLength(2);
      expect(keys.map(k => k.name)).toContain('test_rsa');
      expect(keys.map(k => k.name)).toContain('test_ed25519');
    });

    test('should get public key content', () => {
      const keys = sshManager.listKeys();
      const rsaKey = keys.find(k => k.name === 'test_rsa');

      const publicKey = sshManager.getPublicKey(rsaKey.publicKeyPath);

      expect(publicKey).toMatch(/^ssh-rsa /);
      expect(publicKey.length).toBeGreaterThan(100);
    });

    test('should delete key pair', () => {
      const result = sshManager.deleteKey('test_rsa');

      expect(result.deleted).toContain('private');
      expect(result.deleted).toContain('public');
      expect(result.keyName).toBe('test_rsa');

      const keys = sshManager.listKeys();
      expect(keys.map(k => k.name)).not.toContain('test_rsa');
    });

    test('should detect key type from public key', () => {
      const keys = sshManager.listKeys();
      const rsaKey = keys.find(k => k.name === 'test_rsa');
      const ed25519Key = keys.find(k => k.name === 'test_ed25519');

      expect(rsaKey.type).toBe('rsa');
      expect(ed25519Key.type).toBe('ed25519');
    });
  });
});

describe('Clipboard Manager', () => {
  let clipboardManager;

  beforeEach(() => {
    clipboardManager = new ClipboardManager();
  });

  describe('SSH Key Validation', () => {
    test('should identify valid RSA public key', () => {
      const rsaKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vbqajDhA... user@host';
      
      expect(clipboardManager.isSSHKey(rsaKey)).toBe(true);
      expect(clipboardManager.detectKeyType(rsaKey)).toBe('RSA');
    });

    test('should identify valid Ed25519 public key', () => {
      const ed25519Key = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGbM8... user@host';
      
      expect(clipboardManager.isSSHKey(ed25519Key)).toBe(true);
      expect(clipboardManager.detectKeyType(ed25519Key)).toBe('Ed25519');
    });

    test('should reject invalid key format', () => {
      const invalidKey = 'not-a-ssh-key';
      
      expect(clipboardManager.isSSHKey(invalidKey)).toBe(false);
    });

    test('should handle empty or null input', () => {
      expect(clipboardManager.isSSHKey('')).toBe(false);
      expect(clipboardManager.isSSHKey(null)).toBe(false);
      expect(clipboardManager.isSSHKey(undefined)).toBe(false);
    });
  });
});

describe('Validator', () => {
  describe('Key Name Validation', () => {
    test('should accept valid key names', () => {
      const validNames = ['id_rsa', 'my-key', 'key_2024', 'work_laptop'];
      
      validNames.forEach(name => {
        const result = Validator.validateKeyName(name);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject invalid key names', () => {
      const invalidNames = ['', 'key<test>', 'key/test', 'key:test'];
      
      invalidNames.forEach(name => {
        const result = Validator.validateKeyName(name);
        expect(result.valid).toBe(false);
      });
    });

    test('should sanitize key names', () => {
      expect(Validator.sanitizeKeyName('key<test>')).toBe('key_test_');
      expect(Validator.sanitizeKeyName('')).toBe('id_rsa');
      expect(Validator.sanitizeKeyName('  .test.  ')).toBe('test');
    });
  });

  describe('Key Type Validation', () => {
    test('should accept supported key types', () => {
      const validTypes = ['rsa', 'ed25519', 'ecdsa'];
      
      validTypes.forEach(type => {
        const result = Validator.validateKeyType(type);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject unsupported key types', () => {
      const invalidTypes = ['dsa', 'invalid', ''];
      
      invalidTypes.forEach(type => {
        const result = Validator.validateKeyType(type);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Key Size Validation', () => {
    test('should accept valid RSA key sizes', () => {
      const validSizes = [2048, 3072, 4096];
      
      validSizes.forEach(size => {
        const result = Validator.validateKeySize(size, 'rsa');
        expect(result.valid).toBe(true);
      });
    });

    test('should reject invalid RSA key sizes', () => {
      const invalidSizes = [1024, 5120, 8192];
      
      invalidSizes.forEach(size => {
        const result = Validator.validateKeySize(size, 'rsa');
        expect(result.valid).toBe(false);
      });
    });

    test('should accept valid ECDSA key sizes', () => {
      const validSizes = [256, 384, 521];
      
      validSizes.forEach(size => {
        const result = Validator.validateKeySize(size, 'ecdsa');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('SSH Public Key Validation', () => {
    test('should validate correct SSH public key format', () => {
      const validKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vbqajDhA user@host';
      
      const result = Validator.validateSSHPublicKey(validKey);
      expect(result.valid).toBe(true);
      expect(result.keyType).toBe('rsa');
    });

    test('should reject invalid SSH public key format', () => {
      const invalidKeys = [
        'not-a-key',
        'ssh-rsa',
        'ssh-rsa short',
        ''
      ];
      
      invalidKeys.forEach(key => {
        const result = Validator.validateSSHPublicKey(key);
        expect(result.valid).toBe(false);
      });
    });
  });
});
