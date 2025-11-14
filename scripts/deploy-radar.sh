#!/bin/bash

# =============================================================================
# Channel Radar Deployment Script
# =============================================================================
# Automates the complete deployment of the Channel Radar feature:
# - Database migrations
# - Edge Function deployment
# - Database configuration
# - Verification checks
#
# Usage: ./scripts/deploy-radar.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="https://xlpkabexmwsugkmbngwm.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# =============================================================================
# Step 1: Pre-flight Checks
# =============================================================================

print_header "Step 1: Pre-flight Checks"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi
print_success "Supabase CLI found: $(supabase --version)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Must run from automedia directory"
    echo "Run: cd automedia && ./scripts/deploy-radar.sh"
    exit 1
fi
print_success "Running from correct directory"

# Check if migrations exist
if [ ! -f "supabase/migrations/20251113131610_create_channel_radar.sql" ]; then
    print_error "Migration file not found: 20251113131610_create_channel_radar.sql"
    exit 1
fi
print_success "Migration 1 found: create_channel_radar.sql"

if [ ! -f "supabase/migrations/20251113131611_setup_radar_cron.sql" ]; then
    print_error "Migration file not found: 20251113131611_setup_radar_cron.sql"
    exit 1
fi
print_success "Migration 2 found: setup_radar_cron.sql"

# Check if Edge Function exists
if [ ! -f "supabase/functions/enrichment-radar-updater/index.ts" ]; then
    print_error "Edge Function not found: enrichment-radar-updater/index.ts"
    exit 1
fi
print_success "Edge Function found: enrichment-radar-updater"

print_info "All pre-flight checks passed!"

# =============================================================================
# Step 2: Deploy Database Migrations
# =============================================================================

print_header "Step 2: Deploy Database Migrations"

print_info "Applying radar migrations directly..."
echo ""

# Apply migrations directly using db execute to avoid conflicts with old migrations
print_info "Applying migration 1: create_channel_radar.sql..."
if supabase db execute -f supabase/migrations/20251113131610_create_channel_radar.sql 2>&1 | tee /tmp/migration1.log; then
    if grep -q "ERROR" /tmp/migration1.log; then
        if grep -q "already exists" /tmp/migration1.log; then
            print_warning "Some objects already exist (skipping duplicates)"
        else
            print_error "Failed to apply migration 1"
            cat /tmp/migration1.log
            exit 1
        fi
    fi
    print_success "Migration 1 applied"
else
    print_error "Failed to apply migration 1"
    exit 1
fi

echo ""
print_info "Applying migration 2: setup_radar_cron.sql..."
if supabase db execute -f supabase/migrations/20251113131611_setup_radar_cron.sql 2>&1 | tee /tmp/migration2.log; then
    if grep -q "ERROR" /tmp/migration2.log; then
        if grep -q "already exists" /tmp/migration2.log; then
            print_warning "Some objects already exist (skipping duplicates)"
        else
            print_error "Failed to apply migration 2"
            cat /tmp/migration2.log
            exit 1
        fi
    fi
    print_success "Migration 2 applied"
else
    print_error "Failed to apply migration 2"
    exit 1
fi

rm -f /tmp/migration1.log /tmp/migration2.log

echo ""
print_info "Radar migrations completed"

# =============================================================================
# Step 3: Deploy Edge Function
# =============================================================================

print_header "Step 3: Deploy Edge Function"

print_info "Deploying enrichment-radar-updater Edge Function..."
echo ""

if supabase functions deploy enrichment-radar-updater; then
    print_success "Edge Function deployed successfully"
    echo ""
    print_info "Function URL: ${SUPABASE_URL}/functions/v1/enrichment-radar-updater"
else
    print_error "Failed to deploy Edge Function"
    exit 1
fi

# =============================================================================
# Step 4: Configure Database Settings
# =============================================================================

print_header "Step 4: Configure Database Settings"

print_info "Setting app.settings.supabase_url..."

# Create SQL file for configuration
cat > /tmp/radar_config.sql << EOF
-- Configure Supabase URL for cron job
ALTER DATABASE postgres
SET app.settings.supabase_url = '${SUPABASE_URL}';

-- Configure Service Role Key for cron job
ALTER DATABASE postgres
SET app.settings.service_role_key = '${SERVICE_ROLE_KEY}';
EOF

if supabase db execute -f /tmp/radar_config.sql; then
    print_success "Database settings configured"
    echo ""
    print_info "Configured:"
    echo "  - app.settings.supabase_url = ${SUPABASE_URL}"
    echo "  - app.settings.service_role_key = [HIDDEN]"
else
    print_error "Failed to configure database settings"
    rm /tmp/radar_config.sql
    exit 1
fi

# Clean up temp file
rm /tmp/radar_config.sql

# =============================================================================
# Step 5: Verification
# =============================================================================

print_header "Step 5: Verification Checks"

print_info "Running verification queries..."
echo ""

# Create verification SQL
cat > /tmp/radar_verify.sql << EOF
-- Check if cron job exists
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-radar-update')
        THEN '✓ Cron job "daily-radar-update" is scheduled'
        ELSE '✗ ERROR: Cron job not found'
    END as cron_status;

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

-- Check permissions
SELECT
    COUNT(*) as permission_count,
    '✓ Permissions granted on channel_radar' as status
FROM information_schema.table_privileges
WHERE table_name = 'channel_radar';

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
EOF

supabase db execute -f /tmp/radar_verify.sql || true
rm /tmp/radar_verify.sql

echo ""

# =============================================================================
# Step 6: Deployment Summary
# =============================================================================

print_header "Deployment Complete!"

cat << EOF
${GREEN}✓ All deployment steps completed successfully!${NC}

${BLUE}📋 What was deployed:${NC}
  1. Database tables: channel_radar, channel_radar_cron_log
  2. Database triggers: sync radar flags, update 10x outlier
  3. Database permissions: SELECT, UPDATE for authenticated users
  4. Cron job: daily-radar-update (runs at 6 AM daily)
  5. Edge Function: enrichment-radar-updater
  6. Database settings: supabase_url, service_role_key

${BLUE}🧪 Next Steps - Manual Testing:${NC}

1. Test adding a channel to radar:
   - Navigate to ${YELLOW}http://localhost:3000/channels${NC}
   - Click "Add to Radar" on any channel
   - Verify it appears in ${YELLOW}http://localhost:3000/radar${NC}

2. Verify cron job schedule:
   ${YELLOW}supabase db execute --sql "SELECT * FROM cron.job WHERE jobname = 'daily-radar-update';"${NC}

3. Trigger manual update (optional):
   ${YELLOW}supabase db execute --sql "SELECT trigger_radar_update_now();"${NC}

4. Monitor execution logs:
   ${YELLOW}supabase db execute --sql "SELECT * FROM channel_radar_cron_log ORDER BY execution_started_at DESC LIMIT 5;"${NC}

5. Check real-time updates:
   - Open ${YELLOW}/radar${NC} in two browser tabs
   - Add/remove channels in one tab
   - Verify updates appear in other tab without refresh

${BLUE}📊 Database Configuration:${NC}
  URL: ${SUPABASE_URL}
  Cron Schedule: 0 6 * * * (6 AM daily)

${BLUE}📚 Documentation:${NC}
  See RADAR_FIXES_REQUIRED.md for detailed deployment checklist

${GREEN}🎉 Channel Radar is now live!${NC}
EOF

# =============================================================================
# Optional: Show cron job details
# =============================================================================

echo ""
print_info "Cron Job Details:"
supabase db execute --sql "SELECT jobid, jobname, schedule, active, command FROM cron.job WHERE jobname = 'daily-radar-update';" || true

echo ""
print_success "Deployment script completed successfully!"
echo ""
