# 🌍 SSH Manager - Cross-Platform Guide

SSH Manager now works seamlessly across **Windows**, **macOS**, and **Linux** with automatic OS detection and platform-specific optimizations.

## 🚀 Quick Start

### Automatic Installation
```bash
# One-command installation for all platforms
node install-cross-platform.js
```

### Manual Installation
```bash
# Install dependencies
npm install

# Setup global commands (optional)
npm link

# Test installation
node test-cross-platform.js
```

## 🖥️ Platform Support

### ✅ Windows
- **Windows 10/11** (Native)
- **Windows Server 2019/2022**
- **Windows Subsystem for Linux (WSL)**
- **PowerShell** and **Command Prompt**

**Dependencies:**
- OpenSSH (auto-installed via Windows Features or Git for Windows)
- PowerShell clipboard integration
- Traditional `clip` command fallback

### ✅ macOS
- **macOS 10.15+** (Catalina and newer)
- **Intel** and **Apple Silicon** (M1/M2)

**Dependencies:**
- OpenSSH (pre-installed or via Homebrew)
- `pbcopy`/`pbpaste` clipboard integration
- Xcode Command Line Tools (optional)

### ✅ Linux
- **Ubuntu** 18.04+ / **Debian** 10+
- **Fedora** 30+ / **CentOS** 8+ / **RHEL** 8+
- **Arch Linux** / **Manjaro**
- **openSUSE** / **Alpine Linux**
- **Kali Linux** / **Linux Mint** / **Pop!_OS**

**Dependencies:**
- OpenSSH client (auto-installed via package manager)
- Clipboard tools: `xclip`, `xsel`, `wl-copy` (Wayland)
- Desktop environment integration (KDE, GNOME)

## 🔧 Installation Details

### Windows Installation
```powershell
# Method 1: Windows Features (Recommended)
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# Method 2: Git for Windows (Includes OpenSSH)
winget install Git.Git

# Method 3: Chocolatey
choco install openssh

# Install SSH Manager
npm install
npm link
```

### macOS Installation
```bash
# Method 1: Homebrew (Recommended)
brew install openssh

# Method 2: Xcode Command Line Tools
xcode-select --install

# Install SSH Manager
npm install
npm link
```

### Linux Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install openssh-client xclip xsel
npm install
npm link
```

#### Fedora/CentOS/RHEL
```bash
sudo dnf install openssh-clients xclip xsel
# or: sudo yum install openssh-clients xclip xsel
npm install
npm link
```

#### Arch Linux/Manjaro
```bash
sudo pacman -S openssh xclip xsel
npm install
npm link
```

#### Alpine Linux
```bash
sudo apk add openssh-client xclip xsel
npm install
npm link
```

## 📋 Clipboard Support

### Windows
- **PowerShell**: `Set-Clipboard` / `Get-Clipboard` (Primary)
- **Traditional**: `clip` command (Fallback)
- **WSL Integration**: Automatic Windows clipboard access

### macOS
- **Native**: `pbcopy` / `pbpaste`
- **Homebrew**: Enhanced clipboard tools (optional)

### Linux
- **X11**: `xclip`, `xsel`
- **Wayland**: `wl-copy`, `wl-paste`
- **KDE**: `qdbus` integration
- **GNOME**: `gdbus` integration
- **WSL**: Windows clipboard integration
- **Termux**: Android clipboard support

## 🎯 Usage Examples

### Generate SSH Keys
```bash
# Cross-platform key generation
ssh-manager generate -t ed25519 -n github

# Platform-specific optimizations applied automatically
ssh-manager generate -t rsa -b 4096 -n work
```

### Copy Keys to Clipboard
```bash
# Automatic platform detection
ssh-manager copy -n github

# Works on all platforms with best available method
ssh-manager copy
```

### System Status
```bash
# Platform-aware status check
ssh-manager status

# Shows platform-specific information
```

## 🔍 Platform Detection

SSH Manager automatically detects:

- **Operating System**: Windows, macOS, Linux
- **Architecture**: x64, arm64, etc.
- **Distribution**: Ubuntu, Fedora, Arch, etc. (Linux)
- **Environment**: WSL, Desktop Environment
- **Package Managers**: apt, dnf, pacman, brew, etc.
- **Clipboard Tools**: Available clipboard utilities

## 🧪 Testing

### Run Cross-Platform Tests
```bash
# Comprehensive test suite
node test-cross-platform.js

# Tests all functionality on current platform
```

### Manual Testing
```bash
# Test key generation
ssh-manager generate -t ed25519 -n test

# Test clipboard
ssh-manager copy -n test

# Test listing
ssh-manager list --detailed

# Test status
ssh-manager status
```

## 🐛 Troubleshooting

### Windows Issues
```powershell
# Check OpenSSH installation
ssh-keygen -?

# Check PowerShell clipboard
Get-Command Set-Clipboard

# Run as Administrator if needed
```

### macOS Issues
```bash
# Check OpenSSH
which ssh-keygen

# Check clipboard tools
which pbcopy

# Install Xcode tools if needed
xcode-select --install
```

### Linux Issues
```bash
# Check OpenSSH
which ssh-keygen

# Check clipboard tools
which xclip xsel

# Install missing packages
sudo apt install openssh-client xclip xsel  # Ubuntu/Debian
sudo dnf install openssh-clients xclip xsel # Fedora
```

### WSL Issues
```bash
# Check WSL integration
cat /proc/version | grep -i microsoft

# Test Windows clipboard from WSL
echo "test" | clip.exe

# Verify SSH Manager detects WSL
ssh-manager status
```

## 🚀 Advanced Features

### Environment Variables
```bash
# Override clipboard method
export SSH_MANAGER_CLIPBOARD=xclip

# Override SSH directory
export SSH_MANAGER_DIR=~/.ssh-custom

# Enable debug mode
export SSH_MANAGER_DEBUG=1
```

### Configuration
```json
{
  "ssh": {
    "defaultDirectory": "~/.ssh",
    "defaultKeyType": "ed25519"
  },
  "clipboard": {
    "timeout": 5000,
    "preferredMethod": "auto"
  }
}
```

## 📊 Platform Comparison

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| SSH Key Generation | ✅ | ✅ | ✅ |
| Clipboard Copy | ✅ | ✅ | ✅ |
| Auto-detection | ✅ | ✅ | ✅ |
| Package Installation | ✅ | ✅ | ✅ |
| WSL Support | ✅ | N/A | ✅ |
| Desktop Integration | ✅ | ✅ | ✅ |

## 🎉 Success Stories

- ✅ **Windows 11**: Full functionality with PowerShell clipboard
- ✅ **Ubuntu 22.04**: Complete support with xclip integration
- ✅ **macOS Monterey**: Native pbcopy/pbpaste support
- ✅ **WSL2**: Seamless Windows clipboard integration
- ✅ **Arch Linux**: Full pacman package management
- ✅ **Fedora 38**: Complete dnf integration

## 🔗 Quick Links

- [Windows Setup Guide](WINDOWS-SETUP.md)
- [Main README](README.md)
- [Usage Guide](USAGE.md)
- [Quick Start](QUICK-START.md)

---

**🌟 SSH Manager now works everywhere!** Generate, manage, and copy SSH keys seamlessly across all major operating systems.
