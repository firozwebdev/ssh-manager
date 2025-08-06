#!/usr/bin/env node

/**
 * SSH Manager Publishing Script
 * Automates the npm publishing process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

class Publisher {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Main publishing workflow
   */
  async publish() {
    console.log('📦 SSH Manager - NPM Publishing\n');

    try {
      // Pre-publish checks
      await this.prePublishChecks();
      
      // Confirm publishing
      const confirmed = await this.confirmPublish();
      if (!confirmed) {
        console.log('❌ Publishing cancelled');
        return;
      }

      // Publish to npm
      await this.publishToNPM();
      
      // Post-publish tasks
      await this.postPublishTasks();

      console.log('\n🎉 Publishing completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Publishing failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Pre-publish checks
   */
  async prePublishChecks() {
    console.log('🔍 Running pre-publish checks...\n');

    // Check if logged in to npm
    try {
      const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
      console.log(`✅ Logged in as: ${whoami}`);
    } catch (error) {
      throw new Error('Not logged in to npm. Run: npm login');
    }

    // Check package.json
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ Package: ${pkg.name}@${pkg.version}`);

    // Run tests
    console.log('🧪 Running tests...');
    try {
      execSync('npm test', { stdio: 'pipe' });
      console.log('✅ Tests passed');
    } catch (error) {
      throw new Error('Tests failed. Fix tests before publishing.');
    }

    // Check package readiness
    console.log('📦 Testing package readiness...');
    try {
      execSync('node test-npm-package.js', { stdio: 'pipe' });
      console.log('✅ Package ready for publishing');
    } catch (error) {
      console.log('⚠️  Package test warnings (continuing...)');
    }

    // Check for uncommitted changes
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log('⚠️  Uncommitted changes detected');
        console.log('   Consider committing changes before publishing');
      } else {
        console.log('✅ No uncommitted changes');
      }
    } catch (error) {
      console.log('⚠️  Not a git repository or git not available');
    }

    console.log('');
  }

  /**
   * Confirm publishing
   */
  async confirmPublish() {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log('📋 Publishing Summary:');
    console.log(`   Package: ${pkg.name}`);
    console.log(`   Version: ${pkg.version}`);
    console.log(`   Registry: https://registry.npmjs.org/`);
    console.log(`   Access: public`);
    console.log('');

    return new Promise((resolve) => {
      this.rl.question('❓ Proceed with publishing? (y/N): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * Publish to npm
   */
  async publishToNPM() {
    console.log('🚀 Publishing to npm...\n');

    try {
      // Publish with public access
      execSync('npm publish --access public', { stdio: 'inherit' });
      console.log('\n✅ Successfully published to npm');
      
    } catch (error) {
      throw new Error(`npm publish failed: ${error.message}`);
    }
  }

  /**
   * Post-publish tasks
   */
  async postPublishTasks() {
    console.log('\n📋 Post-publish tasks...');

    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    // Verify package is available
    console.log('🔍 Verifying package availability...');
    try {
      // Wait a moment for npm to propagate
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const info = execSync(`npm info ${pkg.name}`, { encoding: 'utf8' });
      if (info.includes(pkg.version)) {
        console.log('✅ Package available on npm registry');
      } else {
        console.log('⚠️  Package may still be propagating...');
      }
    } catch (error) {
      console.log('⚠️  Could not verify package availability');
    }

    // Create git tag if in git repo
    try {
      execSync('git --version', { stdio: 'ignore' });
      
      const tagName = `v${pkg.version}`;
      console.log(`🏷️  Creating git tag: ${tagName}`);
      
      try {
        execSync(`git tag ${tagName}`, { stdio: 'pipe' });
        console.log('✅ Git tag created');
        
        // Ask if user wants to push tag
        const pushTag = await new Promise((resolve) => {
          this.rl.question('❓ Push git tag to remote? (y/N): ', (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
          });
        });
        
        if (pushTag) {
          execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
          console.log('✅ Git tag pushed to remote');
        }
        
      } catch (error) {
        console.log('⚠️  Git tag creation failed (may already exist)');
      }
      
    } catch (error) {
      console.log('⚠️  Git not available, skipping tag creation');
    }

    // Display next steps
    console.log('\n📖 Next steps:');
    console.log(`   • Test installation: npm install -g ${pkg.name}`);
    console.log(`   • View on npm: https://www.npmjs.com/package/${pkg.name}`);
    console.log('   • Monitor downloads and feedback');
    console.log('   • Update documentation if needed');
  }
}

// Run publisher if called directly
if (require.main === module) {
  const publisher = new Publisher();
  publisher.publish().catch(error => {
    console.error('❌ Publishing script failed:', error.message);
    process.exit(1);
  });
}

module.exports = Publisher;
