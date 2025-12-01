# Content Approval Flow - Documentação Técnica

**Última atualização:** 2025-12-01
**Status:** ✅ Implementado com Webhooks e Retry

## Visão Geral

O Content Approval Flow é a etapa do workflow de produção onde o usuário revisa e aprova/rejeita o pacote de conteúdo gerado pela automação N8N. O pacote inclui:

- **Teaser Script**: Texto do gancho de abertura do vídeo
- **Script Completo**: Roteiro completo do vídeo
- **Description**: Descrição otimizada para YouTube

---

## Critérios para Aparecer na Tela de Aprovação

Um vídeo aparece na aba "Content" da tela de aprovação nos seguintes casos:

| `content_approval_status` | `status` | Situação |
|--------------------------|----------|----------|
| `'pending'` | `'review_script'` | Aguardando aprovação normal |
| `'regenerating'` | `'regenerate_script'` | Regenerando conteúdo (loading) |
| `'approved'` | `'review_script'` | Aprovado mas webhook create-cast falhou (retry) |

### Query de Busca (Server Action)

```typescript
// Arquivo: app/(dashboard)/production/approval-queue/actions.ts
// Função: getPendingContentApprovals()

const { data } = await supabase
  .from('production_videos')
  .select(`
    id,
    title,
    script,
    teaser_script,
    description,
    content_approval_status,
    created_at,
    benchmark_id,
    placeholder,
    status,
    benchmark_videos (
      id,
      title,
      thumbnail_url
    )
  `)
  .in('content_approval_status', ['pending', 'regenerating', 'approved'])
  .in('status', ['review_script', 'regenerate_script'])
  .order('created_at', { ascending: true })
```

**NOTA:** Quando `content_approval_status = 'approved'` E `status = 'review_script'`, significa que o conteúdo foi aprovado mas o webhook create-cast falhou. O item continua na fila para retry.

---

## Server Actions

### 1. getPendingContentApprovals()

**Localização:** `app/(dashboard)/production/approval-queue/actions.ts`

**Propósito:** Buscar todos os vídeos pendentes de aprovação de conteúdo.

**Retorno:**
```typescript
interface PendingContent {
  id: number
  title: string | null
  script: string | null
  teaser_script: string | null
  description: string | null
  content_approval_status: string | null
  created_at: string
  benchmark_id: number | null
  placeholder: string | null
  status: string
  benchmark_videos?: {
    id: number
    title: string
    thumbnail_url: string | null
  } | null
}
```

---

### 2. approveContent(videoId: number)

**Localização:** `app/(dashboard)/production/approval-queue/actions.ts`

**Propósito:** Aprovar o pacote de conteúdo e chamar webhook `create-cast`.

**Validações:**
1. Vídeo existe
2. Status atual é `'review_script'`
3. `content_approval_status` é `'pending'`
4. Há pelo menos um conteúdo (script, teaser_script ou description)

**Fluxo:**
```
1. Marca content_approval_status = 'approved' (mas NÃO muda status ainda)
2. Chama webhook 'create-cast'
3. SE webhook OK → muda status para 'create_cast' (sai da fila)
4. SE webhook FALHA → status fica 'review_script' (continua na fila com erro)
```

**Retorno:**
```typescript
{
  success: boolean
  error?: string
  videoId?: number
  webhookFailed?: boolean  // true se webhook falhou
}
```

**Ações no Banco (webhook OK):**
```sql
-- Primeiro update (antes do webhook)
UPDATE production_videos
SET
  content_approval_status = 'approved',
  content_approved_at = NOW(),
  updated_at = NOW()
WHERE id = :videoId

-- Segundo update (após webhook OK)
UPDATE production_videos
SET
  status = 'create_cast',
  updated_at = NOW()
WHERE id = :videoId
```

---

### 3. rejectContent(videoId: number)

**Localização:** `app/(dashboard)/production/approval-queue/actions.ts`

**Propósito:** Rejeitar o pacote de conteúdo, marcar para regeneração e chamar webhook `create-content`.

**Validações:**
1. Vídeo existe
2. Status atual é `'review_script'`
3. `content_approval_status` é `'pending'`

**Fluxo:**
```
1. Marca content_approval_status = 'regenerating' (não 'rejected')
2. Muda status para 'regenerate_script'
3. Chama webhook 'create-content' para regenerar
4. Item fica na fila com visual de loading
5. SE webhook FALHA → visual de erro com botão Retry
```

**Retorno:**
```typescript
{
  success: boolean
  error?: string
  videoId?: number
  webhookFailed?: boolean  // true se webhook falhou
}
```

**Ações no Banco:**
```sql
UPDATE production_videos
SET
  content_approval_status = 'regenerating',  -- NÃO 'rejected'
  status = 'regenerate_script',
  updated_at = NOW()
WHERE id = :videoId
```

---

### 4. retryContentWebhook(videoId: number)

**Localização:** `app/(dashboard)/production/approval-queue/actions.ts`

**Propósito:** Retry de webhook quando falhou. Detecta automaticamente qual webhook chamar.

**Lógica:**
```
SE content_approval_status = 'approved' E status = 'review_script':
   → Chama webhook 'create-cast' (aprovação que falhou)
   → Se OK, avança status para 'create_cast'

SE content_approval_status = 'regenerating' E status = 'regenerate_script':
   → Chama webhook 'create-content' (regeneração que falhou)
```

**Retorno:**
```typescript
{
  success: boolean
  error?: string
  videoId?: number
  webhookFailed?: boolean  // true se webhook falhou novamente
}
```

---

### 4. getContentApprovalHistory()

**Localização:** `app/(dashboard)/production/approval-queue/actions.ts`

**Propósito:** Buscar histórico de conteúdos já aprovados/rejeitados.

**Query:**
```typescript
const { data } = await supabase
  .from('production_videos')
  .select(`...`)
  .in('content_approval_status', ['approved', 'rejected'])
  .order('content_approved_at', { ascending: false })
  .limit(50)
```

---

## Estrutura do Banco de Dados

### Tabela: production_videos

**Colunas relacionadas ao Content Approval:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `script` | `TEXT` | Roteiro completo do vídeo |
| `teaser_script` | `TEXT` | Script do teaser/gancho de abertura |
| `description` | `TEXT` | Descrição otimizada para YouTube |
| `content_approval_status` | `TEXT` | Status da aprovação: `'pending'`, `'approved'`, `'rejected'` |
| `content_approved_at` | `TIMESTAMPTZ` | Data/hora da aprovação/rejeição |
| `content_approved_by` | `TEXT` | Usuário que aprovou (TODO: integrar com auth) |
| `status` | `TEXT` | Status atual do workflow |

### Tabela: structure_allowed_status

**Status relevantes para Content Approval:**

| sort_order | status_key | status_label | workflow_phase |
|------------|------------|--------------|----------------|
| 7 | `review_script` | Review Script | script |
| 8 | `regenerate_script` | Regenerate Script | script |
| 3 | `create_cast` | Create Cast | script |

---

## Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKFLOW DE CONTEÚDO                         │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  create_script   │  N8N gera script, teaser e description
    │   (sort: 5)      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ create_teaser_   │  N8N gera teaser script
    │    script (6)    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  review_script   │  Vídeo aparece na tela de aprovação
    │    (sort: 7)     │  content_approval_status = 'pending'
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │   DECISÃO DO     │
    │    USUÁRIO       │
    └────────┬─────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌───────────┐  ┌────────────────┐
│  APROVAR  │  │    REJEITAR    │
└─────┬─────┘  └───────┬────────┘
      │                │
      ▼                ▼
┌───────────┐  ┌────────────────┐
│create_cast│  │ regenerate_    │
│ (sort: 3) │  │  script (8)    │
└─────┬─────┘  └───────┬────────┘
      │                │
      ▼                │
┌───────────┐          │
│  Próximas │          │
│  etapas   │          │
│  de prod  │          │
└───────────┘          │
                       │
                       ▼
              ┌────────────────┐
              │  N8N detecta   │
              │  e regenera    │
              │  o conteúdo    │
              └───────┬────────┘
                      │
                      │ (volta para review)
                      │
                      └─────────────────┐
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  review_script   │
                               │    (sort: 7)     │
                               └──────────────────┘
```

---

## Componente de UI

### Localização
`app/(dashboard)/production/approval-queue/components/title-approval-queue.tsx`

### Aba Content
- **Lista Esquerda:** Cards com preview do conteúdo (título + teaser truncado)
- **Painel Direito:** 5 cards:
  1. Video Info (título, badges)
  2. Teaser (gradient roxo/rosa)
  3. Script Completo (gradient azul/cyan, ScrollArea h-[400px])
  4. Description (gradient verde/emerald)
  5. Info/Dica (blue box)

### Action Bar
- Botão "Reject Package" (vermelho) → chama `rejectContent()`
- Botão "Approve Package" (verde) → chama `approveContent()`

---

## Migrations Relacionadas

1. **20251129013145_add_content_approval_columns.sql**
   - Adiciona colunas: `content_approval_status`, `content_approved_at`, `content_approved_by`
   - Cria índice para queries de pending

2. **20251129022117_add_regenerate_script_status.sql**
   - Adiciona status `regenerate_script` (sort_order: 8)
   - Reordena status subsequentes (8→9, 9→10, etc)

---

## TODO / Melhorias Futuras

- [ ] Integrar `content_approved_by` com sistema de autenticação
- [ ] Adicionar campo de notas/feedback ao rejeitar
- [ ] Implementar edição inline do conteúdo
- [ ] Adicionar histórico de versões do conteúdo
- [x] ~~Webhook para notificar N8N sobre rejeição~~ (Implementado: `create-content` é chamado ao rejeitar)
- [x] ~~Webhook para continuar pipeline ao aprovar~~ (Implementado: `create-cast` é chamado ao aprovar)
- [x] ~~UI de loading durante regeneração~~ (Implementado)
- [x] ~~Botão de retry quando webhook falha~~ (Implementado)

---

## Webhooks Relacionados

| Webhook | Disparado Quando | Payload |
|---------|-----------------|---------|
| `create-cast` | Conteúdo é aprovado | `{ production_video_id, triggered_at }` |
| `create-content` | Conteúdo é rejeitado (regenerar) | `{ production_video_id, triggered_at, is_regeneration: true }` |

**Nota:** Os webhooks são configurados na tabela `production_webhooks` e usam Header Auth com `X-API-Key`.
