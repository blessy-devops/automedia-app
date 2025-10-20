# Edge Functions Setup Guide

Este guia explica como configurar e deployar as Edge Functions do Supabase para o pipeline de enriquecimento.

## Pré-requisitos

1. **Supabase CLI instalado**
   ```bash
   brew install supabase/tap/supabase
   # ou
   npm install -g supabase
   ```

2. **Conta Supabase**
   - Projeto criado: `xlpkabexmwsugkmbngwm`
   - Service Role Key configurado

3. **API Keys no Vault**
   - RapidAPI key armazenada

## Estrutura de Arquivos

```
supabase/
├── config.toml                                    # Configuração do Supabase
└── functions/
    └── enrichment-pipeline-starter/
        ├── index.ts                               # Código da Edge Function
        └── README.md                              # Documentação
```

## Setup Inicial

### 1. Inicializar Supabase (se necessário)

```bash
cd automedia
supabase init
```

### 2. Fazer Login no Supabase

```bash
supabase login
```

### 3. Link com o Projeto

```bash
supabase link --project-ref xlpkabexmwsugkmbngwm
```

### 4. Configurar Secrets no Vault

#### Via Dashboard:

1. Acesse: https://app.supabase.com/project/xlpkabexmwsugkmbngwm/settings/vault
2. Clique em "New Secret"
3. Nome: `rapidapi_key_1760651731629`
4. Value: Sua RapidAPI key
5. Save

#### Via CLI:

```bash
# Adicionar secret
supabase secrets set rapidapi_key_1760651731629=YOUR_RAPIDAPI_KEY

# Verificar secrets
supabase secrets list
```

## Deploy da Edge Function

### Deploy para Produção

```bash
# Deploy da função
supabase functions deploy enrichment-pipeline-starter

# Verificar deploy
supabase functions list
```

### Configurar Variáveis de Ambiente

As seguintes variáveis são automaticamente disponibilizadas para Edge Functions:

- `SUPABASE_URL` - URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `SUPABASE_ANON_KEY` - Anon key

**Não é necessário configurá-las manualmente.**

## Testando Localmente

### 1. Iniciar Supabase Local

```bash
supabase start
```

Isso irá iniciar:
- PostgreSQL
- Studio (UI)
- Edge Functions runtime
- API Gateway

### 2. Servir a Edge Function Localmente

```bash
supabase functions serve enrichment-pipeline-starter
```

### 3. Testar com cURL

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/enrichment-pipeline-starter' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "taskId": 1
  }'
```

### 4. Ver Logs

```bash
# Logs em tempo real
supabase functions logs enrichment-pipeline-starter --follow

# Logs recentes
supabase functions logs enrichment-pipeline-starter
```

## Testando End-to-End

### 1. Via UI

1. Acesse: http://localhost:3003/benchmark/channels
2. Insira um Channel ID válido
3. Clique em "Start Channel Benchmark"
4. Verifique os logs:

```bash
# Terminal 1: Next.js logs
# Já rodando com pnpm dev

# Terminal 2: Edge Function logs
supabase functions logs enrichment-pipeline-starter --follow
```

### 2. Via Server Action Direta

```typescript
import { startChannelBenchmark } from '@/app/(dashboard)/benchmark/channels/actions'

const result = await startChannelBenchmark('UCuAXFkgsw1L7xaCfnd5JJOw')
console.log(result)
```

## Monitoramento

### Ver Status das Tasks

```sql
-- Tasks em processamento
SELECT
  id,
  channel_id,
  overall_status,
  started_at,
  created_at
FROM channel_enrichment_tasks
WHERE overall_status = 'processing'
ORDER BY started_at DESC;

-- Últimas tasks criadas
SELECT * FROM channel_enrichment_tasks
ORDER BY created_at DESC
LIMIT 10;
```

### Ver Canais Salvos

```sql
-- Últimos canais enriched
SELECT
  channel_id,
  channel_name,
  subscriber_count,
  total_views,
  updated_at
FROM benchmark_channels
ORDER BY updated_at DESC
LIMIT 10;
```

## Troubleshooting

### Erro: "Failed to fetch API key from Vault"

**Causa:** Secret não está configurado no Vault

**Solução:**
```bash
supabase secrets set rapidapi_key_1760651731629=YOUR_KEY
```

### Erro: "Function not found"

**Causa:** Edge Function não foi deployed

**Solução:**
```bash
supabase functions deploy enrichment-pipeline-starter
```

### Erro: "RapidAPI request failed: 401"

**Causa:** API key inválida

**Solução:**
1. Verifique se a key está correta no Vault
2. Teste a key manualmente:
```bash
curl -X GET "https://yt-api.p.rapidapi.com/channel/about?id=UCuAXFkgsw1L7xaCfnd5JJOw" \
  -H "X-RapidAPI-Host: yt-api.p.rapidapi.com" \
  -H "X-RapidAPI-Key: YOUR_KEY"
```

### Erro: "Database connection failed"

**Causa:** Service role key inválido ou expirado

**Solução:**
1. Obtenha novo service role key do dashboard
2. Atualize `.env`:
```bash
SUPABASE_SERVICE_ROLE_KEY=new-key
```

### Edge Function não invoca

**Causa:** Permissões ou configuração incorreta

**Solução:**
1. Verifique se `createAdminClient()` está sendo usado
2. Confirme que `SUPABASE_SERVICE_ROLE_KEY` está no `.env`
3. Teste invocação manual:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

const supabase = createAdminClient()
const { data, error } = await supabase.functions.invoke(
  'enrichment-pipeline-starter',
  {
    body: { channelId: 'test', taskId: 1 }
  }
)
console.log(data, error)
```

## Próximas Edge Functions

Após deployar `enrichment-pipeline-starter`, você precisará criar:

1. **enrichment-step-1-categorization**
   - Categorizar canal com Claude AI
   - Input: `{ channelId, taskId }`

2. **enrichment-step-2-socialblade**
   - Scraping SocialBlade
   - Input: `{ channelId, taskId }`

3. **enrichment-step-3-fetch-videos**
   - Buscar vídeos do YouTube
   - Input: `{ channelId, taskId }`

4. **enrichment-step-4-baseline-stats**
   - Calcular estatísticas
   - Input: `{ channelId, taskId }`

5. **enrichment-step-5-outlier-analysis**
   - Análise de outliers
   - Input: `{ channelId, taskId }`

## Comandos Úteis

```bash
# Ver funções deployadas
supabase functions list

# Deletar função
supabase functions delete enrichment-pipeline-starter

# Re-deploy
supabase functions deploy enrichment-pipeline-starter --no-verify-jwt

# Ver secrets
supabase secrets list

# Remover secret
supabase secrets unset rapidapi_key_1760651731629

# Parar Supabase local
supabase stop

# Ver status
supabase status
```

## Segurança

### ✅ Boas Práticas

1. **Nunca comitar secrets**
   - Use `.env` para development
   - Use Vault para produção

2. **Usar Service Role com cuidado**
   - Apenas em Edge Functions
   - Nunca no client-side

3. **Validar inputs**
   - Sempre validar `channelId` e `taskId`
   - Sanitizar dados antes de queries

4. **Rate limiting**
   - Implementar rate limits na RapidAPI
   - Usar backoff para retries

### ❌ Evitar

- Expor service role key no frontend
- Armazenar API keys no código
- Fazer chamadas da RapidAPI sem rate limiting
- Processar tasks sem validação

## Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy/docs)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
- [RapidAPI Docs](https://docs.rapidapi.com/)
