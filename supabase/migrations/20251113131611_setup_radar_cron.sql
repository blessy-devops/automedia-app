-- Migration: Setup Channel Radar Cron Scheduler
-- Description: Configures pg_cron to run daily radar updates at 6 AM
-- Author: Claude Code
-- Date: 2025-11-13

-- ============================================================================
-- STEP 1: Enable pg_cron extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- STEP 2: Get Supabase project URL and service role key
-- ============================================================================
-- NOTE: This migration assumes you'll need to manually configure the actual
-- service_role_key in production. For security reasons, we don't hardcode it.
--
-- After running this migration, you'll need to either:
-- 1. Update the cron job via SQL with your actual credentials
-- 2. Use Supabase CLI: supabase functions deploy enrichment-radar-updater
-- 3. Configure via Supabase Dashboard > Database > Cron Jobs

-- ============================================================================
-- STEP 3: Schedule daily radar updates at 6 AM
-- ============================================================================
-- Delete existing job if it exists (idempotent)
SELECT cron.unschedule('daily-radar-update')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-radar-update'
);

-- Schedule new job
-- Runs every day at 6 AM (0 6 * * *)
-- Format: minute hour day month weekday
DO $$
DECLARE
  supabase_url TEXT;
  project_ref TEXT;
BEGIN
  -- Extract project reference from current database connection
  -- This will be something like: https://PROJECT_REF.supabase.co
  supabase_url := current_setting('app.settings.supabase_url', true);

  -- If not set via app settings, construct from pg_stat_database
  IF supabase_url IS NULL THEN
    -- Fallback: use environment or hardcode
    -- You'll need to update this with your actual project URL
    supabase_url := 'https://YOUR_PROJECT_REF.supabase.co';
  END IF;

  -- Schedule the cron job
  PERFORM cron.schedule(
    'daily-radar-update',              -- Job name
    '0 6 * * *',                       -- Schedule: 6 AM daily
    $$
    -- This job will invoke the enrichment-radar-updater Edge Function
    -- The Edge Function will handle all the update logic
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
    );
    $$
  );

  RAISE NOTICE 'Cron job "daily-radar-update" scheduled for 6 AM daily';
  RAISE NOTICE 'Target URL: %/functions/v1/enrichment-radar-updater', supabase_url;
END $$;

-- ============================================================================
-- STEP 4: Create helper function to manually trigger radar update
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_radar_update_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Manually invoke the radar updater
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

  RETURN result;
END;
$$;

COMMENT ON FUNCTION trigger_radar_update_now() IS 'Manually trigger radar update immediately (useful for testing)';

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO service_role;

-- ============================================================================
-- STEP 5: Create helper view to monitor cron jobs
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

COMMENT ON VIEW radar_cron_status IS 'View to monitor the daily radar update cron job status';

-- Grant select to service_role and authenticated
GRANT SELECT ON radar_cron_status TO service_role;
GRANT SELECT ON radar_cron_status TO authenticated;

-- ============================================================================
-- STEP 6: Create table to log cron executions (optional but recommended)
-- ============================================================================
CREATE TABLE IF NOT EXISTS channel_radar_cron_log (
  id SERIAL PRIMARY KEY,
  execution_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  execution_completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed')),
  channels_processed INTEGER DEFAULT 0,
  channels_failed INTEGER DEFAULT 0,
  error_message TEXT,
  execution_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_cron_log_started
ON channel_radar_cron_log(execution_started_at DESC);

CREATE INDEX IF NOT EXISTS idx_radar_cron_log_status
ON channel_radar_cron_log(status);

COMMENT ON TABLE channel_radar_cron_log IS 'Logs each execution of the radar update cron job';

-- Grant permissions
GRANT ALL ON channel_radar_cron_log TO service_role;
GRANT SELECT ON channel_radar_cron_log TO authenticated;
GRANT ALL ON SEQUENCE channel_radar_cron_log_id_seq TO service_role;

-- ============================================================================
-- IMPORTANT: Post-Migration Configuration Required
-- ============================================================================
-- After running this migration, you MUST configure the following in Supabase:
--
-- 1. Set app.settings.supabase_url in Database Settings:
--    ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
--
-- 2. Set app.settings.service_role_key (SECURELY):
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
--
-- 3. Verify the cron job is scheduled:
--    SELECT * FROM radar_cron_status;
--
-- 4. Test manual trigger:
--    SELECT trigger_radar_update_now();
--
-- 5. Monitor cron execution logs:
--    SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-radar-update');
--
-- ============================================================================

-- Migration Complete
-- Next step: Deploy enrichment-radar-updater Edge Function
