const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { execSync } = require('child_process');

class BackupCommand {
  constructor(sshManager, config = {}) {
    this.sshManager = sshManager;
    this.config = config;
  }

  /**
   * Create backup of SSH keys
   */
  async createBackup(options = {}) {
    const {
      backupPath = path.join(require('os').homedir(), 'ssh-backup'),
      includePrivateKeys = true,
      compress = true,
      timestamp = true
    } = options;

    const spinner = ora('Creating SSH keys backup...').start();

    try {
      // Create timestamped backup directory
      const backupName = timestamp 
        ? `ssh-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
        : 'ssh-backup';
      
      const fullBackupPath = path.join(backupPath, backupName);
      
      // Ensure backup directory exists
      fs.mkdirSync(fullBackupPath, { recursive: true });

      // Get list of keys
      const keys = this.sshManager.listKeys();
      
      if (keys.length === 0) {
        spinner.warn('No SSH keys found to backup');
        return { success: false, message: 'No keys to backup' };
      }

      let backedUpKeys = 0;
      const backupLog = [];

      // Copy each key
      for (const key of keys) {
        try {
          // Always backup public key
          if (fs.existsSync(key.publicKeyPath)) {
            const publicBackupPath = path.join(fullBackupPath, `${key.name}.pub`);
            fs.copyFileSync(key.publicKeyPath, publicBackupPath);
            backupLog.push(`✓ Public key: ${key.name}.pub`);
          }

          // Backup private key if it exists and requested
          if (includePrivateKeys && fs.existsSync(key.privateKeyPath)) {
            const privateBackupPath = path.join(fullBackupPath, key.name);
            fs.copyFileSync(key.privateKeyPath, privateBackupPath);
            
            // Set proper permissions on Unix systems
            if (process.platform !== 'win32') {
              fs.chmodSync(privateBackupPath, 0o600);
            }
            
            backupLog.push(`✓ Private key: ${key.name}`);
          }

          backedUpKeys++;
        } catch (error) {
          backupLog.push(`✗ Failed to backup ${key.name}: ${error.message}`);
        }
      }

      // Create backup manifest
      const manifest = {
        created: new Date().toISOString(),
        source: this.sshManager.config.defaultDirectory,
        keys: keys.map(key => ({
          name: key.name,
          type: key.type,
          publicKeyExists: fs.existsSync(key.publicKeyPath),
          privateKeyExists: fs.existsSync(key.privateKeyPath),
          backedUp: backedUpKeys > 0
        })),
        options: {
          includePrivateKeys,
          compress
        }
      };

      fs.writeFileSync(path.join(fullBackupPath, 'manifest.json'), JSON.stringify(manifest, null, 2));

      // Compress if requested
      let finalPath = fullBackupPath;
      if (compress) {
        spinner.text = 'Compressing backup...';
        finalPath = await this.compressBackup(fullBackupPath);
        
        // Remove uncompressed directory
        await fs.remove(fullBackupPath);
      }

      spinner.succeed(`Backup created successfully: ${finalPath}`);

      return {
        success: true,
        backupPath: finalPath,
        keysBackedUp: backedUpKeys,
        totalKeys: keys.length,
        log: backupLog,
        compressed: compress
      };

    } catch (error) {
      spinner.fail('Backup failed');
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Restore SSH keys from backup
   */
  async restoreBackup(backupPath, options = {}) {
    const {
      overwrite = false,
      restorePrivateKeys = true,
      dryRun = false
    } = options;

    const spinner = ora('Restoring SSH keys from backup...').start();

    try {
      let actualBackupPath = backupPath;

      // Check if backup is compressed
      if (backupPath.endsWith('.tar.gz') || backupPath.endsWith('.zip')) {
        spinner.text = 'Extracting backup...';
        actualBackupPath = await this.extractBackup(backupPath);
      }

      // Read manifest
      const manifestPath = path.join(actualBackupPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Invalid backup: manifest.json not found');
      }

      const manifest = await fs.readJson(manifestPath);
      const restoreLog = [];
      let restoredKeys = 0;

      if (dryRun) {
        spinner.text = 'Analyzing backup (dry run)...';
      }

      // Restore each key
      for (const keyInfo of manifest.keys) {
        const publicBackupPath = path.join(actualBackupPath, `${keyInfo.name}.pub`);
        const privateBackupPath = path.join(actualBackupPath, keyInfo.name);
        
        const publicTargetPath = path.join(this.sshManager.config.defaultDirectory, `${keyInfo.name}.pub`);
        const privateTargetPath = path.join(this.sshManager.config.defaultDirectory, keyInfo.name);

        try {
          // Check if files exist in backup
          const hasPublicBackup = fs.existsSync(publicBackupPath);
          const hasPrivateBackup = fs.existsSync(privateBackupPath);

          if (!hasPublicBackup && !hasPrivateBackup) {
            restoreLog.push(`⚠ No backup files found for ${keyInfo.name}`);
            continue;
          }

          // Check for conflicts
          const publicExists = fs.existsSync(publicTargetPath);
          const privateExists = fs.existsSync(privateTargetPath);

          if ((publicExists || privateExists) && !overwrite) {
            restoreLog.push(`⚠ Skipped ${keyInfo.name} (already exists, use --overwrite to replace)`);
            continue;
          }

          if (!dryRun) {
            // Restore public key
            if (hasPublicBackup) {
              await fs.copy(publicBackupPath, publicTargetPath);
              if (process.platform !== 'win32') {
                fs.chmodSync(publicTargetPath, 0o644);
              }
              restoreLog.push(`✓ Restored public key: ${keyInfo.name}.pub`);
            }

            // Restore private key
            if (hasPrivateBackup && restorePrivateKeys) {
              await fs.copy(privateBackupPath, privateTargetPath);
              if (process.platform !== 'win32') {
                fs.chmodSync(privateTargetPath, 0o600);
              }
              restoreLog.push(`✓ Restored private key: ${keyInfo.name}`);
            }
          } else {
            restoreLog.push(`✓ Would restore: ${keyInfo.name} (public: ${hasPublicBackup}, private: ${hasPrivateBackup})`);
          }

          restoredKeys++;
        } catch (error) {
          restoreLog.push(`✗ Failed to restore ${keyInfo.name}: ${error.message}`);
        }
      }

      // Clean up extracted backup if it was compressed
      if (backupPath !== actualBackupPath) {
        await fs.remove(actualBackupPath);
      }

      const action = dryRun ? 'analyzed' : 'restored';
      spinner.succeed(`Backup ${action} successfully`);

      return {
        success: true,
        keysRestored: restoredKeys,
        totalKeys: manifest.keys.length,
        log: restoreLog,
        manifest,
        dryRun
      };

    } catch (error) {
      spinner.fail('Restore failed');
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * List available backups
   */
  async listBackups(backupDirectory) {
    try {
      if (!fs.existsSync(backupDirectory)) {
        return [];
      }

      const items = await fs.readdir(backupDirectory);
      const backups = [];

      for (const item of items) {
        const itemPath = path.join(backupDirectory, item);
        const stats = await fs.stat(itemPath);

        let manifest = null;
        let isValid = false;

        if (stats.isDirectory()) {
          // Check for manifest in directory
          const manifestPath = path.join(itemPath, 'manifest.json');
          if (fs.existsSync(manifestPath)) {
            try {
              manifest = await fs.readJson(manifestPath);
              isValid = true;
            } catch (error) {
              // Invalid manifest
            }
          }
        } else if (item.endsWith('.tar.gz') || item.endsWith('.zip')) {
          // Compressed backup - we'll assume it's valid for now
          isValid = true;
        }

        if (isValid) {
          backups.push({
            name: item,
            path: itemPath,
            created: stats.birthtime,
            modified: stats.mtime,
            size: stats.size,
            isCompressed: !stats.isDirectory(),
            manifest
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created - a.created);

      return backups;
    } catch (error) {
      throw new Error(`Failed to list backups: ${error.message}`);
    }
  }

  /**
   * Compress backup directory
   */
  async compressBackup(backupPath) {
    const tarPath = `${backupPath}.tar.gz`;
    
    try {
      // Use tar command if available
      execSync(`tar -czf "${tarPath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`, {
        stdio: 'ignore'
      });
      
      return tarPath;
    } catch (error) {
      // Fallback to manual compression (simplified)
      throw new Error('Compression failed: tar command not available');
    }
  }

  /**
   * Extract compressed backup
   */
  async extractBackup(backupPath) {
    const extractPath = backupPath.replace(/\.(tar\.gz|zip)$/, '');
    
    try {
      if (backupPath.endsWith('.tar.gz')) {
        execSync(`tar -xzf "${backupPath}" -C "${path.dirname(backupPath)}"`, {
          stdio: 'ignore'
        });
      } else if (backupPath.endsWith('.zip')) {
        execSync(`unzip -q "${backupPath}" -d "${path.dirname(backupPath)}"`, {
          stdio: 'ignore'
        });
      }
      
      return extractPath;
    } catch (error) {
      throw new Error(`Extraction failed: ${error.message}`);
    }
  }
}

module.exports = BackupCommand;
