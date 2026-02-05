
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Connection string format: postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const PROJECT_REF = 'shzfuasxqqflrfiiwtpw';
const DB_HOST = `db.${PROJECT_REF}.supabase.co`; 
const DB_USER = 'postgres'; 
const DB_PORT = 5432;
const DB_NAME = 'postgres';

async function runMigration(password) {
  const connectionString = `postgres://${DB_USER}:${password}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  
  console.log(`Connecting to ${DB_HOST} on port ${DB_PORT}...`);
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    // Read SQL files
    const coreSchema = fs.readFileSync(path.join(__dirname, 'setup-corrected.sql'), 'utf8');
    const saasSchema = fs.readFileSync(path.join(__dirname, 'saas_extensions.sql'), 'utf8');

    // Run Core Schema
    console.log('Running Core Schema Migration...');
    await client.query(coreSchema);
    console.log('Core Schema applied successfully.');

    // Run SaaS Schema
    console.log('Running SaaS Extensions Migration...');
    await client.query(saasSchema);
    console.log('SaaS Extensions applied successfully.');

    console.log('All migrations completed!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

// Get password from command line arg
const password = process.argv[2];

if (!password) {
  console.error('Please provide the database password as an argument.');
  console.error('Usage: node database/run-schema.js <PASSWORD>');
  process.exit(1);
}

runMigration(password);
