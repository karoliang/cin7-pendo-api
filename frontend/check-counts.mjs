import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCounts() {
  console.log('Checking actual record counts in Supabase...\n');

  // Count guides
  const { count: guidesCount, error: guidesError } = await supabase
    .from('pendo_guides')
    .select('*', { count: 'exact', head: true });

  console.log('Guides:', guidesCount, guidesError ? `(Error: ${guidesError.message})` : '');

  // Count features
  const { count: featuresCount, error: featuresError } = await supabase
    .from('pendo_features')
    .select('*', { count: 'exact', head: true });

  console.log('Features:', featuresCount, featuresError ? `(Error: ${featuresError.message})` : '');

  // Count pages
  const { count: pagesCount, error: pagesError } = await supabase
    .from('pendo_pages')
    .select('*', { count: 'exact', head: true });

  console.log('Pages:', pagesCount, pagesError ? `(Error: ${pagesError.message})` : '');

  // Count reports (if table exists)
  const { count: reportsCount, error: reportsError } = await supabase
    .from('pendo_reports')
    .select('*', { count: 'exact', head: true });

  console.log('Reports:', reportsCount || 0, reportsError ? `(Error: ${reportsError.message})` : '');

  console.log('\n---\n');

  // Also check what we get with the current query (with limit)
  console.log('Testing current query with limit(10000):\n');

  const { data: guidesData, error: guidesDataError } = await supabase
    .from('pendo_guides')
    .select('*')
    .order('views', { ascending: false })
    .limit(10000);

  console.log('Guides fetched:', guidesData?.length, guidesDataError ? `(Error: ${guidesDataError.message})` : '');

  const { data: featuresData, error: featuresDataError } = await supabase
    .from('pendo_features')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(10000);

  console.log('Features fetched:', featuresData?.length, featuresDataError ? `(Error: ${featuresDataError.message})` : '');

  const { data: pagesData, error: pagesDataError } = await supabase
    .from('pendo_pages')
    .select('*')
    .order('views', { ascending: false })
    .limit(10000);

  console.log('Pages fetched:', pagesData?.length, pagesDataError ? `(Error: ${pagesDataError.message})` : '');
}

checkCounts();
