-- Usage Heatmap Database Function
-- Creates aggregated view of events by day of week and hour

CREATE OR REPLACE FUNCTION get_usage_heatmap(
  start_date timestamptz,
  end_date timestamptz
)
RETURNS TABLE (
  day_of_week int,
  hour int,
  count bigint
) AS $$
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
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_usage_heatmap(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_heatmap(timestamptz, timestamptz) TO anon;
