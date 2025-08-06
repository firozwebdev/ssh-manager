#!/usr/bin/env node

/**
 * Test script to verify npm package is ready for publishing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NPMPackageTest {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.total = 0;
  }

  /**
   * Run all package tests
   */
  async runTests() {
    console.log('📦 Testing NPM Package Readiness\n');

    // Test package.json
    this.testPackageJson();
    
    // Test required files
    this.testRequiredFiles();
    
    // Test entry points
    this.testEntryPoints();
    
    // Test CLI commands
    this.testCLICommands();
    
    // Test package size
    this.testPackageSize();
    
    // Test dependencies
    this.testDependencies();
    
    // Display results
    this.displayResults();
  }

  /**
   * Test package.json configuration
   */
  testPackageJson() {
    console.log('🔍 Testing package.json...');
    
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Required fields
      this.checkField(pkg, 'name', '@ssh-tools/ssh-manager');
      this.checkField(pkg, 'version');
      this.checkField(pkg, 'description');
      this.checkField(pkg, 'main', 'src/index.js');
      this.checkField(pkg, 'license', 'MIT');
      this.checkField(pkg, 'author');
      
      // Binary configuration
      if (pkg.bin && pkg.bin.sshm) {
        this.pass('Binary command configured');
      } else {
        this.fail('Binary command not configured');
      }
      
      // Keywords
      if (pkg.keywords && pkg.keywords.length > 5) {
        this.pass('Keywords present');
      } else {
        this.warn('Add more keywords for better discoverability');
      }
      
      // Repository
      if (pkg.repository && pkg.repository.url) {
        this.pass('Repository URL configured');
      } else {
        this.warn('Repository URL missing');
      }
      
    } catch (error) {
      this.fail(`package.json error: ${error.message}`);
    }
  }

  /**
   * Test required files exist
   */
  testRequiredFiles() {
    console.log('📁 Testing required files...');
    
    const requiredFiles = [
      'README.md',
      'LICENSE',
      'CHANGELOG.md',
      'src/index.js',
      'src/cli-simple.js',
      'auto-setup.js'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.pass(`${file} exists`);
      } else {
        this.fail(`${file} missing`);
      }
    }
    
    // Check .npmignore
    if (fs.existsSync('.npmignore')) {
      this.pass('.npmignore configured');
    } else {
      this.warn('.npmignore missing - may include unnecessary files');
    }
  }

  /**
   * Test entry points work
   */
  testEntryPoints() {
    console.log('🎯 Testing entry points...');
    
    try {
      // Test main entry point
      const mainModule = require('./src/index.js');
      if (typeof mainModule === 'object') {
        this.pass('Main module exports object');
      }
      
      if (mainModule.SSHManager) {
        this.pass('SSHManager class exported');
      } else {
        this.fail('SSHManager class not exported');
      }
      
      if (mainModule.ClipboardManager) {
        this.pass('ClipboardManager class exported');
      } else {
        this.fail('ClipboardManager class not exported');
      }
      
    } catch (error) {
      this.fail(`Entry point error: ${error.message}`);
    }
  }

  /**
   * Test CLI commands
   */
  testCLICommands() {
    console.log('⚡ Testing CLI commands...');
    
    try {
      // Test CLI script exists and is executable
      const cliPath = 'src/cli-simple.js';
      const stats = fs.statSync(cliPath);
      
      if (stats.mode & parseInt('111', 8)) {
        this.pass('CLI script is executable');
      } else {
        this.warn('CLI script may not be executable on Unix systems');
      }
      
      // Test CLI help
      try {
        execSync('node src/cli-simple.js --help', { stdio: 'pipe' });
        this.pass('CLI help command works');
      } catch (error) {
        this.warn('CLI help command failed');
      }
      
      // Test CLI status
      try {
        execSync('node src/cli-simple.js status', { stdio: 'pipe' });
        this.pass('CLI status command works');
      } catch (error) {
        this.warn('CLI status command failed');
      }
      
    } catch (error) {
      this.fail(`CLI test error: ${error.message}`);
    }
  }

  /**
   * Test package size
   */
  testPackageSize() {
    console.log('📏 Testing package size...');
    
    try {
      // Run npm pack dry run to check size
      const result = execSync('npm pack --dry-run', { encoding: 'utf8' });
      
      // Extract size information
      const lines = result.split('\n');
      const sizeLine = lines.find(line => line.includes('package size:'));
      
      if (sizeLine) {
        const sizeMatch = sizeLine.match(/(\d+\.?\d*)\s*(kB|MB)/);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[2];
          
          if (unit === 'kB' && size < 500) {
            this.pass(`Package size acceptable: ${size}${unit}`);
          } else if (unit === 'MB' && size < 5) {
            this.pass(`Package size acceptable: ${size}${unit}`);
          } else {
            this.warn(`Package size large: ${size}${unit}`);
          }
        }
      }
      
      // Check file count
      const fileLines = lines.filter(line => line.match(/^\d+\s+/));
      if (fileLines.length < 50) {
        this.pass(`File count reasonable: ${fileLines.length} files`);
      } else {
        this.warn(`Many files included: ${fileLines.length} files`);
      }
      
    } catch (error) {
      this.warn(`Package size check failed: ${error.message}`);
    }
  }

  /**
   * Test dependencies
   */
  testDependencies() {
    console.log('📦 Testing dependencies...');
    
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Check for minimal dependencies
      const depCount = Object.keys(pkg.dependencies || {}).length;
      if (depCount < 10) {
        this.pass(`Minimal dependencies: ${depCount} packages`);
      } else {
        this.warn(`Many dependencies: ${depCount} packages`);
      }
      
      // Check for dev dependencies
      const devDepCount = Object.keys(pkg.devDependencies || {}).length;
      if (devDepCount > 0) {
        this.pass(`Dev dependencies present: ${devDepCount} packages`);
      }
      
      // Check for security vulnerabilities
      try {
        execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
        this.pass('No security vulnerabilities found');
      } catch (error) {
        this.warn('Security vulnerabilities detected - run npm audit');
      }
      
    } catch (error) {
      this.fail(`Dependency test error: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */
  checkField(obj, field, expectedValue = null) {
    this.total++;
    
    if (obj[field]) {
      if (expectedValue && obj[field] !== expectedValue) {
        this.fail(`${field}: expected "${expectedValue}", got "${obj[field]}"`);
      } else {
        this.pass(`${field}: ${obj[field]}`);
      }
    } else {
      this.fail(`${field} missing`);
    }
  }

  pass(message) {
    console.log(`   ✅ ${message}`);
    this.passed++;
    this.total++;
  }

  fail(message) {
    console.log(`   ❌ ${message}`);
    this.errors.push(message);
    this.total++;
  }

  warn(message) {
    console.log(`   ⚠️  ${message}`);
    this.warnings.push(message);
  }

  /**
   * Display test results
   */
  displayResults() {
    console.log('\n📊 Test Results Summary:\n');
    
    console.log(`✅ Passed: ${this.passed}/${this.total} tests`);
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${this.warnings.length}`);
    }
    
    if (this.errors.length > 0) {
      console.log(`❌ Errors: ${this.errors.length}`);
    }
    
    console.log('');
    
    if (this.errors.length === 0) {
      console.log('🎉 Package is ready for publishing!');
      console.log('');
      console.log('📦 Next steps:');
      console.log('   1. npm login');
      console.log('   2. npm publish --access public');
      console.log('   3. Test installation: npm install -g @ssh-tools/ssh-manager');
    } else {
      console.log('🔧 Fix the following errors before publishing:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n💡 Consider addressing these warnings:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
  }
}

// Run tests
if (require.main === module) {
  const tester = new NPMPackageTest();
  tester.runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = NPMPackageTest;
