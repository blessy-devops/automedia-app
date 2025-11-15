-- Migration: Create production_webhooks table
-- Description: Stores webhook URLs for sending benchmark videos to production environments
-- Created: 2025-11-14

-- Create production_webhooks table
CREATE TABLE IF NOT EXISTS production_webhooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  webhook_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_webhook_name UNIQUE(name),
  CONSTRAINT valid_webhook_url CHECK (webhook_url ~ '^https?://')
);

-- Create index for active webhooks lookup
CREATE INDEX idx_production_webhooks_active ON production_webhooks(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_production_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_production_webhooks_updated_at
  BEFORE UPDATE ON production_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_production_webhooks_updated_at();

-- Optional: Create webhook_logs table for audit trail
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES production_webhooks(id) ON DELETE CASCADE,
  video_count INTEGER NOT NULL,
  video_ids INTEGER[] NOT NULL,
  status VARCHAR(20) CHECK (status IN ('success', 'failed', 'partial')),
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by VARCHAR(255) -- For future user tracking
);

-- Create index for webhook logs lookup
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_sent_at ON webhook_logs(sent_at DESC);

-- Add comment on tables
COMMENT ON TABLE production_webhooks IS 'Stores webhook URLs for sending benchmark videos to external production environments';
COMMENT ON TABLE webhook_logs IS 'Audit trail for all webhook send attempts';

-- Insert example webhook (optional - can be removed)
-- INSERT INTO production_webhooks (name, webhook_url, description)
-- VALUES ('Production Database', 'https://your-project.supabase.co/functions/v1/receive-benchmark-videos', 'Main production environment webhook');
