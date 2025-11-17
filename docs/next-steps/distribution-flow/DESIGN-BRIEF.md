# Design Brief: Production Distribution Page

## 📋 Contexto e Propósito

**Página:** `/production/distribution`
**Objetivo:** Permitir que usuários selecionem canais de destino para vídeos benchmark que estão aguardando distribuição para produção.

**Fluxo do usuário:**
1. Ver lista de vídeos em status `pending_distribution`
2. Para cada vídeo, visualizar canais elegíveis (matching por niche + subniche)
3. Selecionar um ou mais canais de destino
4. Confirmar distribuição (cria jobs de produção e marca vídeo como `used`)

---

## 🎯 Estrutura Atual da Página

### Header
- **Título:** "Videos Awaiting Distribution"
- **Subtítulo:** "Select destination channels for X videos"
- Botão "Refresh" no canto superior direito

### Corpo (Lista de Cards)
Cada vídeo é exibido em um card expansível com:

#### Seção Superior (sempre visível):
- Ícone de vídeo
- **Título do vídeo** (pode ser longo, 2 linhas)
- **IDs:**
  - ID do benchmark_video (ex: `ID: 26388`)
  - YouTube Video ID (ex: `YT: dQw4w9WgXcQ`)
- **Badges de categorização:**
  - Niche (🎯 entertainment)
  - Subniche (📊 storytelling)
  - Microniche (🔍 universal_family_conflict_betrayal)
  - Category (📁 narrative)
- **Canal de origem:** "Source: [Nome do Canal] (@handle)"
- Botão de expandir/colapsar (chevron)

#### Seção Expansível (quando aberto):
- Link para YouTube
- Status do transcript (✓ Available ou ⚠ Not available)
- Descrição do vídeo (3 linhas max)

#### Seção de Seleção de Canais:
- Título: "Select Destination Channels"
- **Se não há canais elegíveis:**
  - Mensagem: "No eligible channels found for this video's niche/subniche."
- **Se há canais:**
  - Botões "Select All" / "Select None"
  - Lista scrollable de checkboxes com:
    - Nome do canal (placeholder)
    - Badge do niche
    - Badge do subniche
    - Badge de língua
    - Indicador se tem Brand Bible (✓ Brand Bible)

#### Footer do Card:
- Contador: "Will create X production job(s)" ou "No channels selected"
- Botão "Distribute (X)" - disabled se nenhum canal selecionado

---

## 🚨 Problemas Visuais Atuais

### Hierarquia e Espaçamento
- **Falta de hierarquia visual clara** entre título do vídeo e metadados
- IDs (ID: / YT:) ocupam muito espaço e têm destaque excessivo
- Badges de categorização muito próximos, difícil distinguir
- Muita informação competindo por atenção

### Cards
- **Cards muito pesados visualmente** (borders grossas, muito padding)
- Expansão/collapse não é intuitiva
- Seção de canais elegíveis fica "escondida" abaixo de muita informação
- Lista de checkboxes é monótona e difícil de escanear

### Seleção de Canais
- **Checkboxes genéricos** sem diferenciação visual
- Difícil ver quais canais têm Brand Bible configurado
- Sem preview do que acontecerá após distribuir
- Botão "Distribute" não é proeminente o suficiente

### Densidade de Informação
- **Muita informação por card** sem priorização
- Difícil focar no que importa: selecionar canais
- Transcript status e descrição são secundários mas ocupam muito espaço

### Cores e Tipografia
- Uso excessivo de badges (emoji + texto)
- IDs em `font-mono` com `bg-muted` muito destacados
- Falta de cor para guiar ações importantes

---

## 💡 Sugestões de Melhoria

### Layout Geral
- **Modo tabela + cards híbrido:** Lista compacta com expansão inline
- **Duas colunas principais:**
  - Esquerda: Informações do vídeo (70%)
  - Direita: Ações rápidas (30%)

### Priorização de Informação
1. **Crítico (sempre visível):**
   - Título do vídeo
   - Canal de origem
   - Quantidade de canais elegíveis
   - Ação principal (botão Distribute)

2. **Importante (visível em hover ou expanded):**
   - Categorização (niche/subniche)
   - IDs (collapsed por padrão)
   - Lista de canais elegíveis

3. **Secundário (collapsed):**
   - Transcript status
   - Descrição
   - YouTube link

### Seleção de Canais - UX Aprimorada
- **Cards de canais** ao invés de checkboxes simples
- Cada card mostra:
  - Avatar/thumbnail do canal (se disponível)
  - Nome + placeholder
  - Status do Brand Bible (badge colorido)
  - Preview da configuração (workflow, voice, etc)
- **Seleção múltipla** com visual claro de "selected state"
- **Quick actions:**
  - Select all channels with Brand Bible
  - Select by language
  - Select by workflow

### Cores e Estados Visuais
- **Verde:** Canais com Brand Bible completo
- **Amarelo:** Canais com Brand Bible parcial
- **Cinza:** Canais sem Brand Bible
- **Azul:** Estado selecionado
- **Vermelho:** Sem canais elegíveis

### Ações e Feedback
- **Botão "Distribute" proeminente** (primary color, grande)
- **Preview antes de distribuir:**
  - Modal de confirmação mostra resumo:
    - Vídeo source
    - Canais selecionados (com thumbnails)
    - Jobs que serão criados
    - Impacto (benchmark video → used)
- **Toast notifications** após distribuir com link para production queue

---

## 🎨 Referências de Estilo (App Atual)

### Padrão de Header
```
bg-card border-b border-border px-8 py-5
```
- Título em `text-foreground`
- Subtítulo em `text-sm text-muted-foreground mt-1`

### Cards
- `border-2`
- `hover:border-primary/50`
- `hover:shadow-xl`
- Uso de `Separator` entre seções

### Cores do Sistema
- **Primary:** Vermelho/YouTube theme
- **Muted:** Cinza neutro
- **Success:** Verde (para confirmações)
- **Warning:** Amarelo (para alertas)

### Tipografia
- **H1:** Títulos principais
- **text-sm text-muted-foreground:** Metadados
- **font-mono:** Códigos/IDs (usar com moderação)

---

## 📐 Layout Proposto (Conceito)

### Estrutura de Card Otimizada

```
┌─────────────────────────────────────────────────────────────┐
│ [▶] Title of the Video                        [2 channels] │
│     Source: Channel Name (@handle)                          │
│     ID: 26388 · YT: dQw4w9WgXcQ                            │
│                                                             │
│     ┌──────────────────────────────────────────────────┐   │
│     │ SELECT DESTINATION CHANNELS (2 available)        │   │
│     │                                                  │   │
│     │ [ ] Canal A - @canalA          🟢 Brand Bible   │   │
│     │     entertainment · storytelling · pt-BR        │   │
│     │                                                  │   │
│     │ [✓] Canal B - @canalB          🟢 Brand Bible   │   │
│     │     entertainment · storytelling · pt-BR        │   │
│     └──────────────────────────────────────────────────┘   │
│                                                             │
│     [Select All] [Select None]          [Distribute (1)] │
└─────────────────────────────────────────────────────────────┘
```

### Estados Visuais
- **Collapsed:** Apenas título, source, e contador de canais
- **Expanded:** Mostra seleção de canais
- **Selecting:** Highlight nos canais selecionados
- **Distributing:** Loading state no botão

---

## 🎯 Objetivos do Redesign

1. **Reduzir ruído visual** - Focar no essencial
2. **Melhorar hierarquia** - O que importa primeiro
3. **Facilitar seleção** - Cards ao invés de checkboxes
4. **Aumentar confiança** - Preview antes de distribuir
5. **Acelerar workflow** - Quick actions e bulk operations
6. **Manter consistência** - Seguir design system do app

---

## 📝 Especificações Técnicas para Implementação

### Componentes shadcn/ui a usar:
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Button` (primary, outline, ghost variants)
- `Badge` (default, success, warning, secondary)
- `Separator`
- `Checkbox` ou `ToggleGroup` para seleção
- `AlertDialog` para confirmação
- `ScrollArea` para lista de canais
- `Collapsible` para expandir/colapsar

### Estado de UI:
- Collapsed/Expanded por card
- Selected channels (array de IDs)
- Loading states (refreshing, distributing)
- Error states (no channels, distribution failed)

### Interações:
- Click no título → expande/colapsa
- Click no checkbox → seleciona/deseleciona
- Click em "Distribute" → abre modal de confirmação
- Após distribuir → toast + refresh automático

---

## 🚀 Próximos Passos

1. **Criar mockup no Figma** baseado neste brief
2. **Validar com usuário** (layout, cores, interações)
3. **Implementar novo design** no código
4. **Testar com dados reais**
5. **Iterar baseado em feedback**
