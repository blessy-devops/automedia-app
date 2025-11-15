-- Migration: Add api_key column to production_webhooks table
-- Created: 2025-11-14
-- Purpose: Support webhook authentication with Bearer token
--
-- This allows the send-to-gobbi Edge Function to authenticate
-- with the receive-benchmark-videos webhook on Gobbi's platform

-- Add api_key column (nullable - some webhooks may not require auth)
ALTER TABLE production_webhooks
ADD COLUMN api_key TEXT;

-- Add constraint to ensure api_key is at least 16 characters if provided
-- This helps prevent weak/short API keys
ALTER TABLE production_webhooks
ADD CONSTRAINT check_api_key_length
CHECK (api_key IS NULL OR LENGTH(api_key) >= 16);

-- Add comment for documentation
COMMENT ON COLUMN production_webhooks.api_key IS
'Optional API key for webhook authentication. Sent as Bearer token in Authorization header. Must be at least 16 characters if provided.';
