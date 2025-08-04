# 🔐 SSH Manager - Quick Usage Guide

## 🚀 Quick Start

### 1. Install Globally

```bash
# Install with short aliases
node install.js

# Or manually
npm link
```

### 2. Test the Tool

```bash
# Run the working demo to see all features
node working-demo.js

# Run basic tests
node test-basic.js
```

### 3. Use the CLI (Multiple Ways!)

#### Generate SSH Key (One-Shot)

```bash
# Generate RSA key and copy to clipboard
node src/cli-simple.js generate

# Generate Ed25519 key with custom name
node src/cli-simple.js gen -t ed25519 -n work-laptop

# Generate with specific options
node src/cli-simple.js gen -t rsa -b 4096 -n github-key -c "github@mycompany.com"
```

#### Copy Existing Key to Clipboard

```bash
# Copy first available key
node src/cli-simple.js copy

# Copy specific key by name
node src/cli-simple.js cp -n github-key
```

#### List All Keys

```bash
# Basic list
node src/cli-simple.js list

# Detailed information
node src/cli-simple.js ls --detailed
```

#### Check Status

```bash
node src/cli-simple.js status
```

#### Delete Keys

```bash
# Delete specific key (requires confirmation)
node src/cli-simple.js delete -n old-key --force
```

## 🎯 Main Use Cases

### Use Case 1: First Time Setup

```bash
# Generate your main SSH key
node src/cli-simple.js generate -t ed25519 -n main

# The public key is automatically copied to clipboard
# Now paste it into GitHub, GitLab, or your server
```

### Use Case 2: Multiple Keys for Different Services

```bash
# Generate key for GitHub
node src/cli-simple.js gen -t ed25519 -n github -c "github@myemail.com"

# Generate key for work server
node src/cli-simple.js gen -t rsa -b 4096 -n work-server -c "work@company.com"

# List all keys
node src/cli-simple.js list
```

### Use Case 3: Quick Key Retrieval

```bash
# Copy your GitHub key when setting up a new machine
node src/cli-simple.js copy -n github

# Paste into GitHub settings
```

## 🔧 Command Reference

### Generate Command

```bash
node src/cli-simple.js generate [options]

Options:
  -t, --type <type>     Key type: rsa, ed25519, ecdsa (default: rsa)
  -b, --bits <bits>     Key size in bits (default: 4096)
  -n, --name <name>     Key name without extension
  -c, --comment <comment> Key comment
  -f, --force           Overwrite existing key
```

### Copy Command

```bash
node src/cli-simple.js copy [options]

Options:
  -n, --name <name>     Specific key name to copy
```

### List Command

```bash
node src/cli-simple.js list [options]

Options:
  -d, --detailed        Show detailed information
```

### Delete Command

```bash
node src/cli-simple.js delete [options]

Options:
  -n, --name <name>     Key name to delete (required)
  -f, --force           Skip confirmation
```

## 🛡️ Security Features

- **Proper Permissions**: Automatically sets 600 for private keys, 644 for public keys
- **Input Validation**: Comprehensive validation of all inputs
- **Secure Defaults**: Uses secure key types and sizes
- **No Passphrase by Default**: For automation-friendly usage (can be added manually)

## 🔍 Troubleshooting

### SSH-keygen not found

```bash
# Windows: Install Git for Windows or OpenSSH
# macOS: Install Xcode Command Line Tools
# Linux: Install openssh-client package
```

### Clipboard not working

```bash
# The tool will still generate keys successfully
# You can manually copy from the displayed file path
# Or install platform-specific clipboard tools:
# - Linux: xclip or xsel
# - macOS: pbcopy (built-in)
# - Windows: clip (built-in)
```

### Permission denied

```bash
# Ensure you have write access to ~/.ssh directory
# On Unix systems, check directory permissions
```

## 📁 File Structure

```
ssh-manager/
├── src/
│   ├── cli-simple.js          # Main CLI (working version)
│   ├── utils/
│   │   ├── ssh.js             # SSH key management
│   │   ├── clipboard-simple.js # Clipboard operations
│   │   ├── validator.js       # Input validation
│   │   └── config.js          # Configuration management
│   └── commands/
│       ├── status.js          # Status command
│       └── backup.js          # Backup functionality
├── config/
│   └── default.json           # Default configuration
├── tests/
│   └── ssh-manager.test.js    # Test suite
├── working-demo.js            # Complete demo
├── test-basic.js              # Basic functionality test
└── README.md                  # Full documentation
```

## 🎉 Success!

You now have a fully functional SSH key manager that:

✅ **Generates SSH keys** with one command  
✅ **Copies to clipboard** automatically  
✅ **Manages multiple keys** easily  
✅ **Works cross-platform**  
✅ **Validates all inputs**  
✅ **Sets proper permissions**  
✅ **Provides detailed status**

Perfect for developers who need to manage SSH keys across multiple services and machines!
