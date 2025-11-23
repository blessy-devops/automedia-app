-- ============================================================================
-- TITLE APPROVAL SYSTEM
-- Migration to add title approval workflow columns to production_videos
-- Date: 2025-11-23
-- ============================================================================
--
-- OBJETIVO:
-- Substituir o fluxo de aprovação de títulos por email (N8N → Gmail)
-- por uma fila de aprovação real-time dentro da plataforma.
--
-- FLUXO:
-- 1. N8N gera títulos com Claude e salva JSON em title_approval_data
-- 2. Plataforma exibe fila real-time de títulos pendentes (/production/approval-queue)
-- 3. Usuário seleciona título e aprova
-- 4. Sistema atualiza title, marca como approved e avança status para 'create_outline'
-- ============================================================================

-- Adicionar colunas para sistema de aprovação de títulos
ALTER TABLE production_videos
ADD COLUMN IF NOT EXISTS title_approval_data JSONB,
ADD COLUMN IF NOT EXISTS title_approval_status TEXT CHECK (title_approval_status IN ('pending', 'approved')),
ADD COLUMN IF NOT EXISTS title_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS title_approved_by TEXT;

-- Índice para queries eficientes (buscar títulos pendentes de aprovação)
CREATE INDEX IF NOT EXISTS idx_title_approval_pending
ON production_videos(title_approval_status, created_at)
WHERE title_approval_status = 'pending' AND status = 'create_title';

-- Comentários para documentação
COMMENT ON COLUMN production_videos.title_approval_data IS
'JSONB contendo título sugerido pelo Claude, alternativas (10 opções), análise emocional e título de referência do benchmark.
Exemplo: { "title": "...", "alternatives": [{...}], "analysis": {...}, "original": {...} }';

COMMENT ON COLUMN production_videos.title_approval_status IS
'Status da aprovação de título: null (não iniciado) | pending (aguardando aprovação) | approved (título aprovado)';

COMMENT ON COLUMN production_videos.title_approved_at IS
'Timestamp de quando o título foi aprovado pelo usuário';

COMMENT ON COLUMN production_videos.title_approved_by IS
'Identificador de quem aprovou o título (email, user_id, etc). Útil para auditoria.';

-- ============================================================================
-- EXEMPLO DE ESTRUTURA DO JSONB (title_approval_data)
-- ============================================================================
-- FORMATO REAL ENVIADO PELO N8N:
-- {
--   "title": "On Father's Day, My CEO Son Asked, \"Dad, Do You Like The $8000 Marcus Sends You?\"",
--   "alternatives": [
--     { "text": "At My Retirement Party, My VP Son Asked, \"Dad, Who Paid Your $6000 Medical Bills?\"", "score": "6/7" },
--     { "text": "On My 70th Birthday, My Executive Son Said, \"Dad, Wasn't It Nice of Derek to Fix Your Roof?\"", "score": "6/7" },
--     { "text": "At Thanksgiving, My Director Son Asked, \"Dad, Do You Appreciate The $7500 Kevin Gives You?\"", "score": "7/7" },
--     { "text": "On Father's Day, My Manager Son Asked, \"Dad, Aren't You Grateful For What Brian Does?\"", "score": "5/7" },
--     ... (mais 6 alternativas, total de 10)
--   ],
--   "analysis": {
--     "emotional": null,
--     "rationale": "6/7 Fidelity Score"
--   },
--   "original": {
--     "formula": null
--   },
--   "benchmark_title": null,
--   "generated_at": "2025-11-23T14:10:55.382Z"
-- }
--
-- CAMPOS:
-- - title: Título principal sugerido pelo Claude (string, obrigatório)
-- - alternatives: Array com 10 alternativas, cada uma com 'text' e 'score' (array, obrigatório)
-- - analysis.emotional: Análise emocional (string ou null)
-- - analysis.rationale: Justificativa do score (string)
-- - original.formula: Fórmula narrativa usada (string ou null)
-- - benchmark_title: Título do vídeo de referência (string ou null)
-- - generated_at: Timestamp de geração (ISO 8601 string)
-- ============================================================================

-- ============================================================================
-- INTEGRAÇÃO COM N8N
-- ============================================================================
-- No workflow N8N, após o node de geração de títulos com Claude:
--
-- ANTES (fluxo antigo):
-- [Parse JSON] → [Send Email (Human in Loop)] → [Wait for Response] → [Update DB]
--
-- DEPOIS (novo fluxo):
-- [Parse JSON] → [Supabase Update Node] → ✅ FIM
--
-- Configuração do Supabase Update Node no N8N:
-- - Table: production_videos
-- - Update By: id = {{ $json.video_id }}
-- - Fields:
--     title_approval_data: {{ $json.titleData }}
--     title_approval_status: "pending"
--     updated_at: "{{ $now.toISO() }}"
-- ============================================================================
