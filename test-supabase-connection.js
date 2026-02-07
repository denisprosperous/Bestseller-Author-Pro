/**
 * Test Supabase Connection
 * Run this to verify your Supabase API key is correct
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_PROJECT_URL || process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.VITE_SUPABASE_API_KEY || process.env.SUPABASE_API_KEY;

console.log('\n🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key (first 50 chars):', supabaseKey?.substring(0, 50) + '...');
console.log('Key length:', supabaseKey?.length, 'characters');
console.log('\n---\n');

// Check key format
if (!supabaseKey) {
  console.error('❌ ERROR: No Supabase API key found in .env file');
  console.error('   Please add VITE_SUPABASE_API_KEY to your .env file');
  process.exit(1);
}

const parts = supabaseKey.split('.');
console.log('Key structure:');
console.log('  - Header length:', parts[0]?.length || 0);
console.log('  - Payload length:', parts[1]?.length || 0);
console.log('  - Signature length:', parts[2]?.length || 0);

if (parts.length !== 3) {
  console.error('\n❌ ERROR: Invalid JWT format');
  console.error('   Expected 3 parts (header.payload.signature)');
  console.error('   Got', parts.length, 'parts');
  process.exit(1);
}

if (parts[2].length < 40) {
  console.error('\n⚠️  WARNING: Signature seems too short');
  console.error('   Expected ~43 characters, got', parts[2].length);
  console.error('   Your key might be incomplete!');
}

console.log('\n---\n');

// Try to create client
try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully');
  
  // Test authentication
  console.log('\n🔐 Testing authentication...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Session error:', sessionError.message);
  } else {
    console.log('✅ Auth service responding');
    console.log('   Current session:', session ? 'Active' : 'None (expected for new connection)');
  }
  
  // Test database connection
  console.log('\n📊 Testing database connection...');
  const { data, error } = await supabase
    .from('ebooks')
    .select('count')
    .limit(1);
  
  if (error) {
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('⚠️  Table "ebooks" not found (needs to be created)');
      console.log('   Run: project/database/schema.sql in Supabase dashboard');
    } else if (error.message.includes('JWT')) {
      console.error('❌ JWT Error:', error.message);
      console.error('   Your API key is invalid or incomplete!');
      process.exit(1);
    } else {
      console.error('❌ Database error:', error.message);
    }
  } else {
    console.log('✅ Database connection successful');
    console.log('   Can query tables');
  }
  
  console.log('\n---\n');
  console.log('✅ CONNECTION TEST COMPLETE\n');
  
  if (parts[2].length < 40) {
    console.log('⚠️  RECOMMENDATION: Get the complete API key from Supabase dashboard');
    console.log('   Go to: https://supabase.com/dashboard');
    console.log('   Navigate to: Settings → API → Project API keys → anon (public)');
  }
  
} catch (error) {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error('\nPossible causes:');
  console.error('  1. Invalid API key format');
  console.error('  2. Network connection issue');
  console.error('  3. Supabase service unavailable');
  process.exit(1);
}
