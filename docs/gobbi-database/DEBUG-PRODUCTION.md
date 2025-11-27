# Debug - Por que não aparece no Vercel?

## PASSO 1: Confirmar que o RPC foi atualizado

**No SQL Editor do Supabase do Gobbi (produção):**

```sql
-- Teste 1: Verificar se o RPC existe e retorna dados
SELECT * FROM get_videos_awaiting_distribution(5, 0);
```

**Resultado esperado:**
- ✅ JSON com array de vídeos (não vazio)
- ✅ `total_count` > 0
- ✅ `error` = null

**Se retornar array vazio ou erro:**
- ❌ O RPC NÃO foi atualizado corretamente
- **Solução:** Rode o SQL novamente e verifique se houve mensagem de erro

---

## PASSO 2: Verificar qual banco o Vercel está usando

**Opção A - Via Vercel Dashboard:**
1. Acesse https://vercel.com/daviluis-projects (seu dashboard)
2. Entre no projeto do AutoMedia
3. Settings → Environment Variables
4. Verifique: `NEXT_PUBLIC_SUPABASE_URL`

**Deve ser:** `https://[projeto-do-gobbi].supabase.co`

**Opção B - Via Network Tab no navegador:**
1. Abra o site de produção no Vercel
2. F12 → Network tab
3. Recarregue a página `/production/distribution`
4. Procure por requisição para `get_videos_awaiting_distribution`
5. Veja a URL da requisição

---

## PASSO 3: Testar a requisição DIRETAMENTE

**No terminal local:**

```bash
# Substitua [SEU_SUPABASE_URL] e [SEU_ANON_KEY] pelos valores de PRODUÇÃO
curl -X POST 'https://[SEU_SUPABASE_URL]/rest/v1/rpc/get_videos_awaiting_distribution' \
  -H "apikey: [SEU_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"p_limit": 5, "p_offset": 0}'
```

**Resultado esperado:**
```json
{
  "videos": [...],
  "total_count": 18,
  "error": null
}
```

**Se retornar vazio:**
- O RPC não foi atualizado OU
- Está conectando no banco errado

---

## PASSO 4: Limpar cache do Vercel

**Se o RPC está correto mas Vercel ainda mostra vazio:**

```bash
# No terminal local
vercel --prod --force
```

Ou no Vercel Dashboard:
1. Deployments → Latest deployment
2. ⋯ (três pontos) → Redeploy
3. ✅ Use existing Build Cache: **DESMARQUE**
4. Redeploy

---

## PASSO 5: Hard refresh no navegador

1. Abra o site de produção
2. **Chrome/Edge:** `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
3. **Firefox:** `Ctrl + F5`
4. Verifique o Network tab para ver se a requisição retorna dados

---

## Possíveis Causas

### Causa 1: RPC não foi atualizado
- **Sintoma:** SQL retorna array vazio no Supabase
- **Solução:** Rode o SQL novamente, verifique erros

### Causa 2: Vercel conecta em banco diferente
- **Sintoma:** Localhost funciona, Vercel não
- **Solução:** Corrigir NEXT_PUBLIC_SUPABASE_URL nas env vars

### Causa 3: Cache do Vercel
- **Sintoma:** RPC funciona via curl, mas não no site
- **Solução:** Redeploy sem cache

### Causa 4: Server Action cacheado
- **Sintoma:** Dados antigos persistem
- **Solução:** Adicionar `revalidate: 0` no fetch/Server Action

---

## Quick Check

Execute AGORA no SQL Editor do Supabase do Gobbi:

```sql
-- Isso deve retornar a DEFINIÇÃO da função
-- Se tiver "production_workflow_id", o RPC NÃO foi atualizado
-- Se tiver "placeholder", o RPC FOI atualizado ✅
SELECT pg_get_functiondef('get_videos_awaiting_distribution'::regproc);
```

Procure por `production_workflow_id` no resultado:
- ❌ Se encontrar: RPC ainda está quebrado
- ✅ Se NÃO encontrar: RPC foi atualizado corretamente
