#!/bin/bash

# Test script for ssh-manager-pro installation
echo "🧪 Testing ssh-manager-pro Installation"
echo ""

# Clean up any existing installations
echo "🧹 Cleaning up existing installations..."
npm uninstall -g ssh-manager-pro 2>/dev/null || true
npm uninstall -g ssh-manager 2>/dev/null || true

# Wait a moment
sleep 2

# Install the latest version
echo "📦 Installing ssh-manager-pro@latest..."
npm install -g ssh-manager-pro

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Installation successful!"
    
    # Test commands
    echo ""
    echo "🧪 Testing commands..."
    
    # Test help
    echo "Testing: sshm --help"
    sshm --help
    
    # Test status
    echo ""
    echo "Testing: sshm status"
    sshm status
    
    echo ""
    echo "🎉 ssh-manager-pro is working correctly!"
    echo ""
    echo "📋 Available commands:"
    echo "  sshm generate -t ed25519 -n github"
    echo "  sshm list"
    echo "  sshm copy"
    echo "  sshm status"
    
else
    echo "❌ Installation failed"
    echo ""
    echo "🔧 Alternative: Use npx"
    echo "  npx ssh-manager-pro --help"
    echo "  npx ssh-manager-pro status"
fi
