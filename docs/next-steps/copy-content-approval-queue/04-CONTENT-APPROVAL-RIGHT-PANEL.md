# 📱 CONTENT APPROVAL - Painel Direito (Visualização Completa)

## 🎯 ETAPA 5: RENDERIZAR VISUALIZAÇÃO NO PAINEL DIREITO

### 5.1 - Localização e Estrutura

**LOCALIZAÇÃO:** Logo após o bloco `{selectedThumbnailItem && (...)}`

**ADICIONAR ESTE BLOCO COMPLETO:**

```tsx
{/* Content Review */}
{selectedContentItem && (
  <div className="max-w-4xl mx-auto space-y-6">
    {/* Video Info Card - AQUI */}
    {/* Teaser Card - AQUI */}
    {/* Script Card - AQUI */}
    {/* Description Card - AQUI */}
    {/* Info Card - AQUI */}
  </div>
)}
```

**CLASSES IMPORTANTES:**
- `max-w-4xl mx-auto` - Centraliza e limita largura (mesma das outras tabs)
- `space-y-6` - Espaçamento vertical de 24px entre cards

---

## 📹 CARD 1: VIDEO INFO (Topo)

### Código Completo do Card

```tsx
{/* Video Info */}
<div className="bg-muted/30 border border-border p-4 rounded-lg">
  <div className="flex items-center justify-between">
    {/* Left: Video Icon + Title */}
    <div className="flex items-center gap-3">
      <span className="text-2xl">📹</span>
      <div>
        <p className="text-sm text-muted-foreground">Título do Vídeo</p>
        <p className="font-semibold">{selectedContentItem.videoTitle}</p>
      </div>
    </div>
    
    {/* Right: Badges */}
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary"
        style={{
          backgroundColor: `${selectedContentItem.channelColor}20`,
          color: selectedContentItem.channelColor,
          borderColor: `${selectedContentItem.channelColor}40`
        }}
      >
        {selectedContentItem.channelName}
      </Badge>
      <Badge variant="outline" className="font-mono">
        ID: {selectedContentItem.videoId}
      </Badge>
      <Badge variant="outline" className="gap-1">
        <Clock className="w-3 h-3" />
        {formatTimeAgo(selectedContentItem.createdAt)}
      </Badge>
    </div>
  </div>
</div>
```

### Detalhamento Visual

```
┌─────────────────────────────────────────────────────────────────┐
│ 📹  Título do Vídeo                  [DramatizeMe] [ID: 105]   │
│     On Father's Day, My CEO...       [🕐 2h ago]               │
│                                                                 │
│     └─ text-sm text-muted-foreground                           │
│     └─ font-semibold                                           │
└─────────────────────────────────────────────────────────────────┘
```

**CLASSES:**
- Container: `bg-muted/30 border border-border p-4 rounded-lg`
- Emoji: `text-2xl` (📹)
- Label: `text-sm text-muted-foreground`
- Title: `font-semibold` (sem classe de tamanho para usar padrão do sistema)
- Badges container: `flex items-center gap-2`

---

## 🎬 CARD 2: TEASER (Gradient Roxo/Rosa)

### Código Completo do Card

```tsx
{/* Teaser Card */}
<div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-l-4 border-purple-500 p-4 rounded-lg">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className="text-2xl">🎬</span>
      <h3 className="font-semibold">TEASER</h3>
    </div>
    <Badge variant="outline" className="font-mono text-xs">
      {selectedContentItem.teaser.length} caracteres
    </Badge>
  </div>
  
  {/* Content */}
  <div className="bg-background/50 rounded-lg p-4 border border-border">
    <p className="text-sm whitespace-pre-wrap">{selectedContentItem.teaser}</p>
  </div>
  
  {/* FUTURE: Edit Section (commented)
  <div className="mt-3 pt-3 border-t border-border/50">
    <Button variant="ghost" size="sm" className="gap-2">
      <Edit className="w-4 h-4" />
      Editar Teaser
    </Button>
  </div>
  */}
</div>
```

### Detalhamento Visual

```
┌─────────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════╗  │  <- border-l-4
│ ║ 🎬 TEASER                                250 caracteres    ║  │     border-purple-500
│ ║                                                            ║  │
│ ║ ┌────────────────────────────────────────────────────────┐ ║  │
│ ║ │ Um pai emocionado descobre a verdade sobre quem        │ ║  │
│ ║ │ realmente cuidou dele durante anos. No Dia dos         │ ║  │
│ ║ │ Pais, seu filho CEO faz uma pergunta que mudará...     │ ║  │
│ ║ └────────────────────────────────────────────────────────┘ ║  │
│ ╚═══════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────┘
```

**GRADIENT E BORDAS:**
- Gradient: `bg-gradient-to-r from-purple-500/10 to-pink-500/10`
- Borda esquerda: `border-l-4 border-purple-500`
- Padding: `p-4`
- Border radius: `rounded-lg`

**HEADER:**
- Container: `flex items-center justify-between mb-3`
- Left side: `flex items-center gap-2`
  - Emoji: `text-2xl` (🎬)
  - Title: `font-semibold` ("TEASER")
- Right side: Badge com `variant="outline" className="font-mono text-xs"`

**CONTENT BOX:**
- Container: `bg-background/50 rounded-lg p-4 border border-border`
- Text: `text-sm whitespace-pre-wrap`
- **IMPORTANTE:** `whitespace-pre-wrap` preserva quebras de linha

**COMENTÁRIO FUTURO:**
```tsx
{/* FUTURE: Edit Section (commented)
<div className="mt-3 pt-3 border-t border-border/50">
  <Button variant="ghost" size="sm" className="gap-2">
    <Edit className="w-4 h-4" />
    Editar Teaser
  </Button>
</div>
*/}
```

---

## 📝 CARD 3: SCRIPT (Gradient Azul/Cyan + ScrollArea)

### Código Completo do Card

```tsx
{/* Script Card */}
<div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-l-4 border-blue-500 p-4 rounded-lg">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className="text-2xl">📝</span>
      <h3 className="font-semibold">SCRIPT COMPLETO</h3>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="font-mono text-xs">
        {selectedContentItem.script.length.toLocaleString()} caracteres
      </Badge>
      {selectedContentItem.script.length > 5000 && (
        <Badge variant="secondary" className="text-xs">
          Mostrando primeiros 5.000
        </Badge>
      )}
    </div>
  </div>
  
  {/* Scrollable Content Area */}
  <ScrollArea className="h-[400px] rounded-lg border border-border bg-background/50">
    <div className="p-4">
      <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
        {selectedContentItem.script.length > 5000 
          ? selectedContentItem.script.substring(0, 5000) + '...' 
          : selectedContentItem.script}
      </p>
    </div>
  </ScrollArea>
  
  {/* Info about scroll */}
  {selectedContentItem.script.length > 5000 && (
    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      <AlertCircle className="w-3 h-3" />
      <span>Role para ver mais do script. Total: {selectedContentItem.script.length.toLocaleString()} caracteres</span>
    </div>
  )}
  
  {/* FUTURE: Edit Section (commented)
  <div className="mt-3 pt-3 border-t border-border/50">
    <Button variant="ghost" size="sm" className="gap-2">
      <Edit className="w-4 h-4" />
      Editar Script
    </Button>
    <Textarea 
      placeholder="Notas de edição: descreva o que deve ser ajustado no script..."
      className="mt-2"
    />
  </div>
  */}
</div>
```

### Detalhamento Visual

```
┌─────────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════╗  │  <- border-l-4
│ ║ 📝 SCRIPT COMPLETO    28.450 caracteres [Primeiros 5.000] ║  │     border-blue-500
│ ║                                                            ║  │
│ ║ ┌────────────────────────────────────────────────────────┐ ║  │
│ ║ │ [INT. SALA DE ESTAR - DIA]                           ↕ │ ║  │  <- ScrollArea
│ ║ │                                                        │ ║  │     h-[400px]
│ ║ │ FADE IN:                                               │ ║  │
│ ║ │                                                        │ ║  │
│ ║ │ JOHN (70 anos, cabelos grisalhos, roupas simples...   │ ║  │
│ ║ │ ...                                                    │ ║  │
│ ║ │                                                      400px  │
│ ║ │ [Script continua com scroll...]                        │ ║  │
│ ║ └────────────────────────────────────────────────────────┘ ║  │
│ ║                                                            ║  │
│ ║ ⓘ Role para ver mais. Total: 28.450 caracteres            ║  │
│ ╚═══════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────┘
```

**GRADIENT E BORDAS:**
- Gradient: `bg-gradient-to-r from-blue-500/10 to-cyan-500/10`
- Borda esquerda: `border-l-4 border-blue-500`

**HEADER - BADGES MÚLTIPLOS:**
- Container direito: `flex items-center gap-2`
- Badge 1: `variant="outline" className="font-mono text-xs"` (contador total)
- Badge 2: `variant="secondary" className="text-xs"` (condicional se > 5000 chars)

**SCROLLAREA - CRÍTICO:**
- Component: `<ScrollArea>` do shadcn/ui
- Classe principal: `h-[400px]` - **ALTURA FIXA DE 400px**
- Classes adicionais: `rounded-lg border border-border bg-background/50`
- Container interno: `<div className="p-4">`
- Texto: `text-sm whitespace-pre-wrap font-mono leading-relaxed`

**CLASSES DO TEXTO DENTRO DO SCROLL:**
- `text-sm` - Tamanho pequeno para caber mais conteúdo
- `whitespace-pre-wrap` - **ESSENCIAL** - preserva quebras de linha e formatação
- `font-mono` - Fonte monoespaçada (melhor para scripts)
- `leading-relaxed` - Espaçamento entre linhas confortável

**LÓGICA DE TRUNCAMENTO:**
```tsx
{selectedContentItem.script.length > 5000 
  ? selectedContentItem.script.substring(0, 5000) + '...' 
  : selectedContentItem.script}
```

**INFO ADICIONAL (CONDICIONAL):**
- Só aparece se script > 5000 chars
- Container: `mt-2 flex items-center gap-2 text-xs text-muted-foreground`
- Ícone: `<AlertCircle className="w-3 h-3" />`
- Usa `toLocaleString()` para formatar números (28.450 ao invés de 28450)

---

## 📄 CARD 4: DESCRIPTION (Gradient Verde/Emerald)

### Código Completo do Card

```tsx
{/* Description Card */}
<div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-l-4 border-green-500 p-4 rounded-lg">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className="text-2xl">📄</span>
      <h3 className="font-semibold">DESCRIPTION (YouTube)</h3>
    </div>
    <Badge variant="outline" className="font-mono text-xs">
      {selectedContentItem.description.length} caracteres
    </Badge>
  </div>
  
  {/* Content */}
  <div className="bg-background/50 rounded-lg p-4 border border-border">
    <p className="text-sm whitespace-pre-wrap">{selectedContentItem.description}</p>
  </div>
  
  {/* FUTURE: Edit Section (commented)
  <div className="mt-3 pt-3 border-t border-border/50">
    <Button variant="ghost" size="sm" className="gap-2">
      <Edit className="w-4 h-4" />
      Editar Description
    </Button>
  </div>
  */}
</div>
```

### Detalhamento Visual

```
┌─────────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════╗  │  <- border-l-4
│ ║ 📄 DESCRIPTION (YouTube)                  450 caracteres   ║  │     border-green-500
│ ║                                                            ║  │
│ ║ ┌────────────────────────────────────────────────────────┐ ║  │
│ ║ │ 🎬 Uma história emocionante sobre sacrifício, amor e   │ ║  │
│ ║ │ gratidão                                               │ ║  │
│ ║ │                                                        │ ║  │
│ ║ │ Neste vídeo tocante, acompanhe a história de John...  │ ║  │
│ ║ │                                                        │ ║  │
│ ║ │ 🎭 Temas abordados:                                    │ ║  │
│ ║ │ • Amor incondicional de pai e filho                   │ ║  │
│ ║ │ ...                                                    │ ║  │
│ ║ └────────────────────────────────────────────────────────┘ ║  │
│ ╚═══════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────┘
```

**GRADIENT E BORDAS:**
- Gradient: `bg-gradient-to-r from-green-500/10 to-emerald-500/10`
- Borda esquerda: `border-l-4 border-green-500`

**ESTRUTURA IDÊNTICA AO TEASER:**
- Mesmo layout de header
- Mesmo content box
- Mesmas classes
- Mesma estrutura de comentário futuro

**DIFERENÇA DO SCRIPT:**
- **NÃO tem ScrollArea** - texto completo é exibido
- **NÃO tem truncamento** - description é mais curta (~450 chars)
- `whitespace-pre-wrap` preserva formatação, emojis e quebras de linha

---

## 💡 CARD 5: INFO/DICA (Blue Info Box)

### Código Completo do Card

```tsx
{/* Info */}
<div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
  <p className="text-xs text-blue-700 dark:text-blue-400">
    <span className="font-medium">💡 Dica:</span> No futuro você poderá editar manualmente cada campo e adicionar notas de edição para o agente AI ajustar o conteúdo.
  </p>
</div>
```

### Detalhamento Visual

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ 💡 Dica: No futuro você poderá editar manualmente cada    │   │
│ │ campo e adicionar notas de edição para o agente AI...     │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**CLASSES:**
- Container: `bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg`
- Text: `text-xs text-blue-700 dark:text-blue-400`
- "Dica:" label: `font-medium`

**OBSERVAÇÃO:**
- Usa classes de tema para dark mode (`dark:text-blue-400`)
- Background e border semi-transparentes (`/10` e `/20`)

---

## 📊 RESUMO DAS CORES DOS GRADIENTES

| Card | Gradient | Border Color | Emoji |
|------|----------|--------------|-------|
| **Teaser** | `from-purple-500/10 to-pink-500/10` | `border-purple-500` | 🎬 |
| **Script** | `from-blue-500/10 to-cyan-500/10` | `border-blue-500` | 📝 |
| **Description** | `from-green-500/10 to-emerald-500/10` | `border-green-500` | 📄 |
| **Info** | `bg-blue-500/10` | `border-blue-500/20` | 💡 |

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Video Info Card usa emoji 📹 `text-2xl`
- [ ] Teaser tem gradient roxo/rosa + `border-l-4 border-purple-500`
- [ ] Script tem `ScrollArea` com `h-[400px]` exata
- [ ] Script usa `font-mono leading-relaxed`
- [ ] Script trunca em 5000 chars se maior
- [ ] Description tem gradient verde + `border-l-4 border-green-500`
- [ ] Description NÃO tem ScrollArea
- [ ] Todos os textos usam `whitespace-pre-wrap`
- [ ] Info card no final com dica sobre futuro
- [ ] Todos os comentários de "FUTURE: Edit Section" estão presentes

---

Continua no próximo documento (Action Bar e Funções)...
