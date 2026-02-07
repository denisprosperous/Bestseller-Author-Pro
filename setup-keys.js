#!/usr/bin/env node

/**
 * Setup API Keys Script
 * This script loads API keys from .env and displays them
 * You'll need to manually add them via the browser
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔑 API Keys from .env file:\n');
console.log('═'.repeat(80));

// Read .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract API keys
const keys = {
  openai: envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim(),
  anthropic: envContent.match(/ANTHROPIC_API_KEY=(.+)/)?.[1]?.trim(),
  google: envContent.match(/GOOGLE_AI_API_KEY=(.+)/)?.[1]?.trim(),
  xai: envContent.match(/XAI_API_KEY=(.+)/)?.[1]?.trim(),
  deepseek: envContent.match(/HUGGINGFACE_API_KEY=(.+)/)?.[1]?.trim()
};

// Display keys
Object.entries(keys).forEach(([provider, key]) => {
  if (key) {
    const preview = key.substring(0, 20) + '...' + key.substring(key.length - 10);
    console.log(`✅ ${provider.toUpperCase().padEnd(12)} ${preview}`);
  } else {
    console.log(`❌ ${provider.toUpperCase().padEnd(12)} NOT FOUND`);
  }
});

console.log('═'.repeat(80));
console.log('\n📋 To use these keys:\n');
console.log('1. Open your browser to: http://localhost:5173/setup-test-keys.html');
console.log('2. Click "Setup All API Keys"');
console.log('3. Keys will be loaded into localStorage');
console.log('4. Start testing!\n');

// Generate localStorage JSON
const localStorageKeys = Object.entries(keys)
  .filter(([_, key]) => key)
  .map(([provider, key]) => ({
    provider,
    key,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

console.log('📦 localStorage JSON (for manual setup if needed):\n');
console.log(JSON.stringify(localStorageKeys, null, 2));
console.log('\n');
