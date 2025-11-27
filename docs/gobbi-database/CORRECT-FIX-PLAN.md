# Plano Correto para Corrigir o Problema de Status

## O Problema

**Root Cause:** Edge Function `receive-benchmark-videos` no banco do Gobbi tem código bugado que NÃO salva o status corretamente.

**Código bugado (linha 308):**
```typescript
...video.status && { status: video.status }
```

Se `video.status` for falsy, o spread NÃO inclui o campo `status`, então o banco usa o default `'available'`.

---

## Solução Completa (3 Passos)

### PASSO 1: Atualizar os 43 vídeos que foram salvos com status errado

```sql
-- Ver os vídeos que serão atualizados primeiro
SELECT id, title, status, created_at
FROM benchmark_videos
WHERE status = 'available'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Se a lista parecer correta, RODE:
UPDATE benchmark_videos
SET status = 'pending_distribution',
    updated_at = NOW()
WHERE status = 'available'
  AND created_at >= NOW() - INTERVAL '7 days';
```

**Resultado esperado:** 43 rows updated

---

### PASSO 2: Testar que os vídeos agora aparecem

```sql
-- Rodar a query de teste (no arquivo TEST-QUERY.sql)
-- Deve retornar 46 vídeos (3 originais + 43 corrigidos)
```

---

### PASSO 3: Consertar a Edge Function `receive-benchmark-videos`

**O problema está no código do Gobbi** (não temos acesso), na linha:
```typescript
const videoData = {
  youtube_video_id: video.youtube_video_id,
  channel_id: video.channel_id,
  title: video.title,
  // ... outros campos
  ...video.status && { status: video.status },  // ❌ BUGADO!
}
```

**Deveria ser:**
```typescript
const videoData = {
  youtube_video_id: video.youtube_video_id,
  channel_id: video.channel_id,
  title: video.title,
  status: video.status || 'pending_distribution',  // ✅ SEMPRE inclui status
  // ... outros campos
}
```

OU mais seguro:
```typescript
const videoData = {
  youtube_video_id: video.youtube_video_id,
  channel_id: video.channel_id,
  title: video.title,
  status: video.status,  // ✅ SEMPRE inclui status (sem spread condicional)
  // ... outros campos
}
```

**IMPORTANTE:** Esse código está no Edge Function do **Gobbi**, não do AutoMedia. Quem pode consertar é o Gobbi ou você precisa ter acesso ao projeto dele no Supabase.

---

## Resumo

1. ✅ UPDATE manual dos 43 vídeos (solução temporária)
2. ❌ NÃO alterar default da coluna (outros status precisam do default 'available')
3. 🔧 Consertar Edge Function no projeto do Gobbi (solução permanente)
