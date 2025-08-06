#!/usr/bin/env node

/**
 * Test script to verify automatic clipboard installation
 */

const { execSync } = require('child_process');
const ClipboardManager = require('./src/utils/clipboard-simple');

async function testAutoInstall() {
  console.log('🧪 Testing Automatic Clipboard Installation\n');
  
  // Check current platform
  const platform = process.platform;
  console.log(`Platform: ${platform}`);
  
  if (platform !== 'linux') {
    console.log('❌ This test is for Linux systems only');
    return;
  }
  
  const clipboard = new ClipboardManager();
  
  // Check if clipboard tools are working
  console.log('🔍 Checking current clipboard tools...');
  const hasWorking = await clipboard.checkLinuxClipboardTools();
  console.log(`Working clipboard tools: ${hasWorking ? 'Yes' : 'No'}`);
  
  // Get available methods
  const methods = clipboard.getLinuxMethods();
  console.log(`Available methods: ${methods.length > 0 ? methods.join(', ') : 'None'}`);
  
  // Test the copy functionality
  console.log('\n📋 Testing clipboard copy functionality...');
  
  try {
    const testText = 'SSH Manager Auto-Install Test - ' + Date.now();
    const result = await clipboard.copy(testText);
    
    if (result.success) {
      console.log(`✅ Copy successful using: ${result.method}`);
      
      // Try to read back
      try {
        const readText = await clipboard.read();
        if (readText.includes('SSH Manager Auto-Install Test')) {
          console.log('✅ Read back successful - clipboard is working!');
        } else {
          console.log('⚠️  Read back failed - clipboard content mismatch');
        }
      } catch (readError) {
        console.log('⚠️  Read back failed:', readError.message);
      }
    } else {
      console.log('❌ Copy failed');
      if (result.text) {
        console.log('Manual copy would be provided to user');
      }
    }
  } catch (error) {
    console.log('❌ Copy test failed:', error.message);
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('- Automatic installation should trigger if no working tools found');
  console.log('- User should see installation progress messages');
  console.log('- Copy should succeed after installation');
  console.log('- Manual copy fallback should work if installation fails');
}

// Run test
if (require.main === module) {
  testAutoInstall().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = testAutoInstall;
