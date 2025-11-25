# Guia de Integração: N8N → Sistema de Aprovação de Títulos

**Data:** 2025-11-23
**Objetivo:** Substituir o fluxo de aprovação por email por uma fila real-time na plataforma

---

## 📋 Resumo da Mudança

### Fluxo ANTIGO (Email-based)
```
[Gera Títulos com Claude]
  ↓
[Parse JSON]
  ↓
[Send Email (Human in Loop)] ← Gobbi recebe email
  ↓
[Wait for Response] ← Aguarda resposta no Gmail
  ↓
[Update Database] ← Atualiza campo 'title' com título escolhido
  ↓
[Continua Workflow]
```

### Fluxo NOVO (Platform-based)
```
[Gera Títulos com Claude]
  ↓
[Parse JSON]
  ↓
[Supabase Update] ← Envia para fila de aprovação na plataforma
  ↓
✅ FIM (workflow N8N termina aqui)

// A partir daqui acontece na plataforma:
[Plataforma exibe fila real-time]
  ↓
[Usuário aprova título]
  ↓
[Server Action atualiza DB + avança status]
  ↓
[Próximo workflow é trigado automaticamente]
```

---

## 🔧 Modificações no Workflow N8N

### 1️⃣ Identificar o Node Atual

Procure no workflow **"workflow-criação-de-tittles-com-claude-code"** pelos seguintes nodes:

- `Send Email` ou `Human in the Loop`
- `Gmail` node
- `Wait for Response`

Esses nodes serão **REMOVIDOS**.

### 2️⃣ Adicionar Node Supabase

Após o node de **Parse JSON** que formata os títulos, adicione:

**Node Type:** `Supabase` (Supabase Node)
**Operation:** `Update`
**Credentials:** Selecione suas credenciais do Supabase

#### Configuração do Node

| Campo | Valor |
|-------|-------|
| **Table** | `production_videos` |
| **Update By** | `id` |
| **Row Identifier** | `={{ $('NodeAnterior').item.json.video_id }}` |


#### Fields to Update

Configure os seguintes campos para serem atualizados:

```javascript
{
  "title_approval_data": {
    "title": "={{ $json[0].title }}",
    "alternatives": "={{ $json[0].alternatives }}",
    "analysis": "={{ $json[0].analysis }}",
    "original": "={{ $json[0].original }}",
    "benchmark_title": "={{ $('NodeBenchmark').item.json.title }}",
    "generated_at": "={{ $now.toISO() }}"
  },
  "title_approval_status": "pending",
  "updated_at": "={{ $now.toISO() }}"
}
```

**⚠️ ATENÇÃO:**
- `$json[0]` assume que o output do Claude está no primeiro item do array
- `NodeBenchmark` deve ser substituído pelo nome do node que busca o vídeo de benchmark
- Se o formato for diferente, ajuste as referências conforme necessário

---

## 📊 Estrutura Esperada do JSON

O campo `title_approval_data` deve seguir esta estrutura:

```json
{
  "title": "On Father's Day, My CEO Son Asked, \"Dad, Do You Like The $8000 Marcus Sends You?\"",
  "alternatives": [
    {
      "text": "At My Retirement Party, My VP Son Asked, \"Dad, Who Paid Your $6000 Medical Bills?\"",
      "score": "6/7"
    },
    {
      "text": "On My 70th Birthday, My Executive Son Said, \"Dad, Wasn't It Nice of Derek to Fix Your Roof?\"",
      "score": "6/7"
    },
    {
      "text": "At Thanksgiving, My Director Son Asked, \"Dad, Do You Appreciate The $7500 Kevin Gives You?\"",
      "score": "7/7"
    },
    {
      "text": "On Father's Day, My Manager Son Asked, \"Dad, Aren't You Grateful For What Brian Does?\"",
      "score": "5/7"
    }
    // ... mais 6 alternativas (total 10)
  ],
  "analysis": {
    "emotional": null,
    "rationale": "6/7 Fidelity Score"
  },
  "original": {
    "formula": null
  },
  "benchmark_title": null,
  "generated_at": "2025-11-23T14:10:55.382Z"
}
```

**⚠️ Campos importantes:**
- Cada alternativa deve ter `text` (string) e `score` (string, formato "X/7")
- Campos `emotional`, `formula`, e `benchmark_title` podem ser `null`
- Total de 10 alternativas no array

---
