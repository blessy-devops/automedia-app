# 📋 Checklist de Deploy: Integração Gobbi

**Data:** 2025-11-15
**Status:** ⏳ Aguardando deploy no Gobbi

---

## 🎯 Resumo

Webhook para enviar vídeos da Automedia Platform para o banco do Gobbi está **funcionando**, mas com campos limitados. Com a migration, podemos enviar **22 campos totais** (vs 18 atuais).

---

## ✅ O que JÁ está funcionando (18 campos)

### Testes realizados:
- ✅ Webhook `send-to-gobbi` deployed na sua plataforma
- ✅ Webhook `receive-benchmark-videos` deployed no Gobbi
- ✅ Teste manual bem-sucedido (2 vídeos enviados e recebidos)
- ✅ Zero erros, 100% de sucesso

### Campos enviados atualmente:
1. `youtube_video_id` ⭐ (obrigatório)
2. `channel_id` ⭐ (obrigatório)
3. `title`
4. `description`
5. `thumbnail_url`
6. `upload_date`
7. `video_length`
8. `views`
9. `channel_name`
10. `metrics_last_updated`
11. `video_age_days`
12. `views_per_day`
13. `categorization` (JSONB)
14. `performance_vs_avg_historical`
15. `performance_vs_median_historical`
16. `momentum_vs_14d`
17. `status`
18. `video_transcript` (opcional, se `include_transcript !== false`)

---

## 🚀 Próximos Passos (adicionar +4 campos)

### Passo 1: Rodar Migration no Gobbi

**Arquivo:** `docs/gobbi-database/add_enrichment_fields_migration.sql`

**Como executar:**
1. Abrir SQL Editor no dashboard do Supabase do Gobbi
2. Copiar e colar o conteúdo do arquivo
3. Executar (Run)

**Campos adicionados:**
19. `enrichment_data` (JSONB)
20. `performance_vs_recent_14d` (NUMERIC)
21. `keywords` (TEXT[])
22. `related_video_ids` (TEXT[])

### Passo 2: Deploy da Edge Function atualizada no Gobbi

**Arquivo:** `docs/gobbi-database/receive-benchmark-videos-function.ts`

**Como fazer:**
1. Copiar o arquivo atualizado
2. Abrir Edge Functions no dashboard do Gobbi
3. Editar a função `receive-benchmark-videos`
4. Colar o código atualizado
5. Deploy

### Passo 3: Testar novamente

```bash
cd /Users/daviluis/Documents/automedia-platform/automedia
node test-webhook.mjs
```

**Resultado esperado:**
- ✅ 2 vídeos enviados com sucesso
- ✅ Agora com os 4 novos campos incluídos

---

## 📊 Comparação: Antes vs Depois

### Campos que NÃO existem no Gobbi (nunca serão enviados):

| Campo | Por que não enviar |
|-------|-------------------|
| `likes` | Coluna não existe no Gobbi |
| `comments` | Coluna não existe no Gobbi |
| `tags` | Coluna não existe (separado de `categorization`) |
| `performance_vs_recent_30d` | Coluna não existe |
| `performance_vs_recent_90d` | Coluna não existe |
| `is_outlier` | Coluna não existe |
| `outlier_threshold` | Coluna não existe |
| `last_enriched_at` | Coluna não existe |
| `youtube_url` | **GENERATED COLUMN** (auto-gerado) |
| `created_at` | **DEFAULT now()** (auto-gerido) |
| `id` | **SERIAL** (auto-incremento) |

### Campos Adicionados com Migration:

| Campo | Tipo | Uso |
|-------|------|-----|
| `enrichment_data` | JSONB | Metadata adicional de enriquecimento |
| `performance_vs_recent_14d` | NUMERIC | Performance vs média recente de 14 dias |
| `keywords` | TEXT[] | Array de palavras-chave extraídas |
| `related_video_ids` | TEXT[] | Array de IDs de vídeos relacionados |

---

## 🔧 Troubleshooting

### Se o teste falhar após a migration:

**Erro: "Could not find the 'enrichment_data' column"**
- ✅ **Solução**: Migration não foi executada. Rodar o SQL no Gobbi.

**Erro: "Could not find the 'keywords' column"**
- ✅ **Solução**: Migration não foi executada. Rodar o SQL no Gobbi.

**Erro: Nenhum erro, mas campos novos não aparecem**
- ✅ **Solução**: Deploy da Edge Function não foi feito. Atualizar `receive-benchmark-videos` no Gobbi.

---

## 📞 Contato

Se tiver problemas, me chame!

---

**Última atualização:** 2025-11-15
**Autor:** Claude Code + Davi Luis
