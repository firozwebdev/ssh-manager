# ⚡ SSH Manager - Ultra-Quick Start with Short Aliases

## 🚀 Installation (One Command)

```bash
# Install with all short aliases
node install.js
```

## 🎯 Ultra-Short Commands (After Installation)

### Generate SSH Key (One-Shot!)
```bash
# 🔥 FASTEST WAY
sg                              # Generate default RSA key + copy to clipboard
sg -t ed25519 -n github        # Generate Ed25519 key for GitHub
sg -t rsa -b 4096 -n work      # Generate 4096-bit RSA key for work

# 🎯 Special shortcuts (after running: bash aliases.sh)
github-key                      # Auto-generate GitHub key
work-key                       # Auto-generate work key
```

### Copy Existing Key (One-Shot!)
```bash
# 🔥 FASTEST WAY  
sc                              # Copy first available key to clipboard
sc -n github                   # Copy specific key to clipboard
```

### List Your Keys
```bash
# 🔥 FASTEST WAY
sl                              # List all keys
sl -d                          # List with details
```

## 📋 All Available Commands

| Ultra-Short | Short Command | Full Command | Description |
|-------------|---------------|--------------|-------------|
| `sg` | `ssh-gen` | `ssh-manager generate` | Generate SSH key |
| `sc` | `ssh-copy` | `ssh-manager copy` | Copy key to clipboard |
| `sl` | `ssh-list` | `ssh-manager list` | List all keys |
| - | `sshm st` | `ssh-manager status` | Show status |
| - | `sshm del` | `ssh-manager delete` | Delete key |

## 🎯 Real-World Examples

### First Time Setup
```bash
# Generate your main SSH key
sg -t ed25519 -n main

# Key is automatically copied to clipboard!
# Now paste it into GitHub/GitLab/server
```

### Multiple Services Setup
```bash
# Generate key for GitHub
sg -t ed25519 -n github -c "github@myemail.com"

# Generate key for work server  
sg -t rsa -b 4096 -n work-server

# Generate key for personal projects
sg -t ed25519 -n personal

# List all your keys
sl
```

### Daily Usage
```bash
# Copy GitHub key when setting up new machine
sc -n github

# Copy work key for server access
sc -n work-server

# Quick check what keys you have
sl
```

## 🔧 Advanced Short Commands

### With Shell Aliases (run: `bash aliases.sh`)
```bash
# Generate GitHub key automatically
github-key                      # Creates "github" key with GitHub email

# Generate work key automatically  
work-key server1               # Creates "server1" key with work email

# Find keys by name
ssh-find github                # Search for keys containing "github"
```

## 🎉 The Complete Workflow

```bash
# 1. Install (one time)
node install.js

# 2. Add shell aliases (optional, one time)
bash aliases.sh
source ~/.bashrc

# 3. Generate your first key (copies to clipboard automatically!)
sg

# 4. Paste into GitHub/GitLab/server - DONE! 🎉

# 5. Later, copy existing keys instantly
sc -n github
```

## 💡 Pro Tips

- **`sg`** = Super fast key generation + clipboard copy
- **`sc`** = Super fast key copy to clipboard  
- **`sl`** = Super fast key listing
- Keys are **automatically copied to clipboard** after generation
- Use **`-n name`** to organize keys by service/purpose
- Use **`-t ed25519`** for modern, secure keys
- Use **`-t rsa -b 4096`** for maximum compatibility

## 🔥 Why This is Unbeatable

✅ **One command** generates key + copies to clipboard  
✅ **Ultra-short aliases** for daily use  
✅ **Cross-platform** - works everywhere  
✅ **Multiple key management** - organize by service  
✅ **Instant retrieval** - copy any key anytime  
✅ **Secure defaults** - proper permissions automatically  
✅ **Zero configuration** - works out of the box  

**Perfect for developers who value speed and efficiency!** 🚀
