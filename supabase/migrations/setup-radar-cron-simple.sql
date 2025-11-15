-- ============================================================================
-- RADAR CRON SETUP - SIMPLIFIED FOR SUPABASE SQL EDITOR
-- ============================================================================
-- BEFORE RUNNING: Replace YOUR_SERVICE_ROLE_KEY with your actual key (line 34)
-- ============================================================================

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS "http";

-- Step 2: Create execution log table
CREATE TABLE IF NOT EXISTS channel_radar_cron_log (
  id SERIAL PRIMARY KEY,
  execution_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  execution_completed_at TIMESTAMPTZ,
  status VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  channels_processed INTEGER DEFAULT 0,
  channels_failed INTEGER DEFAULT 0,
  error_message TEXT,
  execution_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_cron_log_started ON channel_radar_cron_log(execution_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_cron_log_status ON channel_radar_cron_log(status);
GRANT ALL ON channel_radar_cron_log TO service_role;
GRANT SELECT ON channel_radar_cron_log TO authenticated;
GRANT ALL ON SEQUENCE channel_radar_cron_log_id_seq TO service_role;

-- Step 3: Create config table (alternative to ALTER DATABASE)
CREATE TABLE IF NOT EXISTS radar_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert configuration (REPLACE YOUR_SERVICE_ROLE_KEY!)
INSERT INTO radar_config (key, value)
VALUES
  ('supabase_url', 'https://xlpkabexmwsugkmbngwm.supabase.co'),
  ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

GRANT SELECT ON radar_config TO service_role;

-- Step 4: Remove existing cron job
DO $$
BEGIN
  PERFORM cron.unschedule('daily-radar-update');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Step 5: Create cron job using config table
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  SELECT cron.schedule(
    'daily-radar-update',
    '0 6 * * *',
    $$
      SELECT http_post(
        (SELECT value FROM radar_config WHERE key = 'supabase_url') || '/functions/v1/enrichment-radar-updater',
        '{"trigger": "cron", "scheduled_at": "' || NOW()::text || '"}',
        'application/json',
        ARRAY[
          http_header('Authorization', 'Bearer ' || (SELECT value FROM radar_config WHERE key = 'service_role_key')),
          http_header('Content-Type', 'application/json')
        ]
      )
    $$
  ) INTO job_id;

  RAISE NOTICE 'Cron job created with ID: %', job_id;
END $$;

-- Step 6: Create helper function for manual trigger
CREATE OR REPLACE FUNCTION trigger_radar_update_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result record;
BEGIN
  SELECT http_post(
    (SELECT value FROM radar_config WHERE key = 'supabase_url') || '/functions/v1/enrichment-radar-updater',
    '{"trigger": "manual", "triggered_at": "' || NOW()::text || '"}',
    'application/json',
    ARRAY[
      http_header('Authorization', 'Bearer ' || (SELECT value FROM radar_config WHERE key = 'service_role_key')),
      http_header('Content-Type', 'application/json')
    ]
  ) INTO result;

  RETURN jsonb_build_object(
    'status', result.status,
    'content', result.content::jsonb,
    'triggered_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO service_role;

-- Step 7: Create monitoring view
CREATE OR REPLACE VIEW radar_cron_status AS
SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename,
  LEFT(command, 100) as command_preview
FROM cron.job
WHERE jobname = 'daily-radar-update';

GRANT SELECT ON radar_cron_status TO service_role;
GRANT SELECT ON radar_cron_status TO authenticated;

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check configuration
SELECT
  'Configuration' as check_type,
  CASE
    WHEN (SELECT value FROM radar_config WHERE key = 'service_role_key') LIKE 'YOUR_%'
    THEN 'ERROR: Service role key not configured! Edit line 34.'
    ELSE 'OK: Service role key configured'
  END as status;

-- Check cron job
SELECT
  'Cron Job' as check_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-radar-update')
    THEN 'OK: Cron job scheduled'
    ELSE 'ERROR: Cron job not found!'
  END as status;

-- Show cron details
SELECT * FROM radar_cron_status;

-- ============================================================================
-- SETUP COMPLETE!
--
-- NEXT STEPS:
-- 1. Verify service role key is set (should NOT say YOUR_SERVICE_ROLE_KEY)
-- 2. Test manual trigger: SELECT trigger_radar_update_now();
-- 3. Check logs: SELECT * FROM channel_radar_cron_log;
-- ============================================================================
