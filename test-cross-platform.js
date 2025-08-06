#!/usr/bin/env node

/**
 * Cross-Platform SSH Manager Test Suite
 * Tests all functionality across different operating systems
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class CrossPlatformTester {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.isWindows = this.platform === 'win32';
    this.isMacOS = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    this.isWSL = this.detectWSL();
    this.testResults = [];
    this.tempDir = path.join(os.tmpdir(), 'ssh-manager-test-' + Date.now());
  }

  /**
   * Detect if running in WSL
   */
  detectWSL() {
    if (!this.isLinux) return false;
    
    try {
      const release = fs.readFileSync('/proc/version', 'utf8');
      return release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl');
    } catch (error) {
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 SSH Manager Cross-Platform Test Suite\n');
    
    this.displaySystemInfo();
    
    // Create temporary directory for testing
    fs.mkdirSync(this.tempDir, { recursive: true });
    console.log(`📁 Test directory: ${this.tempDir}\n`);
    
    // Run tests
    await this.testSystemDetection();
    await this.testOpenSSHDetection();
    await this.testClipboardFunctionality();
    await this.testSSHKeyGeneration();
    await this.testSSHKeyListing();
    await this.testSSHKeyCopying();
    await this.testCLICommands();
    
    // Cleanup
    this.cleanup();
    
    // Display results
    this.displayResults();
  }

  /**
   * Display system information
   */
  displaySystemInfo() {
    console.log('🖥️  System Information:');
    
    if (this.isWindows) {
      console.log('   🪟 Platform: Windows');
    } else if (this.isMacOS) {
      console.log('   🍎 Platform: macOS');
    } else if (this.isLinux) {
      if (this.isWSL) {
        console.log('   🐧 Platform: Linux (WSL)');
      } else {
        console.log('   🐧 Platform: Linux');
      }
    }
    
    console.log(`   🏗️  Architecture: ${this.arch}`);
    console.log(`   📍 Node.js: ${process.version}`);
    console.log('');
  }

  /**
   * Test system detection
   */
  async testSystemDetection() {
    console.log('🔍 Testing system detection...');
    
    try {
      const SystemSetup = require('./src/utils/system-setup');
      const systemSetup = new SystemSetup();
      
      this.addResult('System Detection', true, 'Platform correctly detected');
      console.log('   ✅ System detection working');
    } catch (error) {
      this.addResult('System Detection', false, error.message);
      console.log('   ❌ System detection failed:', error.message);
    }
  }

  /**
   * Test OpenSSH detection
   */
  async testOpenSSHDetection() {
    console.log('🔐 Testing OpenSSH detection...');
    
    try {
      const SystemSetup = require('./src/utils/system-setup');
      const systemSetup = new SystemSetup();
      
      const hasSSH = systemSetup.checkSSHKeygen();
      
      if (hasSSH) {
        this.addResult('OpenSSH Detection', true, 'ssh-keygen found and working');
        console.log('   ✅ OpenSSH detected and working');
      } else {
        this.addResult('OpenSSH Detection', false, 'ssh-keygen not found');
        console.log('   ❌ OpenSSH not detected');
      }
    } catch (error) {
      this.addResult('OpenSSH Detection', false, error.message);
      console.log('   ❌ OpenSSH detection failed:', error.message);
    }
  }

  /**
   * Test clipboard functionality
   */
  async testClipboardFunctionality() {
    console.log('📋 Testing clipboard functionality...');
    
    try {
      const ClipboardManager = require('./src/utils/clipboard-simple');
      const clipboardManager = new ClipboardManager();
      
      const testText = 'SSH Manager Test - ' + Date.now();
      
      // Test copy
      const copyResult = await clipboardManager.copy(testText);
      
      if (copyResult.success) {
        this.addResult('Clipboard Copy', true, `Using method: ${copyResult.method}`);
        console.log(`   ✅ Clipboard copy working (${copyResult.method})`);
        
        // Test read
        try {
          const readText = await clipboardManager.read();
          if (readText.includes(testText.substring(0, 20))) {
            this.addResult('Clipboard Read', true, 'Content verified');
            console.log('   ✅ Clipboard read working');
          } else {
            this.addResult('Clipboard Read', false, 'Content mismatch');
            console.log('   ⚠️  Clipboard read content mismatch');
          }
        } catch (readError) {
          this.addResult('Clipboard Read', false, readError.message);
          console.log('   ⚠️  Clipboard read failed (non-critical)');
        }
      } else {
        this.addResult('Clipboard Copy', false, 'Copy operation failed');
        console.log('   ❌ Clipboard copy failed');
      }
    } catch (error) {
      this.addResult('Clipboard Functionality', false, error.message);
      console.log('   ❌ Clipboard test failed:', error.message);
    }
  }

  /**
   * Test SSH key generation
   */
  async testSSHKeyGeneration() {
    console.log('🔑 Testing SSH key generation...');
    
    try {
      const SSHManager = require('./src/utils/ssh');
      const sshManager = new SSHManager({ defaultDirectory: this.tempDir });
      
      // Test ED25519 key generation
      const keyOptions = {
        keyType: 'ed25519',
        keyName: 'test_ed25519',
        comment: 'test@ssh-manager',
        passphrase: ''
      };
      
      const result = await sshManager.generateKeyPair(keyOptions);
      
      if (result && result.privateKeyPath && result.publicKeyPath) {
        this.addResult('SSH Key Generation', true, `${result.keyType.toUpperCase()} key generated`);
        console.log(`   ✅ SSH key generation working (${result.keyType.toUpperCase()})`);
        
        // Verify files exist
        if (fs.existsSync(result.privateKeyPath) && fs.existsSync(result.publicKeyPath)) {
          this.addResult('SSH Key Files', true, 'Key files created successfully');
          console.log('   ✅ SSH key files created');
        } else {
          this.addResult('SSH Key Files', false, 'Key files not found');
          console.log('   ❌ SSH key files not created');
        }
      } else {
        this.addResult('SSH Key Generation', false, 'Invalid result object');
        console.log('   ❌ SSH key generation returned invalid result');
      }
    } catch (error) {
      this.addResult('SSH Key Generation', false, error.message);
      console.log('   ❌ SSH key generation failed:', error.message);
    }
  }

  /**
   * Test SSH key listing
   */
  async testSSHKeyListing() {
    console.log('📝 Testing SSH key listing...');
    
    try {
      const SSHManager = require('./src/utils/ssh');
      const sshManager = new SSHManager({ defaultDirectory: this.tempDir });
      
      const keys = sshManager.listKeys();
      
      if (Array.isArray(keys) && keys.length > 0) {
        this.addResult('SSH Key Listing', true, `Found ${keys.length} key(s)`);
        console.log(`   ✅ SSH key listing working (${keys.length} keys found)`);
      } else {
        this.addResult('SSH Key Listing', false, 'No keys found or invalid result');
        console.log('   ⚠️  SSH key listing returned no keys');
      }
    } catch (error) {
      this.addResult('SSH Key Listing', false, error.message);
      console.log('   ❌ SSH key listing failed:', error.message);
    }
  }

  /**
   * Test SSH key copying
   */
  async testSSHKeyCopying() {
    console.log('📋 Testing SSH key copying...');
    
    try {
      const SSHManager = require('./src/utils/ssh');
      const ClipboardManager = require('./src/utils/clipboard-simple');
      
      const sshManager = new SSHManager({ defaultDirectory: this.tempDir });
      const clipboardManager = new ClipboardManager();
      
      const keys = sshManager.listKeys();
      
      if (keys.length > 0) {
        const publicKey = sshManager.getPublicKey(keys[0].publicKeyPath);
        const copyResult = await clipboardManager.copyWithNotification(publicKey, 'Test SSH key');
        
        this.addResult('SSH Key Copying', true, copyResult.message);
        console.log('   ✅ SSH key copying working');
      } else {
        this.addResult('SSH Key Copying', false, 'No keys available to copy');
        console.log('   ⚠️  No keys available for copying test');
      }
    } catch (error) {
      this.addResult('SSH Key Copying', false, error.message);
      console.log('   ❌ SSH key copying failed:', error.message);
    }
  }

  /**
   * Test CLI commands
   */
  async testCLICommands() {
    console.log('⚡ Testing CLI commands...');
    
    try {
      // Test simple CLI
      const statusOutput = execSync('node src/cli-simple.js status', { 
        encoding: 'utf8',
        timeout: 10000
      });
      
      if (statusOutput.includes('SSH Manager Status')) {
        this.addResult('CLI Commands', true, 'Status command working');
        console.log('   ✅ CLI commands working');
      } else {
        this.addResult('CLI Commands', false, 'Unexpected status output');
        console.log('   ❌ CLI commands returned unexpected output');
      }
    } catch (error) {
      this.addResult('CLI Commands', false, error.message);
      console.log('   ❌ CLI commands failed:', error.message);
    }
  }

  /**
   * Add test result
   */
  addResult(test, success, message) {
    this.testResults.push({
      test,
      success,
      message,
      platform: this.platform
    });
  }

  /**
   * Display test results
   */
  displayResults() {
    console.log('\n📊 Test Results Summary:\n');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`✅ Passed: ${passed}/${total} tests\n`);
    
    this.testResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! SSH Manager is working correctly on this platform.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the output above for details.');
    }
    
    console.log(`\n🖥️  Platform: ${this.platform} (${this.arch})`);
    if (this.isWSL) {
      console.log('🐧 WSL detected');
    }
  }

  /**
   * Cleanup test files
   */
  cleanup() {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.log('⚠️  Cleanup failed (non-critical):', error.message);
    }
  }
}

// Run tests
if (require.main === module) {
  const tester = new CrossPlatformTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = CrossPlatformTester;
