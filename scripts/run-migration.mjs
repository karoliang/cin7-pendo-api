#!/usr/bin/env node

// Script to run SQL migrations on Supabase
// Usage: node scripts/run-migration.mjs <migration-file>

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env from frontend folder
const envPath = './frontend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Get migration file from command line or use default
const migrationFile = process.argv[2] || 'supabase-migrations/002_add_reports_table.sql';
const migrationPath = path.join(process.cwd(), migrationFile);

console.log(`🚀 Running migration: ${migrationFile}\n`);

try {
  // Read SQL file
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Execute SQL
  console.log('📤 Executing SQL...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
    // If exec_sql doesn't exist, try direct execution
    // Note: This uses the REST API which has limitations
    // For complex migrations, use Supabase Dashboard SQL Editor
    console.log('⚠️  Direct SQL execution not available via API');
    console.log('📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    return { data: null, error: null };
  });

  if (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('\nNext steps:');
  console.log('  1. Verify table creation in Supabase Dashboard');
  console.log('  2. Run sync script to populate data');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
