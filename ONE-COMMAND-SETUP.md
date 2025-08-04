# 🚀 SSH Manager - One-Command Setup

## ⚡ **The Easiest Way Ever**

```bash
node setup.js
```

**That's it!** This single command will:

✅ Install all dependencies  
✅ Install OpenSSH automatically  
✅ Set up global commands  
✅ Test everything  
✅ Show you how to generate your first SSH key  

## 🎯 **After Setup**

Generate SSH key (copies to clipboard automatically!):
```bash
ssh-gen
```

Copy existing key to clipboard:
```bash
ssh-copy
```

List all your keys:
```bash
ssh-list
```

## 🔥 **Perfect Workflow**

1. **Setup once:** `node setup.js`
2. **Generate key:** `ssh-gen` (auto-copies to clipboard!)
3. **Paste anywhere:** GitHub, servers, etc.
4. **Done!** 🎉

## 💡 **What the Setup Does**

The `setup.js` script is **smart** and handles everything:

- **Detects your OS** (Windows, macOS, Linux)
- **Installs OpenSSH** using the best method for your system:
  - Windows: PowerShell, Chocolatey, or Winget
  - macOS: Homebrew or Xcode Command Line Tools
  - Linux: apt, dnf, or pacman
- **Sets up global commands** so you can use `ssh-gen` anywhere
- **Tests everything** to make sure it works
- **Shows you exactly what to do next**

## 🛡️ **No Manual Steps Required**

Unlike other tools that require you to:
- ❌ Manually install OpenSSH
- ❌ Figure out your OS-specific commands
- ❌ Set up PATH variables
- ❌ Configure permissions

SSH Manager does **everything automatically**! 🎉

## 🔧 **If Auto-Setup Fails**

The script will show you exactly what to do manually. But in most cases, it just works!

## 🎯 **Why This is Revolutionary**

**Before:** 
1. Install OpenSSH manually
2. Learn ssh-keygen commands
3. Remember file locations
4. Copy files manually
5. Manage multiple keys

**After:**
1. `node setup.js` (one time)
2. `ssh-gen` (anytime you need a key)
3. Paste and done! 🚀

**Perfect for developers who want zero friction!**
