# 📋 Instruções de Deploy: receive-benchmark-videos

**Para:** Gobbi
**De:** Davi Luis (Automedia Platform)
**Data:** 2025-11-15
**Objetivo:** Atualizar Edge Function `receive-benchmark-videos` no seu projeto Supabase

---

## 🎯 O QUE PRECISA SER FEITO

Preciso que você faça deploy da Edge Function **`receive-benchmark-videos`** atualizada no seu projeto Supabase.

**Por quê?**
Atualizamos o header de autenticação de `Authorization` para `X-Webhook-Key` para evitar conflitos com o JWT do Supabase.

---

## 📁 ARQUIVO ATUALIZADO

O arquivo atualizado está em:
`docs/gobbi-database/receive-benchmark-videos-function.ts`

**Principais mudanças:**
1. Header de autenticação mudou de `Authorization: Bearer XXX` para `X-Webhook-Key: XXX`
2. CORS atualizado para aceitar o header `x-webhook-key`
3. Timestamps `created_at` e `updated_at` agora são gerenciados explicitamente

---

## 🚀 COMANDOS PARA DEPLOY

### Passo 1: Criar pasta da Edge Function (se não existir)
```bash
mkdir -p supabase/functions/receive-benchmark-videos
```

### Passo 2: Copiar o arquivo atualizado
```bash
# Se você recebeu o arquivo por email/slack/etc, copie para:
cp receive-benchmark-videos-function.ts supabase/functions/receive-benchmark-videos/index.ts

# OU se tem acesso ao repo da Automedia Platform:
cp [PATH_TO_AUTOMEDIA]/docs/gobbi-database/receive-benchmark-videos-function.ts \
   supabase/functions/receive-benchmark-videos/index.ts
```

### Passo 3: Deploy
```bash
npx supabase functions deploy receive-benchmark-videos --project-ref eafkhsmgrzywrhviisdl --no-verify-jwt
```

### Passo 4: Configurar Secret (OPCIONAL - para autenticação)
```bash
# Gerar uma API key segura
uuidgen  # Vai gerar algo como: a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Configurar o secret
npx supabase secrets set WEBHOOK_API_KEY=a1b2c3d4-e5f6-7890-abcd-ef1234567890 --project-ref eafkhsmgrzywrhviisdl
```

**⚠️ IMPORTANTE:** Se você configurar o `WEBHOOK_API_KEY`, compartilhe essa key comigo para eu adicionar na tabela `production_webhooks` do meu banco.

---

## 🧪 COMO TESTAR

Depois do deploy, vou rodar um teste da minha plataforma para confirmar que está funcionando.

Você pode acompanhar os logs com:
```bash
npx supabase functions logs receive-benchmark-videos --project-ref eafkhsmgrzywrhviisdl
```

---

## 📞 SE TIVER PROBLEMAS

**Deploy falhou?**
- Certifique-se de estar logado no Supabase CLI: `npx supabase login`
- Verifique se tem permissão no projeto: `npx supabase projects list`

**Dúvidas?**
- Me chame e eu ajudo!

---

## ✅ CHECKLIST

- [ ] Criar pasta `supabase/functions/receive-benchmark-videos/`
- [ ] Copiar arquivo `index.ts` atualizado
- [ ] Fazer deploy com `npx supabase functions deploy`
- [ ] (Opcional) Configurar `WEBHOOK_API_KEY` secret
- [ ] (Opcional) Compartilhar a API key comigo
- [ ] Avisar que o deploy foi feito para eu testar

---

**Obrigado! 🚀**
