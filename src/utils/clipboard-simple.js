const { execSync, spawn } = require('child_process');
const os = require('os');

class SimpleClipboardManager {
  constructor(config = {}) {
    this.config = {
      timeout: 5000,
      fallbackMethods: this.getFallbackMethods(),
      ...config
    };
  }

  /**
   * Get platform-specific fallback methods
   */
  getFallbackMethods() {
    const platform = os.platform();
    
    switch (platform) {
      case 'darwin': // macOS
        return ['pbcopy'];
      case 'linux':
        return ['xclip', 'xsel'];
      case 'win32': // Windows
        return ['clip'];
      default:
        return [];
    }
  }

  /**
   * Copy text to clipboard using platform-specific methods
   */
  async copy(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text provided for clipboard copy');
    }

    // Try fallback methods
    for (const method of this.config.fallbackMethods) {
      try {
        await this.copyWithFallback(text, method);
        return { method, success: true };
      } catch (fallbackError) {
        console.warn(`Fallback method ${method} failed:`, fallbackError.message);
      }
    }
    
    throw new Error('All clipboard methods failed. Text could not be copied.');
  }

  /**
   * Copy using platform-specific fallback methods
   */
  async copyWithFallback(text, method) {
    return new Promise((resolve, reject) => {
      let command;
      
      switch (method) {
        case 'pbcopy': // macOS
          command = 'pbcopy';
          break;
        case 'xclip': // Linux
          command = 'xclip -selection clipboard';
          break;
        case 'xsel': // Linux alternative
          command = 'xsel --clipboard --input';
          break;
        case 'clip': // Windows
          command = 'clip';
          break;
        default:
          reject(new Error(`Unknown fallback method: ${method}`));
          return;
      }

      try {
        // Check if command exists
        execSync(`where ${method}`, { stdio: 'ignore' });
      } catch (error) {
        reject(new Error(`Command not found: ${method}`));
        return;
      }

      const child = spawn(command, [], { 
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${method} failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`${method} process error: ${error.message}`));
      });

      // Write text to stdin
      child.stdin.write(text);
      child.stdin.end();

      // Set timeout
      setTimeout(() => {
        child.kill();
        reject(new Error(`${method} operation timed out`));
      }, this.config.timeout);
    });
  }

  /**
   * Read from clipboard (simplified - just return empty for now)
   */
  async read() {
    // For simplicity, we'll just return empty string
    // In a real implementation, you'd use platform-specific read commands
    return '';
  }

  /**
   * Check if clipboard contains SSH key
   */
  async containsSSHKey() {
    try {
      const content = await this.read();
      return this.isSSHKey(content);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate if text is an SSH key
   */
  isSSHKey(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const sshKeyPatterns = [
      /^ssh-rsa\s+[A-Za-z0-9+/]+=*\s*.*/,
      /^ssh-ed25519\s+[A-Za-z0-9+/]+=*\s*.*/,
      /^ecdsa-sha2-\w+\s+[A-Za-z0-9+/]+=*\s*.*/,
      /^ssh-dss\s+[A-Za-z0-9+/]+=*\s*.*/
    ];

    return sshKeyPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Clear clipboard
   */
  async clear() {
    try {
      await this.copy('');
      return true;
    } catch (error) {
      throw new Error(`Failed to clear clipboard: ${error.message}`);
    }
  }

  /**
   * Get clipboard status and info
   */
  async getStatus() {
    try {
      const content = await this.read();
      const isSSHKey = this.isSSHKey(content);
      
      return {
        hasContent: content.length > 0,
        contentLength: content.length,
        isSSHKey,
        keyType: isSSHKey ? this.detectKeyType(content) : null,
        preview: content.length > 50 ? content.substring(0, 50) + '...' : content
      };
    } catch (error) {
      return {
        hasContent: false,
        contentLength: 0,
        isSSHKey: false,
        keyType: null,
        preview: '',
        error: error.message
      };
    }
  }

  /**
   * Detect SSH key type from content
   */
  detectKeyType(content) {
    if (content.startsWith('ssh-rsa')) return 'RSA';
    if (content.startsWith('ssh-ed25519')) return 'Ed25519';
    if (content.startsWith('ecdsa-sha2-')) return 'ECDSA';
    if (content.startsWith('ssh-dss')) return 'DSA';
    return 'Unknown';
  }

  /**
   * Copy with success notification
   */
  async copyWithNotification(text, description = 'Text') {
    try {
      const result = await this.copy(text);
      return {
        ...result,
        message: `${description} copied to clipboard successfully using ${result.method}`,
        length: text.length
      };
    } catch (error) {
      throw new Error(`Failed to copy ${description.toLowerCase()}: ${error.message}`);
    }
  }
}

module.exports = SimpleClipboardManager;
