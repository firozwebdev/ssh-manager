#!/bin/bash

# SSH Manager - One-Command Setup
# Automatically sets up everything: permissions, global commands, dependencies

echo "🚀 SSH Manager - One-Command Setup"
echo "   Setting up everything automatically..."
echo ""

# Make auto-setup script executable
chmod +x auto-setup.js 2>/dev/null || true

# Run the comprehensive auto-setup
node auto-setup.js

# Check if setup was successful
if command -v sshm >/dev/null 2>&1; then
    echo ""
    echo "🎉 Setup successful! You can now use:"
    echo "  sshm generate"
    echo "  sshm list"
    echo "  sshm copy"
    echo "  sshm status"
    echo ""
    echo "🔗 Quick start:"
    echo "  sshm generate -t ed25519 -n github"
else
    echo ""
    echo "⚠️  Global command setup incomplete."
    echo "You can still use: node src/cli-simple.js [command]"
    echo ""
    echo "To fix global commands, restart your terminal and try:"
    echo "  source ~/.bashrc"
    echo "  sshm --help"
fi
