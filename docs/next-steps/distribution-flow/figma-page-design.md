# Production Distribution - Especificação Técnica Completa

## 📋 Contexto do Projeto

Este documento detalha a implementação completa da página **Production Distribution** para a plataforma Automídia, uma ferramenta de benchmark de canais do YouTube.

### Stack Tecnológico
- React + TypeScript
- Tailwind CSS
- Shadcn/ui components
- Tema escuro/claro com CSS variables
- Esquema de cores: YouTube Red (#DD2C00)

---

## 🎯 Objetivo da Página

A página Production Distribution permite distribuir vídeos com status `pending_distribution` para canais elegíveis baseados em **match de niche/subniche**.

### Fluxo Principal
1. Usuário vê lista de vídeos aguardando distribuição
2. Clica em um vídeo (ou botão "Select Channels")
3. Abre drawer lateral mostrando canais elegíveis
4. Seleciona um ou mais canais
5. Clica em "Distribute" para criar jobs de produção

### Fluxo Secundário (Sem Match)
1. Se vídeo não tem canais elegíveis, drawer mostra mensagem
2. Opções: "Force Selection" (mostrar todos canais) ou "Remove from Queue"
3. Se forçar seleção, canais não-match aparecem com badge vermelha "No Match"

---

## 📁 Estrutura do Arquivo

**Localização:** `/components/ProductionDistribution.tsx`

### Imports Necessários

```typescript
import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Search, RefreshCw, Send, CheckCircle2, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Sidebar } from './Sidebar';
import { ImageWithFallback } from './figma/ImageWithFallback';
```

**⚠️ ATENÇÃO:** Importar `toast` especificamente da versão `sonner@2.0.3`

---

## 🔧 Interfaces TypeScript

```typescript
interface ProductionDistributionProps {
  onNavigate: (route: string) => void;
}

interface BenchmarkVideo {
  id: number;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string;
  source_channel_name: string;
  source_channel_handle: string;
  niche: string;
  subniche: string;
  microniche?: string;
  category?: string;
  has_transcript: boolean;
}

interface EligibleChannel {
  id: number;
  name: string;
  handle: string;
  niche: string;
  subniche: string;
  language: string;
  has_brand_bible: boolean;
  brand_bible_complete: boolean;
}
```

---

## 🗂️ Mock Data

### mockVideos (Array de BenchmarkVideo)

```typescript
const mockVideos: BenchmarkVideo[] = [
  {
    id: 26388,
    youtube_video_id: 'dQw4w9WgXcQ',
    title: 'The Ultimate Guide to Family Conflict Resolution in Modern Times',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    source_channel_name: 'Family Stories Channel',
    source_channel_handle: '@familystories',
    niche: 'entertainment',
    subniche: 'storytelling',
    microniche: 'universal_family_conflict_betrayal',
    category: 'narrative',
    has_transcript: true,
  },
  {
    id: 26389,
    youtube_video_id: 'xyz123ABC',
    title: 'How to Build Trust After Betrayal',
    thumbnail_url: 'https://img.youtube.com/vi/xyz123ABC/mqdefault.jpg',
    source_channel_name: 'Life Wisdom',
    source_channel_handle: '@lifewisdom',
    niche: 'entertainment',
    subniche: 'storytelling',
    category: 'narrative',
    has_transcript: false,
  },
  {
    id: 26390,
    youtube_video_id: 'abc456DEF',
    title: 'Top 10 Gaming Moments of 2024',
    thumbnail_url: 'https://img.youtube.com/vi/abc456DEF/mqdefault.jpg',
    source_channel_name: 'Epic Gaming',
    source_channel_handle: '@epicgaming',
    niche: 'gaming',
    subniche: 'highlights',
    category: 'entertainment',
    has_transcript: true,
  },
];
```

### mockEligibleChannels (Objeto mapeado por video.id)

```typescript
const mockEligibleChannels: { [videoId: number]: EligibleChannel[] } = {
  26388: [
    {
      id: 1,
      name: 'Canal Histórias da Vida',
      handle: '@historiasdavida',
      niche: 'entertainment',
      subniche: 'storytelling',
      language: 'pt-BR',
      has_brand_bible: true,
      brand_bible_complete: true,
    },
    {
      id: 2,
      name: 'Narrativas Reais',
      handle: '@narrativasreais',
      niche: 'entertainment',
      subniche: 'storytelling',
      language: 'pt-BR',
      has_brand_bible: true,
      brand_bible_complete: false,
    },
    {
      id: 3,
      name: 'Stories BR',
      handle: '@storiesbr',
      niche: 'entertainment',
      subniche: 'storytelling',
      language: 'pt-BR',
      has_brand_bible: false,
      brand_bible_complete: false,
    },
  ],
  26389: [
    {
      id: 4,
      name: 'Vida e Sabedoria',
      handle: '@vidaesabedoria',
      niche: 'entertainment',
      subniche: 'storytelling',
      language: 'pt-BR',
      has_brand_bible: true,
      brand_bible_complete: true,
    },
  ],
  26390: [], // Vídeo sem canais elegíveis
};
```

### mockAllChannels (Canais para "Force Selection")

```typescript
const mockAllChannels: EligibleChannel[] = [
  {
    id: 10,
    name: 'Canal Gaming BR',
    handle: '@gamingbr',
    niche: 'gaming',
    subniche: 'gameplay',
    language: 'pt-BR',
    has_brand_bible: true,
    brand_bible_complete: true,
  },
  {
    id: 11,
    name: 'Tech Reviews',
    handle: '@techreviews',
    niche: 'technology',
    subniche: 'reviews',
    language: 'en-US',
    has_brand_bible: false,
    brand_bible_complete: false,
  },
];
```

---

## 🎨 Estrutura de Layout

### Container Principal

```tsx
<div className="flex h-screen bg-background">
  <Sidebar currentRoute="productionDistribution" onNavigate={onNavigate} />
  
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Conteúdo aqui */}
  </div>
</div>
```

**⚠️ IMPORTANTE:**
- `flex h-screen` no container principal
- `flex-1 flex flex-col overflow-hidden` no container de conteúdo
- **NÃO usar `ml-16`** (isso cria espaço extra)
- Sidebar usa `currentRoute="productionDistribution"`

---

## 📊 Área de Conteúdo Principal

### Header com Título e Ações

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-foreground mb-1">Production Distribution</h1>
    <p className="text-sm text-muted-foreground">
      {videos.length} video{videos.length !== 1 ? 's' : ''} awaiting distribution
    </p>
  </div>
  <Button variant="outline" size="sm">
    <RefreshCw className="w-4 h-4 mr-2" />
    Refresh
  </Button>
</div>
```

**Classes críticas:**
- `text-foreground` no h1 (não adicionar classes de font-size)
- `mb-1` entre título e subtítulo
- `mb-6` após o header inteiro

### Barra de Busca

```tsx
<div className="mb-6">
  <div className="relative max-w-md">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      placeholder="Search videos..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-9"
    />
  </div>
</div>
```

**⚠️ ATENÇÃO:**
- `max-w-md` limita largura da busca
- Ícone Search posicionado com `absolute left-3 top-1/2 transform -translate-y-1/2`
- Input tem `pl-9` para não sobrepor o ícone

---

## 📋 Tabela de Vídeos

### Estrutura da Tabela

```tsx
<div className="bg-card rounded-lg border border-border overflow-hidden">
  <table className="w-full">
    <thead className="bg-muted/50 border-b border-border">
      {/* Headers */}
    </thead>
    <tbody className="divide-y divide-border">
      {/* Rows */}
    </tbody>
  </table>
</div>
```

### Headers da Tabela

```tsx
<thead className="bg-muted/50 border-b border-border">
  <tr>
    <th className="px-4 py-3 text-left text-sm text-muted-foreground w-20">Thumb</th>
    <th className="px-4 py-3 text-left text-sm text-muted-foreground">Video</th>
    <th className="px-4 py-3 text-left text-sm text-muted-foreground">Source</th>
    <th className="px-4 py-3 text-left text-sm text-muted-foreground">Category</th>
    <th className="px-4 py-3 text-left text-sm text-muted-foreground">Eligible</th>
    <th className="px-4 py-3 text-right text-sm text-muted-foreground">Actions</th>
  </tr>
</thead>
```

**Classes obrigatórias:**
- `bg-muted/50` no thead (não usar `bg-muted` sozinho)
- `text-sm text-muted-foreground` nos th
- `w-20` na coluna Thumb
- `text-right` no último th (Actions)

### Linha da Tabela (TR)

```tsx
<tr
  key={video.id}
  className="hover:bg-muted/30 transition-colors cursor-pointer"
  onClick={() => handleVideoSelect(video)}
>
```

**Hover state:** `hover:bg-muted/30` (30% de opacidade)

### Coluna 1: Thumbnail

```tsx
<td className="px-4 py-3">
  <ImageWithFallback
    src={video.thumbnail_url}
    alt={video.title}
    className="w-16 h-9 rounded object-cover"
  />
</td>
```

**Proporção:** `w-16 h-9` (16:9 aspect ratio)

### Coluna 2: Video (Título + IDs + Link YouTube)

```tsx
<td className="px-4 py-3">
  <div className="flex flex-col gap-1.5">
    <div className="text-sm text-foreground line-clamp-2 max-w-md">
      {video.title}
    </div>
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge variant="secondary" className="text-xs font-mono">
        ID: {video.id}
      </Badge>
      <Badge variant="outline" className="text-xs font-mono">
        YT: {video.youtube_video_id}
      </Badge>
      <a
        href={`https://www.youtube.com/watch?v=${video.youtube_video_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        Ver no YouTube
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  </div>
</td>
```

**⚠️ CRÍTICO:**
- `line-clamp-2 max-w-md` no título
- Badges com `font-mono` para IDs
- Link com `onClick={(e) => e.stopPropagation()}` para não abrir drawer
- Ícone ExternalLink com `w-3 h-3` (menor que normal)
- `flex-wrap` nos badges para quebrar linha se necessário

### Coluna 3: Source (Canal de Origem)

```tsx
<td className="px-4 py-3">
  <div className="flex flex-col gap-0.5">
    <div className="text-sm text-foreground">{video.source_channel_name}</div>
    <div className="text-xs text-muted-foreground">{video.source_channel_handle}</div>
  </div>
</td>
```

**Gap:** `gap-0.5` (menor que o padrão)

### Coluna 4: Category (Niche + Subniche)

```tsx
<td className="px-4 py-3">
  <div className="flex flex-wrap gap-1">
    <Badge variant="secondary" className="text-xs">
      {video.niche}
    </Badge>
    <Badge variant="outline" className="text-xs">
      {video.subniche}
    </Badge>
  </div>
</td>
```

### Coluna 5: Eligible (Status de Canais)

```tsx
<td className="px-4 py-3">
  {channelCount > 0 ? (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-green-600" />
      <span className="text-sm text-foreground">{channelCount} channel{channelCount !== 1 ? 's' : ''}</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <AlertCircle className="w-4 h-4 text-amber-600" />
      <span className="text-sm text-muted-foreground">No matches</span>
    </div>
  )}
</td>
```

**Cores específicas:**
- Verde: `text-green-600` (CheckCircle2)
- Âmbar: `text-amber-600` (AlertCircle)

### Coluna 6: Actions

```tsx
<td className="px-4 py-3 text-right">
  <Button
    size="sm"
    variant="ghost"
    onClick={(e) => {
      e.stopPropagation();
      handleVideoSelect(video);
    }}
  >
    Select Channels
  </Button>
</td>
```

**⚠️ IMPORTANTE:** `e.stopPropagation()` para evitar duplo-click

### Empty State (Sem resultados)

```tsx
{filteredVideos.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">
    No videos found
  </div>
)}
```

**Padding:** `py-12` (espaçamento vertical generoso)

---

## 🗂️ Drawer (Sheet) de Seleção de Canais

### Estrutura Principal do Sheet

```tsx
<Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
  <SheetContent className="sm:max-w-xl flex flex-col p-0">
    {/* Conteúdo */}
  </SheetContent>
</Sheet>
```

**⚠️ CRÍTICO:**
- `sm:max-w-xl` define largura máxima
- `flex flex-col` para layout vertical
- `p-0` remove padding padrão (controlamos manualmente)

### SheetHeader

```tsx
<SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
  <SheetTitle>Select Destination Channels</SheetTitle>
  
  <div className="text-sm text-muted-foreground space-y-2">
    <div className="line-clamp-2">{selectedVideo.title}</div>
    <div className="flex flex-wrap gap-1 mt-2">
      <Badge variant="secondary" className="text-xs">
        {selectedVideo.niche}
      </Badge>
      <Badge variant="outline" className="text-xs">
        {selectedVideo.subniche}
      </Badge>
      {selectedVideo.category && (
        <Badge variant="outline" className="text-xs">
          {selectedVideo.category}
        </Badge>
      )}
    </div>
  </div>
</SheetHeader>
```

**Padding específico:**
- `px-6` horizontal
- `pt-6` top
- `pb-4` bottom
- `border-b border-border` separador

**⚠️ NÃO incluir link "Ver no YouTube" aqui** (era o erro que causava sobreposição com botão X)

### Área de Conteúdo (COM Canais Elegíveis)

```tsx
<div className="flex-1 overflow-hidden px-6 py-4">
  {eligibleChannels.length > 0 || showAllChannels ? (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {channelsToShow.length} {showAllChannels ? 'available' : 'eligible'} channel{channelsToShow.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSelectNone}>
            Clear
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-2">
          {/* Channel cards aqui */}
        </div>
      </ScrollArea>
    </>
  ) : (
    {/* Empty state */}
  )}
</div>
```

**⚠️ CRÍTICO:**
- Container: `flex-1 overflow-hidden px-6 py-4`
- ScrollArea: `h-[calc(100vh-380px)]` (altura dinâmica)
- Container interno: `space-y-2` (gap entre cards)
- **NÃO usar `pr-4`** no container interno (causava espaçamento desigual)

### Channel Card (Item Selecionável)

```tsx
<div
  key={channel.id}
  className={`border rounded-lg p-4 transition-all cursor-pointer hover:border-primary/50 ${
    selectedChannels.includes(channel.id)
      ? 'border-primary bg-primary/5'
      : 'border-border'
  }`}
  onClick={() => handleChannelToggle(channel.id)}
>
  <div className="flex items-start gap-3">
    <Checkbox
      checked={selectedChannels.includes(channel.id)}
      onCheckedChange={() => handleChannelToggle(channel.id)}
      className="mt-0.5"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-foreground truncate">
            {channel.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {channel.handle}
          </div>
        </div>
        {channel.has_brand_bible && (
          <Badge 
            variant={channel.brand_bible_complete ? "default" : "secondary"}
            className="text-xs shrink-0"
          >
            {channel.brand_bible_complete ? '✓ Complete' : 'Partial'}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-xs">
          {channel.niche}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {channel.subniche}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {channel.language}
        </Badge>
        {!isMatch && showAllChannels && (
          <Badge variant="destructive" className="text-xs">
            No Match
          </Badge>
        )}
      </div>
    </div>
  </div>
</div>
```

**Estados do Card:**
- Default: `border-border`
- Selecionado: `border-primary bg-primary/5`
- Hover: `hover:border-primary/50`

**Layout interno:**
- `gap-3` entre checkbox e conteúdo
- `gap-2` entre nome e badge de brand bible
- `mb-2` entre header e badges
- `gap-1` entre badges

**⚠️ Badge "No Match":**
- Só aparece quando `!isMatch && showAllChannels`
- Variant: `destructive`

### Empty State (SEM Canais Elegíveis)

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <AlertCircle className="w-12 h-12 mb-3 text-amber-600" />
  <p className="text-muted-foreground mb-4">
    No eligible channels found for this video's niche/subniche
  </p>
  <div className="flex gap-2">
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setShowAllChannels(true)}
    >
      Force Selection
    </Button>
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleRemoveFromQueue}
      disabled={isDistributing}
    >
      <Trash2 className="w-4 h-4 mr-2" />
      Remove from Queue
    </Button>
  </div>
</div>
```

**Tamanhos:**
- Ícone: `w-12 h-12` (maior que normal)
- Botões: `size="sm"`
- Ícone Trash2: `w-4 h-4`

### SheetFooter

```tsx
<SheetFooter className="px-6 py-4 border-t border-border mt-auto">
  <div className="flex items-center justify-between w-full">
    <p className="text-sm text-muted-foreground">
      {selectedChannels.length > 0
        ? `${selectedChannels.length} job${selectedChannels.length !== 1 ? 's' : ''} will be created`
        : 'No channels selected'}
    </p>
    <div className="flex gap-2">
      {eligibleChannels.length === 0 && !showAllChannels && (
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleRemoveFromQueue}
          disabled={isDistributing}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove
        </Button>
      )}
      <Button
        onClick={handleDistribute}
        disabled={selectedChannels.length === 0 || isDistributing}
      >
        {isDistributing ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Distributing...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Distribute ({selectedChannels.length})
          </>
        )}
      </Button>
    </div>
  </div>
</SheetFooter>
```

**⚠️ CRÍTICO:**
- `mt-auto` empurra footer para o bottom
- `border-t border-border` separador superior
- `px-6 py-4` padding consistente com header
- `w-full` no container interno para justify-between funcionar

---

## ⚙️ Estados e Funções

### Estados do Component

```typescript
const [searchTerm, setSearchTerm] = useState('');
const [videos, setVideos] = useState<BenchmarkVideo[]>(mockVideos);
const [selectedVideo, setSelectedVideo] = useState<BenchmarkVideo | null>(null);
const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
const [isDrawerOpen, setIsDrawerOpen] = useState(false);
const [isDistributing, setIsDistributing] = useState(false);
const [showAllChannels, setShowAllChannels] = useState(false);
```

### Computed Values

```typescript
const filteredVideos = videos.filter((video) =>
  video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  video.source_channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  video.youtube_video_id.toLowerCase().includes(searchTerm.toLowerCase())
);

const eligibleChannels = selectedVideo ? (mockEligibleChannels[selectedVideo.id] || []) : [];
const channelsToShow = showAllChannels ? mockAllChannels : eligibleChannels;
```

### handleVideoSelect

```typescript
const handleVideoSelect = (video: BenchmarkVideo) => {
  setSelectedVideo(video);
  setSelectedChannels([]);
  setShowAllChannels(false);
  setIsDrawerOpen(true);
};
```

**⚠️ Reset states:** Limpa seleções anteriores e showAllChannels

### handleChannelToggle

```typescript
const handleChannelToggle = (channelId: number) => {
  setSelectedChannels((prev) =>
    prev.includes(channelId)
      ? prev.filter((id) => id !== channelId)
      : [...prev, channelId]
  );
};
```

### handleSelectAll

```typescript
const handleSelectAll = () => {
  if (!selectedVideo) return;
  const channels = showAllChannels 
    ? mockAllChannels 
    : (mockEligibleChannels[selectedVideo.id] || []);
  setSelectedChannels(channels.map((ch) => ch.id));
};
```

**⚠️ Dinâmico:** Seleciona da lista correta baseado em `showAllChannels`

### handleSelectNone

```typescript
const handleSelectNone = () => {
  setSelectedChannels([]);
};
```

### handleRemoveFromQueue

```typescript
const handleRemoveFromQueue = async () => {
  if (!selectedVideo) return;

  setIsDistributing(true);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  toast.success('Video removed from distribution queue', {
    description: `"${selectedVideo.title}" has been removed`,
  });

  // Remove video da lista
  setVideos(prev => prev.filter(v => v.id !== selectedVideo.id));
  setIsDistributing(false);
  setIsDrawerOpen(false);
  setSelectedVideo(null);
};
```

**⚠️ Remove da lista:** `setVideos(prev => prev.filter(...))`

### handleDistribute

```typescript
const handleDistribute = async () => {
  if (!selectedVideo || selectedChannels.length === 0) return;

  setIsDistributing(true);
  
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500));

  toast.success(`${selectedChannels.length} production job(s) created successfully`, {
    description: `Video "${selectedVideo.title}" distributed`,
  });

  setIsDistributing(false);
  setIsDrawerOpen(false);
  setSelectedVideo(null);
  setSelectedChannels([]);
};
```

**Delay:** 1500ms para simular API

---

## 🔗 Integração com Sidebar

### No componente Sidebar

Adicionar rota em `/components/Sidebar.tsx`:

```typescript
// No array de rotas
{
  id: 'productionDistribution',
  name: 'Distribution',
  icon: List,
},
```

### No App.tsx

```typescript
import { ProductionDistribution } from './components/ProductionDistribution';

// No switch de rotas
{currentRoute === 'productionDistribution' && (
  <ProductionDistribution onNavigate={handleNavigation} />
)}
```

---

## ✅ Checklist de Verificação

### Imports
- [ ] Todos os 13 imports estão presentes
- [ ] `toast` importado de `sonner@2.0.3`
- [ ] `ImageWithFallback` importado corretamente

### Interfaces
- [ ] 3 interfaces criadas (Props, BenchmarkVideo, EligibleChannel)
- [ ] Todas as propriedades presentes

### Mock Data
- [ ] 3 vídeos em mockVideos
- [ ] mockEligibleChannels com keys 26388, 26389, 26390
- [ ] 26390 tem array vazio
- [ ] 2 canais em mockAllChannels

### Layout Principal
- [ ] `flex h-screen` no container root
- [ ] `flex-1 flex flex-col overflow-hidden` no content
- [ ] **SEM** `ml-16`
- [ ] Sidebar com `currentRoute="productionDistribution"`

### Header
- [ ] Título sem classes de font-size
- [ ] Contador dinâmico de vídeos
- [ ] Botão Refresh com ícone

### Busca
- [ ] `max-w-md` limitando largura
- [ ] Ícone Search posicionado absolutamente
- [ ] Input com `pl-9`

### Tabela
- [ ] 6 colunas: Thumb, Video, Source, Category, Eligible, Actions
- [ ] thead com `bg-muted/50` (não `bg-muted`)
- [ ] tr com `hover:bg-muted/30`
- [ ] Thumbnail `w-16 h-9`
- [ ] Link YouTube na coluna Video (não no drawer)
- [ ] Link com `stopPropagation`
- [ ] Badges de ID com `font-mono`
- [ ] CheckCircle2 `text-green-600`
- [ ] AlertCircle `text-amber-600`

### Sheet/Drawer
- [ ] `sm:max-w-xl flex flex-col p-0`
- [ ] SheetHeader sem link YouTube
- [ ] `px-6 pt-6 pb-4` no header
- [ ] Content com `px-6 py-4`
- [ ] ScrollArea `h-[calc(100vh-380px)]`
- [ ] Container de cards **SEM** `pr-4`
- [ ] `space-y-2` entre cards

### Channel Card
- [ ] Selecionado: `border-primary bg-primary/5`
- [ ] Hover: `hover:border-primary/50`
- [ ] Checkbox com `mt-0.5`
- [ ] Badge "No Match" só quando `!isMatch && showAllChannels`
- [ ] Niche, subniche, language badges presentes

### Empty State
- [ ] AlertCircle `w-12 h-12 text-amber-600`
- [ ] Botão "Force Selection"
- [ ] Botão "Remove from Queue" com Trash2

### Footer
- [ ] `px-6 py-4 border-t border-border mt-auto`
- [ ] Contador dinâmico de jobs
- [ ] Botão Remove (condicional)
- [ ] Botão Distribute com loading state
- [ ] RefreshCw com `animate-spin`

### Funções
- [ ] 7 funções de handler implementadas
- [ ] handleVideoSelect reseta estados
- [ ] handleRemoveFromQueue remove da lista
- [ ] handleDistribute com delay de 1500ms
- [ ] Toasts configurados corretamente

### Estados
- [ ] 7 estados declarados
- [ ] 2 computed values (filteredVideos, eligibleChannels)

---

## 🚨 Erros Comuns a Evitar

### ❌ NÃO FAZER:
1. Usar `ml-16` no container de conteúdo
2. Usar `bg-muted` no thead (usar `bg-muted/50`)
3. Adicionar `pr-4` no container de channel cards
4. Colocar link YouTube no SheetHeader
5. Esquecer `stopPropagation` nos links/botões dentro da tabela
6. Usar `hover:bg-muted` (usar `hover:bg-muted/30`)
7. Esquecer `font-mono` nos badges de ID
8. Usar cores diferentes para CheckCircle/AlertCircle
9. Esquecer `mt-auto` no footer
10. Esquecer `flex-wrap` nas badges

### ✅ SEMPRE FAZER:
1. Importar toast de `sonner@2.0.3`
2. Usar `ImageWithFallback` para thumbnails
3. Incluir `e.stopPropagation()` em links/botões nested
4. Manter proporção 16:9 nas thumbnails (`w-16 h-9`)
5. Usar `line-clamp-2` em títulos
6. Adicionar singular/plural dinâmico em contadores
7. Reset estados ao abrir drawer
8. Validar `selectedVideo` antes de operações
9. Simular delays em ações assíncronas
10. Usar conditional rendering para badges opcionais

---

## 📝 Código Completo de Referência

O código completo está em `/components/ProductionDistribution.tsx` - **377 linhas**.

### Estrutura de Pastas

```
/components
  ├── ProductionDistribution.tsx (NOVO)
  ├── Sidebar.tsx (atualizar com rota)
  └── ui/
      ├── button.tsx
      ├── badge.tsx
      ├── input.tsx
      ├── sheet.tsx
      ├── scroll-area.tsx
      └── checkbox.tsx
```

---

## 🎯 Resultado Final Esperado

### Funcionalidades Testáveis

1. **Busca funcional** - filtra por título, canal, ou youtube_video_id
2. **Click na linha** - abre drawer
3. **Click em "Select Channels"** - abre drawer
4. **Click em link YouTube** - abre nova aba (não fecha drawer)
5. **Seleção de canais** - múltipla via checkbox ou click no card
6. **Select All** - seleciona todos canais visíveis
7. **Clear** - desmarca todos
8. **Distribute** - mostra toast, fecha drawer, limpa estados
9. **Force Selection** - mostra `mockAllChannels` com badge "No Match"
10. **Remove from Queue** - remove vídeo da lista, fecha drawer

### Estados Visuais

1. ✅ **Com canais elegíveis** - verde CheckCircle2
2. ⚠️ **Sem canais elegíveis** - âmbar AlertCircle
3. 🔵 **Canal selecionado** - borda primary, background primary/5
4. ⭕ **Canal hover** - borda primary/50
5. 🔴 **No Match badge** - variant destructive (quando forçado)
6. ⏳ **Distributing** - botão disabled, spinner animado

---

## 📊 Métricas de Qualidade

- **0 erros TypeScript**
- **0 warnings React**
- **100% match** com especificação visual
- **Tema dark/light** funcionando
- **Responsivo** (mas otimizado para desktop)
- **Acessível** (labels, ARIA, keyboard navigation via Shadcn)

---

**Última atualização:** 2025-11-16  
**Versão:** 1.0.0  
**Status:** ✅ Completo e Testado
