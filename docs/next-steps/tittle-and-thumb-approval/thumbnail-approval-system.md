# Sistema de Aprovação de Thumbnails - Documentação Técnica

## Visão Geral
Sistema de aprovação de thumbnails geradas automaticamente pelo Claude, com interface split-screen para comparação lado-a-lado entre thumbnail de referência (original) e thumbnail gerada.

## Estrutura de Dados

### Interface: PendingThumbnail
```typescript
interface PendingThumbnail {
  id: number;                    // ID único do item na fila
  videoId: number;               // ID do vídeo no YouTube
  channelName: string;           // Nome do canal
  channelColor: string;          // Cor hex do canal (ex: '#DC2626')
  videoTitle: string;            // Título do vídeo
  referenceThumbnail: string;    // URL da thumbnail de referência (original)
  generatedThumbnail: string;    // URL da thumbnail gerada pelo Claude (APENAS UMA)
  createdAt: string;             // ISO timestamp de criação
  status: 'pending' | 'approved' | 'rejected';
  author: string;                // Geralmente 'AI Agent'
}
```

**IMPORTANTE**: Diferente do sistema antigo, agora `generatedThumbnail` é uma **string única** (não array), pois o Claude gera APENAS UMA thumbnail por vez.

### Interface: ApprovalHistoryThumbnail
```typescript
interface ApprovalHistoryThumbnail {
  id: number;
  itemId: number;                    // ID do PendingThumbnail original
  videoId: number;
  channelName: string;
  channelColor: string;
  videoTitle: string;
  referenceThumbnail: string;
  selectedThumbnailUrl: string;      // URL da thumbnail aprovada (vazio se rejeitado)
  status: 'approved' | 'rejected';
  approvedAt: string;                // ISO timestamp da aprovação/rejeição
  approvedBy: string;                // Usuário que aprovou (ex: 'You')
  autoApproved: boolean;             // Se foi aprovado automaticamente
}
```

## Layout da Interface

### Estrutura Geral (Split-Screen)
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Approval Queue 2                    [Pending|History]│
│                                             [Auto-Approve ⚡] │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                             │
│  LEFT PANEL     │         RIGHT PANEL (Main Area)            │
│  (384px)        │         (flex-1)                           │
│                 │                                             │
│ ┌─────────────┐ │  ┌─────────────────────────────────────┐  │
│ │[Titles|Thumb]│ │  │   Título do Vídeo: ...              │  │
│ └─────────────┘ │  │   Video ID: 103                     │  │
│                 │  └─────────────────────────────────────┘  │
│ ┌─────────────┐ │                                           │
│ │   Search    │ │  ┌──────────────┬──────────────────────┐ │
│ └─────────────┘ │  │              │                      │ │
│                 │  │  REFERÊNCIA  │  GERADA (Claude)     │ │
│ ┌─────────────┐ │  │  (Original)  │  [⭐ Sparkles]       │ │
│ │             │ │  │              │                      │ │
│ │ Thumbnail 1 │ │  │  [16:9 img]  │  [16:9 img]         │ │
│ │ [selected]  │ │  │              │  [Hover: Preview]    │ │
│ │             │ │  │              │                      │ │
│ └─────────────┘ │  └──────────────┴──────────────────────┘ │
│                 │                                           │
│ ┌─────────────┐ │  ┌─────────────────────────────────────┐ │
│ │             │ │  │ 💡 Dica: Clique em "Reprovar e      │ │
│ │ Thumbnail 2 │ │  │    Regerar" para gerar nova versão  │ │
│ │             │ │  └─────────────────────────────────────┘ │
│ └─────────────┘ │                                           │
│                 │                                             │
└─────────────────┴─────────────────────────────────────────┬─┤
                  │  [Reprovar e Regerar] [Aprovar & Next]   │
                  └──────────────────────────────────────────┘
```

## Painel Esquerdo: Lista de Thumbnails Pendentes

### Tabs no Topo
- **Titles**: Aprovação de títulos
- **Thumbnails**: Aprovação de thumbnails (aba ativa)
  - Badge com contador de pendentes

### Campo de Busca
- Filtra por `videoTitle` ou `channelName`
- Ícone de filtro à esquerda
- Placeholder: "Search..."

### Cards de Thumbnail na Lista
Cada card mostra:
```tsx
<button className="w-full p-3 rounded-lg">
  {/* Thumbnail de referência pequena */}
  <img src={referenceThumbnail} className="aspect-video rounded" />
  
  {/* Badges informativos */}
  <Badge>{channelName}</Badge>
  <Badge>ID: {videoId}</Badge>
  <Badge><Clock /> {timeAgo}</Badge>
  
  {/* Título do vídeo */}
  <p className="line-clamp-2">{videoTitle}</p>
</button>
```

**Estado de seleção**:
- Selecionado: `bg-accent border-2 border-primary`
- Não selecionado: `bg-muted/30 hover:bg-muted/50`

## Painel Direito: Área de Aprovação (Main Area)

### Seção 1: Informações do Vídeo
```tsx
<div className="bg-muted/30 border p-3 rounded-lg">
  <p className="text-xs uppercase">Título do Vídeo</p>
  <Badge>Video ID: {videoId}</Badge>
  <p className="text-sm font-medium">{videoTitle}</p>
</div>
```

### Seção 2: Comparação Lado-a-Lado (Grid 2 Colunas)

#### Coluna 1: Thumbnail de Referência
```tsx
<div>
  <div className="flex items-center gap-2 mb-3">
    <p className="text-xs uppercase text-muted-foreground">
      Referência (Original)
    </p>
  </div>
  <div className="aspect-video rounded-lg border-2 border-border">
    <img 
      src={referenceThumbnail}
      className="w-full h-full object-cover"
    />
  </div>
</div>
```

#### Coluna 2: Thumbnail Gerada pelo Claude
```tsx
<div>
  <div className="flex items-center gap-2 mb-3">
    <Sparkles className="text-yellow-600" />
    <p className="text-xs uppercase text-yellow-700">
      Gerada pelo Claude
    </p>
  </div>
  <div className="aspect-video rounded-lg border-2 border-primary group">
    <img 
      src={generatedThumbnail}
      className="w-full h-full object-cover"
    />
    
    {/* Overlay com botão de preview ao hover */}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40">
      <Button onClick={() => setPreviewUrl(generatedThumbnail)}>
        <Maximize2 /> Visualizar Ampliado
      </Button>
    </div>
  </div>
</div>
```

**Características importantes**:
- Layout em grid 2 colunas (`grid grid-cols-2 gap-6`)
- Ambas as thumbnails mantêm proporção 16:9 (`aspect-video`)
- Thumbnail gerada tem borda primária (`border-primary`) para destacar
- Botão de preview aparece apenas no hover da thumbnail gerada
- Ícone Sparkles ⭐ indica que é gerada pelo Claude

### Seção 3: Dica Informativa
```tsx
<div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
  <p className="text-xs text-blue-700">
    <span className="font-medium">Dica:</span> 
    Se a thumbnail gerada não atender às expectativas, 
    clique em "Reprovar e Regerar" para gerar uma nova versão.
  </p>
</div>
```

## Barra de Ações (Action Bar)

Fixa no bottom da área principal:

### Para Thumbnails
```tsx
<div className="border-t bg-card p-4">
  <div className="max-w-4xl mx-auto flex justify-between">
    {/* Status text */}
    <span className="text-sm text-muted-foreground">
      Ready to approve or regenerate
    </span>
    
    {/* Botões */}
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleRejectAndRegenerate}>
        <XCircle /> Reprovar e Regerar
      </Button>
      <Button onClick={handleApprove}>
        <CheckCircle2 /> Aprovar & Next
      </Button>
    </div>
  </div>
</div>
```

**IMPORTANTE**: Diferente de títulos, thumbnails NÃO precisam de seleção prévia, pois só há uma opção.

## Funcionalidades

### 1. Aprovar Thumbnail
```typescript
const handleApproveThumbnail = () => {
  const currentItem = mockPendingThumbnails.find(t => t.id === selectedItemId);
  if (!currentItem) return;
  
  // Adiciona ao histórico
  const historyEntry: ApprovalHistoryThumbnail = {
    id: Date.now(),
    itemId: currentItem.id,
    videoId: currentItem.videoId,
    channelName: currentItem.channelName,
    channelColor: currentItem.channelColor,
    videoTitle: currentItem.videoTitle,
    referenceThumbnail: currentItem.referenceThumbnail,
    selectedThumbnailUrl: currentItem.generatedThumbnail,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: 'You',
    autoApproved: autoApprovalThumbnails
  };
  setThumbnailHistory(prev => [historyEntry, ...prev]);
  
  // Remove da lista
  setRemovedThumbnailIds(prev => new Set([...prev, selectedItemId]));
  
  // Move para próximo item
  const currentIndex = filteredThumbnails.findIndex(t => t.id === selectedItemId);
  if (currentIndex < filteredThumbnails.length - 1) {
    setSelectedItemId(filteredThumbnails[currentIndex + 1].id);
  } else if (currentIndex > 0) {
    setSelectedItemId(filteredThumbnails[currentIndex - 1].id);
  } else {
    setSelectedItemId(null);
  }
};
```

### 2. Reprovar e Regerar Thumbnail
```typescript
const handleRejectAndRegenerateThumbnail = () => {
  const currentItem = mockPendingThumbnails.find(t => t.id === selectedItemId);
  if (!currentItem) return;
  
  // Adiciona ao histórico com selectedThumbnailUrl vazio
  const historyEntry: ApprovalHistoryThumbnail = {
    id: Date.now(),
    itemId: currentItem.id,
    videoId: currentItem.videoId,
    channelName: currentItem.channelName,
    channelColor: currentItem.channelColor,
    videoTitle: currentItem.videoTitle,
    referenceThumbnail: currentItem.referenceThumbnail,
    selectedThumbnailUrl: '', // Vazio = rejeitado
    status: 'rejected',
    approvedAt: new Date().toISOString(),
    approvedBy: 'You',
    autoApproved: false
  };
  setThumbnailHistory(prev => [historyEntry, ...prev]);
  
  console.log(`Rejected thumbnail for item ${selectedItemId} - Regenerating...`);
  
  // Remove da lista (API regenerará automaticamente)
  setRemovedThumbnailIds(prev => new Set([...prev, selectedItemId]));
  
  // Move para próximo item
  // ... mesmo código de navegação
};
```

### 3. Preview Ampliado (Modal)
```tsx
<Dialog open={!!previewThumbnailUrl} onOpenChange={(open) => !open && setPreviewThumbnailUrl(null)}>
  <DialogContent className="max-w-7xl w-[90vw]">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Maximize2 className="w-5 h-5" />
        Thumbnail Preview
      </DialogTitle>
      <DialogDescription>
        Full-size preview of the thumbnail.
      </DialogDescription>
    </DialogHeader>
    <div className="w-full aspect-video rounded-lg border overflow-hidden bg-black">
      {previewThumbnailUrl && (
        <img 
          src={previewThumbnailUrl}
          alt="Full preview"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  </DialogContent>
</Dialog>
```

**Características do preview**:
- Modal com 90% da largura da tela (`w-[90vw]`)
- Máximo de `max-w-7xl` para telas muito grandes
- Mantém proporção 16:9 (`aspect-video`)
- Fundo preto para destacar a thumbnail
- `object-cover` para preencher sem distorcer

## Estados da Interface

### States Principais
```typescript
const [activeTab, setActiveTab] = useState('titles'); // 'titles' | 'thumbnails'
const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
const [selectedItemId, setSelectedItemId] = useState<number | null>(1);
const [autoApprovalThumbnails, setAutoApprovalThumbnails] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [previewThumbnailUrl, setPreviewThumbnailUrl] = useState<string | null>(null);
const [removedThumbnailIds, setRemovedThumbnailIds] = useState<Set<number>>(new Set());
const [thumbnailHistory, setThumbnailHistory] = useState<ApprovalHistoryThumbnail[]>([]);
```

### Computed Values
```typescript
const filteredThumbnails = mockPendingThumbnails
  .filter(item => !removedThumbnailIds.has(item.id))
  .filter(item =>
    item.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

const selectedThumbnailItem = activeTab === 'thumbnails' 
  ? mockPendingThumbnails.find(t => t.id === selectedItemId) 
  : null;

const pendingThumbnailsCount = mockPendingThumbnails
  .filter(t => t.status === 'pending').length;
```

## Comportamento de Auto-Aprovação

Quando `autoApprovalThumbnails` está ativado:
1. O campo `autoApproved: true` é marcado no histórico
2. A aprovação ainda requer clique manual no botão
3. É usado apenas para tracking/auditoria

## Integração com API (Futuro)

### Endpoint: POST /api/thumbnails/approve
```typescript
{
  itemId: number;
  videoId: number;
  action: 'approve' | 'reject';
  selectedThumbnailUrl?: string; // Apenas se aprovado
}
```

### Endpoint: POST /api/thumbnails/regenerate
```typescript
{
  itemId: number;
  videoId: number;
  referenceThumbnailUrl: string;
  videoTitle: string;
}
```

## Exemplo de Mock Data
```typescript
const mockPendingThumbnails: PendingThumbnail[] = [
  {
    id: 1,
    videoId: 103,
    channelName: 'DramatizeMe',
    channelColor: '#DC2626',
    videoTitle: "On Father's Day, My CEO Son Asked...",
    referenceThumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop',
    generatedThumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
    createdAt: '2025-11-23T12:00:00',
    status: 'pending',
    author: 'AI Agent'
  },
  {
    id: 2,
    videoId: 104,
    channelName: 'DramatizeMe',
    channelColor: '#DC2626',
    videoTitle: "Homeless Girl Shares Her Bread With Mean Vendor",
    referenceThumbnail: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&h=450&fit=crop',
    generatedThumbnail: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=450&fit=crop',
    createdAt: '2025-11-23T11:30:00',
    status: 'pending',
    author: 'AI Agent'
  }
];
```

## Diferenças entre Aprovação de Títulos vs Thumbnails

| Aspecto | Títulos | Thumbnails |
|---------|---------|------------|
| **Opções** | 11 opções (1 principal + 10 alternativas) | 1 única thumbnail |
| **Seleção** | Radio buttons, requer seleção | Não requer seleção |
| **Botão Rejeitar** | "Reject" (remove da fila) | "Reprovar e Regerar" (gera nova) |
| **Layout** | Lista vertical de opções | Grid 2 colunas (lado-a-lado) |
| **Preview** | Não possui | Modal ampliado ao clicar |
| **Análise AI** | Mostra emoção + rationale + fidelity | Não mostra análise |
| **Fórmula** | Mostra fórmula do título | Não possui fórmula |

## Tailwind Classes Importantes

### Cores e Temas
- `bg-muted/30` - Fundo suave para cards
- `border-border` - Borda padrão
- `border-primary` - Borda destacada (thumbnail gerada)
- `text-muted-foreground` - Texto secundário
- `text-yellow-600 dark:text-yellow-500` - Ícone Sparkles

### Layout
- `aspect-video` - Proporção 16:9
- `grid grid-cols-2 gap-6` - Grid de 2 colunas
- `w-96` - Largura fixa do painel esquerdo (384px)
- `flex-1` - Painel direito ocupa resto do espaço

### Interatividade
- `group` + `group-hover:opacity-100` - Efeitos ao hover
- `transition-all` - Animações suaves
- `cursor-pointer` - Indica clicável

## Fluxo Completo de Uso

1. **Usuário seleciona a aba "Thumbnails"**
   - Lista carrega thumbnails pendentes
   - Primeiro item é auto-selecionado

2. **Visualiza comparação lado-a-lado**
   - Thumbnail original (esquerda)
   - Thumbnail gerada (direita com destaque)

3. **Decide a ação**:
   - **Opção A**: Clica em "Aprovar & Next"
     - Thumbnail é marcada como aprovada
     - Move automaticamente para próxima
   - **Opção B**: Clica em "Reprovar e Regerar"
     - Thumbnail é marcada como rejeitada
     - Sistema dispara regeneração automática
     - Move para próxima
   - **Opção C**: Clica em "Visualizar Ampliado"
     - Abre modal com preview grande (90vw)
     - Mantém proporção 16:9
     - Pode fechar e continuar aprovação

4. **Processo se repete** até fila estar vazia

5. **Consulta histórico**
   - Clica em aba "History" no header
   - Vê todas as aprovações/rejeições

## Arquivos Relacionados

- `/components/ProductionApprovalQueue2.tsx` - Componente principal
- `/components/ApprovalHistory.tsx` - Componente de histórico
- `/components/ui/dialog.tsx` - Modal de preview
- `/components/ui/badge.tsx` - Badges informativos
- `/components/ui/button.tsx` - Botões de ação

## Melhorias Futuras

1. **Keyboard Shortcuts**
   - `A` = Approve
   - `R` = Reject & Regenerate
   - `Space` = Preview
   - `←/→` = Navigate

2. **Batch Actions**
   - Aprovar múltiplas de uma vez
   - Filtrar por canal

3. **AI Confidence Score**
   - Mostrar score de confiança do Claude
   - Indicar se está "muito próxima" da referência

4. **Comparação A/B**
   - Slider para comparar lado-a-lado
   - Highlight de diferenças visuais

5. **Métricas de Performance**
   - Taxa de aprovação
   - Tempo médio de aprovação
   - Quantas regenerações foram necessárias
