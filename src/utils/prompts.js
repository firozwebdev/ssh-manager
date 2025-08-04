const inquirer = require('inquirer');
const chalk = require('chalk');
const Validator = require('./validator');

class PromptManager {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Prompt for key generation options
   */
  async promptKeyGeneration(existing = {}) {
    console.log(chalk.cyan('\n🔐 SSH Key Generation Wizard\n'));
    
    const questions = [
      {
        type: 'list',
        name: 'keyType',
        message: 'Select key type:',
        choices: [
          { name: 'RSA (Recommended for compatibility)', value: 'rsa' },
          { name: 'Ed25519 (Modern, secure, fast)', value: 'ed25519' },
          { name: 'ECDSA (Elliptic Curve)', value: 'ecdsa' }
        ],
        default: existing.keyType || 'rsa'
      },
      {
        type: 'list',
        name: 'keySize',
        message: 'Select key size:',
        choices: (answers) => {
          if (answers.keyType === 'rsa') {
            return [
              { name: '2048 bits (Minimum)', value: 2048 },
              { name: '3072 bits (Good)', value: 3072 },
              { name: '4096 bits (Recommended)', value: 4096 }
            ];
          } else if (answers.keyType === 'ecdsa') {
            return [
              { name: '256 bits (P-256)', value: 256 },
              { name: '384 bits (P-384)', value: 384 },
              { name: '521 bits (P-521)', value: 521 }
            ];
          }
          return [{ name: '256 bits (Fixed for Ed25519)', value: 256 }];
        },
        default: (answers) => {
          if (answers.keyType === 'rsa') return existing.keySize || 4096;
          if (answers.keyType === 'ecdsa') return existing.keySize || 256;
          return 256;
        },
        when: (answers) => answers.keyType !== 'ed25519'
      },
      {
        type: 'input',
        name: 'keyName',
        message: 'Key name (without extension):',
        default: (answers) => existing.keyName || `id_${answers.keyType}`,
        validate: (input) => {
          const validation = Validator.validateKeyName(input);
          return validation.valid || validation.errors[0];
        },
        filter: (input) => Validator.sanitizeKeyName(input)
      },
      {
        type: 'input',
        name: 'comment',
        message: 'Comment (optional):',
        default: existing.comment || `${require('os').userInfo().username}@${require('os').hostname()}`,
        validate: (input) => {
          const validation = Validator.validateComment(input);
          return validation.valid || validation.errors[0];
        }
      },
      {
        type: 'confirm',
        name: 'usePassphrase',
        message: 'Add passphrase protection?',
        default: false
      },
      {
        type: 'password',
        name: 'passphrase',
        message: 'Enter passphrase:',
        when: (answers) => answers.usePassphrase,
        validate: (input) => {
          const validation = Validator.validatePassphrase(input, { minLength: 8 });
          return validation.valid || validation.errors[0];
        }
      },
      {
        type: 'password',
        name: 'confirmPassphrase',
        message: 'Confirm passphrase:',
        when: (answers) => answers.usePassphrase,
        validate: (input, answers) => {
          if (input !== answers.passphrase) {
            return 'Passphrases do not match';
          }
          return true;
        }
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    // Clean up answers
    if (!answers.usePassphrase) {
      answers.passphrase = '';
    }
    delete answers.usePassphrase;
    delete answers.confirmPassphrase;
    
    // Set key size for ed25519
    if (answers.keyType === 'ed25519') {
      answers.keySize = 256;
    }

    return answers;
  }

  /**
   * Prompt for key selection
   */
  async promptKeySelection(keys, message = 'Select a key:') {
    if (keys.length === 0) {
      throw new Error('No keys available for selection');
    }

    const choices = keys.map(key => ({
      name: `${key.name} (${key.type.toUpperCase()}) ${key.exists ? '' : chalk.red('- missing private key')}`,
      value: key,
      short: key.name
    }));

    const { selectedKey } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedKey',
      message,
      choices,
      pageSize: 10
    }]);

    return selectedKey;
  }

  /**
   * Prompt for confirmation
   */
  async promptConfirmation(message, defaultValue = false) {
    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue
    }]);

    return confirmed;
  }

  /**
   * Prompt for directory path
   */
  async promptDirectory(message = 'Enter directory path:', defaultPath = '') {
    const { directory } = await inquirer.prompt([{
      type: 'input',
      name: 'directory',
      message,
      default: defaultPath,
      validate: (input) => {
        const validation = Validator.validateDirectory(input);
        return validation.valid || validation.errors[0];
      }
    }]);

    return directory;
  }

  /**
   * Prompt for configuration settings
   */
  async promptConfiguration(currentConfig = {}) {
    console.log(chalk.cyan('\n⚙️  Configuration Settings\n'));

    const questions = [
      {
        type: 'input',
        name: 'sshDirectory',
        message: 'SSH directory path:',
        default: currentConfig.ssh?.defaultDirectory || '~/.ssh',
        validate: (input) => {
          const validation = Validator.validateDirectory(input);
          return validation.valid || validation.errors[0];
        }
      },
      {
        type: 'list',
        name: 'defaultKeyType',
        message: 'Default key type:',
        choices: ['rsa', 'ed25519', 'ecdsa'],
        default: currentConfig.ssh?.defaultKeyType || 'rsa'
      },
      {
        type: 'list',
        name: 'defaultKeySize',
        message: 'Default key size:',
        choices: (answers) => {
          if (answers.defaultKeyType === 'rsa') {
            return [2048, 3072, 4096];
          } else if (answers.defaultKeyType === 'ecdsa') {
            return [256, 384, 521];
          }
          return [256];
        },
        default: currentConfig.ssh?.defaultKeySize || 4096,
        when: (answers) => answers.defaultKeyType !== 'ed25519'
      },
      {
        type: 'confirm',
        name: 'enableColors',
        message: 'Enable colored output?',
        default: currentConfig.ui?.colors !== false
      },
      {
        type: 'confirm',
        name: 'enableAnimations',
        message: 'Enable loading animations?',
        default: currentConfig.ui?.animations !== false
      },
      {
        type: 'confirm',
        name: 'enableBackup',
        message: 'Enable automatic key backup?',
        default: currentConfig.security?.backupKeys !== false
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    // Set default key size for ed25519
    if (answers.defaultKeyType === 'ed25519') {
      answers.defaultKeySize = 256;
    }

    return answers;
  }

  /**
   * Prompt for backup options
   */
  async promptBackup() {
    console.log(chalk.cyan('\n💾 Backup Options\n'));

    const questions = [
      {
        type: 'input',
        name: 'backupPath',
        message: 'Backup directory path:',
        default: require('path').join(require('os').homedir(), 'ssh-backup'),
        validate: (input) => {
          const validation = Validator.validateDirectory(require('path').dirname(input));
          return validation.valid || validation.errors[0];
        }
      },
      {
        type: 'confirm',
        name: 'includePrivateKeys',
        message: 'Include private keys in backup?',
        default: true
      },
      {
        type: 'confirm',
        name: 'compress',
        message: 'Compress backup?',
        default: true
      }
    ];

    return await inquirer.prompt(questions);
  }

  /**
   * Show progress with spinner
   */
  async withProgress(message, asyncFunction) {
    const ora = require('ora');
    const spinner = ora(message).start();

    try {
      const result = await asyncFunction();
      spinner.succeed();
      return result;
    } catch (error) {
      spinner.fail();
      throw error;
    }
  }

  /**
   * Display key information
   */
  displayKeyInfo(keyInfo) {
    console.log(chalk.cyan('\n🔑 Key Information\n'));
    console.log(chalk.dim('─'.repeat(40)));
    
    console.log(`${chalk.bold('Name:')} ${keyInfo.name || keyInfo.keyName}`);
    console.log(`${chalk.bold('Type:')} ${(keyInfo.keyType || keyInfo.type || 'unknown').toUpperCase()}`);
    
    if (keyInfo.keySize) {
      console.log(`${chalk.bold('Size:')} ${keyInfo.keySize} bits`);
    }
    
    if (keyInfo.fingerprint) {
      console.log(`${chalk.bold('Fingerprint:')} ${keyInfo.fingerprint}`);
    }
    
    if (keyInfo.privateKeyPath) {
      console.log(`${chalk.bold('Private Key:')} ${keyInfo.privateKeyPath}`);
    }
    
    if (keyInfo.publicKeyPath) {
      console.log(`${chalk.bold('Public Key:')} ${keyInfo.publicKeyPath}`);
    }
    
    if (keyInfo.created) {
      console.log(`${chalk.bold('Created:')} ${keyInfo.created.toLocaleDateString()}`);
    }
    
    console.log();
  }

  /**
   * Display error with formatting
   */
  displayError(error, context = '') {
    console.log(chalk.red('\n✗ Error' + (context ? ` (${context})` : '') + ':'));
    console.log(chalk.red(`  ${error.message || error}`));
    
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach(err => {
        console.log(chalk.red(`  - ${err}`));
      });
    }
    
    console.log();
  }

  /**
   * Display success message
   */
  displaySuccess(message, details = []) {
    console.log(chalk.green(`\n✓ ${message}`));
    
    if (details.length > 0) {
      details.forEach(detail => {
        console.log(chalk.dim(`  ${detail}`));
      });
    }
    
    console.log();
  }
}

module.exports = PromptManager;
