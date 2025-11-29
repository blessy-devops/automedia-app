-- ============================================================================
-- CREATE PRODUCTION_WEBHOOKS TABLE (Gobbi Database)
-- Execute this script manually in Gobbi's Supabase Dashboard > SQL Editor
-- Date: 2025-11-29
-- ============================================================================

-- 1. Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_production_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar tabela production_webhooks
CREATE TABLE IF NOT EXISTS public.production_webhooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  webhook_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  api_key TEXT,
  webhook_type VARCHAR(50) DEFAULT 'benchmark',

  CONSTRAINT unique_webhook_name UNIQUE (name),
  CONSTRAINT check_api_key_length CHECK (api_key IS NULL OR LENGTH(api_key) >= 16),
  CONSTRAINT valid_webhook_url CHECK (webhook_url ~ '^https?://'),
  CONSTRAINT check_webhook_type CHECK (webhook_type IN ('benchmark', 'regeneration', 'creation', 'notification'))
);

-- 3. Criar indices
CREATE INDEX IF NOT EXISTS idx_production_webhooks_active
  ON public.production_webhooks(is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_production_webhooks_type
  ON public.production_webhooks(webhook_type);

-- 4. Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_production_webhooks_updated_at ON production_webhooks;
CREATE TRIGGER trigger_update_production_webhooks_updated_at
  BEFORE UPDATE ON production_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_production_webhooks_updated_at();

-- 5. Comentario de documentacao
COMMENT ON COLUMN production_webhooks.webhook_type IS
  'Tipo do webhook: benchmark (envio de videos), regeneration (regerar thumb/script), creation (criar conteudo), notification (alertas)';

-- 6. Criar tabela webhook_logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES production_webhooks(id) ON DELETE CASCADE,
  video_count INTEGER NOT NULL,
  video_ids INTEGER[] NOT NULL,
  status VARCHAR(20) CHECK (status IN ('success', 'failed', 'partial')),
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id
  ON public.webhook_logs(webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_sent_at
  ON public.webhook_logs(sent_at DESC);

-- 7. Seed do webhook existente (receive-benchmark-videos)
INSERT INTO production_webhooks (id, name, webhook_url, description, is_active, webhook_type, api_key)
VALUES (
  1,
  'receive-benchmark-videos',
  'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos',
  'Webhook principal para receber videos de benchmark do ambiente de desenvolvimento',
  TRUE,
  'benchmark',
  NULL
) ON CONFLICT (name) DO UPDATE SET
  webhook_url = EXCLUDED.webhook_url,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  webhook_type = EXCLUDED.webhook_type;

-- Reset sequence para proximo ID
SELECT setval('production_webhooks_id_seq', COALESCE((SELECT MAX(id) FROM production_webhooks), 1));

-- 8. Verificar criacao
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT * FROM production_webhooks;
