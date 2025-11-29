# 🎨 CONTENT APPROVAL - Layout Visual Detalhado

## 📐 ESTRUTURA VISUAL COMPLETA

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER: Approval Queue 2                      [Pending | History]  │
│                                               [Auto-Approve Toggle] │
├─────────────────┬───────────────────────────────────────────────────┤
│                 │                                                   │
│  LEFT PANEL     │         RIGHT PANEL (Main Area)                  │
│  384px width    │         flex-1                                   │
│                 │                                                   │
│ ┌─────────────┐ │  ┌───────────────────────────────────────────┐  │
│ │ [Titles |   │ │  │ 📹 Video Info Card                        │  │
│ │ Thumbnails | │ │  │ height: auto, mb-6                       │  │
│ │  Content]   │ │  └───────────────────────────────────────────┘  │
│ └─────────────┘ │                                                   │
│      grid-3     │  ┌───────────────────────────────────────────┐  │
│                 │  │ 🎬 TEASER Card                            │  │
│ ┌─────────────┐ │  │ gradient purple/pink, border-l-4         │  │
│ │   Search    │ │  │ p-4, rounded-lg, space-y-3              │  │
│ │   Input     │ │  └───────────────────────────────────────────┘  │
│ └─────────────┘ │                                                   │
│                 │  ┌───────────────────────────────────────────┐  │
│ ┌─────────────┐ │  │ 📝 SCRIPT Card                            │  │
│ │             │ │  │ gradient blue/cyan, border-l-4           │  │
│ │  Content 1  │ │  │ ScrollArea h-[400px]                     │  │
│ │  [selected] │ │  │ p-4, rounded-lg                          │  │
│ │             │ │  └───────────────────────────────────────────┘  │
│ │ 📦 CONTENT  │ │                                                   │
│ │   PACK      │ │  ┌───────────────────────────────────────────┐  │
│ │             │ │  │ 📄 DESCRIPTION Card                       │  │
│ │ Video: ...  │ │  │ gradient green/emerald, border-l-4       │  │
│ │ Channel     │ │  │ p-4, rounded-lg                          │  │
│ │ 2h ago      │ │  └───────────────────────────────────────────┘  │
│ └─────────────┘ │                                                   │
│                 │  ┌───────────────────────────────────────────┐  │
│ ┌─────────────┐ │  │ 💡 Info Card                              │  │
│ │             │ │  │ blue info, border-l-0                    │  │
│ │  Content 2  │ │  └───────────────────────────────────────────┘  │
│ │             │ │                                                   │
│ └─────────────┘ │                                                   │
│                 │                                                   │
└─────────────────┴───────────────────────────────────────────────────┘
                  ├───────────────────────────────────────────────┤
                  │ ACTION BAR (border-top)                       │
                  │ [Status Info]  [Reject Package] [Approve All] │
                  └───────────────────────────────────────────────┘
```

---

## 🎯 ETAPA 3: ADICIONAR TAB "CONTENT"

### 3.1 - Modificar TabsList para grid-cols-3

**LOCALIZAÇÃO:** Aproximadamente linha ~1054

**CÓDIGO ATUAL:**
```tsx
<TabsList className="w-full grid grid-cols-2">
  <TabsTrigger value="titles" className="gap-2">
    <FileText className="w-4 h-4" />
    Titles
    {pendingTitlesCount > 0 && (
      <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
        {pendingTitlesCount}
      </Badge>
    )}
  </TabsTrigger>
  <TabsTrigger value="thumbnails" className="gap-2">
    <ImageIcon className="w-4 h-4" />
    Thumbnails
    {pendingThumbnailsCount > 0 && (
      <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
        {pendingThumbnailsCount}
      </Badge>
    )}
  </TabsTrigger>
</TabsList>
```

**CÓDIGO MODIFICADO (COMPLETO):**
```tsx
<TabsList className="w-full grid grid-cols-3">
  <TabsTrigger value="titles" className="gap-2">
    <FileText className="w-4 h-4" />
    Titles
    {pendingTitlesCount > 0 && (
      <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
        {pendingTitlesCount}
      </Badge>
    )}
  </TabsTrigger>
  <TabsTrigger value="thumbnails" className="gap-2">
    <ImageIcon className="w-4 h-4" />
    Thumbnails
    {pendingThumbnailsCount > 0 && (
      <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
        {pendingThumbnailsCount}
      </Badge>
    )}
  </TabsTrigger>
  <TabsTrigger value="content" className="gap-2">
    <Package className="w-4 h-4" />
    Content
    {pendingContentCount > 0 && (
      <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
        {pendingContentCount}
      </Badge>
    )}
  </TabsTrigger>
</TabsList>
```

**CLASSES IMPORTANTES:**
- `grid-cols-3` - MUDOU de grid-cols-2 para grid-cols-3
- `gap-2` - Espaçamento entre ícone e texto
- `ml-1 h-5 min-w-5 px-1.5` - Badge de contador (mesmas classes das outras tabs)

---

### 3.2 - Atualizar lógica de onValueChange

**LOCALIZAÇÃO:** Dentro do `<Tabs>` component (linha ~1048)

**CÓDIGO ATUAL:**
```tsx
<Tabs value={activeTab} onValueChange={(newTab) => {
  setActiveTab(newTab);
  setSelectedItemId(newTab === 'titles' ? (filteredTitles[0]?.id || null) : (filteredThumbnails[0]?.id || null));
  setSelectedTitleIndex(undefined);
  setSelectedThumbnailId(undefined);
}} className="w-full">
```

**CÓDIGO MODIFICADO:**
```tsx
<Tabs value={activeTab} onValueChange={(newTab) => {
  setActiveTab(newTab);
  if (newTab === 'titles') {
    setSelectedItemId(filteredTitles[0]?.id || null);
  } else if (newTab === 'thumbnails') {
    setSelectedItemId(filteredThumbnails[0]?.id || null);
  } else if (newTab === 'content') {
    setSelectedItemId(filteredContent[0]?.id || null);
  }
  setSelectedTitleIndex(undefined);
  setSelectedThumbnailId(undefined);
}} className="w-full">
```

**LÓGICA:**
- Quando muda para tab "content", auto-seleciona o primeiro content pack
- Limpa seleções anteriores de title/thumbnail

---

### 3.3 - Adicionar computed values

**LOCALIZAÇÃO:** Logo após `selectedThumbnailItem` (linha ~928)

**CÓDIGO EXISTENTE:**
```tsx
const pendingTitlesCount = mockPendingTitles.filter(t => t.status === 'pending').length;
const pendingThumbnailsCount = mockPendingThumbnails.filter(t => t.status === 'pending').length;

const selectedTitleItem = activeTab === 'titles' ? mockPendingTitles.find(t => t.id === selectedItemId) : null;
const selectedThumbnailItem = activeTab === 'thumbnails' ? mockPendingThumbnails.find(t => t.id === selectedItemId) : null;
```

**ADICIONAR ESTAS LINHAS:**
```tsx
const pendingContentCount = mockPendingContent.filter(c => c.status === 'pending').length;

const selectedContentItem = activeTab === 'content' ? mockPendingContent.find(c => c.id === selectedItemId) : null;
```

---

### 3.4 - Adicionar filteredContent

**LOCALIZAÇÃO:** Logo após `filteredThumbnails` (linha ~953)

**CÓDIGO EXISTENTE:**
```tsx
const filteredThumbnails = mockPendingThumbnails
  .filter(item => !removedThumbnailIds.has(item.id))
  .filter(item =>
    item.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );
```

**ADICIONAR ESTE CÓDIGO:**
```tsx
const filteredContent = mockPendingContent
  .filter(item => !removedContentIds.has(item.id))
  .filter(item =>
    item.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.teaser.toLowerCase().includes(searchQuery.toLowerCase())
  );
```

**OBSERVAÇÃO:**
- Content tem filtro adicional por `teaser` (além de videoTitle e channelName)

---

## 🎯 ETAPA 4: RENDERIZAR LISTA DE CONTENT PACKS (PAINEL ESQUERDO)

### 4.1 - Adicionar bloco de renderização

**LOCALIZAÇÃO:** Logo após o bloco `{activeTab === 'thumbnails' && (...)}`  (linha ~1214)

**ADICIONAR ESTE CÓDIGO COMPLETO:**

```tsx
{activeTab === 'content' && (
  <div className="p-2">
    {filteredContent.length === 0 ? (
      <div className="py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No pending content</p>
      </div>
    ) : (
      filteredContent.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setSelectedItemId(item.id);
          }}
          className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
            selectedItemId === item.id
              ? 'bg-accent border-2 border-primary'
              : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
          }`}
        >
          {/* Icon Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📦</span>
            <span className="text-xs font-semibold text-muted-foreground">CONTENT PACK</span>
          </div>
          
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge 
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: `${item.channelColor}20`,
                color: item.channelColor,
                borderColor: `${item.channelColor}40`
              }}
            >
              {item.channelName}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              ID: {item.videoId}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(item.createdAt)}
            </Badge>
          </div>
          
          {/* Video Title */}
          <p className="text-xs font-medium line-clamp-2 mb-2">
            {item.videoTitle}
          </p>
          
          {/* Teaser Preview */}
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.teaser.substring(0, 60)}...
          </p>
        </button>
      ))
    )}
  </div>
)}
```

---

### 4.2 - Detalhamento do Card na Lista

**ESTRUTURA DO CARD:**

```
┌─────────────────────────────────────┐
│ 📦 CONTENT PACK                     │  <- text-lg emoji + text-xs label
├─────────────────────────────────────┤
│ [DramatizeMe] [ID: 105] [2h ago]    │  <- Badges inline, gap-2
├─────────────────────────────────────┤
│ On Father's Day, My CEO Son         │  <- line-clamp-2, text-xs
│ Asked, "Dad, Do You Like..."        │     font-medium
├─────────────────────────────────────┤
│ Um pai emocionado descobre a ver... │  <- line-clamp-1, text-xs
│                                     │     text-muted-foreground
└─────────────────────────────────────┘
```

**CLASSES TAILWIND (CARD):**
- Container: `w-full text-left p-3 rounded-lg mb-2 transition-all`
- Selected: `bg-accent border-2 border-primary`
- Unselected: `bg-muted/30 hover:bg-muted/50 border-2 border-transparent`

**EMOJI E LABEL:**
- Emoji: `text-lg` (📦)
- Label: `text-xs font-semibold text-muted-foreground` ("CONTENT PACK")
- Container: `flex items-center gap-2 mb-2`

**BADGES:**
- Container: `flex items-center gap-2 mb-2 flex-wrap`
- Channel Badge: `variant="secondary" className="text-xs"` + inline styles
- ID Badge: `variant="outline" className="text-xs font-mono"`
- Time Badge: `variant="outline" className="text-xs gap-1"` + Clock icon `w-3 h-3`

**TEXTOS:**
- Title: `text-xs font-medium line-clamp-2 mb-2`
- Teaser: `text-xs text-muted-foreground line-clamp-1`

---

Continua no próximo documento (Visualização no Painel Direito)...
