
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coreSchemaPath = path.join(__dirname, 'setup-corrected.sql');
const saasSchemaPath = path.join(__dirname, 'saas_extensions.sql');
const migrationDir = path.join(__dirname, '../supabase/migrations');

// Ensure migration dir exists
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
}

const migrationPath = path.join(migrationDir, '20240204120000_comprehensive_schema.sql');

try {
  const coreSchema = fs.readFileSync(coreSchemaPath, 'utf8');
  const saasSchema = fs.readFileSync(saasSchemaPath, 'utf8');
  
  const completeSchema = coreSchema + '\n\n' + saasSchema;
  
  fs.writeFileSync(migrationPath, completeSchema);
  console.log(`Migration created at: ${migrationPath}`);
} catch (err) {
  console.error('Error creating migration:', err);
}
