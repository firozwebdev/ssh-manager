# 🚀 SSH Manager - Quick Setup

## ⚡ One-Command Setup (Recommended)

```bash
# Automatic setup - handles everything
npm run setup
```

**That's it!** The setup will automatically:
- ✅ Fix file permissions
- ✅ Install Node.js dependencies  
- ✅ Setup global `sshm` command
- ✅ Install system dependencies (OpenSSH, clipboard tools)
- ✅ Verify everything works

## 🎯 Alternative Setup Methods

### Method 1: Shell Script
```bash
chmod +x setup.sh
./setup.sh
```

### Method 2: Direct Node.js
```bash
node auto-setup.js
```

### Method 3: Manual (if automatic fails)
```bash
npm install
chmod +x src/cli-simple.js
npm link
```

## ✅ After Setup

You can use these commands:

```bash
# Generate SSH key
sshm generate -t ed25519 -n github

# List SSH keys
sshm list

# Copy key to clipboard (auto-installs clipboard tools)
sshm copy

# Check system status
sshm status
```

## 🔧 If Global Commands Don't Work

If `sshm` command isn't available after setup:

```bash
# Restart terminal and reload shell
source ~/.bashrc

# Or use direct execution
node src/cli-simple.js [command]

# Or create manual alias
echo 'alias sshm="node ~/Desktop/ssh-manager/src/cli-simple.js"' >> ~/.bashrc
source ~/.bashrc
```

## 🎉 Features

- **🔧 Automatic Setup**: Everything configured automatically
- **📋 Auto-Install**: Missing tools installed automatically  
- **🌍 Cross-Platform**: Works on Windows, macOS, Linux
- **🔗 Global Commands**: Use `sshm` from anywhere
- **📱 User-Friendly**: No manual configuration needed

## 🚀 Quick Start

```bash
# 1. One-command setup
npm run setup

# 2. Generate your first SSH key
sshm generate -t ed25519 -n github

# 3. Copy to clipboard (auto-installs clipboard tools)
sshm copy

# 4. Paste into GitHub/GitLab/etc.
```

**Everything is automatic - just run the setup and start using SSH Manager!** 🎉
