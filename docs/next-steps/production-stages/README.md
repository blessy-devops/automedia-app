# Production Stages - Documentation Placeholder

**Created:** 2025-11-15
**Status:** Planejamento Futuro

---

## 📋 Visão Geral

Esta pasta contém documentação detalhada sobre cada stage do pipeline de produção de vídeos.

O pipeline completo possui **15 stages principais** divididos em 3 fases:

---

## 🎬 Pipeline Stages

### Script Phase (Stages 1-8)

1. **create_title** - Gerar título adaptado para o canal
2. **create_outline** - Adaptar beats narrativos para universo da marca
3. **create_cast** - Mapear arquétipos de personagens
4. **create_rich_outline** - Estruturar roteiro em 10 capítulos
5. **create_script** - Escrever todos os 10 capítulos
6. **create_teaser_script** - Escrever script do gancho de abertura
7. **review_script** - Revisar, polir e moderar manuscrito
8. **create_seo_description** - Gerar descrição otimizada para YouTube

---

### Production Phase (Stages 9-15)

9. **create_thumbnail** - Gerar imagem de thumbnail
10. **create_audio_segments** - Converter script para áudio narrado (TTS)
11. **create_covering_assets** - Gerar imagens/assets visuais cobrindo
12. **create_video_segments** - Montar segmentos de vídeo com imagens/efeitos
13. **create_concatenated_audios** - Mesclar todos os segmentos de áudio
14. **create_final_video** - Renderizar vídeo completo com áudio/visuais
15. **produce_teaser** - Renderizar segmento de teaser

---

### Publishing Phase (Stages 16-20)

16. **pending_approval** - Vídeo pronto, aguardando aprovação manual
17. **approved** - Vídeo aprovado para publicação
18. **scheduled** - Vídeo agendado para upload
19. **published** - Vídeo publicado no YouTube
20. **in_analysis** - Analisando métricas pós-publicação

---

## 📝 Documentos a Criar

- [ ] `create-title-stage.md` - Stage 1: Criação de Título
- [ ] `create-outline-stage.md` - Stage 2: Criação de Outline
- [ ] `create-cast-stage.md` - Stage 3: Criação de Elenco
- [ ] `create-rich-outline-stage.md` - Stage 4: Rich Outline
- [ ] `create-script-stage.md` - Stage 5: Escrita de Script
- [ ] `create-teaser-script-stage.md` - Stage 6: Script do Teaser
- [ ] `review-script-stage.md` - Stage 7: Revisão de Script
- [ ] `create-seo-description-stage.md` - Stage 8: Descrição SEO
- [ ] `create-thumbnail-stage.md` - Stage 9: Thumbnail
- [ ] `create-audio-segments-stage.md` - Stage 10: Segmentos de Áudio
- [ ] `create-covering-assets-stage.md` - Stage 11: Assets Visuais
- [ ] `create-video-segments-stage.md` - Stage 12: Segmentos de Vídeo
- [ ] `create-concatenated-audios-stage.md` - Stage 13: Concatenação de Áudio
- [ ] `create-final-video-stage.md` - Stage 14: Vídeo Final
- [ ] `produce-teaser-stage.md` - Stage 15: Produção de Teaser

---

## 📄 Template Padrão

Cada documento de stage deve seguir esta estrutura:

```markdown
# Stage X: [Nome do Stage]

**Status:** [sort order]
**Workflow Phase:** [script | production | publishing]
**Description:** [descrição curta]

---

## 📖 Propósito

[Explicação detalhada do que este stage faz]

---

## 📥 Input

**Tabelas consultadas:**
- `production_videos` (campos: ...)
- `benchmark_videos` (campos: ...)
- `structure_brand_bible` (campos: ...)

**Campos necessários:**
- `campo1` - Descrição
- `campo2` - Descrição

**Pré-requisitos:**
- Status anterior: `[status_anterior]`
- Campos obrigatórios: `[lista]`

---

## ⚙️ Processamento

### Lógica Principal

[Explicação passo a passo do processamento]

### AI/Prompts (se aplicável)

**Modelo:** Claude 3.5 Sonnet / GPT-4 / etc.

**Prompt Template:**
```
[Template do prompt usado]
```

**Parâmetros:**
- Temperature: 0.7
- Max tokens: 2000
- etc.

---

## 📤 Output

**Tabelas atualizadas:**
- `production_videos` (campos atualizados: ...)

**Campos modificados:**
- `campo_output1` - Valor gerado
- `status` → `[próximo_status]`
- `updated_at` → NOW()

**Side Effects:**
- [Outras alterações no sistema]

---

## 🔧 Implementação

### Edge Function

**Nome:** `production-stage-[nome-do-stage]`

**Trigger:**
- Manual (via Server Action)
- Automático (via workflow anterior)

**Código Base:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Implementação...
})
```

---

## ✅ Testes

### Test Cases

1. **Happy Path:**
   - Input: [dados válidos]
   - Expected: [resultado esperado]

2. **Edge Cases:**
   - Missing data
   - Invalid format
   - etc.

### Exemplo de Teste

```bash
# Testar manualmente
npx supabase functions invoke production-stage-[nome] \
  --data '{"video_id": 123}'
```

---

## 📊 Métricas

- **Tempo médio de execução:** [X segundos]
- **Taxa de sucesso:** [Y%]
- **Custo médio (AI):** [$Z por execução]

---

## 🐛 Troubleshooting

### Problema 1: [Descrição]
**Causa:** [Explicação]
**Solução:** [Como resolver]

---

## 🔗 Relacionamentos

**Stage Anterior:** [nome_do_stage_anterior]
**Próximo Stage:** [nome_do_próximo_stage]

**Dependências:**
- Tabela X deve ter dados
- Service Y deve estar disponível
```

---

## 🚀 Próximos Passos

1. Começar documentando os stages mais críticos:
   - `create-title-stage.md` (Stage 1)
   - `create-outline-stage.md` (Stage 2)
   - `create-script-stage.md` (Stage 5)

2. Implementar Edge Functions conforme necessidade

3. Testar cada stage isoladamente

4. Integrar no workflow completo

---

**Documento criado em:** 2025-11-15
**Última atualização:** 2025-11-15
