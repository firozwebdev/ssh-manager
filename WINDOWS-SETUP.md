# 🪟 SSH Manager - Windows Setup Guide

## 🚨 First: Install OpenSSH (Required)

SSH Manager needs `ssh-keygen` command to work. Here's how to install it on Windows:

### Option 1: Install via Windows Features (Recommended)
```powershell
# Run as Administrator in PowerShell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### Option 2: Install via Chocolatey
```powershell
# If you have Chocolatey installed
choco install openssh
```

### Option 3: Install Git for Windows (Includes OpenSSH)
1. Download and install [Git for Windows](https://git-scm.com/download/win)
2. During installation, select "Use Git and optional Unix tools from the Command Prompt"
3. This includes `ssh-keygen` command

### Option 4: Manual Download
1. Download OpenSSH from [Microsoft's GitHub](https://github.com/PowerShell/Win32-OpenSSH/releases)
2. Extract and add to your PATH

## ✅ Verify OpenSSH Installation

```powershell
# Test if ssh-keygen is available
ssh-keygen -h
```

You should see the ssh-keygen help output.

## 🚀 Install SSH Manager

```powershell
# Navigate to the SSH Manager directory
cd C:\Users\sabuz\OneDrive\Desktop\ssh-manager

# Install globally
npm link

# Verify installation
ssh-manager --help
```

## 🎯 Quick Test

```powershell
# Check status (should show ssh-keygen as available now)
ssh-manager status

# Generate your first SSH key
ssh-manager generate

# List your keys
ssh-manager list
```

## ⚡ Short Commands Available

After installation, you have these commands available:

| Command | Description |
|---------|-------------|
| `ssh-manager` | Full command |
| `sshm` | Short alias |
| `ssh-gen` | Direct generate |
| `ssh-copy` | Direct copy |
| `ssh-list` | Direct list |

## 🔥 Ultra-Short Aliases (PowerShell)

Add these to your PowerShell profile for ultra-short commands:

```powershell
# Open PowerShell profile
notepad $PROFILE

# Add these aliases:
Set-Alias sg ssh-gen
Set-Alias sc ssh-copy  
Set-Alias sl ssh-list

# Save and reload
. $PROFILE
```

## 💡 Windows-Specific Tips

### PowerShell vs Command Prompt
- Use **PowerShell** (recommended) - better clipboard support
- Command Prompt also works but may have clipboard limitations

### Clipboard on Windows
- Uses built-in `clip` command
- Should work automatically after OpenSSH installation

### File Permissions
- Windows doesn't use Unix-style permissions
- SSH Manager handles this automatically

## 🎉 Complete Windows Workflow

```powershell
# 1. Install OpenSSH (one time)
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# 2. Install SSH Manager (one time)
npm link

# 3. Generate SSH key (copies to clipboard!)
ssh-manager generate

# 4. Paste into GitHub/GitLab/server - Done! 🎉

# 5. Later, copy existing keys
ssh-manager copy -n github
```

## 🔧 Troubleshooting

### "ssh-keygen not found"
- Install OpenSSH using one of the methods above
- Restart PowerShell/Command Prompt after installation
- Check PATH includes OpenSSH directory

### "Command not recognized"
- Make sure you ran `npm link` successfully
- Restart your terminal
- Try the full path: `node src/cli-simple.js`

### Clipboard not working
- The tool will still generate keys successfully
- You can manually copy from the displayed file path
- Usually located in: `C:\Users\YourName\.ssh\`

## ✅ Success Indicators

When everything is working, you should see:

```powershell
PS> ssh-manager status

🔐 SSH Manager Status

📁 SSH Directory
✓ Directory exists: C:\Users\YourName\.ssh

🔑 SSH Keys
✓ Found X key(s)

⚙️  System
✓ ssh-keygen available
✓ Platform: win32 x64
✓ Node.js: v20.15.0
```

Now you're ready to use SSH Manager on Windows! 🚀
