# 🔐 SSH Manager

[![npm version](https://badge.fury.io/js/%40ssh-tools%2Fssh-manager.svg)](https://badge.fury.io/js/%40ssh-tools%2Fssh-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, production-ready SSH key manager with automatic clipboard integration, cross-platform support, and zero-configuration setup.

## ✨ Features

- **One-Click Key Generation**: Generate SSH keys and automatically copy to clipboard
- **Instant Key Retrieval**: Copy existing SSH keys to clipboard with a single command
- **Multiple Key Types**: Support for RSA, Ed25519, and ECDSA keys
- **Interactive Mode**: User-friendly prompts for key generation
- **Key Management**: List, delete, and manage multiple SSH keys
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Backup & Restore**: Backup your keys and restore them when needed
- **Security Features**: Proper file permissions and validation
- **Configuration Management**: Customizable settings and preferences

## 🚀 Quick Start

### NPM Installation (Recommended)

```bash
# Install globally
npm install -g @ssh-tools/ssh-manager

# Or use npx (no installation required)
npx @ssh-tools/ssh-manager generate
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/ssh-tools/ssh-manager.git
cd ssh-manager

# Install dependencies and setup
npm install
npm run setup
```

### Basic Usage

```bash
# Generate a new SSH key and copy to clipboard
ssh-manager generate

# Copy existing key to clipboard
ssh-manager copy

# List all SSH keys
ssh-manager list

# Show status and system information
ssh-manager status
```

## 📖 Commands

### Generate (`generate`, `gen`)

Generate a new SSH key pair and automatically copy the public key to clipboard.

```bash
# Basic generation (interactive mode)
ssh-manager generate

# Quick generation with defaults
ssh-manager gen -t rsa -b 4096 -n my-key

# Interactive mode with prompts
ssh-manager gen --interactive

# Generate with custom options
ssh-manager gen --type ed25519 --name work-laptop --comment "work@company.com"
```

**Options:**
- `-t, --type <type>`: Key type (rsa, ed25519, ecdsa) [default: rsa]
- `-b, --bits <bits>`: Key size in bits [default: 4096]
- `-n, --name <name>`: Key name (without extension)
- `-c, --comment <comment>`: Key comment
- `-p, --passphrase <passphrase>`: Key passphrase
- `-f, --force`: Overwrite existing key
- `-i, --interactive`: Interactive mode

### Copy (`copy`, `cp`)

Copy an existing SSH public key to clipboard.

```bash
# Interactive key selection
ssh-manager copy

# Copy specific key by name
ssh-manager cp --name id_rsa

# List keys first, then select
ssh-manager cp --list
```

**Options:**
- `-n, --name <name>`: Key name to copy
- `-l, --list`: List available keys first

### List (`list`, `ls`)

List all SSH keys in your SSH directory.

```bash
# Basic list
ssh-manager list

# Detailed information
ssh-manager ls --detailed
```

**Options:**
- `-d, --detailed`: Show detailed information

### Delete (`delete`, `del`)

Delete SSH key pairs.

```bash
# Interactive deletion
ssh-manager delete

# Delete specific key
ssh-manager del --name old-key

# Force deletion without confirmation
ssh-manager del --name old-key --force
```

**Options:**
- `-n, --name <name>`: Key name to delete
- `-f, --force`: Skip confirmation

### Status (`status`, `st`)

Show SSH manager and system status.

```bash
ssh-manager status
```

## 🔧 Configuration

SSH Manager uses a configuration file located at `~/.ssh-manager/config.json`. You can customize various settings:

```json
{
  "ssh": {
    "defaultKeyType": "rsa",
    "defaultKeySize": 4096,
    "defaultDirectory": "~/.ssh",
    "supportedKeyTypes": ["rsa", "ed25519", "ecdsa"]
  },
  "clipboard": {
    "timeout": 5000,
    "fallbackMethods": ["pbcopy", "xclip", "clip"]
  },
  "security": {
    "enablePassphrase": false,
    "backupKeys": true,
    "maxKeyAge": 365
  },
  "ui": {
    "colors": true,
    "animations": true,
    "verbose": false
  }
}
```

## 🛡️ Security Features

- **Proper File Permissions**: Automatically sets correct permissions (600 for private keys, 644 for public keys)
- **Input Validation**: Comprehensive validation of all inputs
- **Secure Defaults**: Uses secure key types and sizes by default
- **Backup Support**: Optional automatic backup of keys
- **Passphrase Support**: Optional passphrase protection for private keys

## 🔄 Backup & Restore

### Create Backup

```bash
# Create backup with timestamp
ssh-manager backup create

# Create backup to specific location
ssh-manager backup create --path ~/my-backups

# Create compressed backup
ssh-manager backup create --compress
```

### Restore Backup

```bash
# Restore from backup
ssh-manager backup restore ~/backups/ssh-backup-2024-01-01.tar.gz

# Dry run (preview what would be restored)
ssh-manager backup restore ~/backups/backup.tar.gz --dry-run

# Restore with overwrite
ssh-manager backup restore ~/backups/backup.tar.gz --overwrite
```

### List Backups

```bash
ssh-manager backup list ~/backups
```

## 🧪 Testing

Run the test suite to ensure everything works correctly:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## 🔍 Troubleshooting

### Common Issues

1. **ssh-keygen not found**
   - Install OpenSSH on your system
   - Ensure ssh-keygen is in your PATH

2. **Clipboard not working**
   - Install clipboard utilities for your platform:
     - Linux: `xclip` or `xsel`
     - macOS: Built-in `pbcopy`
     - Windows: Built-in `clip`

3. **Permission denied**
   - Ensure you have write permissions to the SSH directory
   - Run with appropriate privileges if needed

4. **Key already exists**
   - Use `--force` flag to overwrite
   - Or choose a different key name

### Debug Mode

Enable verbose output for debugging:

```bash
ssh-manager generate --verbose
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with Node.js and modern CLI tools
- Uses industry-standard SSH key generation
- Cross-platform clipboard integration
- Comprehensive error handling and validation

---

**Made with ❤️ for developers who love automation and security**
