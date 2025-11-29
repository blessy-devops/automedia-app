# 🎨 CONTENT APPROVAL - Referência Visual Rápida

## 📐 LAYOUT COMPLETO COM MEDIDAS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER (h-auto, bg-card, border-b)                                         │
│ ┌─────────────────────────────────────────┐  [Pending|History] [Toggle⚡]  │
│ │ Approval Queue 2                        │                                │
│ └─────────────────────────────────────────┘                                │
├─────────────────┬───────────────────────────────────────────────────────────┤
│                 │                                                           │
│  LEFT PANEL     │         RIGHT PANEL                                      │
│  w-96 (384px)   │         flex-1                                           │
│  border-r       │                                                           │
│  bg-card        │  max-w-4xl mx-auto                                       │
│                 │                                                           │
│ ┌─────────────┐ │  ┌─────────────────────────────────────────────────┐    │
│ │  TABS       │ │  │ 📹 VIDEO INFO CARD                              │    │
│ │ grid-cols-3 │ │  │ bg-muted/30, border, p-4, rounded-lg            │    │
│ │             │ │  │ height: auto                                    │    │
│ │ [Titles |   │ │  └─────────────────────────────────────────────────┘    │
│ │ Thumbnails| │ │  ↓ space-y-6 (24px)                                     │
│ │  Content]   │ │  ┌─────────────────────────────────────────────────┐    │
│ └─────────────┘ │  │ 🎬 TEASER CARD                                  │    │
│                 │  │ gradient purple/pink, border-l-4, p-4           │    │
│ ┌─────────────┐ │  │ rounded-lg                                      │    │
│ │   Search    │ │  │                                                 │    │
│ │   Input     │ │  │ bg-background/50, p-4, border                   │    │
│ │   w-full    │ │  │ text-sm whitespace-pre-wrap                     │    │
│ └─────────────┘ │  └─────────────────────────────────────────────────┘    │
│                 │  ↓ space-y-6 (24px)                                     │
│ ┌─────────────┐ │  ┌─────────────────────────────────────────────────┐    │
│ │             │ │  │ 📝 SCRIPT CARD                                  │    │
│ │  Content 1  │ │  │ gradient blue/cyan, border-l-4, p-4             │    │
│ │  [SELECTED] │ │  │                                                 │    │
│ │             │ │  │ ┌─────────────────────────────────────────┐     │    │
│ │ bg-accent   │ │  │ │ <ScrollArea className="h-[400px]">     │     │    │
│ │ border-2    │ │  │ │                                         │     │    │
│ │ border-     │ │  │ │ [INT. SALA DE ESTAR - DIA]          ↕  │     │    │
│ │ primary     │ │  │ │                                         │     │    │
│ │             │ │  │ │ FADE IN:                                │  400px  │
│ │ p-3         │ │  │ │                                         │     │    │
│ │ rounded-lg  │ │  │ │ JOHN (70 anos, cabelos grisalhos...    │     │    │
│ │ mb-2        │ │  │ │ ...                                     │     │    │
│ │             │ │  │ │                                         │     │    │
│ │ 📦 CONTENT  │ │  │ │ font-mono, leading-relaxed,             │     │    │
│ │   PACK      │ │  │ │ whitespace-pre-wrap                     │     │    │
│ │             │ │  │ └─────────────────────────────────────────┘     │    │
│ │ [Channel]   │ │  │                                                 │    │
│ │ [ID: 105]   │ │  │ ⓘ Role para ver mais. Total: 28.450 chars      │    │
│ │ [2h ago]    │ │  └─────────────────────────────────────────────────┘    │
│ │             │ │  ↓ space-y-6 (24px)                                     │
│ │ Video       │ │  ┌─────────────────────────────────────────────────┐    │
│ │ Title...    │ │  │ 📄 DESCRIPTION CARD                             │    │
│ │             │ │  │ gradient green/emerald, border-l-4, p-4         │    │
│ │ Teaser...   │ │  │                                                 │    │
│ └─────────────┘ │  │ bg-background/50, p-4, border                   │    │
│                 │  │ text-sm whitespace-pre-wrap                     │    │
│ ┌─────────────┐ │  │ (NO ScrollArea)                                 │    │
│ │             │ │  └─────────────────────────────────────────────────┘    │
│ │  Content 2  │ │  ↓ space-y-6 (24px)                                     │
│ │             │ │  ┌─────────────────────────────────────────────────┐    │
│ │ bg-muted/30 │ │  │ 💡 INFO/DICA CARD                               │    │
│ │ hover:      │ │  │ bg-blue-500/10, border-blue-500/20, p-3         │    │
│ │ bg-muted/50 │ │  │ text-xs text-blue-700 dark:text-blue-400        │    │
│ │             │ │  └─────────────────────────────────────────────────┘    │
│ │ border-2    │ │                                                           │
│ │ border-     │ │  (flex-1 overflow-y-auto)                                │
│ │ transparent │ │                                                           │
│ └─────────────┘ │                                                           │
│                 │                                                           │
│ (overflow-y-    │                                                           │
│  auto, flex-1)  │                                                           │
│                 │                                                           │
└─────────────────┴───────────────────────────────────────────────────────────┤
                  │ ACTION BAR (border-t, bg-card, p-4, flex-shrink-0)       │
                  │ ┌─────────────────────────────────────────────────────┐  │
                  │ │ max-w-4xl mx-auto, flex justify-between             │  │
                  │ │                                                     │  │
                  │ │ 📦 Aprovando pacote...  [Reject] [Approve All]     │  │
                  │ │                         outline   primary           │  │
                  │ └─────────────────────────────────────────────────────┘  │
                  └──────────────────────────────────────────────────────────┘
```

---

## 🎨 CORES E GRADIENTES - HEX CODES

### Gradientes dos Cards

#### Teaser (Roxo/Rosa)
```tsx
className="bg-gradient-to-r from-purple-500/10 to-pink-500/10"
```
```css
/* Código CSS gerado */
background-image: linear-gradient(
  to right,
  rgb(168 85 247 / 0.1),    /* purple-500 com 10% opacity */
  rgb(236 72 153 / 0.1)     /* pink-500 com 10% opacity */
);
```

#### Script (Azul/Cyan)
```tsx
className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
```
```css
/* Código CSS gerado */
background-image: linear-gradient(
  to right,
  rgb(59 130 246 / 0.1),    /* blue-500 com 10% opacity */
  rgb(6 182 212 / 0.1)      /* cyan-500 com 10% opacity */
);
```

#### Description (Verde/Emerald)
```tsx
className="bg-gradient-to-r from-green-500/10 to-emerald-500/10"
```
```css
/* Código CSS gerado */
background-image: linear-gradient(
  to right,
  rgb(34 197 94 / 0.1),     /* green-500 com 10% opacity */
  rgb(16 185 129 / 0.1)     /* emerald-500 com 10% opacity */
);
```

### Bordas Esquerdas (border-l-4)

```tsx
// Teaser
border-l-4 border-purple-500    /* rgb(168 85 247) */

// Script
border-l-4 border-blue-500      /* rgb(59 130 246) */

// Description
border-l-4 border-green-500     /* rgb(34 197 94) */
```

### Preview Boxes no Histórico

```tsx
// Teaser Preview
bg-purple-500/5 border border-purple-500/20
text-purple-700 dark:text-purple-400

// Script Preview
bg-blue-500/5 border border-blue-500/20
text-blue-700 dark:text-blue-400

// Description Preview
bg-green-500/5 border border-green-500/20
text-green-700 dark:text-green-400
```

---

## 📏 MEDIDAS EXATAS - TABELA DE REFERÊNCIA

| Elemento | Width | Height | Padding | Margin | Gap |
|----------|-------|--------|---------|--------|-----|
| **Left Panel** | `w-96` (384px) | `min-h-screen` | - | - | - |
| **Right Panel** | `flex-1` | `min-h-screen` | - | - | - |
| **Content Container** | `max-w-4xl` | `auto` | - | `mx-auto` | - |
| **Cards Space** | - | - | - | - | `space-y-6` (24px) |
| **Card Padding** | - | - | `p-4` (16px) | - | - |
| **Card Border** | - | - | - | - | - |
| **ScrollArea** | `100%` | `h-[400px]` | - | - | - |
| **Header mb** | - | - | - | `mb-3` (12px) | - |
| **Icon-Text Gap** | - | - | - | - | `gap-2` (8px) |
| **Badge Gap** | - | - | - | - | `gap-2` (8px) |
| **Action Bar** | `100%` | `auto` | `p-4` (16px) | - | - |

---

## 🔤 TIPOGRAFIA - CLASSES TAILWIND

| Elemento | Class | Font Size | Line Height | Font Weight |
|----------|-------|-----------|-------------|-------------|
| **Emoji (grande)** | `text-2xl` | 1.5rem (24px) | 2rem | - |
| **Emoji (pequeno)** | `text-lg` | 1.125rem (18px) | 1.75rem | - |
| **Header Title** | `font-semibold` | **inherit** | **inherit** | 600 |
| **Body Text** | `text-sm` | 0.875rem (14px) | 1.25rem | - |
| **Label Text** | `text-xs` | 0.75rem (12px) | 1rem | - |
| **Script Text** | `text-sm font-mono` | 0.875rem | `leading-relaxed` | - |
| **Badge Text** | `text-xs` | 0.75rem (12px) | 1rem | - |

**IMPORTANTE:** Headers NÃO têm override de tamanho (usam padrão do `/styles/globals.css`)

---

## 🎭 EMOJIS USADOS - REFERÊNCIA

| Emoji | Unicode | Uso | Tamanho |
|-------|---------|-----|---------|
| 📹 | U+1F4F9 | Video Info Card | `text-2xl` |
| 🎬 | U+1F3AC | Teaser Card | `text-2xl` |
| 📝 | U+1F4DD | Script Card | `text-2xl` |
| 📄 | U+1F4C4 | Description Card | `text-2xl` |
| 💡 | U+1F4A1 | Info/Dica Card | `text-2xl` |
| 📦 | U+1F4E6 | Content Pack (lista) | `text-lg` |
| ⓘ | U+24D8 | Info adicional | `text-xs` |

---

## 🔧 COMPONENTES SHADCN/UI UTILIZADOS

| Component | Import | Props Importantes |
|-----------|--------|-------------------|
| **Badge** | `./ui/badge` | `variant="outline"` / `variant="secondary"` |
| **Button** | `./ui/button` | `variant="outline"` / `className="gap-2"` |
| **ScrollArea** | `./ui/scroll-area` | `className="h-[400px]"` - **CRÍTICO** |
| **Card** | `./ui/card` | Usado no ApprovalHistory |
| **Tabs** | `./ui/tabs` | `TabsList`, `TabsTrigger`, `TabsContent` |
| **Switch** | `./ui/switch` | `checked`, `onCheckedChange` |

---

## 📊 ESTRUTURA DO MOCK DATA

### Template PendingContent

```tsx
{
  id: 1,                          // Único
  videoId: 105,                   // ID do vídeo
  channelName: 'DramatizeMe',     // Nome do canal
  channelColor: '#DC2626',        // Cor hex (red-600)
  videoTitle: "On Father's...",  // Título completo
  teaser: "Um pai emocionado...", // ~250 chars
  script: `[INT. SALA...]`,       // ~30.000 chars
  description: `🎬 Uma...`,       // ~450 chars, com emojis
  thumbText?: "Texto...",         // OPCIONAL, não exibir
  createdAt: '2025-11-29T14:30:00', // ISO timestamp
  status: 'pending',              // 'pending' | 'approved' | 'rejected'
  author: 'AI Agent'              // Quem criou
}
```

### Template ApprovalHistoryContent

```tsx
{
  id: Date.now(),                 // Timestamp como ID único
  itemId: 1,                      // ID do PendingContent original
  videoId: 105,
  channelName: 'DramatizeMe',
  channelColor: '#DC2626',
  videoTitle: "On Father's...",
  teaser: "Um pai emocionado...",
  script: `[INT. SALA...]`,       // Script COMPLETO (não truncado)
  description: `🎬 Uma...`,
  status: 'approved',             // 'approved' | 'rejected'
  approvedAt: new Date().toISOString(),
  approvedBy: 'You',
  autoApproved: false             // true se auto-approval ativo
}
```

---

## 🎯 CLASSES CRÍTICAS - COPIAR EXATAMENTE

### Card de Content Pack na Lista (Painel Esquerdo)

```tsx
// Container
className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
  selectedItemId === item.id
    ? 'bg-accent border-2 border-primary'
    : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
}`}

// Icon Header
<div className="flex items-center gap-2 mb-2">
  <span className="text-lg">📦</span>
  <span className="text-xs font-semibold text-muted-foreground">CONTENT PACK</span>
</div>

// Badges Container
<div className="flex items-center gap-2 mb-2 flex-wrap">
  {/* Badges aqui */}
</div>

// Video Title
<p className="text-xs font-medium line-clamp-2 mb-2">
  {item.videoTitle}
</p>

// Teaser Preview
<p className="text-xs text-muted-foreground line-clamp-1">
  {item.teaser.substring(0, 60)}...
</p>
```

### Card de Visualização - Template Base

```tsx
// Container (exemplo com Teaser)
<div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-l-4 border-purple-500 p-4 rounded-lg">
  
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className="text-2xl">🎬</span>
      <h3 className="font-semibold">TEASER</h3>
    </div>
    <Badge variant="outline" className="font-mono text-xs">
      {teaser.length} caracteres
    </Badge>
  </div>
  
  {/* Content Box */}
  <div className="bg-background/50 rounded-lg p-4 border border-border">
    <p className="text-sm whitespace-pre-wrap">{teaser}</p>
  </div>
</div>
```

### ScrollArea do Script - CRÍTICO

```tsx
<ScrollArea className="h-[400px] rounded-lg border border-border bg-background/50">
  <div className="p-4">
    <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
      {script.length > 5000 
        ? script.substring(0, 5000) + '...' 
        : script}
    </p>
  </div>
</ScrollArea>
```

**CLASSES OBRIGATÓRIAS:**
- `h-[400px]` - Altura fixa
- `text-sm` - Tamanho de fonte pequeno
- `whitespace-pre-wrap` - Preserva formatação
- `font-mono` - Fonte monoespaçada
- `leading-relaxed` - Espaçamento entre linhas

---

## 🔄 FLUXO DE DADOS - DIAGRAMA

```
┌─────────────────────────────────────────────────────────┐
│ mockPendingContent (array)                              │
│ ├─ Item 1 (id: 1, videoId: 105, status: 'pending')     │
│ └─ Item 2 (id: 2, videoId: 106, status: 'pending')     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ removedContentIds (Set)                                 │
│ ├─ [vazio inicialmente]                                 │
│ └─ Adiciona ID ao aprovar/rejeitar                      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ filteredContent (computed)                              │
│ = mockPendingContent                                    │
│   .filter(item => !removedContentIds.has(item.id))      │
│   .filter(item => matches searchQuery)                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ selectedItemId (state)                                  │
│ = ID do item selecionado atualmente                     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ selectedContentItem (computed)                          │
│ = mockPendingContent.find(c => c.id === selectedItemId) │
└─────────────────────────────────────────────────────────┘
                    ↓
        ┌─────────────────────┐
        │   USER ACTION       │
        └─────────────────────┘
                ↓
    ┌──────────┴──────────┐
    ↓                     ↓
[Approve]             [Reject]
    ↓                     ↓
┌────────────┐      ┌────────────┐
│ handleApp- │      │ handleRej- │
│ roveContent│      │ ectContent │
└────────────┘      └────────────┘
    ↓                     ↓
    └─────────┬───────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ contentHistory (state)                                  │
│ [novo item adicionado no início do array]              │
│ status: 'approved' ou 'rejected'                        │
│ autoApproved: true/false                                │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ removedContentIds.add(selectedItemId)                   │
│ [item removido da lista pending]                        │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ setSelectedItemId(próximo item ou null)                 │
│ [navegação automática]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 CÓDIGO RÁPIDO - COPY/PASTE

### Import Statement Completo

```tsx
import { CheckCircle2, XCircle, Sparkles, FileText, Image as ImageIcon, Clock, User, AlertCircle, Brain, Target, Maximize2, Filter, History, Package, Video } from 'lucide-react';
```

### Estados Completos

```tsx
const [autoApprovalContent, setAutoApprovalContent] = useState(false);
const [removedContentIds, setRemovedContentIds] = useState<Set<number>>(new Set());
const [contentHistory, setContentHistory] = useState<ApprovalHistoryContent[]>([]);
```

### Computed Values Completos

```tsx
const pendingContentCount = mockPendingContent.filter(c => c.status === 'pending').length;
const selectedContentItem = activeTab === 'content' ? mockPendingContent.find(c => c.id === selectedItemId) : null;

const filteredContent = mockPendingContent
  .filter(item => !removedContentIds.has(item.id))
  .filter(item =>
    item.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.teaser.toLowerCase().includes(searchQuery.toLowerCase())
  );
```

### TabsTrigger Content

```tsx
<TabsTrigger value="content" className="gap-2">
  <Package className="w-4 h-4" />
  Content
  {pendingContentCount > 0 && (
    <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
      {pendingContentCount}
    </Badge>
  )}
</TabsTrigger>
```

### Action Bar Status Info

```tsx
{activeTab === 'content' && (
  <div className="flex items-center gap-2">
    <Package className="w-4 h-4" />
    <span>Aprovando pacote completo (3 itens)</span>
  </div>
)}
```

### Action Bar Buttons

```tsx
{activeTab === 'content' ? (
  <>
    <Button variant="outline" onClick={handleRejectContent} className="gap-2">
      <XCircle className="w-4 h-4" />
      Reject Package
    </Button>
    <Button onClick={handleApproveContent} className="gap-2">
      <CheckCircle2 className="w-4 h-4" />
      Approve All
    </Button>
  </>
) : null}
```

---

## 🎓 COMPARAÇÃO COM OUTRAS TABS

| Feature | Titles | Thumbnails | Content |
|---------|--------|------------|---------|
| **Ícone** | FileText | ImageIcon | Package |
| **Items por aprovação** | 1 (de 11 opções) | 1 | 3 (pacote) |
| **Seleção UI** | Radio buttons | Auto-select | Auto-select |
| **Preview visual** | Não | Sim (imagens) | Sim (texto) |
| **Scroll** | Não | Não | **Sim (script)** |
| **Modal ampliado** | Não | Sim | Não |
| **Inline edit** | Não | Não | Futuro |
| **Múltiplos campos** | Não | Não | **Sim (3)** |
| **Gradientes** | Não | Não | **Sim (3 cores)** |
| **Emojis grandes** | Não | Não | **Sim (5)** |
| **Font mono** | Não | Não | **Sim (script)** |
| **Truncamento** | Não | Não | **Sim (5k chars)** |
| **Badge "Auto"** | Sim | Sim | Sim |

---

## ✅ CONCLUSÃO DA REFERÊNCIA

Este documento serve como **referência visual rápida** para consulta durante a implementação.

**Use junto com:**
- `CONTENT-APPROVAL-INDEX.md` - Navegação entre documentos
- `CONTENT-APPROVAL-TAB-COMPLETE.md` - Etapas 1-2
- `CONTENT-APPROVAL-UI-LAYOUT.md` - Etapas 3-4
- `CONTENT-APPROVAL-RIGHT-PANEL.md` - Etapa 5
- `CONTENT-APPROVAL-FUNCTIONS.md` - Etapas 6-8
- `CONTENT-APPROVAL-FINAL.md` - Etapas 9-10

**Todos os valores de medidas, cores e classes são EXATOS.**
**Copie e cole conforme necessário.**

🎨 **Design System:** Tailwind CSS v4.0
📦 **UI Library:** shadcn/ui
⚛️ **Framework:** React + TypeScript
