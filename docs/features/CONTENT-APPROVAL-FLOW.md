# Content Approval Flow - Documentação Técnica

## Visão Geral

O Content Approval Flow é a etapa do workflow de produção onde o usuário revisa e aprova/rejeita o pacote de conteúdo gerado pela automação N8N. O pacote inclui:

- **Teaser Script**: Texto do gancho de abertura do vídeo
- **Script Completo**: Roteiro completo do vídeo
- **Description**: Descrição otimizada para YouTube

---

## Critérios para Aparecer na Tela de Aprovação

Um vídeo aparece na aba "Content" da tela de aprovação quando:

| Campo | Valor Esperado |
|-------|----------------|
| `status` | `'review_script'` |
| `content_approval_status` | `'pending'` |

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
  .eq('status', 'review_script')
  .eq('content_approval_status', 'pending')
  .order('created_at', { ascending: true })
```

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

**Propósito:** Aprovar o pacote de conteúdo e avançar o vídeo para a próxima etapa.

**Validações:**
1. Vídeo existe
2. Status atual é `'review_script'`
3. `content_approval_status` é `'pending'`
4. Há pelo menos um conteúdo (script, teaser_script ou description)

**Ações no Banco:**
```sql
UPDATE production_videos
SET
  content_approval_status = 'approved',
  content_approved_at = NOW(),
  status = 'create_cast',
  updated_at = NOW()
WHERE id = :videoId
```

**Fluxo do Workflow:**
```
review_script (7) → create_cast (3)
                    ↓
                    (próximas etapas de produção)
```

---

### 3. rejectContent(videoId: number)

**Localização:** `app/(dashboard)/production/approval-queue/actions.ts`

**Propósito:** Rejeitar o pacote de conteúdo e marcar para regeneração.

**Validações:**
1. Vídeo existe
2. Status atual é `'review_script'`
3. `content_approval_status` é `'pending'`

**Ações no Banco:**
```sql
UPDATE production_videos
SET
  content_approval_status = 'rejected',
  content_approved_at = NOW(),
  status = 'regenerate_script',
  updated_at = NOW()
WHERE id = :videoId
```

**Fluxo do Workflow:**
```
review_script (7) → regenerate_script (8)
                    ↓
                    (N8N detecta e regenera o conteúdo)
                    ↓
                    review_script (7)
                    ↓
                    (volta para aprovação)
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
- [ ] Webhook para notificar N8N sobre rejeição
