# 📋 Checklist de Deploy: Sincronização de Canais

**Data:** 2025-11-15
**Status:** ⏳ Aguardando deploy no Gobbi

---

## 🎯 Resumo

Implementação da **sincronização de canais** junto com vídeos. Agora quando você envia vídeos para o Gobbi, os canais relacionados também são enviados automaticamente com **upsert** (cria se não existe, atualiza se existe).

---

## ✅ O que JÁ foi feito

### No seu sistema (Automedia Platform):
- ✅ `send-to-gobbi` Edge Function atualizada e **deployed**
- ✅ Função agora busca dados completos dos canais
- ✅ Envia canais junto com vídeos no primeiro batch
- ✅ Tracking separado para canais e vídeos

### Arquivos criados:
- ✅ `add_missing_channel_fields_migration.sql` - Migration para adicionar 7 campos no Gobbi
- ✅ `receive-benchmark-videos-function.ts` - Edge Function atualizada para processar canais

---

## 🚀 Próximos Passos (fazer no Gobbi)

### Passo 1: Rodar Migration de Canais no Gobbi

**Arquivo:** `docs/gobbi-database/add_missing_channel_fields_migration.sql`

**Como executar:**
1. Abrir SQL Editor no dashboard do Supabase do Gobbi
2. Copiar e colar o conteúdo do arquivo
3. Executar (Run)

**Campos que serão adicionados à tabela `benchmark_channels`:**
1. `thumbnail_url` (TEXT) - URL da foto do canal
2. `banner_url` (TEXT) - URL do banner do canal
3. `custom_url` (TEXT) - URL customizada (ex: @username)
4. `country` (TEXT) - País do canal
5. `is_verified` (BOOLEAN) - Se o canal é verificado
6. `created_at` (TIMESTAMPTZ) - Quando foi criado no banco
7. `updated_at` (TIMESTAMPTZ) - Última atualização (auto-atualizado via trigger)

**Extras criados pela migration:**
- ✅ 4 índices para performance
- ✅ Trigger para auto-atualizar `updated_at`
- ✅ Comentários de documentação em cada coluna

### Passo 2: Deploy da Edge Function atualizada no Gobbi

**Arquivo:** `docs/gobbi-database/receive-benchmark-videos-function.ts`

**Como fazer:**
1. Copiar o arquivo atualizado
2. Abrir Edge Functions no dashboard do Gobbi
3. Editar a função `receive-benchmark-videos`
4. Colar o código atualizado
5. Deploy

**Mudanças na Edge Function:**
- Processa **canais PRIMEIRO**, depois vídeos (evita erro de FK)
- Upsert de canais usando `channel_id` como unique key
- Tracking separado: `channels_inserted`, `channels_updated`, `channels_failed`
- Response agora inclui estatísticas de canais e vídeos

### Passo 3: Testar sincronização end-to-end

```bash
cd /Users/daviluis/Documents/automedia-platform/automedia
node test-webhook.mjs
```

**Resultado esperado:**
```json
{
  "success": true,
  "channels_inserted": 2,
  "channels_updated": 0,
  "channels_failed": 0,
  "videos_inserted": 2,
  "videos_updated": 0,
  "videos_failed": 0,
  "message": "Successfully processed 2 channels and 2 videos"
}
```

---

## 📊 Arquitetura da Sincronização

### Fluxo de Dados:

```
1. Usuário seleciona vídeos no /videos e clica "Enviar para Produção"
   ↓
2. Action chama Edge Function send-to-gobbi com video_ids
   ↓
3. send-to-gobbi busca:
   - Dados dos vídeos
   - Dados dos canais únicos (18 campos totais)
   ↓
4. Envia payload via HTTP POST para Gobbi:
   {
     "channels": [...],  // Enviado apenas no primeiro batch
     "videos": [...],
     "metadata": {
       "channel_count": 2,
       "video_count": 10
     }
   }
   ↓
5. receive-benchmark-videos no Gobbi processa:
   a) CANAIS PRIMEIRO (upsert em benchmark_channels)
   b) VÍDEOS DEPOIS (upsert em benchmark_videos)
   ↓
6. Retorna estatísticas detalhadas
```

### Campos de Canais Enviados (18 total):

**Campos originais (11):**
1. `channel_id` ⭐ (obrigatório, unique key)
2. `channel_name`
3. `description`
4. `subscriber_count`
5. `video_count`
6. `view_count`
7. `published_at`

**Novos campos (7) - REQUEREM MIGRATION:**
8. `thumbnail_url`
9. `banner_url`
10. `custom_url`
11. `country`
12. `is_verified`
13. `created_at` (auto-gerido)
14. `updated_at` (auto-gerido)

**Campos que NÃO enviamos (existem apenas no Gobbi):**
- `channel_url` - GENERATED COLUMN (auto-gerado)
- `update_routine` - Específico do Gobbi
- `narrative_playbook` - Específico do Gobbi

---

## 🔧 Troubleshooting

### Erro: "Could not find the 'thumbnail_url' column" (canais)
- ✅ **Solução**: Migration de canais não foi executada. Rodar `add_missing_channel_fields_migration.sql` no Gobbi.

### Erro: "Foreign key constraint violation" (vídeos)
- ✅ **Solução**: Canais não foram processados primeiro. Atualizar Edge Function `receive-benchmark-videos` no Gobbi.

### Erro: Canais não aparecem ou não são atualizados
- ✅ **Solução**: Deploy da Edge Function não foi feito. Atualizar `receive-benchmark-videos` no Gobbi.

### Vídeos chegam mas sem canais
- ✅ **Verificar**: Payload enviado inclui array `channels`? Ver logs do `send-to-gobbi`.
- ✅ **Verificar**: Migration de canais foi executada no Gobbi?

---

## 📈 Melhorias Implementadas

### Performance:
- ✅ Canais enviados apenas 1x no primeiro batch (não duplicados)
- ✅ Upsert eficiente usando `ON CONFLICT (channel_id)`
- ✅ Índices criados para buscas rápidas
- ✅ Batch processing mantido (50 vídeos por batch)

### Confiabilidade:
- ✅ Canais processados ANTES dos vídeos (evita FK errors)
- ✅ Trigger auto-atualiza `updated_at` em canais
- ✅ Tracking separado de erros (type: 'channel' | 'video')
- ✅ Rollback automático em caso de erro (transações)

### Observabilidade:
- ✅ Logs detalhados de canais e vídeos
- ✅ Response inclui estatísticas separadas
- ✅ Erros identificam tipo e ID específico

---

## 📞 Próximos Passos

1. **Gobbi executa:**
   - Migration `add_missing_channel_fields_migration.sql`
   - Deploy da Edge Function `receive-benchmark-videos`

2. **Testar:**
   - Rodar `node test-webhook.mjs`
   - Verificar se 2 canais + 2 vídeos foram inseridos

3. **Validar no banco do Gobbi:**
   ```sql
   SELECT COUNT(*) FROM benchmark_channels;
   SELECT COUNT(*) FROM benchmark_videos;

   -- Ver canais recebidos
   SELECT channel_id, channel_name, thumbnail_url, is_verified
   FROM benchmark_channels
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

**Última atualização:** 2025-11-15
**Autor:** Claude Code + Davi Luis
