#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Testing Environment Variables...\n');

const requiredVars = [
  'SUPABASE_PROJECT_URL',
  'SUPABASE_API_KEY',
  'ENCRYPTION_KEY',
  'XAI_API_KEY',
  'OPENAI_API_KEY'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allGood = false;
  }
});

console.log('\n📊 Summary:');
if (allGood) {
  console.log('✅ All required environment variables are set!');
} else {
  console.log('❌ Some environment variables are missing.');
}

// Test Supabase URL format
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
  console.log('✅ Supabase URL format looks correct');
} else {
  console.log('❌ Supabase URL format may be incorrect');
}

process.exit(allGood ? 0 : 1);