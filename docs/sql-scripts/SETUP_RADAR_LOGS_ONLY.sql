-- ============================================================================
-- RADAR SETUP - LOGS TABLE ONLY (NO CRON)
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Execute (clique em "Run")
--
-- Este script APENAS cria as tabelas/views necessárias.
-- O cron será configurado via Supabase Edge Functions Cron (não pg_cron).
-- ============================================================================

-- STEP 1: Create log table
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

-- STEP 2: Create helper function for manual trigger
CREATE OR REPLACE FUNCTION trigger_radar_update_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  result jsonb;
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Read credentials from Vault
  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'radar_supabase_url';

  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'radar_service_role_key';

  -- Check if credentials were found
  IF supabase_url IS NULL OR service_key IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Credentials not found in Vault',
      'message', 'This function requires Vault secrets to be set up first. Use Supabase Dashboard to trigger the Edge Function manually instead.'
    );
  END IF;

  -- Return message since we can't make HTTP calls without net/http extension
  RETURN jsonb_build_object(
    'message', 'Manual trigger not available (net/http extension missing)',
    'instructions', 'Go to Supabase Dashboard > Edge Functions > enrichment-radar-updater > Invoke to trigger manually',
    'url', supabase_url || '/functions/v1/enrichment-radar-updater'
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_radar_update_now() TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show secrets in Vault (names only, not values)
SELECT
  id,
  name,
  created_at
FROM vault.secrets
WHERE name IN ('radar_supabase_url', 'radar_service_role_key')
ORDER BY name;

-- Show log table exists
SELECT
  table_name AS "Table Name",
  table_type AS "Type"
FROM information_schema.tables
WHERE table_name = 'channel_radar_cron_log';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ RADAR LOGS TABLE CREATED!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '  1. Deploy Edge Function with cron config:';
  RAISE NOTICE '     cd /Users/daviluis/Documents/automedia-platform/automedia';
  RAISE NOTICE '     npx supabase functions deploy enrichment-radar-updater --project-ref xlpkabexmwsugkmbngwm';
  RAISE NOTICE '';
  RAISE NOTICE '  2. Verify cron was configured:';
  RAISE NOTICE '     Check Supabase Dashboard > Edge Functions > enrichment-radar-updater';
  RAISE NOTICE '';
  RAISE NOTICE '⏰ Cron Schedule: Daily at 6:00 AM UTC (configured via Edge Functions Cron)';
  RAISE NOTICE '';
END $$;
