#!/bin/bash

# SSH Manager - Linux Clipboard Tools Installer
# Automatically installs clipboard tools for Linux distributions

set -e

echo "🐧 SSH Manager - Linux Clipboard Tools Installer"
echo ""

# Function to detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo $ID
    else
        echo "unknown"
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install clipboard tools
install_clipboard_tools() {
    local distro=$1
    
    echo "📦 Detected distribution: $distro"
    echo "🔧 Installing clipboard tools..."
    
    case $distro in
        ubuntu|debian|mint|pop|kali)
            echo "   Installing via apt..."
            sudo apt update
            sudo apt install -y xclip xsel
            ;;
        fedora|centos|rhel)
            echo "   Installing via dnf/yum..."
            if command_exists dnf; then
                sudo dnf install -y xclip xsel
            elif command_exists yum; then
                sudo yum install -y xclip xsel
            else
                echo "❌ No package manager found (dnf/yum)"
                exit 1
            fi
            ;;
        arch|manjaro)
            echo "   Installing via pacman..."
            sudo pacman -S --noconfirm xclip xsel
            ;;
        opensuse*)
            echo "   Installing via zypper..."
            sudo zypper install -y xclip xsel
            ;;
        alpine)
            echo "   Installing via apk..."
            sudo apk add xclip xsel
            ;;
        *)
            echo "⚠️  Unknown distribution: $distro"
            echo "   Trying common package managers..."
            
            if command_exists apt; then
                sudo apt update && sudo apt install -y xclip xsel
            elif command_exists dnf; then
                sudo dnf install -y xclip xsel
            elif command_exists yum; then
                sudo yum install -y xclip xsel
            elif command_exists pacman; then
                sudo pacman -S --noconfirm xclip xsel
            elif command_exists zypper; then
                sudo zypper install -y xclip xsel
            elif command_exists apk; then
                sudo apk add xclip xsel
            else
                echo "❌ No supported package manager found"
                echo "   Please install xclip and xsel manually"
                exit 1
            fi
            ;;
    esac
}

# Function to verify installation
verify_installation() {
    echo ""
    echo "🔍 Verifying installation..."
    
    local tools_found=0
    
    if command_exists xclip; then
        echo "✅ xclip installed successfully"
        tools_found=$((tools_found + 1))
    else
        echo "❌ xclip not found"
    fi
    
    if command_exists xsel; then
        echo "✅ xsel installed successfully"
        tools_found=$((tools_found + 1))
    else
        echo "❌ xsel not found"
    fi
    
    if command_exists wl-copy; then
        echo "✅ wl-copy found (Wayland clipboard)"
        tools_found=$((tools_found + 1))
    fi
    
    if [ $tools_found -gt 0 ]; then
        echo ""
        echo "🎉 Clipboard tools installation successful!"
        echo "   You can now use SSH Manager clipboard features"
        echo ""
        echo "📋 Test clipboard:"
        echo "   echo 'test' | xclip -selection clipboard"
        echo "   xclip -selection clipboard -o"
        return 0
    else
        echo ""
        echo "❌ No clipboard tools were successfully installed"
        echo "   Please install manually or check your package manager"
        return 1
    fi
}

# Function to show manual installation instructions
show_manual_instructions() {
    echo ""
    echo "📖 Manual Installation Instructions:"
    echo ""
    echo "Ubuntu/Debian/Mint:"
    echo "   sudo apt update"
    echo "   sudo apt install xclip xsel"
    echo ""
    echo "Fedora/CentOS/RHEL:"
    echo "   sudo dnf install xclip xsel"
    echo "   # or: sudo yum install xclip xsel"
    echo ""
    echo "Arch Linux/Manjaro:"
    echo "   sudo pacman -S xclip xsel"
    echo ""
    echo "openSUSE:"
    echo "   sudo zypper install xclip xsel"
    echo ""
    echo "Alpine Linux:"
    echo "   sudo apk add xclip xsel"
    echo ""
}

# Main execution
main() {
    # Check if running on Linux
    if [ "$(uname)" != "Linux" ]; then
        echo "❌ This script is for Linux systems only"
        echo "   Current system: $(uname)"
        exit 1
    fi
    
    # Check if already installed
    if command_exists xclip || command_exists xsel; then
        echo "✅ Clipboard tools already installed:"
        command_exists xclip && echo "   • xclip found"
        command_exists xsel && echo "   • xsel found"
        command_exists wl-copy && echo "   • wl-copy found (Wayland)"
        echo ""
        echo "🎉 SSH Manager clipboard features should work!"
        exit 0
    fi
    
    # Detect distribution and install
    local distro=$(detect_distro)
    
    if [ "$distro" = "unknown" ]; then
        echo "⚠️  Could not detect Linux distribution"
        show_manual_instructions
        exit 1
    fi
    
    # Install clipboard tools
    install_clipboard_tools "$distro"
    
    # Verify installation
    if verify_installation; then
        echo "🚀 Ready to use SSH Manager with clipboard support!"
    else
        echo ""
        echo "⚠️  Installation may have failed"
        show_manual_instructions
        exit 1
    fi
}

# Run main function
main "$@"
