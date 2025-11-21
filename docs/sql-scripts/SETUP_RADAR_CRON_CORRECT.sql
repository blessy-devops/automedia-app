-- ============================================================================
-- RADAR CRON SETUP - CORRECT VERSION (FIXED FUNCTION SIGNATURE)
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Execute (clique em "Run")
--
-- Versão corrigida com assinatura correta de net.http_post:
-- net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)
-- ============================================================================

-- STEP 1: Create log table (if not exists)
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

-- STEP 2: Remove existing cron job (if any)
SELECT cron.unschedule('daily-radar-update')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-radar-update'
);

-- STEP 3: Create cron job (with correct signature)
SELECT cron.schedule(
  'daily-radar-update',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      'https://xlpkabexmwsugkmbngwm.supabase.co/functions/v1/enrichment-radar-updater',
      jsonb_build_object('trigger', 'cron', 'scheduled_at', NOW()),
      '{}'::jsonb,
      jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs',
        'Content-Type', 'application/json'
      ),
      300000
    );
  $$
);

-- STEP 4: Create helper function for manual trigger (with correct signature)
CREATE OR REPLACE FUNCTION trigger_radar_update_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id bigint;
  http_response record;
BEGIN
  -- Call net.http_post with correct parameter order
  SELECT * INTO result_id FROM net.http_post(
    'https://xlpkabexmwsugkmbngwm.supabase.co/functions/v1/enrichment-radar-updater',
    jsonb_build_object('trigger', 'manual', 'triggered_at', NOW()),
    '{}'::jsonb,
    jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs',
      'Content-Type', 'application/json'
    ),
    300000
  );

  -- Return success message with request ID
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Manual radar update triggered',
    'request_id', result_id,
    'note', 'Check channel_radar_cron_log for execution results'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO authenticated;

-- STEP 5: Create monitoring view
CREATE OR REPLACE VIEW radar_cron_status AS
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'daily-radar-update';

GRANT SELECT ON radar_cron_status TO service_role;
GRANT SELECT ON radar_cron_status TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show cron job
SELECT
  jobid AS "Job ID",
  jobname AS "Job Name",
  schedule AS "Schedule",
  active AS "Active"
FROM cron.job
WHERE jobname = 'daily-radar-update';

-- Show log table exists
SELECT COUNT(*) as "Log Table Exists (should be 1)"
FROM information_schema.tables
WHERE table_name = 'channel_radar_cron_log';

-- Show net.http_post signature (for reference)
SELECT
  n.nspname AS "Schema",
  p.proname AS "Function",
  pg_catalog.pg_get_function_arguments(p.oid) AS "Arguments"
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'http_post'
AND n.nspname = 'net';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ RADAR CRON SETUP COMPLETE!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Cron job created: daily-radar-update';
  RAISE NOTICE '⏰ Schedule: Every day at 6:00 AM UTC (0 6 * * *)';
  RAISE NOTICE '📍 Target: enrichment-radar-updater Edge Function';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test manually:';
  RAISE NOTICE '   SELECT trigger_radar_update_now();';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Monitor:';
  RAISE NOTICE '   SELECT * FROM radar_cron_status;';
  RAISE NOTICE '   SELECT * FROM channel_radar_cron_log ORDER BY execution_started_at DESC LIMIT 5;';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: net.http_post signature:';
  RAISE NOTICE '   net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)';
  RAISE NOTICE '';
END $$;
