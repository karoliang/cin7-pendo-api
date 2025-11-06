-- Supabase Database Schema for Pendo Analytics
-- Run this in Supabase SQL Editor
-- Note: JWT secret is automatically managed by Supabase

-- Create tables for Pendo data

-- 1. Guides Table
CREATE TABLE IF NOT EXISTS pendo_guides (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  avg_time_to_complete INTEGER DEFAULT 0,
  steps INTEGER DEFAULT 0,
  steps_data JSONB,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on last_synced for efficient queries
CREATE INDEX IF NOT EXISTS idx_guides_last_synced ON pendo_guides(last_synced DESC);
CREATE INDEX IF NOT EXISTS idx_guides_state ON pendo_guides(state);

-- 2. Features Table
CREATE TABLE IF NOT EXISTS pendo_features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_usage_per_user NUMERIC(10,2) DEFAULT 0,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_features_last_synced ON pendo_features(last_synced DESC);
CREATE INDEX IF NOT EXISTS idx_features_usage ON pendo_features(usage_count DESC);

-- 3. Pages Table
CREATE TABLE IF NOT EXISTS pendo_pages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  geographic_data JSONB,
  top_accounts JSONB,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pages_last_synced ON pendo_pages(last_synced DESC);
CREATE INDEX IF NOT EXISTS idx_pages_views ON pendo_pages(views DESC);

-- 4. Events Table (for raw event data)
CREATE TABLE IF NOT EXISTS pendo_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_id TEXT,
  entity_type TEXT,
  visitor_id TEXT,
  account_id TEXT,
  browser_time TIMESTAMP WITH TIME ZONE,
  remote_ip TEXT,
  user_agent TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_entity_id ON pendo_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_events_entity_type ON pendo_events(entity_type);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON pendo_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_browser_time ON pendo_events(browser_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON pendo_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_account_id ON pendo_events(account_id);

-- 5. Sync Status Table (track sync progress)
CREATE TABLE IF NOT EXISTS sync_status (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  last_sync_start TIMESTAMP WITH TIME ZONE,
  last_sync_end TIMESTAMP WITH TIME ZONE,
  status TEXT, -- 'running', 'completed', 'failed'
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sync_status_entity ON sync_status(entity_type, last_sync_end DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE pendo_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendo_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendo_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users with @cin7.com domain
-- Policy for guides
CREATE POLICY "Allow read access for cin7.com users" ON pendo_guides
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@cin7.com');

-- Policy for features
CREATE POLICY "Allow read access for cin7.com users" ON pendo_features
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@cin7.com');

-- Policy for pages
CREATE POLICY "Allow read access for cin7.com users" ON pendo_pages
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@cin7.com');

-- Policy for events
CREATE POLICY "Allow read access for cin7.com users" ON pendo_events
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@cin7.com');

-- Policy for sync_status
CREATE POLICY "Allow read access for cin7.com users" ON sync_status
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@cin7.com');

-- Create a function to get guide analytics
CREATE OR REPLACE FUNCTION get_guide_analytics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  state TEXT,
  views INTEGER,
  completions INTEGER,
  completion_rate NUMERIC,
  avg_time_to_complete INTEGER,
  sparkline_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.state,
    g.views,
    g.completions,
    g.completion_rate,
    g.avg_time_to_complete,
    (
      SELECT json_agg(daily_views ORDER BY day)
      FROM (
        SELECT
          DATE(e.browser_time) as day,
          COUNT(*) as daily_views
        FROM pendo_events e
        WHERE e.entity_id = g.id
          AND e.entity_type = 'guide'
          AND e.browser_time >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY DATE(e.browser_time)
        ORDER BY day
      ) daily_data
    ) as sparkline_data
  FROM pendo_guides g
  WHERE g.last_synced >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get feature analytics
CREATE OR REPLACE FUNCTION get_feature_analytics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  usage_count INTEGER,
  unique_users INTEGER,
  avg_usage_per_user NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.usage_count,
    f.unique_users,
    f.avg_usage_per_user
  FROM pendo_features f
  WHERE f.last_synced >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get page analytics
CREATE OR REPLACE FUNCTION get_page_analytics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  url TEXT,
  views INTEGER,
  unique_visitors INTEGER,
  avg_time_on_page INTEGER,
  geographic_data JSONB,
  top_accounts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.url,
    p.views,
    p.unique_visitors,
    p.avg_time_on_page,
    p.geographic_data,
    p.top_accounts
  FROM pendo_pages p
  WHERE p.last_synced >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_guide_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_feature_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_page_analytics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE pendo_guides IS 'Stores Pendo guide data with analytics';
COMMENT ON TABLE pendo_features IS 'Stores Pendo feature data with usage analytics';
COMMENT ON TABLE pendo_pages IS 'Stores Pendo page data with view analytics';
COMMENT ON TABLE pendo_events IS 'Stores raw Pendo event data for detailed analysis';
COMMENT ON TABLE sync_status IS 'Tracks the status of data sync operations';
