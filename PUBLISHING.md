# 📦 Publishing SSH Manager to NPM

This guide explains how to publish SSH Manager as an npm package for distribution.

## 🚀 Quick Publishing

### Prerequisites

1. **NPM Account**: Create account at [npmjs.com](https://www.npmjs.com)
2. **NPM CLI**: Install with `npm install -g npm`
3. **Login**: Run `npm login`

### One-Command Publishing

```bash
# Publish to npm
npm publish
```

## 📋 Detailed Publishing Process

### Step 1: Prepare Package

```bash
# Ensure everything is ready
npm run test
npm run lint
npm run setup

# Check package contents
npm pack --dry-run
```

### Step 2: Version Management

```bash
# Update version (choose one)
npm version patch    # 1.0.0 -> 1.0.1
npm version minor    # 1.0.0 -> 1.1.0  
npm version major    # 1.0.0 -> 2.0.0

# Or manually edit package.json version
```

### Step 3: Login to NPM

```bash
# Login to npm
npm login

# Verify login
npm whoami
```

### Step 4: Publish

```bash
# Publish public package
npm publish --access public

# Or for scoped package
npm publish
```

## 🔧 Package Configuration

### Current Package Details

- **Name**: `@ssh-tools/ssh-manager`
- **Scope**: `@ssh-tools`
- **Access**: Public
- **License**: MIT
- **Main Entry**: `src/index.js`
- **Binary**: `sshm` command

### Key Files Included

```
📦 Package Contents:
├── src/                 # Source code
├── config/             # Configuration files
├── auto-setup.js       # Automatic setup script
├── install-cross-platform.js
├── test-cross-platform.js
├── README.md           # Documentation
├── LICENSE             # MIT License
├── CHANGELOG.md        # Version history
└── package.json        # Package configuration
```

## 🎯 Publishing Checklist

### Pre-Publishing

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with new features
- [ ] Run tests: `npm test`
- [ ] Run linting: `npm run lint`
- [ ] Test installation: `npm pack && npm install -g ssh-manager-*.tgz`
- [ ] Test commands: `sshm generate`, `sshm list`, `sshm copy`
- [ ] Verify cross-platform compatibility
- [ ] Update documentation if needed

### Publishing

- [ ] Login to npm: `npm login`
- [ ] Publish: `npm publish --access public`
- [ ] Verify on npmjs.com
- [ ] Test installation: `npm install -g @ssh-tools/ssh-manager`
- [ ] Test global commands work

### Post-Publishing

- [ ] Create GitHub release
- [ ] Update documentation website
- [ ] Announce on social media
- [ ] Monitor for issues

## 🌍 Distribution Channels

### NPM Registry

```bash
# Install from npm
npm install -g @ssh-tools/ssh-manager

# Use with npx
npx @ssh-tools/ssh-manager generate
```

### GitHub Packages

```bash
# Configure for GitHub packages
npm config set @ssh-tools:registry https://npm.pkg.github.com

# Publish to GitHub
npm publish
```

### Alternative Registries

```bash
# Yarn
yarn global add @ssh-tools/ssh-manager

# pnpm  
pnpm add -g @ssh-tools/ssh-manager
```

## 📊 Package Statistics

### Size Optimization

```bash
# Check package size
npm pack --dry-run

# Analyze bundle
npx bundlephobia @ssh-tools/ssh-manager
```

### Download Stats

- Monitor downloads at [npmjs.com](https://www.npmjs.com/package/@ssh-tools/ssh-manager)
- Use `npm-stat` for detailed analytics

## 🔄 Version Management

### Semantic Versioning

- **Patch** (1.0.1): Bug fixes, small improvements
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

### Release Process

```bash
# Create release branch
git checkout -b release/v1.1.0

# Update version
npm version minor

# Commit changes
git commit -am "Release v1.1.0"

# Merge to main
git checkout main
git merge release/v1.1.0

# Tag release
git tag v1.1.0

# Push changes
git push origin main --tags

# Publish to npm
npm publish
```

## 🛡️ Security

### Package Security

- Use `npm audit` to check vulnerabilities
- Keep dependencies updated
- Use `.npmignore` to exclude sensitive files
- Enable 2FA on npm account

### Access Control

```bash
# Add team members
npm team add @ssh-tools:developers username

# Set package permissions
npm access grant read-write @ssh-tools:developers @ssh-tools/ssh-manager
```

## 📈 Monitoring

### Package Health

```bash
# Check package info
npm info @ssh-tools/ssh-manager

# View download stats
npm info @ssh-tools/ssh-manager --json
```

### User Feedback

- Monitor GitHub issues
- Check npm package page comments
- Track social media mentions
- Collect user feedback

## 🎉 Success Metrics

### Installation Success

- Global installation works: `npm install -g @ssh-tools/ssh-manager`
- Commands available: `sshm --help`
- Cross-platform compatibility
- Automatic setup works

### User Experience

- Zero-configuration setup
- Automatic dependency installation
- Clear error messages
- Comprehensive documentation

## 🔗 Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [NPM Best Practices](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Package.json Guide](https://docs.npmjs.com/files/package.json)

---

**Ready to publish SSH Manager to the world! 🚀**
