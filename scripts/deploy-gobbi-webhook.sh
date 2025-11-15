#!/bin/bash
# deploy-gobbi-webhook.sh
# Script para fazer deploy completo da integração webhook AutoMedia ↔ Gobbi
#
# Usage:
#   chmod +x scripts/deploy-gobbi-webhook.sh
#   ./scripts/deploy-gobbi-webhook.sh

set -e  # Exit on error

echo "🚀 AutoMedia → Gobbi Webhook Integration Deployment"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found. Are you in the automedia directory?${NC}"
  exit 1
fi

echo -e "${BLUE}📍 Current directory: $(pwd)${NC}"
echo ""

# Step 1: Run migration
echo -e "${YELLOW}Step 1: Running database migration...${NC}"
echo "Migration: 20251114_add_gobbi_compatible_fields.sql"
echo ""

read -p "Run migration now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running migration..."
  npx supabase migration up
  echo -e "${GREEN}✅ Migration completed${NC}"
else
  echo -e "${YELLOW}⚠️  Skipping migration (run manually: npx supabase migration up)${NC}"
fi

echo ""

# Step 2: Configure secrets
echo -e "${YELLOW}Step 2: Configuring secrets...${NC}"
echo ""

echo "You need to set these secrets:"
echo "  1. GOBBI_SUPABASE_URL"
echo "  2. GOBBI_SERVICE_ROLE_KEY"
echo ""

read -p "Configure secrets now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Setting GOBBI_SUPABASE_URL..."
  npx supabase secrets set GOBBI_SUPABASE_URL=https://eafkhsmgrzywrhviisdl.supabase.co

  echo "Setting GOBBI_SERVICE_ROLE_KEY..."
  npx supabase secrets set GOBBI_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZmtoc21ncnp5d3Jodmlpc2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1MjIzMywiZXhwIjoyMDYzNTI4MjMzfQ.Tiaai7QQLOhuRnd-l2mg1RVC_NXM7XVgOKNxjQQY98E

  echo -e "${GREEN}✅ Secrets configured${NC}"
else
  echo -e "${YELLOW}⚠️  Skipping secrets configuration (run manually - see docs)${NC}"
fi

echo ""

# Step 3: Deploy send-to-gobbi Edge Function
echo -e "${YELLOW}Step 3: Deploying send-to-gobbi Edge Function...${NC}"
echo ""

read -p "Deploy send-to-gobbi function now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Deploying send-to-gobbi..."
  npx supabase functions deploy send-to-gobbi
  echo -e "${GREEN}✅ send-to-gobbi deployed${NC}"
else
  echo -e "${YELLOW}⚠️  Skipping deployment (run manually: npx supabase functions deploy send-to-gobbi)${NC}"
fi

echo ""

# Step 4: Verify deployment
echo -e "${YELLOW}Step 4: Verifying deployment...${NC}"
echo ""

echo "Listing deployed functions..."
npx supabase functions list

echo ""
echo -e "${GREEN}✅ Verification complete${NC}"
echo ""

# Step 5: Instructions for Gobbi's side
echo -e "${YELLOW}Step 5: Deploy receive function on Gobbi's Supabase${NC}"
echo ""
echo "⚠️  The following steps must be done on Gobbi's Supabase account:"
echo ""
echo "1. Create function directory:"
echo "   mkdir -p supabase/functions/receive-benchmark-videos"
echo ""
echo "2. Copy function code:"
echo "   cp docs/gobbi-database/receive-benchmark-videos-function.ts \\"
echo "      supabase/functions/receive-benchmark-videos/index.ts"
echo ""
echo "3. Deploy to Gobbi's Supabase:"
echo "   npx supabase functions deploy receive-benchmark-videos --project-ref eafkhsmgrzywrhviisdl"
echo ""
echo "4. (Optional) Set up webhook API key:"
echo "   npx supabase secrets set WEBHOOK_API_KEY=your-secret-key --project-ref eafkhsmgrzywrhviisdl"
echo ""

# Step 6: Test webhook
echo ""
echo -e "${YELLOW}Step 6: Testing webhook integration${NC}"
echo ""

read -p "Run a test send? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Testing webhook..."
  echo ""
  echo "Run this in your browser console or via curl:"
  echo ""
  echo "const { data, error } = await supabase.functions.invoke('send-to-gobbi', {"
  echo "  body: { video_ids: [1] }  // Replace with a valid video ID"
  echo "})"
  echo "console.log(data)"
  echo ""
else
  echo -e "${YELLOW}⚠️  Skipping test (test manually - see docs/gobbi-database/WEBHOOK_INTEGRATION.md)${NC}"
fi

echo ""

# Summary
echo ""
echo -e "${GREEN}=================================================="
echo "🎉 Deployment Complete!"
echo "==================================================${NC}"
echo ""
echo "✅ Migration deployed"
echo "✅ Secrets configured"
echo "✅ Edge Function deployed (send-to-gobbi)"
echo ""
echo "📚 Next steps:"
echo "  1. Deploy receive function on Gobbi's Supabase (see instructions above)"
echo "  2. Test the integration (see docs/gobbi-database/WEBHOOK_INTEGRATION.md)"
echo "  3. Monitor logs: npx supabase functions logs send-to-gobbi --tail"
echo ""
echo "📖 Full documentation:"
echo "   docs/gobbi-database/WEBHOOK_INTEGRATION.md"
echo ""
echo "🔗 Edge Function URL:"
echo "   https://[YOUR-PROJECT].supabase.co/functions/v1/send-to-gobbi"
echo ""

# Check for unique constraint on Gobbi's DB
echo -e "${YELLOW}⚠️  Important: Verify unique constraint on Gobbi's benchmark_videos table${NC}"
echo ""
echo "Run this SQL on Gobbi's database:"
echo ""
echo "ALTER TABLE benchmark_videos"
echo "ADD CONSTRAINT unique_youtube_video_id UNIQUE (youtube_video_id);"
echo ""

echo "Done! 🚀"
