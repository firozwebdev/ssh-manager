#!/bin/bash

# SSH Manager - Shell Aliases
# Add these to your .bashrc, .zshrc, or .profile for ultra-convenient SSH key management

echo "🔐 SSH Manager - Shell Aliases"
echo ""
echo "Adding the following aliases to your shell:"
echo ""

# Standard aliases
echo "# SSH Manager Aliases" >> ~/.bashrc
echo "alias sshgen='ssh-gen'" >> ~/.bashrc
echo "alias sshcopy='ssh-copy'" >> ~/.bashrc
echo "alias sshls='ssh-list'" >> ~/.bashrc
echo "alias sshst='ssh-manager status'" >> ~/.bashrc
echo "alias sshdel='ssh-manager delete'" >> ~/.bashrc
echo "" >> ~/.bashrc

# Ultra-short aliases
echo "# Ultra-short SSH aliases" >> ~/.bashrc
echo "alias sg='ssh-gen'" >> ~/.bashrc
echo "alias sc='ssh-copy'" >> ~/.bashrc
echo "alias sl='ssh-list'" >> ~/.bashrc
echo "" >> ~/.bashrc

# Function aliases for common workflows
echo "# SSH Manager Functions" >> ~/.bashrc
cat << 'EOF' >> ~/.bashrc

# Generate GitHub SSH key
github-key() {
    local name=${1:-github}
    ssh-gen -t ed25519 -n "$name" -c "github@$(whoami).com"
}

# Generate work SSH key
work-key() {
    local name=${1:-work}
    ssh-gen -t rsa -b 4096 -n "$name" -c "work@$(whoami).com"
}

# Quick copy by partial name match
ssh-find() {
    ssh-list | grep -i "$1"
}

EOF

echo "✅ Aliases added to ~/.bashrc"
echo ""
echo "🔄 Reload your shell or run: source ~/.bashrc"
echo ""
echo "📋 Available aliases:"
echo "  sshgen, sg     → Generate SSH key"
echo "  sshcopy, sc    → Copy SSH key"
echo "  sshls, sl      → List SSH keys"
echo "  sshst          → SSH status"
echo "  sshdel         → Delete SSH key"
echo ""
echo "🎯 Special functions:"
echo "  github-key     → Generate GitHub key"
echo "  work-key       → Generate work key"
echo "  ssh-find <term> → Find keys by name"
echo ""
echo "💡 Examples:"
echo "  sg                    # Generate default key"
echo "  sg -t ed25519 -n main # Generate Ed25519 key named 'main'"
echo "  sc -n github          # Copy GitHub key"
echo "  github-key            # Generate key for GitHub"
echo "  work-key server1      # Generate work key named 'server1'"
echo ""
