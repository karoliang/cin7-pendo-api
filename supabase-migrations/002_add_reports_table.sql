-- Migration: Add pendo_reports table
-- Run this in Supabase SQL Editor

-- Create Reports Table
CREATE TABLE IF NOT EXISTS pendo_reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  last_success_run_at TIMESTAMP WITH TIME ZONE,
  configuration JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_reports_last_synced ON pendo_reports(last_synced DESC);
CREATE INDEX IF NOT EXISTS idx_reports_name ON pendo_reports(name);
CREATE INDEX IF NOT EXISTS idx_reports_last_run ON pendo_reports(last_success_run_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE pendo_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated cin7.com users
CREATE POLICY "Allow read access for cin7.com users" ON pendo_reports
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@cin7.com');

-- Add comment
COMMENT ON TABLE pendo_reports IS 'Stores Pendo report data with metadata and configurations';
