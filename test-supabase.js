#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    
    // Try a simple query that should work even without tables
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth test failed:', error.message);
    } else {
      console.log('✅ Auth connection successful');
    }

    // Try to list tables (this might fail but will give us info)
    console.log('\n2. Testing database access...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);

    if (tablesError) {
      console.log('❌ Database query failed:', tablesError.message);
      
      // Try a different approach - test with a simple RPC call
      console.log('\n3. Testing with RPC call...');
      const { data: version, error: versionError } = await supabase.rpc('version');
      
      if (versionError) {
        console.log('❌ RPC call failed:', versionError.message);
      } else {
        console.log('✅ RPC call successful:', version);
      }
    } else {
      console.log('✅ Database access successful');
      console.log('Tables found:', tables?.map(t => t.table_name) || []);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();