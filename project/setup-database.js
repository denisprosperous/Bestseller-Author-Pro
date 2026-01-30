#!/usr/bin/env node

/**
 * Database Setup Verification Script
 * 
 * This script verifies your Supabase connection and database schema.
 * Run with: node setup-database.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('\nPlease set up your .env file with:');
  console.log('SUPABASE_PROJECT_URL=https://your-project-id.supabase.co');
  console.log('SUPABASE_API_KEY=your-anon-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase connection...\n');

  try {
    // Test basic connection with a simple query
    console.log('1. Testing connection...');
    const { data, error } = await supabase
      .from('api_keys')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      
      // Check if it's a table not found error
      if (error.message.includes('relation "api_keys" does not exist')) {
        console.log('\n🔧 Database schema not found. Please run the schema SQL in Supabase:');
        console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql');
        console.log('2. Copy and paste the contents of project/database/schema.sql');
        console.log('3. Click "Run" to create all tables');
        console.log('4. Run this script again to verify');
        return false;
      }
      
      return false;
    }
    
    console.log('✅ Connection successful!');

    // Check required tables
    console.log('\n2. Checking database schema...');
    
    const tables = ['api_keys', 'ebooks', 'chapters', 'generation_sessions'];
    const tableResults = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
          tableResults[table] = false;
        } else {
          console.log(`✅ Table '${table}': Found`);
          tableResults[table] = true;
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
        tableResults[table] = false;
      }
    }

    // Check RLS policies
    console.log('\n3. Checking Row Level Security...');
    try {
      // This will fail if RLS is properly configured and user is not authenticated
      const { data, error } = await supabase.from('ebooks').select('*').limit(1);
      
      if (error && error.message.includes('RLS')) {
        console.log('✅ RLS policies are active (this is good!)');
      } else if (error) {
        console.log('⚠️  RLS check inconclusive:', error.message);
      } else {
        console.log('⚠️  RLS might not be properly configured');
      }
    } catch (err) {
      console.log('⚠️  RLS check failed:', err.message);
    }

    // Summary
    console.log('\n📊 Database Setup Summary:');
    console.log('================================');
    console.log(`Connection: ✅ Working`);
    console.log(`Project URL: ${supabaseUrl}`);
    
    const allTablesExist = Object.values(tableResults).every(exists => exists);
    if (allTablesExist) {
      console.log('Schema: ✅ All required tables found');
      console.log('\n🎉 Your database is ready!');
      console.log('\nNext steps:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Visit http://localhost:5173');
      console.log('3. Create an account and test the features');
    } else {
      console.log('Schema: ❌ Some tables are missing');
      console.log('\nPlease run your database schema SQL in Supabase SQL Editor:');
      console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql');
      console.log('2. Paste and run the contents of project/database/schema.sql');
      console.log('3. Run this script again to verify');
    }

    return allTablesExist;

  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your SUPABASE_PROJECT_URL and SUPABASE_API_KEY in .env');
    console.log('2. Ensure your Supabase project is active');
    console.log('3. Verify your API key has the correct permissions');
    return false;
  }
}

// Run verification
verifyDatabase().then(success => {
  process.exit(success ? 0 : 1);
});