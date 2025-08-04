#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔐 SSH Manager - Installation Script\n');

try {
  // 1. Install globally via npm link
  console.log('📦 Installing SSH Manager globally...');
  execSync('npm link', { stdio: 'inherit' });
  console.log('✅ Global installation complete!\n');

  // 2. Show available commands
  console.log('🎯 Available Commands:');
  console.log('');
  console.log('📋 Main Commands:');
  console.log('  ssh-manager generate    # Generate new SSH key');
  console.log('  ssh-manager copy        # Copy existing key');
  console.log('  ssh-manager list        # List all keys');
  console.log('  ssh-manager status      # Show status');
  console.log('  ssh-manager delete      # Delete a key');
  console.log('');
  console.log('⚡ Short Aliases:');
  console.log('  sshm generate          # Same as ssh-manager');
  console.log('  ssh-gen                # Direct generate command');
  console.log('  ssh-copy               # Direct copy command');
  console.log('  ssh-list               # Direct list command');
  console.log('');

  // 3. Create additional shell aliases (optional)
  console.log('🔧 Optional Shell Aliases:');
  console.log('');
  console.log('Add these to your shell profile (.bashrc, .zshrc, etc.) for even shorter commands:');
  console.log('');
  
  const aliases = [
    'alias sshgen="ssh-gen"',
    'alias sshcopy="ssh-copy"',
    'alias sshls="ssh-list"',
    'alias sshst="ssh-manager status"',
    'alias sshdel="ssh-manager delete"',
    '',
    '# Ultra-short aliases',
    'alias sg="ssh-gen"',
    'alias sc="ssh-copy"',
    'alias sl="ssh-list"'
  ];

  aliases.forEach(alias => {
    console.log(`  ${alias}`);
  });

  console.log('');

  // 4. Test installation
  console.log('🧪 Testing installation...');
  try {
    execSync('ssh-manager --version', { stdio: 'pipe' });
    console.log('✅ ssh-manager command works');
  } catch (error) {
    console.log('❌ ssh-manager command failed');
  }

  try {
    execSync('sshm --version', { stdio: 'pipe' });
    console.log('✅ sshm alias works');
  } catch (error) {
    console.log('❌ sshm alias failed');
  }

  try {
    execSync('ssh-gen --help', { stdio: 'pipe' });
    console.log('✅ ssh-gen direct command works');
  } catch (error) {
    console.log('❌ ssh-gen direct command failed');
  }

  console.log('');

  // 5. Quick start guide
  console.log('🚀 Quick Start:');
  console.log('');
  console.log('1. Generate your first SSH key:');
  console.log('   ssh-gen');
  console.log('   # or: ssh-manager generate');
  console.log('');
  console.log('2. Copy existing key to clipboard:');
  console.log('   ssh-copy');
  console.log('   # or: ssh-manager copy');
  console.log('');
  console.log('3. List all your keys:');
  console.log('   ssh-list');
  console.log('   # or: ssh-manager list');
  console.log('');
  console.log('4. Check system status:');
  console.log('   ssh-manager status');
  console.log('');

  // 6. Usage examples
  console.log('💡 Usage Examples:');
  console.log('');
  console.log('# Generate Ed25519 key for GitHub');
  console.log('ssh-gen -t ed25519 -n github -c "github@myemail.com"');
  console.log('');
  console.log('# Generate RSA key for work server');
  console.log('ssh-gen -t rsa -b 4096 -n work-server');
  console.log('');
  console.log('# Copy specific key');
  console.log('ssh-copy -n github');
  console.log('');
  console.log('# List with details');
  console.log('ssh-list --detailed');
  console.log('');

  console.log('🎉 Installation complete! SSH Manager is ready to use.');
  console.log('');

} catch (error) {
  console.error('❌ Installation failed:', error.message);
  console.log('');
  console.log('🔧 Manual installation:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm link');
  console.log('3. Test: ssh-manager --help');
  process.exit(1);
}
