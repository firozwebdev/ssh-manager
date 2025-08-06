#!/bin/bash

# Quick fix for Ubuntu repository issues
# This script fixes common Ubuntu PPA and repository problems

echo "🔧 Ubuntu Repository Fix Tool"
echo "   Fixing common repository issues..."
echo ""

# Fix broken PPAs and repository issues
echo "📦 Fixing repository configuration..."

# Remove problematic Node.js PPA
sudo add-apt-repository --remove ppa:chris-lea/node.js -y 2>/dev/null || true

# Fix repository label changes
echo "📋 Accepting repository label changes..."
sudo apt update -y 2>/dev/null || true

# Clean package cache
echo "🧹 Cleaning package cache..."
sudo apt clean
sudo apt autoclean

# Fix broken packages
echo "🔧 Fixing broken packages..."
sudo apt --fix-broken install -y

# Update package lists
echo "📦 Updating package lists..."
sudo apt update

# Install clipboard tools
echo "📋 Installing clipboard tools..."
sudo apt install -y xclip xsel

# Verify installation
echo ""
echo "🧪 Testing installation..."
if command -v xclip >/dev/null 2>&1; then
    echo "✅ xclip installed successfully"
else
    echo "❌ xclip installation failed"
fi

if command -v xsel >/dev/null 2>&1; then
    echo "✅ xsel installed successfully"
else
    echo "❌ xsel installation failed"
fi

# Test clipboard functionality
echo ""
echo "🧪 Testing clipboard functionality..."
if echo "test" | xclip -selection clipboard 2>/dev/null; then
    if [ "$(xclip -selection clipboard -o 2>/dev/null)" = "test" ]; then
        echo "✅ Clipboard functionality working!"
        echo ""
        echo "🎉 Repository issues fixed! SSH Manager should now work:"
        echo "   sshm copy"
    else
        echo "⚠️  Clipboard tools installed but not working properly"
    fi
else
    echo "⚠️  Clipboard tools may not be working properly"
fi

echo ""
echo "✅ Repository fix complete!"
