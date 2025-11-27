# Plano de Verificação - Por que os vídeos não aparecem?

## O Problema

**Sintomas:**
- ✅ Vídeos estão sendo inseridos no banco com status 'pending_distribution' (você mostrou 6 exemplos)
- ❌ A UI mostra 0 vídeos quando deveria mostrar 17
- ✅ O código do Edge Function está correto (força status='pending_distribution')

**Causa Raiz:**
O RPC `get_videos_awaiting_distribution` no Supabase do Gobbi ainda está usando código QUEBRADO que você rodou anteriormente. Esse código tem 2 erros:

1. **Linha 50**: `sbb.production_workflow_id` - Esta coluna NÃO EXISTE na tabela `structure_brand_bible`
2. **Linhas 96-102**: CROSS JOIN inválido tentando fazer SELECT de uma variável DECLARE

Quando o RPC tenta executar com esses erros:
- O LEFT JOIN falha silenciosamente porque a coluna não existe
- A subquery de `eligible_channels` retorna NULL ou erro
- O RPC cai no bloco EXCEPTION (linhas 105-109) e retorna: `{"videos": [], "error": "mensagem de erro"}`
- A UI recebe array vazio e mostra 0 vídeos

## Plano de Verificação (Execute nesta ordem)

### PASSO 1: Confirmar que os vídeos existem
```sql
-- Deve retornar 17 vídeos
SELECT COUNT(*) as total
FROM benchmark_videos
WHERE status = 'pending_distribution';

-- Ver os primeiros 5
SELECT
  id,
  title,
  status,
  created_at,
  categorization->>'niche' as niche,
  categorization->>'subniche' as subniche
FROM benchmark_videos
WHERE status = 'pending_distribution'
ORDER BY created_at ASC
LIMIT 5;
```

**Resultado Esperado:** Deve mostrar 17 vídeos com status correto ✅

---

### PASSO 2: Testar a subquery problemática isoladamente
```sql
-- Esta query VAI FALHAR porque production_workflow_id não existe
SELECT
  sa.unique_profile_id,
  sa.niche,
  sa.subniche,
  sbb.brand_name,
  sbb.production_workflow_id  -- ❌ ESTA COLUNA NÃO EXISTE!
FROM structure_accounts sa
LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
WHERE sa.niche = 'entertainment'
  AND sa.subniche = 'storytelling'
LIMIT 5;
```

**Resultado Esperado:** Erro: `column "production_workflow_id" does not exist` ❌

---

### PASSO 3: Testar a subquery CORRIGIDA
```sql
-- Esta query FUNCIONA porque usa sbb.placeholder (coluna correta)
SELECT
  sa.unique_profile_id,
  sa.niche,
  sa.subniche,
  sbb.brand_name,
  sbb.placeholder  -- ✅ ESTA COLUNA EXISTE!
FROM structure_accounts sa
LEFT JOIN structure_brand_bible sbb ON sbb.id = sa.brand_id
WHERE sa.niche = 'entertainment'
  AND sa.subniche = 'storytelling'
LIMIT 5;
```

**Resultado Esperado:** Retorna dados sem erro ✅

---

### PASSO 4: Testar o RPC ATUAL (quebrado)
```sql
-- Este RPC vai retornar erro ou array vazio
SELECT * FROM get_videos_awaiting_distribution(5, 0);
```

**Resultado Esperado:**
```json
{
  "videos": [],
  "total_count": 0,
  "error": "column production_workflow_id does not exist"
}
```
OU array vazio com erro silencioso ❌

---

### PASSO 5: Aplicar a correção
```sql
-- RODE O ARQUIVO CORRIGIDO:
-- /Users/daviluis/Documents/automedia-platform/automedia/supabase/rpc_get_videos_awaiting_distribution.sql

-- Copie e cole TODO o conteúdo do arquivo no SQL Editor do Supabase
```

**Mudanças aplicadas:**
1. ✅ Linha 50: `sbb.production_workflow_id` → `sbb.placeholder`
2. ✅ Linhas 96-101: Removido CROSS JOIN inválido, usa variável `total_count` diretamente

---

### PASSO 6: Testar o RPC CORRIGIDO
```sql
-- Este RPC AGORA VAI FUNCIONAR
SELECT * FROM get_videos_awaiting_distribution(5, 0);
```

**Resultado Esperado:**
```json
{
  "videos": [
    {
      "id": "...",
      "title": "...",
      "status": "pending_distribution",
      "eligibleChannels": [...]
    },
    ... (mais 4 vídeos)
  ],
  "total_count": 17,
  "error": null
}
```
✅ Array com 5 vídeos + total_count correto!

---

### PASSO 7: Verificar na UI
1. Abra http://localhost:7002/production/distribution
2. Deve mostrar os 17 vídeos com status 'pending_distribution'
3. Scroll down deve carregar mais 50 (paginação funciona)

---

## Por que os vídeos estavam chegando corretamente mas não apareciam?

**Não era problema de Edge Function ou status!**

Os Edge Functions estavam funcionando perfeitamente:
- ✅ `send-to-gobbi`: Enviava status='pending_distribution' corretamente
- ✅ `receive-benchmark-videos`: Inseria no banco com status correto
- ✅ Banco de dados: 17 vídeos com status correto

**O problema era APENAS o RPC de leitura:**
- ❌ RPC quebrado com coluna errada não conseguia BUSCAR os vídeos
- ❌ UI chamava o RPC, recebia array vazio, mostrava 0 vídeos

É como se você tivesse 17 carros na garagem, mas a porta da garagem estivesse trancada com a chave errada. Os carros sempre estiveram lá, você só não conseguia abrir a porta pra ver eles.

---

## Resumo Final

| Item | Status Antes | Status Depois |
|------|--------------|---------------|
| Vídeos no banco | ✅ 17 vídeos corretos | ✅ 17 vídeos corretos |
| Status dos vídeos | ✅ 'pending_distribution' | ✅ 'pending_distribution' |
| RPC funcionando | ❌ Quebrado | ✅ Corrigido |
| UI mostrando vídeos | ❌ 0 vídeos | ✅ 17 vídeos |

**A solução:** Rodar o RPC corrigido no Supabase do Gobbi.
