-- ============================================================================
-- RADAR CRON SETUP - CORRECTED VERSION
-- ============================================================================
-- This script sets up the daily radar update cron job
-- Run this ONCE in Supabase SQL Editor
--
-- BEFORE RUNNING:
-- 1. Replace YOUR_SERVICE_ROLE_KEY with your actual Supabase service role key
--    (found in: Supabase Dashboard > Settings > API > service_role secret)
--
-- WHAT THIS DOES:
-- - Enables required PostgreSQL extensions (pg_cron, net)
-- - Configures database settings for authentication
-- - Creates cron job to run daily at 6 AM UTC
-- - Creates helper functions and monitoring views
-- - Creates execution log table
-- ============================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🚀 RADAR CRON SETUP - Starting...'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================
\echo ''
\echo '📦 Step 1: Enabling PostgreSQL extensions...'

CREATE EXTENSION IF NOT EXISTS pg_cron;
\echo '  ✓ pg_cron enabled (for scheduling)'

CREATE EXTENSION IF NOT EXISTS "http";
\echo '  ✓ http extension enabled (for API calls)'

-- Note: 'net' extension might not be available in all Supabase projects
-- If you get an error here, use 'http' extension instead
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS net;
  RAISE NOTICE '  ✓ net extension enabled (alternative HTTP client)';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '  ⚠ net extension not available, will use http extension instead';
END $$;

-- ============================================================================
-- STEP 2: Configure Database Settings
-- ============================================================================
\echo ''
\echo '⚙️  Step 2: Configuring database settings...'

-- Set Supabase project URL
ALTER DATABASE postgres
SET app.settings.supabase_url = 'https://xlpkabexmwsugkmbngwm.supabase.co';
\echo '  ✓ Supabase URL configured'

-- Set service role key (REPLACE WITH YOUR ACTUAL KEY!)
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY below with your actual key
ALTER DATABASE postgres
SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
\echo '  ✓ Service role key configured (VERIFY THIS IS CORRECT!)'

-- Reload configuration
SELECT pg_reload_conf();
\echo '  ✓ Configuration reloaded'

-- ============================================================================
-- STEP 3: Create Execution Log Table
-- ============================================================================
\echo ''
\echo '📊 Step 3: Creating execution log table...'

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

CREATE INDEX IF NOT EXISTS idx_radar_cron_log_started
ON channel_radar_cron_log(execution_started_at DESC);

CREATE INDEX IF NOT EXISTS idx_radar_cron_log_status
ON channel_radar_cron_log(status);

GRANT ALL ON channel_radar_cron_log TO service_role;
GRANT SELECT ON channel_radar_cron_log TO authenticated;
GRANT ALL ON SEQUENCE channel_radar_cron_log_id_seq TO service_role;

\echo '  ✓ channel_radar_cron_log table created'

-- ============================================================================
-- STEP 4: Remove Existing Cron Job (if any)
-- ============================================================================
\echo ''
\echo '🗑️  Step 4: Removing any existing cron jobs...'

DO $$
BEGIN
  PERFORM cron.unschedule('daily-radar-update');
  RAISE NOTICE '  ✓ Existing cron job removed (if any)';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '  ℹ No existing cron job to remove';
END $$;

-- ============================================================================
-- STEP 5: Schedule Daily Radar Update Cron
-- ============================================================================
\echo ''
\echo '⏰ Step 5: Scheduling daily radar update cron...'

-- Try with 'net' extension first
DO $$
DECLARE
  job_id BIGINT;
  has_net BOOLEAN;
BEGIN
  -- Check if net extension is available
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'net'
  ) INTO has_net;

  IF has_net THEN
    -- Use net.http_post
    SELECT cron.schedule(
      'daily-radar-update',
      '0 6 * * *',
      $cron$
        SELECT net.http_post(
          url := current_setting('app.settings.supabase_url') || '/functions/v1/enrichment-radar-updater',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object(
            'trigger', 'cron',
            'scheduled_at', NOW()
          )
        )
      $cron$
    ) INTO job_id;
    RAISE NOTICE '  ✓ Cron job created using net.http_post (Job ID: %)', job_id;
  ELSE
    -- Use http extension as fallback
    SELECT cron.schedule(
      'daily-radar-update',
      '0 6 * * *',
      $cron$
        SELECT http_post(
          current_setting('app.settings.supabase_url') || '/functions/v1/enrichment-radar-updater',
          '{"trigger": "cron", "scheduled_at": "' || NOW()::text || '"}',
          'application/json',
          ARRAY[
            http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
            http_header('Content-Type', 'application/json')
          ]
        )
      $cron$
    ) INTO job_id;
    RAISE NOTICE '  ✓ Cron job created using http_post (Job ID: %)', job_id;
  END IF;

  RAISE NOTICE '  ✓ Schedule: Every day at 6:00 AM UTC';
  RAISE NOTICE '  ✓ Target: /functions/v1/enrichment-radar-updater';
END $$;

-- ============================================================================
-- STEP 6: Create Helper Function for Manual Trigger
-- ============================================================================
\echo ''
\echo '🔧 Step 6: Creating helper functions...'

CREATE OR REPLACE FUNCTION trigger_radar_update_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  result jsonb;
  has_net BOOLEAN;
BEGIN
  -- Check if net extension is available
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'net'
  ) INTO has_net;

  IF has_net THEN
    -- Use net.http_post
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/enrichment-radar-updater',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'trigger', 'manual',
        'triggered_at', NOW()
      )
    ) INTO result;
  ELSE
    -- Fallback to returning instruction
    result := jsonb_build_object(
      'error', 'net extension not available',
      'message', 'Please trigger manually via Supabase Dashboard'
    );
  END IF;

  RETURN result;
END;
$func$;

GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO service_role;
\echo '  ✓ trigger_radar_update_now() function created'

-- ============================================================================
-- STEP 7: Create Monitoring View
-- ============================================================================
CREATE OR REPLACE VIEW radar_cron_status AS
SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename,
  command
FROM cron.job
WHERE jobname = 'daily-radar-update';

GRANT SELECT ON radar_cron_status TO service_role;
GRANT SELECT ON radar_cron_status TO authenticated;

\echo '  ✓ radar_cron_status view created'

-- ============================================================================
-- STEP 8: Verify Configuration
-- ============================================================================
\echo ''
\echo '✅ Step 8: Verifying configuration...'
\echo ''

-- Show cron job details
\echo '📋 Cron Job Details:'
SELECT
  jobid AS "Job ID",
  jobname AS "Job Name",
  schedule AS "Schedule (Cron)",
  active AS "Active",
  command AS "Command"
FROM cron.job
WHERE jobname = 'daily-radar-update';

-- Show configuration
\echo ''
\echo '⚙️  Database Configuration:'
\echo '  Supabase URL: ' || current_setting('app.settings.supabase_url', true);
\echo '  Service Key: ' ||
  CASE
    WHEN current_setting('app.settings.service_role_key', true) LIKE 'YOUR_%'
    THEN '❌ NOT CONFIGURED - REPLACE YOUR_SERVICE_ROLE_KEY!'
    ELSE '✓ Configured (masked for security)'
  END;

-- Show recent logs
\echo ''
\echo '📊 Recent Execution Logs (last 5):'
SELECT
  id,
  execution_started_at,
  status,
  channels_processed,
  channels_failed
FROM channel_radar_cron_log
ORDER BY execution_started_at DESC
LIMIT 5;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ RADAR CRON SETUP COMPLETE!'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '🎯 Next Steps:'
\echo '  1. VERIFY service role key is configured (see above)'
\echo '  2. Test manual trigger: SELECT trigger_radar_update_now();'
\echo '  3. Check logs: SELECT * FROM channel_radar_cron_log;'
\echo '  4. Monitor cron: SELECT * FROM radar_cron_status;'
\echo ''
\echo '⏰ Cron Schedule: Daily at 6:00 AM UTC'
\echo '📍 Target: /functions/v1/enrichment-radar-updater'
\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
