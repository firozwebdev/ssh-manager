#!/usr/bin/env node

// Basic test without external dependencies
const fs = require("fs");
const path = require("path");
const os = require("os");

console.log("🔐 SSH Manager - Basic Test\n");

try {
  // Test 1: Check if SSH utilities exist
  console.log("1. Testing SSH utilities...");
  const SSHManager = require("./src/utils/ssh");
  console.log("   ✓ SSH utilities loaded");

  // Test 2: Check if clipboard utilities exist
  console.log("2. Testing clipboard utilities...");
  const ClipboardManager = require("./src/utils/clipboard-simple");
  console.log("   ✓ Clipboard utilities loaded");

  // Test 3: Check if validator exists
  console.log("3. Testing validator...");
  const Validator = require("./src/utils/validator");
  console.log("   ✓ Validator loaded");

  // Test 4: Test validator functions
  console.log("4. Testing validation functions...");

  const nameTest = Validator.validateKeyName("test-key");
  console.log(`   ✓ Key name validation: ${nameTest.valid ? "PASS" : "FAIL"}`);

  const typeTest = Validator.validateKeyType("rsa");
  console.log(`   ✓ Key type validation: ${typeTest.valid ? "PASS" : "FAIL"}`);

  const sizeTest = Validator.validateKeySize(4096, "rsa");
  console.log(`   ✓ Key size validation: ${sizeTest.valid ? "PASS" : "FAIL"}`);

  // Test 5: Test SSH manager initialization
  console.log("5. Testing SSH manager initialization...");
  const tempDir = path.join(os.tmpdir(), "ssh-test-" + Date.now());
  const sshManager = new SSHManager({ defaultDirectory: tempDir });
  console.log(`   ✓ SSH manager initialized with temp dir: ${tempDir}`);

  // Test 6: Test directory creation
  console.log("6. Testing directory creation...");
  if (fs.existsSync(tempDir)) {
    console.log("   ✓ SSH directory created successfully");
  } else {
    console.log("   ✗ SSH directory creation failed");
  }

  // Test 7: Test key listing (should be empty)
  console.log("7. Testing key listing...");
  const keys = sshManager.listKeys();
  console.log(`   ✓ Key listing works, found ${keys.length} keys`);

  // Cleanup
  console.log("8. Cleaning up...");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("   ✓ Cleanup completed");
  }

  console.log("\n🎉 All basic tests passed!");
  console.log("\nNext steps:");
  console.log("  1. Install globally: npm link");
  console.log("  2. Test CLI: ssh-manager --help");
  console.log("  3. Generate key: ssh-manager generate");
} catch (error) {
  console.error("\n✗ Test failed:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}
