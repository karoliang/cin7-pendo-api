-- Migration: Add Usage Heatmap Function
-- Description: Creates a PostgreSQL function to efficiently aggregate pendo_events by day of week and hour
-- Date: 2025-11-08
-- Required for: UsageHeatmap component in frontend

-- Drop function if it exists (for re-running migration)
DROP FUNCTION IF EXISTS get_usage_heatmap(timestamptz, timestamptz);

-- Create function to aggregate events by day of week and hour
CREATE OR REPLACE FUNCTION get_usage_heatmap(
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE (day_of_week int, hour int, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(DOW FROM created_at)::int as day_of_week,
    EXTRACT(HOUR FROM created_at)::int as hour,
    COUNT(*)::bigint as count
  FROM pendo_events
  WHERE created_at >= start_date
    AND created_at <= end_date
  GROUP BY day_of_week, hour
  ORDER BY day_of_week, hour;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION get_usage_heatmap IS 'Aggregates pendo_events by day of week (0=Sunday, 6=Saturday) and hour (0-23) for heatmap visualization';
