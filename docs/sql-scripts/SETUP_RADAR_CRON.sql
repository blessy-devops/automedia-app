-- ============================================================================
-- RADAR CRON SETUP - SIMPLIFIED FOR SUPABASE SQL EDITOR
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor (https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/sql/new)
-- 3. Execute (clique em "Run")
-- 4. Verifique os resultados no final
-- ============================================================================

-- STEP 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS http;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS net;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- STEP 2: Configure database settings
ALTER DATABASE postgres
SET app.settings.supabase_url = 'https://xlpkabexmwsugkmbngwm.supabase.co';

ALTER DATABASE postgres
SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs';

SELECT pg_reload_conf();

-- STEP 3: Create log table
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

-- STEP 4: Remove existing cron job (if any)
DO $$
BEGIN
  PERFORM cron.unschedule('daily-radar-update');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- STEP 5: Schedule daily radar update
DO $$
DECLARE
  job_id BIGINT;
  has_net BOOLEAN;
  has_http BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'net') INTO has_net;
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') INTO has_http;

  IF has_net THEN
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
    RAISE NOTICE 'Cron job created with net.http_post (Job ID: %)', job_id;
  ELSIF has_http THEN
    SELECT cron.schedule(
      'daily-radar-update',
      '0 6 * * *',
      $cron$
        SELECT content::jsonb
        FROM http_post(
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
    RAISE NOTICE 'Cron job created with http_post (Job ID: %)', job_id;
  ELSE
    RAISE EXCEPTION 'Neither net nor http extension is available';
  END IF;
END $$;

-- STEP 6: Create helper function
CREATE OR REPLACE FUNCTION trigger_radar_update_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  result jsonb;
  has_net BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'net') INTO has_net;

  IF has_net THEN
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
    result := jsonb_build_object(
      'error', 'net extension not available',
      'message', 'Use Supabase Dashboard to trigger manually'
    );
  END IF;

  RETURN result;
END;
$func$;

GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO authenticated;

-- STEP 7: Create monitoring view
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

-- ============================================================================
-- VERIFICATION QUERIES (results will show below)
-- ============================================================================

-- Show cron job
SELECT
  jobid AS "Job ID",
  jobname AS "Job Name",
  schedule AS "Schedule",
  active AS "Active"
FROM cron.job
WHERE jobname = 'daily-radar-update';

-- Show configuration
SELECT
  current_setting('app.settings.supabase_url', true) AS "Supabase URL",
  CASE
    WHEN current_setting('app.settings.service_role_key', true) IS NULL
    THEN 'NOT SET'
    ELSE 'CONFIGURED'
  END AS "Service Key Status";

-- Show extension availability
SELECT
  extname AS "Extension",
  extversion AS "Version"
FROM pg_extension
WHERE extname IN ('pg_cron', 'http', 'net')
ORDER BY extname;
