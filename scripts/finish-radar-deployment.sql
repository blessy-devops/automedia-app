-- ============================================================================
-- Finish Channel Radar Deployment
-- ============================================================================
-- This script completes the deployment by:
-- 1. Configuring database settings for cron job
-- 2. Verifying all components are installed
--
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xlpkabexmwsugkmbngwm/sql/new
-- ============================================================================

-- Step 1: Configure database settings for cron
ALTER DATABASE postgres
SET app.settings.supabase_url = 'https://xlpkabexmwsugkmbngwm.supabase.co';

ALTER DATABASE postgres
SET app.settings.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs';

-- Step 2: Verification Queries
-- Check if cron job exists
SELECT
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname = 'daily-radar-update';

-- Check if channel_radar table exists
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_radar')
        THEN '✓ Table "channel_radar" exists'
        ELSE '✗ ERROR: Table not found'
    END as table_status;

-- Check if channel_radar_cron_log table exists
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_radar_cron_log')
        THEN '✓ Table "channel_radar_cron_log" exists'
        ELSE '✗ ERROR: Log table not found'
    END as log_table_status;

-- Check if in_radar column was added
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'benchmark_channels'
            AND column_name = 'in_radar'
        )
        THEN '✓ Column "in_radar" added to benchmark_channels'
        ELSE '✗ ERROR: Column not found'
    END as column_status;

-- Check permissions
SELECT
    grantee,
    privilege_type,
    table_name
FROM information_schema.table_privileges
WHERE table_name = 'channel_radar'
ORDER BY grantee, privilege_type;

-- Step 3: Test manual trigger function
SELECT trigger_radar_update_now();
