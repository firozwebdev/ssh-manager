#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const SSHManager = require("./utils/ssh");
const ClipboardManager = require("./utils/clipboard-simple");
const StatusCommand = require("./commands/status");
const config = require("../config/default.json");

const program = new Command();
const sshManager = new SSHManager(config.ssh);
const clipboardManager = new ClipboardManager(config.clipboard);

// Global error handler
process.on("uncaughtException", (error) => {
  console.error(chalk.red("✗ Unexpected error:"), error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(chalk.red("✗ Unhandled promise rejection:"), reason);
  process.exit(1);
});

// Utility functions
const log = {
  success: (msg) => console.log(chalk.green("✓"), msg),
  error: (msg) => console.log(chalk.red("✗"), msg),
  warning: (msg) => console.log(chalk.yellow("⚠"), msg),
  info: (msg) => console.log(chalk.blue("ℹ"), msg),
  dim: (msg) => console.log(chalk.dim(msg)),
};

// Program configuration
program
  .name("ssh-manager")
  .description("A robust SSH key manager with clipboard integration")
  .version("1.0.0")
  .option("-v, --verbose", "enable verbose output")
  .option("--no-color", "disable colored output");

// Generate command
program
  .command("generate")
  .alias("gen")
  .description("Generate a new SSH key pair and copy public key to clipboard")
  .option("-t, --type <type>", "key type (rsa, ed25519, ecdsa)", "rsa")
  .option("-b, --bits <bits>", "key size in bits", "4096")
  .option("-n, --name <name>", "key name (without extension)")
  .option("-c, --comment <comment>", "key comment")
  .option("-p, --passphrase <passphrase>", "key passphrase")
  .option("-f, --force", "overwrite existing key")
  .option("-i, --interactive", "interactive mode")
  .action(async (options) => {
    try {
      let keyOptions = { ...options };

      // Interactive mode
      if (options.interactive) {
        keyOptions = await promptForKeyOptions(keyOptions);
      }

      // Set defaults
      keyOptions.keyType = keyOptions.type || "rsa";
      keyOptions.keySize = parseInt(keyOptions.bits) || 4096;
      keyOptions.keyName = keyOptions.name || `id_${keyOptions.keyType}`;
      keyOptions.overwrite = options.force || false;

      const spinner = ora("Generating SSH key pair...").start();

      try {
        const result = await sshManager.generateKeyPair(keyOptions);
        spinner.succeed("SSH key pair generated successfully");

        // Display key information
        log.info(`Key type: ${result.keyType.toUpperCase()}`);
        log.info(`Key size: ${result.keySize} bits`);
        log.info(`Private key: ${result.privateKeyPath}`);
        log.info(`Public key: ${result.publicKeyPath}`);
        log.info(`Fingerprint: ${result.fingerprint}`);

        // Copy public key to clipboard
        const publicKey = sshManager.getPublicKey(result.publicKeyPath);
        const clipResult = await clipboardManager.copyWithNotification(
          publicKey,
          "SSH public key"
        );

        log.success(clipResult.message);
        log.dim(`Key length: ${clipResult.length} characters`);
      } catch (error) {
        spinner.fail("SSH key generation failed");
        throw error;
      }
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Copy command
program
  .command("copy")
  .alias("cp")
  .description("Copy existing SSH public key to clipboard")
  .option("-n, --name <name>", "key name to copy")
  .option("-l, --list", "list available keys first")
  .action(async (options) => {
    try {
      const keys = sshManager.listKeys();

      if (keys.length === 0) {
        log.warning(
          "No SSH keys found. Generate one first with: ssh-manager generate"
        );
        return;
      }

      let selectedKey;

      if (options.list || !options.name) {
        // Show available keys and let user select
        selectedKey = await selectKey(keys, "Select key to copy:");
      } else {
        // Find key by name
        selectedKey = keys.find((key) => key.name === options.name);
        if (!selectedKey) {
          log.error(`Key not found: ${options.name}`);
          log.info("Available keys:");
          keys.forEach((key) => log.dim(`  - ${key.name} (${key.type})`));
          return;
        }
      }

      const spinner = ora("Copying public key to clipboard...").start();

      try {
        const publicKey = sshManager.getPublicKey(selectedKey.publicKeyPath);
        const clipResult = await clipboardManager.copyWithNotification(
          publicKey,
          "SSH public key"
        );

        spinner.succeed("Public key copied to clipboard");
        log.info(
          `Key: ${selectedKey.name} (${selectedKey.type.toUpperCase()})`
        );
        log.dim(`Length: ${clipResult.length} characters`);
      } catch (error) {
        spinner.fail("Failed to copy key");
        throw error;
      }
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// List command
program
  .command("list")
  .alias("ls")
  .description("List all SSH keys")
  .option("-d, --detailed", "show detailed information")
  .action(async (options) => {
    try {
      const keys = sshManager.listKeys();

      if (keys.length === 0) {
        log.warning("No SSH keys found");
        log.info("Generate your first key with: ssh-manager generate");
        return;
      }

      console.log(chalk.bold("\nSSH Keys:"));
      console.log(chalk.dim("─".repeat(60)));

      for (const key of keys) {
        const status = key.exists ? chalk.green("✓") : chalk.red("✗");
        const keyType = chalk.cyan(key.type.toUpperCase().padEnd(8));
        const keyName = chalk.white(key.name);

        console.log(`${status} ${keyType} ${keyName}`);

        if (options.detailed) {
          log.dim(`    Public:  ${key.publicKeyPath}`);
          log.dim(
            `    Private: ${key.privateKeyPath} ${
              key.exists ? "" : "(missing)"
            }`
          );
          log.dim(`    Created: ${key.created.toLocaleDateString()}`);
          log.dim(`    Size:    ${key.size} bytes`);
          console.log();
        }
      }

      if (!options.detailed) {
        log.dim("\nUse --detailed for more information");
      }
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Delete command
program
  .command("delete")
  .alias("del")
  .description("Delete SSH key pair")
  .option("-n, --name <name>", "key name to delete")
  .option("-f, --force", "skip confirmation")
  .action(async (options) => {
    try {
      const keys = sshManager.listKeys();

      if (keys.length === 0) {
        log.warning("No SSH keys found");
        return;
      }

      let selectedKey;

      if (!options.name) {
        selectedKey = await selectKey(keys, "Select key to delete:");
      } else {
        selectedKey = keys.find((key) => key.name === options.name);
        if (!selectedKey) {
          log.error(`Key not found: ${options.name}`);
          return;
        }
      }

      // Confirmation
      if (!options.force) {
        const { confirmed } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirmed",
            message: `Are you sure you want to delete key "${selectedKey.name}"?`,
            default: false,
          },
        ]);

        if (!confirmed) {
          log.info("Deletion cancelled");
          return;
        }
      }

      const result = sshManager.deleteKey(selectedKey.name);
      log.success(
        `Deleted ${result.deleted.join(" and ")} key(s): ${result.keyName}`
      );
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Helper functions
async function promptForKeyOptions(existing = {}) {
  const questions = [
    {
      type: "list",
      name: "type",
      message: "Select key type:",
      choices: ["rsa", "ed25519", "ecdsa"],
      default: existing.type || "rsa",
    },
    {
      type: "list",
      name: "bits",
      message: "Select key size:",
      choices: (answers) => {
        if (answers.type === "rsa") return ["2048", "3072", "4096"];
        if (answers.type === "ecdsa") return ["256", "384", "521"];
        return ["256"]; // ed25519 has fixed size
      },
      default: existing.bits || "4096",
      when: (answers) => answers.type !== "ed25519",
    },
    {
      type: "input",
      name: "name",
      message: "Key name (without extension):",
      default: (answers) => existing.name || `id_${answers.type}`,
    },
    {
      type: "input",
      name: "comment",
      message: "Comment (optional):",
      default: existing.comment || "",
    },
  ];

  return await inquirer.prompt(questions);
}

async function selectKey(keys, message) {
  const choices = keys.map((key) => ({
    name: `${key.name} (${key.type.toUpperCase()}) ${
      key.exists ? "" : "- missing private key"
    }`,
    value: key,
  }));

  const { selectedKey } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedKey",
      message,
      choices,
    },
  ]);

  return selectedKey;
}

// Status command
program
  .command("status")
  .alias("st")
  .description("Show SSH manager and system status")
  .action(async () => {
    try {
      const statusCommand = new StatusCommand(config);
      await statusCommand.execute();
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
