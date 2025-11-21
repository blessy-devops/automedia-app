-- ============================================================================
-- FIX RADAR ENRICHMENT TASKS - ALLOW NULL enrichment_job_id
-- ============================================================================
-- PROBLEMA:
-- A coluna enrichment_job_id em channel_enrichment_tasks é NOT NULL,
-- mas radar updates não têm um job pai (são individuais, não batch).
--
-- SOLUÇÃO:
-- Tornar enrichment_job_id NULLABLE para permitir radar updates.
-- ============================================================================

-- Remove NOT NULL constraint from enrichment_job_id
ALTER TABLE channel_enrichment_tasks
ALTER COLUMN enrichment_job_id DROP NOT NULL;

-- Verify the change
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'channel_enrichment_tasks'
AND column_name = 'enrichment_job_id';

-- Show summary
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ enrichment_job_id NOW ACCEPTS NULL!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Changes made:';
  RAISE NOTICE '  - channel_enrichment_tasks.enrichment_job_id can now be NULL';
  RAISE NOTICE '  - This allows radar updates (which have no parent job) to work';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test radar again:';
  RAISE NOTICE '   SELECT trigger_radar_update_now();';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Check logs:';
  RAISE NOTICE '   SELECT * FROM channel_radar_cron_log ORDER BY execution_started_at DESC LIMIT 1;';
  RAISE NOTICE '';
END $$;
