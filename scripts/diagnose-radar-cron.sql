-- ============================================================================
-- RADAR CRON DIAGNOSTIC SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor to check the current status of the radar cron
-- ============================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔍 RADAR CRON DIAGNOSTIC REPORT'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- 1. PostgreSQL Extensions Check
-- ============================================================================
\echo '📦 1. POSTGRESQL EXTENSIONS'
\echo '─────────────────────────────'

SELECT
  extname AS "Extension",
  extversion AS "Version",
  CASE
    WHEN extname = 'pg_cron' THEN '✓ Required for scheduling'
    WHEN extname = 'net' THEN '✓ Required for HTTP calls'
    WHEN extname = 'http' THEN '✓ Alternative for HTTP calls'
    ELSE ''
  END AS "Status"
FROM pg_extension
WHERE extname IN ('pg_cron', 'net', 'http')
ORDER BY extname;

\echo ''
\echo 'Expected: pg_cron + (net OR http)'
\echo ''

-- ============================================================================
-- 2. Database Configuration Check
-- ============================================================================
\echo '⚙️  2. DATABASE CONFIGURATION'
\echo '──────────────────────────────'

SELECT
  'app.settings.supabase_url' AS "Setting",
  CASE
    WHEN current_setting('app.settings.supabase_url', true) IS NULL
    THEN '❌ NOT CONFIGURED'
    ELSE '✓ ' || current_setting('app.settings.supabase_url', true)
  END AS "Value"
UNION ALL
SELECT
  'app.settings.service_role_key' AS "Setting",
  CASE
    WHEN current_setting('app.settings.service_role_key', true) IS NULL
    THEN '❌ NOT CONFIGURED'
    WHEN current_setting('app.settings.service_role_key', true) LIKE 'YOUR_%'
    THEN '❌ PLACEHOLDER VALUE - NEEDS REAL KEY'
    ELSE '✓ Configured (key masked for security)'
  END AS "Value";

\echo ''

-- ============================================================================
-- 3. Cron Job Status
-- ============================================================================
\echo '⏰ 3. CRON JOB STATUS'
\echo '────────────────────'

DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM cron.job
  WHERE jobname = 'daily-radar-update';

  IF job_count = 0 THEN
    RAISE NOTICE '❌ Cron job "daily-radar-update" NOT FOUND';
    RAISE NOTICE '   Action: Run setup-radar-cron-fixed.sql';
  ELSE
    RAISE NOTICE '✓ Cron job "daily-radar-update" EXISTS';
  END IF;
END $$;

\echo ''
\echo 'Job Details:'

SELECT
  jobid AS "Job ID",
  jobname AS "Name",
  schedule AS "Schedule",
  active AS "Active",
  LEFT(command, 80) || '...' AS "Command (truncated)"
FROM cron.job
WHERE jobname = 'daily-radar-update';

\echo ''
\echo 'Schedule Explanation:'
\echo '  0 6 * * * = Every day at 6:00 AM UTC'
\echo ''

-- ============================================================================
-- 4. Cron Execution History
-- ============================================================================
\echo '📊 4. CRON EXECUTION HISTORY (from pg_cron)'
\echo '──────────────────────────────────────────'

SELECT
  runid AS "Run ID",
  jobid AS "Job ID",
  start_time AS "Started",
  end_time AS "Ended",
  status AS "Status",
  LEFT(return_message, 50) AS "Message (truncated)"
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-radar-update')
ORDER BY start_time DESC
LIMIT 10;

\echo ''
\echo 'Note: If empty, cron has not run yet (next run at 6 AM UTC)'
\echo ''

-- ============================================================================
-- 5. Application Execution Logs
-- ============================================================================
\echo '📝 5. APPLICATION EXECUTION LOGS'
\echo '────────────────────────────────'

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'channel_radar_cron_log'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE NOTICE '❌ Table channel_radar_cron_log does NOT exist';
    RAISE NOTICE '   Action: Run setup-radar-cron-fixed.sql';
  ELSE
    RAISE NOTICE '✓ Table channel_radar_cron_log exists';
  END IF;
END $$;

\echo ''
\echo 'Recent Executions (last 10):'

SELECT
  id,
  TO_CHAR(execution_started_at, 'YYYY-MM-DD HH24:MI:SS') AS "Started",
  TO_CHAR(execution_completed_at, 'YYYY-MM-DD HH24:MI:SS') AS "Completed",
  status AS "Status",
  channels_processed AS "✓ Success",
  channels_failed AS "✗ Failed",
  CASE
    WHEN execution_completed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (execution_completed_at - execution_started_at)) || 's'
    ELSE 'running...'
  END AS "Duration"
FROM channel_radar_cron_log
ORDER BY execution_started_at DESC
LIMIT 10;

\echo ''

-- ============================================================================
-- 6. Edge Function Status Check
-- ============================================================================
\echo '🔧 6. EDGE FUNCTION CHECK'
\echo '────────────────────────'
\echo ''
\echo 'Cannot directly verify from SQL, but you should check:'
\echo '  1. Supabase Dashboard > Edge Functions'
\echo '  2. Verify "enrichment-radar-updater" is deployed'
\echo '  3. Check function logs for errors'
\echo ''
\echo 'To test manually, run:'
\echo '  SELECT trigger_radar_update_now();'
\echo ''

-- ============================================================================
-- 7. Active Channels Count
-- ============================================================================
\echo '📡 7. ACTIVE CHANNELS IN RADAR'
\echo '─────────────────────────────'

DO $$
DECLARE
  table_exists BOOLEAN;
  active_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'channel_radar'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE NOTICE '❌ Table channel_radar does NOT exist';
    RAISE NOTICE '   Action: Run migration 20251113131610_create_channel_radar.sql';
  ELSE
    SELECT COUNT(*) INTO active_count
    FROM channel_radar
    WHERE is_active = true;

    RAISE NOTICE '✓ Active channels: %', active_count;

    IF active_count = 0 THEN
      RAISE NOTICE '  ⚠ No channels in radar! Add channels via UI or:';
      RAISE NOTICE '    INSERT INTO channel_radar (channel_id) VALUES (''YOUR_CHANNEL_ID'');';
    END IF;
  END IF;
END $$;

\echo ''

-- ============================================================================
-- 8. Next Scheduled Run
-- ============================================================================
\echo '🕒 8. NEXT SCHEDULED RUN'
\echo '───────────────────────'

DO $$
DECLARE
  next_run TIMESTAMPTZ;
  now_utc TIMESTAMPTZ := NOW() AT TIME ZONE 'UTC';
  tomorrow_6am TIMESTAMPTZ;
BEGIN
  -- Calculate next 6 AM UTC
  tomorrow_6am := (DATE_TRUNC('day', now_utc) + INTERVAL '1 day' + INTERVAL '6 hours')::TIMESTAMPTZ;

  IF EXTRACT(HOUR FROM now_utc) < 6 THEN
    -- Today's 6 AM hasn't passed yet
    next_run := (DATE_TRUNC('day', now_utc) + INTERVAL '6 hours')::TIMESTAMPTZ;
  ELSE
    -- Use tomorrow's 6 AM
    next_run := tomorrow_6am;
  END IF;

  RAISE NOTICE 'Current UTC Time: %', now_utc;
  RAISE NOTICE 'Next Scheduled Run: %', next_run;
  RAISE NOTICE 'Time Until Next Run: %', next_run - now_utc;
END $$;

\echo ''

-- ============================================================================
-- SUMMARY & RECOMMENDATIONS
-- ============================================================================
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📋 DIAGNOSTIC SUMMARY'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

DO $$
DECLARE
  has_pgcron BOOLEAN;
  has_http BOOLEAN;
  has_url BOOLEAN;
  has_key BOOLEAN;
  has_cron_job BOOLEAN;
  all_good BOOLEAN;
BEGIN
  -- Check all prerequisites
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') INTO has_pgcron;
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname IN ('net', 'http')) INTO has_http;
  SELECT current_setting('app.settings.supabase_url', true) IS NOT NULL INTO has_url;
  SELECT
    current_setting('app.settings.service_role_key', true) IS NOT NULL
    AND current_setting('app.settings.service_role_key', true) NOT LIKE 'YOUR_%'
  INTO has_key;
  SELECT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-radar-update') INTO has_cron_job;

  all_good := has_pgcron AND has_http AND has_url AND has_key AND has_cron_job;

  IF all_good THEN
    RAISE NOTICE '✅ ALL SYSTEMS OPERATIONAL';
    RAISE NOTICE '';
    RAISE NOTICE '✓ Extensions enabled';
    RAISE NOTICE '✓ Configuration set';
    RAISE NOTICE '✓ Cron job scheduled';
    RAISE NOTICE '';
    RAISE NOTICE 'Radar will run automatically at 6 AM UTC daily.';
  ELSE
    RAISE NOTICE '⚠️  ISSUES DETECTED - ACTION REQUIRED';
    RAISE NOTICE '';

    IF NOT has_pgcron THEN
      RAISE NOTICE '❌ pg_cron extension missing';
      RAISE NOTICE '   Fix: Run setup-radar-cron-fixed.sql';
    END IF;

    IF NOT has_http THEN
      RAISE NOTICE '❌ HTTP extension missing (need net or http)';
      RAISE NOTICE '   Fix: Run setup-radar-cron-fixed.sql';
    END IF;

    IF NOT has_url THEN
      RAISE NOTICE '❌ Supabase URL not configured';
      RAISE NOTICE '   Fix: Run setup-radar-cron-fixed.sql';
    END IF;

    IF NOT has_key THEN
      RAISE NOTICE '❌ Service role key not configured or is placeholder';
      RAISE NOTICE '   Fix: Edit setup-radar-cron-fixed.sql and replace YOUR_SERVICE_ROLE_KEY';
    END IF;

    IF NOT has_cron_job THEN
      RAISE NOTICE '❌ Cron job not scheduled';
      RAISE NOTICE '   Fix: Run setup-radar-cron-fixed.sql';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '📖 See docs/RADAR_CRON_SETUP.md for detailed instructions';
  END IF;
END $$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔍 END OF DIAGNOSTIC REPORT'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
