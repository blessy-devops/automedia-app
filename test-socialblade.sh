#!/bin/bash

# Script de Teste - SocialBlade Scraper Edge Function
# Uso: ./test-socialblade.sh [channelId]

CHANNEL_ID=${1:-"UCuAXFkgsw1L7xaCfnd5JJOw"}  # Default: Fireship
SUPABASE_URL="https://xlpkabexmwsugkmbngwm.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODgwMjUsImV4cCI6MjA3NTk2NDAyNX0.3Fln1PXKSQtUucS9X3J-b0_L37ealeLFewpSJs6Z7gc"

echo "🧪 Testing SocialBlade Scraper Edge Function"
echo "📺 Channel ID: $CHANNEL_ID"
echo "⏰ Starting test at $(date +%H:%M:%S)"
echo ""

START_TIME=$(date +%s)

curl -X POST "$SUPABASE_URL/functions/v1/test-socialblade-scraper" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"channelId\": \"$CHANNEL_ID\"}" \
  -w "\n\n⏱️  HTTP Status: %{http_code}\n⏱️  Total Time: %{time_total}s\n" \
  | jq '.'

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "✅ Test completed in ${DURATION}s"
echo ""
echo "📊 To check logs:"
echo "   supabase functions logs test-socialblade-scraper --follow"
