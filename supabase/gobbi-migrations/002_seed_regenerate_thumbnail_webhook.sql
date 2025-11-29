-- ============================================================================
-- SEED REGENERATE THUMBNAIL WEBHOOK (Gobbi Database)
-- Execute this script manually in Gobbi's Supabase Dashboard > SQL Editor
-- Date: 2025-11-29
-- ============================================================================

-- Inserir webhook para regeneracao de thumbnail via N8N
-- Este webhook sera chamado quando uma thumbnail for reprovada
INSERT INTO production_webhooks (name, webhook_url, description, is_active, webhook_type, api_key)
VALUES (
  'n8n-regenerate-thumbnail',
  'https://n8n.exemplo.com/webhook/regenerate-thumbnail',
  'Webhook para acionar fluxo N8N de regeneracao de thumbnail quando reprovada. Payload: { video_id, thumb_text }',
  TRUE,
  'regeneration',
  NULL
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  webhook_type = EXCLUDED.webhook_type;

-- Verificar insercao
SELECT * FROM production_webhooks WHERE webhook_type = 'regeneration';
