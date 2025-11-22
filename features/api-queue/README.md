# API Queue Feature

## 📊 Status: Pixel-Perfect UI ✅ | Real Data Integration Ready ⏳

A página API Queue está **visualmente completa** e idêntica ao design do Figma. A integração com dados reais está **preparada** e aguardando aplicação da VIEW no banco de dados.

---

## 🔄 Como Habilitar Dados Reais

### **Passo 1: Aplicar Migration no Supabase**

A migration já foi criada em:
```
supabase/migrations/20251121214559_create_vw_api_queue_enriched.sql
```

**Opção A: Via Dashboard do Supabase (Recomendado)**
1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Cole o conteúdo do arquivo de migration
3. Clique em "Run"

**Opção B: Via SQL Editor local**
```bash
npx supabase migration up --local
```

### **Passo 2: Descomentar Query Real**

No arquivo `app/(dashboard)/production/api-queue/page.tsx`:

1. **Comentar** estas linhas (mock data):
```typescript
// TEMPORARY: Using mock data until VIEW is applied
const { mockImageJobs, mockAudioJobs, mockVideoJobs, getMockStats } = await import('@/features/api-queue/lib/mock-data')
const allJobs = [...mockImageJobs, ...mockAudioJobs, ...mockVideoJobs]
```

2. **Descomentar** estas linhas (dados reais):
```typescript
const { data: viewData, error } = await supabase
  .from('vw_api_queue_enriched')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100)

if (error) {
  console.error('Error fetching queue data:', error)
}

const allJobs = mapViewRowsToApiQueueJobs(viewData || [])
```

### **Passo 3: Testar**

```bash
pnpm dev
```

Acesse: `http://localhost:3000/production/api-queue`

Você verá os jobs reais da tabela `structure_api_queue`! 🎉

---

## 🗂️ O Que a VIEW Faz

A VIEW `vw_api_queue_enriched` pré-processa os dados para a UI:

### **Campos Extraídos do JSONB:**
- `payload.model` → `model`
- `payload.positivePrompt` → `prompt`
- `payload.taskUUID` → `task_uuid`

### **JOIN com benchmark_videos:**
- `video_title` - Título do vídeo
- `channel_name` - Nome do canal

### **Campos Computados:**
- `job_type` - Detecta automaticamente: "image", "audio", "video"
- `job_status` - Mapeia: "processed" → "completed", "pending" → "queued"
- `eta` - Estimativa de tempo restante

### **Exemplo de Query:**
```sql
SELECT * FROM vw_api_queue_enriched
WHERE job_type = 'image'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📁 Estrutura de Arquivos

```
features/api-queue/
├── types.ts                    # Interfaces TypeScript
├── lib/
│   ├── adapters.ts             # Mapeia VIEW → TypeScript (NOVO!)
│   ├── mock-data.ts            # Mock data (temporário)
│   └── utils.ts                # Funções helper
└── components/                 # (componentes antigos não usados)

app/(dashboard)/production/api-queue/
├── page.tsx                    # Server Component (preparado para dados reais)
└── client.tsx                  # Client Component (UI completa)

supabase/migrations/
└── 20251121214559_create_vw_api_queue_enriched.sql  # Migration (NOVO!)
```

---

## 🎨 Provider Badges (Cores)

O adapter mapeia providers automaticamente:

| Provider DB | Provider UI | Cor Badge |
|------------|-------------|-----------|
| "runware" | Runware | Purple |
| "gemini" | Gemini | Blue |
| "openai", "gpt" | GPT | Green |
| "elevenlabs" | ElevenLabs | Orange |
| "google tts" | Google TTS | Red |
| outros | FFMPEG | Gray |

---

## 🔧 Funções do Adapter

### **mapProvider(provider: string)**
Mapeia string do banco → Provider type com cores corretas

### **simplifyModel(model: string)**
Simplifica nomes complexos:
- `"rundiffusion:130@100"` → `"Rundiffusion 130"`
- `"dall-e-3"` → `"DALL-E 3"`

### **truncatePrompt(prompt: string)**
Trunca prompts longos para 100 caracteres na tabela

### **calculateEta(createdAt, processedAt, status)**
Calcula tempo estimado para jobs em processamento

### **mapViewRowToApiQueueJob(row)**
Função principal que converte row da VIEW → `ApiQueueJob`

---

## 📊 Stats Cards (Cálculo Real)

Quando usar dados reais, as 4 métricas serão calculadas da VIEW:

```typescript
const stats: QueueStats = {
  processing: allJobs.filter(j => j.status === 'processing').length,
  queued: allJobs.filter(j => j.status === 'queued').length,
  completed24h: allJobs.filter(j => j.status === 'completed').length,
  failed24h: failedJobs.length,
}
```

**TODO:** Filtrar `completed24h` e `failed24h` por data real (últimas 24h) ao invés de todos os jobs.

---

## 🚀 Próximos Passos (Opcional)

### **1. Period Filter Funcional**
Implementar filtro por período no page.tsx:
```typescript
const periodHours = getPeriodHours(periodFilter) // '1h', '24h', '7d'
const cutoffDate = new Date(Date.now() - periodHours * 60 * 60 * 1000)

.gte('created_at', cutoffDate.toISOString())
```

### **2. Actions Reais (RPCs)**
Criar RPCs para ações:
```sql
CREATE FUNCTION retry_queue_job(job_id bigint) ...
CREATE FUNCTION cancel_queue_job(job_id bigint) ...
```

### **3. Real-time Updates**
Adicionar Supabase Realtime subscription:
```typescript
supabase
  .channel('api-queue-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'structure_api_queue'
  }, handleUpdate)
  .subscribe()
```

### **4. View Logs Modal**
Criar modal para exibir `payload` completo do job

---

## ✅ Checklist de Integração

- [x] Migration criada (`vw_api_queue_enriched`)
- [x] Adapter implementado (`adapters.ts`)
- [x] Page.tsx preparado para dados reais
- [ ] Migration aplicada no banco
- [ ] Dados reais descomentados no page.tsx
- [ ] Testado com jobs reais
- [ ] Period filter implementado
- [ ] RPCs de actions criados
- [ ] Real-time subscription adicionado

---

**Status:** 🟡 Aguardando aplicação da VIEW no banco
**Última atualização:** 21/11/2025
