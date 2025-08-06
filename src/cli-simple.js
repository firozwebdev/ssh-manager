#!/usr/bin/env node

const { Command } = require("commander");
const SSHManager = require("./utils/ssh");
const ClipboardManager = require("./utils/clipboard-simple");
const SystemSetup = require("./utils/system-setup");
const config = require("../config/default.json");

const program = new Command();
const sshManager = new SSHManager(config.ssh);
const clipboardManager = new ClipboardManager(config.clipboard);
const systemSetup = new SystemSetup();

// Utility functions
const log = {
  success: (msg) => console.log("✓", msg),
  error: (msg) => console.log("✗", msg),
  warning: (msg) => console.log("⚠", msg),
  info: (msg) => console.log("ℹ", msg),
  dim: (msg) => console.log(msg),
};

// Program configuration
program
  .name("ssh-manager")
  .description("A robust SSH key manager with clipboard integration")
  .version("1.0.0")
  .option("-v, --verbose", "enable verbose output");

// Generate command
program
  .command("generate")
  .alias("gen")
  .description("Generate a new SSH key pair and copy public key to clipboard")
  .option("-t, --type <type>", "key type (rsa, ed25519, ecdsa)", "rsa")
  .option("-b, --bits <bits>", "key size in bits", "4096")
  .option("-n, --name <name>", "key name (without extension)")
  .option("-c, --comment <comment>", "key comment")
  .option("-f, --force", "overwrite existing key")
  .action(async (options) => {
    try {
      console.log("🔐 SSH Manager - Automatic Setup & Key Generation\n");

      // Auto-setup system if needed
      console.log("🔧 Checking system requirements...");
      if (!systemSetup.checkSSHKeygen()) {
        console.log("⚠️  OpenSSH not found. Setting up automatically...\n");

        const setupSuccess = await systemSetup.setupSystem();
        if (!setupSuccess) {
          log.error(
            "System setup failed. Please install OpenSSH manually and try again."
          );
          process.exit(1);
        }
        console.log("");
      } else {
        console.log("✅ OpenSSH is available!\n");
      }

      console.log("🔑 Generating SSH key pair...");

      // Set defaults
      const keyOptions = {
        keyType: options.type || "rsa",
        keySize: parseInt(options.bits) || 4096,
        keyName: options.name || `id_${options.type || "rsa"}`,
        comment:
          options.comment ||
          `${require("os").userInfo().username}@${require("os").hostname()}`,
        overwrite: options.force || false,
        passphrase: "", // No passphrase for simplicity
      };

      console.log("⏳ Generating key...");
      const result = await sshManager.generateKeyPair(keyOptions);

      log.success("SSH key pair generated successfully");
      log.info(`Key type: ${result.keyType.toUpperCase()}`);
      log.info(`Key size: ${result.keySize} bits`);
      log.info(`Private key: ${result.privateKeyPath}`);
      log.info(`Public key: ${result.publicKeyPath}`);
      log.info(`Fingerprint: ${result.fingerprint}`);

      // Copy public key to clipboard
      console.log("\n⏳ Copying public key to clipboard...");
      const publicKey = sshManager.getPublicKey(result.publicKeyPath);

      try {
        const clipResult = await clipboardManager.copyWithNotification(
          publicKey,
          "SSH public key"
        );
        log.success(clipResult.message);
        log.dim(`Key length: ${clipResult.length} characters`);
      } catch (clipError) {
        log.warning(
          "Clipboard copy failed, but key was generated successfully"
        );
        log.dim(
          "You can manually copy the public key from: " + result.publicKeyPath
        );
      }

      console.log("\n🎉 Done! Your SSH key is ready to use.");
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

      if (options.name) {
        // Find key by name
        selectedKey = keys.find((key) => key.name === options.name);
        if (!selectedKey) {
          log.error(`Key not found: ${options.name}`);
          log.info("Available keys:");
          keys.forEach((key) => log.dim(`  - ${key.name} (${key.type})`));
          return;
        }
      } else {
        // Use first available key
        selectedKey = keys[0];
        if (keys.length > 1) {
          log.info(`Multiple keys found, using: ${selectedKey.name}`);
          log.dim("Use --name to specify a different key");
        }
      }

      console.log("⏳ Copying public key to clipboard...");

      try {
        const publicKey = sshManager.getPublicKey(selectedKey.publicKeyPath);
        const clipResult = await clipboardManager.copyWithNotification(
          publicKey,
          "SSH public key"
        );

        log.success("Public key copied to clipboard");
        log.info(
          `Key: ${selectedKey.name} (${selectedKey.type.toUpperCase()})`
        );
        log.dim(`Length: ${clipResult.length} characters`);
      } catch (clipError) {
        log.error("Failed to copy key to clipboard");
        log.dim("Manual copy from: " + selectedKey.publicKeyPath);
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

      console.log("\n🔑 SSH Keys:\n");

      for (const key of keys) {
        const status = key.exists ? "✓" : "✗";
        const keyType = key.type.toUpperCase().padEnd(8);
        const keyName = key.name;

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
        log.error(
          "Key name is required. Use --name to specify which key to delete"
        );
        log.info("Available keys:");
        keys.forEach((key) => log.dim(`  - ${key.name} (${key.type})`));
        return;
      }

      selectedKey = keys.find((key) => key.name === options.name);
      if (!selectedKey) {
        log.error(`Key not found: ${options.name}`);
        return;
      }

      // Simple confirmation
      if (!options.force) {
        log.warning(
          `This will delete key "${selectedKey.name}". Use --force to confirm.`
        );
        return;
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

// Status command
program
  .command("status")
  .alias("st")
  .description("Show SSH manager and system status")
  .action(async () => {
    try {
      console.log("\n🔐 SSH Manager Status\n");

      // SSH Directory Status
      console.log("📁 SSH Directory");
      const sshDir = sshManager.config.defaultDirectory;
      const fs = require("fs");

      if (fs.existsSync(sshDir)) {
        log.success(`Directory exists: ${sshDir}`);
      } else {
        log.error(`Directory not found: ${sshDir}`);
      }

      // Keys Status
      console.log("\n🔑 SSH Keys");
      const keys = sshManager.listKeys();

      if (keys.length === 0) {
        log.warning("No SSH keys found");
      } else {
        log.success(`Found ${keys.length} key(s)`);
        keys.forEach((key) => {
          const status = key.exists ? "✓" : "✗";
          console.log(
            `  ${status} ${key.type.toUpperCase().padEnd(8)} ${key.name}`
          );
        });
      }

      // System Status
      console.log("\n⚙️  System");

      // Check ssh-keygen availability
      try {
        const { execSync } = require("child_process");
        execSync("ssh-keygen -?", { stdio: "pipe" });
        log.success("ssh-keygen available");
      } catch (error) {
        // ssh-keygen -? returns non-zero but shows usage if available
        if (error.stderr && error.stderr.includes('usage: ssh-keygen')) {
          log.success("ssh-keygen available");
        } else if (error.stdout && error.stdout.includes('usage: ssh-keygen')) {
          log.success("ssh-keygen available");
        } else {
          log.error("ssh-keygen not found");
          log.dim("Install OpenSSH to use this tool");
        }
      }

      // Platform info
      const os = require("os");
      log.success(`Platform: ${os.platform()} ${os.arch()}`);
      log.success(`Node.js: ${process.version}`);

      console.log();
    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Handle direct command aliases
const scriptName = require("path").basename(process.argv[1], ".js");

// Auto-execute commands based on script name
if (scriptName === "ssh-gen") {
  // Auto-run generate command
  process.argv.splice(2, 0, "generate");
} else if (scriptName === "ssh-copy") {
  // Auto-run copy command
  process.argv.splice(2, 0, "copy");
} else if (scriptName === "ssh-list") {
  // Auto-run list command
  process.argv.splice(2, 0, "list");
}

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
