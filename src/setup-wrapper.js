#!/usr/bin/env node

/**
 * Setup wrapper that only runs when explicitly called
 * This prevents auto-setup during npm installation
 */

// Only run setup if explicitly called, not during npm install
if (process.env.npm_lifecycle_event !== 'install' && 
    process.env.npm_lifecycle_event !== 'postinstall' &&
    !process.env.npm_config_global) {
  
  const AutoSetup = require('../auto-setup');
  const setup = new AutoSetup();
  
  setup.setup().catch(error => {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Manual commands available:');
    console.log('  node src/cli-simple.js [command]');
    process.exit(1);
  });
} else {
  console.log('✅ SSH Manager installed successfully!');
  console.log('');
  console.log('📋 Available commands:');
  console.log('  sshm generate    # Generate SSH key');
  console.log('  sshm list        # List SSH keys');
  console.log('  sshm copy        # Copy key to clipboard');
  console.log('  sshm status      # Show system status');
  console.log('');
  console.log('🔧 Run setup manually if needed:');
  console.log('  npx ssh-manager-pro setup');
}
