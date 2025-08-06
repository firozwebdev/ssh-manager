# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- 🎉 Initial release of SSH Manager
- 🔑 SSH key generation (RSA, ED25519, ECDSA)
- 📋 Automatic clipboard integration with cross-platform support
- 🌍 Cross-platform support (Windows, macOS, Linux)
- 🚀 Zero-configuration automatic setup
- 🔧 Smart system dependency detection and installation
- 📱 User-friendly CLI with multiple interfaces
- 🛡️ Secure file permissions and validation
- 🎯 Multiple clipboard methods with automatic fallbacks
- 📦 NPM package distribution
- 🔍 Comprehensive system status checking
- 📝 Detailed SSH key listing and management
- 🎨 Interactive and non-interactive modes
- 🔄 Automatic environment refresh and PATH management

### Features
- **Key Generation**: Support for RSA (1024-4096 bits), ED25519, ECDSA
- **Clipboard Integration**: Automatic tool installation for Linux, Windows PowerShell integration, macOS native support
- **Cross-Platform**: Windows 10+, macOS 10.15+, all major Linux distributions
- **Auto-Setup**: Automatic dependency installation, permission fixing, global command setup
- **Smart Detection**: OS detection, package manager detection, desktop environment integration
- **WSL Support**: Windows clipboard integration for WSL environments
- **Wayland Support**: wl-clipboard integration for Wayland desktop environments
- **Package Managers**: Support for apt, dnf, yum, pacman, zypper, apk, brew, winget, chocolatey

### Technical
- **Node.js**: Requires Node.js 16.0.0 or higher
- **Dependencies**: Minimal dependencies with automatic system tool installation
- **Architecture**: Modular design with separate utilities for SSH, clipboard, and system management
- **Testing**: Comprehensive cross-platform test suite
- **Documentation**: Complete documentation with examples and troubleshooting

### Supported Platforms
- **Windows**: Windows 10, Windows 11, Windows Server 2019/2022, WSL1/WSL2
- **macOS**: macOS 10.15+ (Intel and Apple Silicon)
- **Linux**: Ubuntu, Debian, Fedora, CentOS, RHEL, Arch Linux, Manjaro, openSUSE, Alpine Linux

### Commands
- `sshm generate` - Generate SSH keys with various options
- `sshm list` - List existing SSH keys with details
- `sshm copy` - Copy SSH keys to clipboard
- `sshm status` - Show comprehensive system status
- `sshm delete` - Delete SSH keys with confirmation
- `sshm backup` - Backup SSH keys
- `sshm restore` - Restore SSH keys from backup

### Installation Methods
- Global NPM installation: `npm install -g @ssh-tools/ssh-manager`
- One-time use: `npx @ssh-tools/ssh-manager`
- Local installation: `npm install @ssh-tools/ssh-manager`
- Development setup: Clone repository and run setup

## [Unreleased]

### Planned
- 🔐 SSH agent integration
- 🌐 Remote server key deployment
- 📊 Key usage analytics
- 🔄 Automatic key rotation
- 🏢 Enterprise features
- 🔗 Git hosting service integration
- 📱 Mobile companion app
- 🎨 GUI interface
- 🔒 Hardware security key support
- ☁️ Cloud backup integration
