# Instruções Completas: Approval Queue 2 (Split-Screen View)

## 📋 Visão Geral

Criar uma tela de aprovação de títulos e thumbnails gerados por IA com layout **split-screen**: coluna esquerda com lista de items e coluna direita com detalhes inline para aprovação. A tela possui **modo Pending** (fila de aprovações) e **modo History** (histórico de aprovações/rejeições).

## 🎯 Requisitos Funcionais

### 1. Estrutura Principal
- **Sidebar fixa** à esquerda (componente `<Sidebar>` padrão da plataforma)
- **Header fixo** com título, badges e controles
- **Layout Split-Screen**:
  - **Coluna Esquerda** (384px): Lista de items com scroll independente
  - **Coluna Direita** (flex-1): Detalhes e aprovação com scroll independente

### 2. Modos de Visualização (View Modes)

#### Modo "Pending" (Padrão)
- Exibe fila de items aguardando aprovação
- Sidebar esquerda mostra lista de items filtráveis
- Painel direito mostra detalhes do item selecionado + controles de aprovação
- Toggle "Auto-Approve" visível no header

#### Modo "History"
- Exibe histórico de items já aprovados/rejeitados
- Sidebar esquerda continua com tabs de Titles/Thumbnails
- Painel direito mostra cards de histórico em formato timeline
- Toggle "Auto-Approve" **oculto** (não faz sentido no histórico)

### 3. Tabs de Conteúdo
- **Titles**: Aprovação de títulos gerados por IA
- **Thumbnails**: Aprovação de thumbnails geradas por IA
- Tabs ficam **no topo da sidebar esquerda** (não no painel direito)
- Ao trocar tab: auto-seleciona primeiro item da nova lista

### 4. Funcionalidades de Aprovação

#### Para Titles:
1. Exibir título de referência (benchmark)
2. Exibir fórmula aplicada
3. Exibir título principal sugerido com análise (emoção + racional)
4. Exibir 10 alternativas (total 11 opções)
5. Usuário seleciona 1 opção via radio button
6. Botão "Approve & Next": salva no histórico + remove da fila + avança para próximo
7. Botão "Reject": salva no histórico como rejeitado + remove da fila + avança

#### Para Thumbnails:
1. Exibir thumbnail de referência (grande, centralizada)
2. Exibir 4 thumbnails geradas em grid 2x2
3. Badge "AI Pick" na thumbnail recomendada pelo Claude
4. Hover mostra botão "Preview" para ver em tamanho maior (modal)
5. Usuário seleciona 1 thumbnail via radio button
6. Botão "Approve & Next": salva no histórico + remove da fila + avança
7. Botão "Reject": salva no histórico como rejeitado + remove da fila + avança

### 5. Navegação e Seleção
- Primeiro item sempre auto-selecionado ao entrar na tela
- Ao aprovar/rejeitar: auto-avança para próximo item da lista
- Se não houver próximo: tenta item anterior
- Se for o último: limpa seleção e mostra empty state
- Items aprovados/rejeitados **somem da fila imediatamente**

### 6. Histórico de Aprovações
- Lista cronológica (mais recente primeiro)
- Cards visuais com:
  - Ícone de status (✓ verde para aprovado, ✗ vermelho para rejeitado)
  - Badge do canal (com cor personalizada)
  - Badge de status (Approved/Rejected)
  - Badge "Auto" se foi auto-aprovação
  - Data/hora (formato "Nov 23, 2:30 PM" + "2h ago")
  - Usuário que aprovou
  - **Para Titles aprovados**: mostra opção selecionada destacada
  - **Para Thumbnails aprovados**: mostra comparação lado a lado (ref vs selecionada)
  - **Para rejeitados**: não mostra a escolha (pois não houve)

## 🏗️ Estrutura de Arquivos

```
/components/
  ├── ProductionApprovalQueue2.tsx  (componente principal)
  ├── ApprovalHistory.tsx           (componente de histórico separado)
  └── Sidebar.tsx                    (sidebar padrão da plataforma)
```

## 📦 Componente 1: `/components/ProductionApprovalQueue2.tsx`

### Imports Necessários
```tsx
import { useState } from 'react';
import { 
  CheckCircle2, XCircle, Sparkles, FileText, Image as ImageIcon, 
  Clock, User, AlertCircle, Brain, Target, Maximize2, Filter, History 
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Sidebar } from './Sidebar';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { ApprovalHistory } from './ApprovalHistory';
```

### Interfaces TypeScript

```tsx
interface TitleAlternative {
  text: string;
}

interface TitleAnalysis {
  emotional: string;
  rationale: string;
}

interface TitleOriginal {
  formula: string;
}

interface GeneratedTitle {
  title: string;
  alternatives: TitleAlternative[];
  analysis: TitleAnalysis;
  original: TitleOriginal;
}

interface PendingTitle {
  id: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  referenceTitle: string;
  generatedData: GeneratedTitle;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  author: string;
}

interface GeneratedThumbnail {
  id: number;
  url: string;
  isClaudePick: boolean;
  prompt?: string;
}

interface PendingThumbnail {
  id: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  videoTitle: string;
  referenceThumbnail: string;
  generatedThumbnails: GeneratedThumbnail[];
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  author: string;
}

interface ApprovalHistoryTitle {
  id: number;
  itemId: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  referenceTitle: string;
  selectedOption: string;
  selectedIndex: number;
  status: 'approved' | 'rejected';
  approvedAt: string;
  approvedBy: string;
  autoApproved: boolean;
}

interface ApprovalHistoryThumbnail {
  id: number;
  itemId: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  videoTitle: string;
  referenceThumbnail: string;
  selectedThumbnailUrl: string;
  selectedThumbnailId: number;
  status: 'approved' | 'rejected';
  approvedAt: string;
  approvedBy: string;
  autoApproved: boolean;
}

interface ProductionApprovalQueue2Props {
  onNavigate: (route: any) => void;
  isSidebarExpanded: boolean;
  onSidebarExpandedChange: (expanded: boolean) => void;
}
```

### Estados do Componente

```tsx
export function ProductionApprovalQueue2({ onNavigate, isSidebarExpanded, onSidebarExpandedChange }: ProductionApprovalQueue2Props) {
  // Navegação entre tabs
  const [activeTab, setActiveTab] = useState('titles'); // 'titles' | 'thumbnails'
  
  // Modo de visualização
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
  
  // Seleção de items
  const [selectedItemId, setSelectedItemId] = useState<number | null>(1); // Auto-seleciona primeiro item
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | undefined>(undefined);
  const [selectedThumbnailId, setSelectedThumbnailId] = useState<number | undefined>(undefined);
  
  // Auto-approval
  const [autoApprovalTitles, setAutoApprovalTitles] = useState(false);
  const [autoApprovalThumbnails, setAutoApprovalThumbnails] = useState(false);
  
  // Busca
  const [searchQuery, setSearchQuery] = useState('');
  
  // Preview de thumbnail
  const [previewThumbnailUrl, setPreviewThumbnailUrl] = useState<string | null>(null);
  
  // Items removidos (aprovados/rejeitados)
  const [removedTitleIds, setRemovedTitleIds] = useState<Set<number>>(new Set());
  const [removedThumbnailIds, setRemovedThumbnailIds] = useState<Set<number>>(new Set());
  
  // Histórico de aprovações
  const [titleHistory, setTitleHistory] = useState<ApprovalHistoryTitle[]>([]);
  const [thumbnailHistory, setThumbnailHistory] = useState<ApprovalHistoryThumbnail[]>([]);
  
  // ... resto do código
}
```

### Mock Data Completo

**Pending Titles (3 items):**

```tsx
const mockPendingTitles: PendingTitle[] = [
  {
    id: 1,
    videoId: 101,
    channelName: 'DramatizeMe',
    channelColor: '#DC2626',
    referenceTitle: 'On Mother\'s Day, My Millionaire Son Asked, "Mom, Do You Like The $6000 Clara Gives You?"',
    generatedData: {
      title: "On Father's Day, My CEO Son Asked, \"Dad, Do You Like The $8000 Marcus Sends You?\"",
      alternatives: [
        { text: "At My Retirement Party, My VP Son Asked, \"Dad, Who Paid Your $6000 Medical Bills?\"" },
        { text: "On My 70th Birthday, My Executive Son Said, \"Dad, Wasn't It Nice of Derek to Fix Your Roof?\"" },
        { text: "At Thanksgiving, My Director Son Asked, \"Dad, Do You Appreciate The $7500 Kevin Gives You?\"" },
        { text: "On Father's Day, My Manager Son Asked, \"Dad, Aren't You Grateful For What Brian Does?\"" },
        { text: "At My 65th Birthday, My Corporate Son Asked, \"Dad, Do You Thank Raymond For The $9000?\"" },
        { text: "On Father's Day, My Wealthy Son Asked, \"Dad, Does Jerome's $8000 Help With The Bills?\"" },
        { text: "At Christmas, My Executive Son Asked, \"Dad, Do You Like The $5000 Check From Wallace?\"" },
        { text: "On My Retirement Day, My CEO Son Asked, \"Dad, Did You Thank Preston For The $7000?\"" },
        { text: "On Father's Day, My VP Son Asked, \"Dad, Wasn't It Generous of Carl to Send $6000?\"" },
        { text: "At My 68th Birthday, My Director Son Asked, \"Dad, Do You Appreciate Marcus's $8000?\"" }
      ],
      analysis: {
        emotional: "Shared Outrage",
        rationale: "7/7 Fidelity Score"
      },
      original: {
        formula: "[Sacred family bond] + [Sacred holiday] + [Specific money] + [Third party revelation]"
      }
    },
    createdAt: '2025-11-23T14:30:00',
    status: 'pending',
    author: 'AI Agent'
  },
  {
    id: 2,
    videoId: 102,
    channelName: 'DramatizeMe',
    channelColor: '#DC2626',
    referenceTitle: 'Poor Boy Gives Grumpy Bus Driver His Lunch, Next Day All Passengers Stand for Him',
    generatedData: {
      title: "Homeless Girl Shares Her Bread With Mean Vendor, Next Morning Entire Market Claps For Her",
      alternatives: [
        { text: "Orphan Boy Helps Rude Shopkeeper, Next Day All Customers Stand For Him" },
        { text: "Poor Girl Feeds Angry Farmer, Next Morning Whole Village Cheers For Her" },
        { text: "Street Kid Saves Mean Teacher's Cat, Next Day Entire School Applauds Him" },
        { text: "Beggar Child Helps Cruel Boss, Next Morning All Workers Praise Her" },
        { text: "Young Cleaner Helps Mean Manager, Next Day Company Stands For Him" },
        { text: "Delivery Boy Assists Rude Client, Next Morning Whole Office Claps" },
        { text: "Poor Student Helps Mean Principal, Next Day All Students Stand For Her" },
        { text: "Homeless Teen Saves Grumpy Neighbor, Next Day Entire Street Thanks Him" },
        { text: "Young Waiter Helps Mean Chef, Next Morning Whole Restaurant Applauds" },
        { text: "Street Vendor Helps Rude Customer, Next Day All Buyers Stand For Her" }
      ],
      analysis: {
        emotional: "Heartwarming Justice",
        rationale: "6/7 Fidelity Score"
      },
      original: {
        formula: "[Underdog protagonist] + [Good deed to antagonist] + [Next day] + [Public recognition]"
      }
    },
    createdAt: '2025-11-23T13:15:00',
    status: 'pending',
    author: 'AI Agent'
  },
  {
    id: 3,
    videoId: 103,
    channelName: 'DramatizeMe',
    channelColor: '#DC2626',
    referenceTitle: 'Rich Man Mocks Poor Woman at Airport, Regrets It When He Sees Who Gets Off The Plane',
    generatedData: {
      title: "Wealthy Boss Insults Janitor at Hotel, Regrets It When He Sees Who Walks Into The Meeting",
      alternatives: [
        { text: "Arrogant CEO Mocks Cleaner at Office, Regrets It When He Discovers Her Identity" },
        { text: "Rich Passenger Ridicules Flight Attendant, Regrets It When Pilot Makes Announcement" },
        { text: "Elite Doctor Dismisses Nurse, Regrets It When He Needs Emergency Surgery" },
        { text: "Wealthy Client Insults Waiter, Regrets It When Restaurant Owner Appears" },
        { text: "Arrogant Lawyer Mocks Receptionist, Regrets It When Judge Arrives" },
        { text: "Rich Student Bullies Librarian, Regrets It When Dean Makes Introduction" },
        { text: "Wealthy Shopper Insults Cashier, Regrets It When Store Owner Steps In" },
        { text: "Arrogant Executive Dismisses Assistant, Regrets It When Board Meeting Starts" },
        { text: "Rich Traveler Mocks Tour Guide, Regrets It When Ambassador Arrives" },
        { text: "Elite Investor Insults Secretary, Regrets It When CEO Reveals Truth" }
      ],
      analysis: {
        emotional: "Karma & Justice",
        rationale: "7/7 Fidelity Score"
      },
      original: {
        formula: "[Rich antagonist] + [Mocks humble person] + [Location] + [Identity revelation]"
      }
    },
    createdAt: '2025-11-23T12:00:00',
    status: 'pending',
    author: 'AI Agent'
  }
];
```

**Pending Thumbnails (2 items):**

```tsx
const mockPendingThumbnails: PendingThumbnail[] = [
  {
    id: 1,
    videoId: 103,
    channelName: 'DramatizeMe',
    channelColor: '#DC2626',
    videoTitle: "On Father's Day, My CEO Son Asked, \"Dad, Do You Like The $8000 Marcus Sends You?\"",
    referenceThumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop',
    generatedThumbnails: [
      { id: 1, url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop', isClaudePick: true, prompt: 'Father and son emotional conversation' },
      { id: 2, url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop', isClaudePick: false, prompt: 'Family conflict moment' },
      { id: 3, url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=450&fit=crop', isClaudePick: false, prompt: 'Emotional family scene' },
      { id: 4, url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=450&fit=crop', isClaudePick: false, prompt: 'Father son dialogue' }
    ],
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
    generatedThumbnails: [
      { id: 1, url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=450&fit=crop', isClaudePick: true, prompt: 'Homeless girl sharing food' },
      { id: 2, url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=450&fit=crop', isClaudePick: false, prompt: 'Kind gesture' },
      { id: 3, url: 'https://images.unsplash.com/photo-1504197832061-98356e3dcdcf?w=800&h=450&fit=crop', isClaudePick: false, prompt: 'Act of kindness' },
      { id: 4, url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=450&fit=crop', isClaudePick: false, prompt: 'Compassion moment' }
    ],
    createdAt: '2025-11-23T11:30:00',
    status: 'pending',
    author: 'AI Agent'
  }
];
```

### Handlers de Aprovação/Rejeição

**IMPORTANTE**: Cada handler deve:
1. Buscar o item atual da lista mockada
2. Criar entrada no histórico com todos os dados
3. Adicionar ao estado de histórico (início do array)
4. Adicionar ID ao Set de removidos
5. Navegar para próximo item (ou anterior, ou limpar seleção)
6. Resetar seleção específica (selectedTitleIndex ou selectedThumbnailId)

```tsx
const handleApproveTitle = () => {
  if (selectedTitleIndex === undefined) {
    alert('Please select a title first');
    return;
  }
  
  const currentItem = mockPendingTitles.find(t => t.id === selectedItemId);
  if (!currentItem) return;
  
  const selectedOption = getAllTitleOptions(currentItem)[selectedTitleIndex];
  
  // Add to history
  const historyEntry: ApprovalHistoryTitle = {
    id: Date.now(),
    itemId: currentItem.id,
    videoId: currentItem.videoId,
    channelName: currentItem.channelName,
    channelColor: currentItem.channelColor,
    referenceTitle: currentItem.referenceTitle,
    selectedOption: selectedOption.text,
    selectedIndex: selectedTitleIndex,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: 'You',
    autoApproved: autoApprovalTitles
  };
  setTitleHistory(prev => [historyEntry, ...prev]);
  
  // Remove from list
  if (selectedItemId) {
    setRemovedTitleIds(prev => new Set([...prev, selectedItemId]));
  }
  
  // Move to next item or clear selection
  const currentIndex = filteredTitles.findIndex(t => t.id === selectedItemId);
  if (currentIndex < filteredTitles.length - 1) {
    setSelectedItemId(filteredTitles[currentIndex + 1].id);
  } else if (currentIndex > 0) {
    setSelectedItemId(filteredTitles[currentIndex - 1].id);
  } else {
    setSelectedItemId(null);
  }
  setSelectedTitleIndex(undefined);
};

const handleRejectTitle = () => {
  const currentItem = mockPendingTitles.find(t => t.id === selectedItemId);
  if (!currentItem) return;
  
  // Add to history
  const historyEntry: ApprovalHistoryTitle = {
    id: Date.now(),
    itemId: currentItem.id,
    videoId: currentItem.videoId,
    channelName: currentItem.channelName,
    channelColor: currentItem.channelColor,
    referenceTitle: currentItem.referenceTitle,
    selectedOption: '',
    selectedIndex: -1,
    status: 'rejected',
    approvedAt: new Date().toISOString(),
    approvedBy: 'You',
    autoApproved: false
  };
  setTitleHistory(prev => [historyEntry, ...prev]);
  
  // Remove from list
  if (selectedItemId) {
    setRemovedTitleIds(prev => new Set([...prev, selectedItemId]));
  }
  
  // Move to next item or clear selection
  const currentIndex = filteredTitles.findIndex(t => t.id === selectedItemId);
  if (currentIndex < filteredTitles.length - 1) {
    setSelectedItemId(filteredTitles[currentIndex + 1].id);
  } else if (currentIndex > 0) {
    setSelectedItemId(filteredTitles[currentIndex - 1].id);
  } else {
    setSelectedItemId(null);
  }
  setSelectedTitleIndex(undefined);
};

const handleApproveThumbnail = () => {
  if (!selectedThumbnailId) {
    alert('Please select a thumbnail first');
    return;
  }
  
  const currentItem = mockPendingThumbnails.find(t => t.id === selectedItemId);
  if (!currentItem) return;
  
  const selectedThumbnail = currentItem.generatedThumbnails.find(t => t.id === selectedThumbnailId);
  if (!selectedThumbnail) return;
  
  // Add to history
  const historyEntry: ApprovalHistoryThumbnail = {
    id: Date.now(),
    itemId: currentItem.id,
    videoId: currentItem.videoId,
    channelName: currentItem.channelName,
    channelColor: currentItem.channelColor,
    videoTitle: currentItem.videoTitle,
    referenceThumbnail: currentItem.referenceThumbnail,
    selectedThumbnailUrl: selectedThumbnail.url,
    selectedThumbnailId: selectedThumbnail.id,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: 'You',
    autoApproved: autoApprovalThumbnails
  };
  setThumbnailHistory(prev => [historyEntry, ...prev]);
  
  // Remove from list
  if (selectedItemId) {
    setRemovedThumbnailIds(prev => new Set([...prev, selectedItemId]));
  }
  
  // Move to next item or clear selection
  const currentIndex = filteredThumbnails.findIndex(t => t.id === selectedItemId);
  if (currentIndex < filteredThumbnails.length - 1) {
    setSelectedItemId(filteredThumbnails[currentIndex + 1].id);
  } else if (currentIndex > 0) {
    setSelectedItemId(filteredThumbnails[currentIndex - 1].id);
  } else {
    setSelectedItemId(null);
  }
  setSelectedThumbnailId(undefined);
};

const handleRejectThumbnail = () => {
  const currentItem = mockPendingThumbnails.find(t => t.id === selectedItemId);
  if (!currentItem) return;
  
  // Add to history
  const historyEntry: ApprovalHistoryThumbnail = {
    id: Date.now(),
    itemId: currentItem.id,
    videoId: currentItem.videoId,
    channelName: currentItem.channelName,
    channelColor: currentItem.channelColor,
    videoTitle: currentItem.videoTitle,
    referenceThumbnail: currentItem.referenceThumbnail,
    selectedThumbnailUrl: '',
    selectedThumbnailId: -1,
    status: 'rejected',
    approvedAt: new Date().toISOString(),
    approvedBy: 'You',
    autoApproved: false
  };
  setThumbnailHistory(prev => [historyEntry, ...prev]);
  
  // Remove from list
  if (selectedItemId) {
    setRemovedThumbnailIds(prev => new Set([...prev, selectedItemId]));
  }
  
  // Move to next item or clear selection
  const currentIndex = filteredThumbnails.findIndex(t => t.id === selectedItemId);
  if (currentIndex < filteredThumbnails.length - 1) {
    setSelectedItemId(filteredThumbnails[currentIndex + 1].id);
  } else if (currentIndex > 0) {
    setSelectedItemId(filteredThumbnails[currentIndex - 1].id);
  } else {
    setSelectedItemId(null);
  }
  setSelectedThumbnailId(undefined);
};
```

### Funções Auxiliares

```tsx
// Formata tempo relativo (ex: "2h ago")
const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

// Retorna todas as opções de título (principal + alternativas)
const getAllTitleOptions = (item: PendingTitle) => {
  return [
    { text: item.generatedData.title, isMain: true },
    ...item.generatedData.alternatives.map(alt => ({ text: alt.text, isMain: false }))
  ];
};

// Contadores
const pendingTitlesCount = mockPendingTitles.filter(t => t.status === 'pending').length;
const pendingThumbnailsCount = mockPendingThumbnails.filter(t => t.status === 'pending').length;

// Items filtrados (remove os que já foram processados)
const filteredTitles = mockPendingTitles
  .filter(item => !removedTitleIds.has(item.id))
  .filter(item => 
    item.referenceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

const filteredThumbnails = mockPendingThumbnails
  .filter(item => !removedThumbnailIds.has(item.id))
  .filter(item =>
    item.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

// Items selecionados
const selectedTitleItem = activeTab === 'titles' ? mockPendingTitles.find(t => t.id === selectedItemId) : null;
const selectedThumbnailItem = activeTab === 'thumbnails' ? mockPendingThumbnails.find(t => t.id === selectedItemId) : null;
```

### Estrutura JSX - Layout Principal

```tsx
return (
  <>
    <Sidebar 
      currentRoute="productionApprovalQueue2" 
      onNavigate={onNavigate} 
      onExpandedChange={onSidebarExpandedChange} 
    />

    <main className={`bg-background min-h-screen transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}>
      {/* Header */}
      <div className="border-b border-border bg-card">
        {/* ... header content ... */}
      </div>

      {/* Split View Layout */}
      <div className="flex h-[calc(100vh-120px)] overflow-hidden">
        {/* Left Panel - Items List */}
        <div className="w-96 border-r border-border bg-card flex flex-col overflow-hidden">
          {/* ... sidebar content ... */}
        </div>

        {/* Right Panel - Details & Review */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ... main content ... */}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewThumbnailUrl} onOpenChange={(open) => !open && setPreviewThumbnailUrl(null)}>
        {/* ... dialog content ... */}
      </Dialog>
    </main>
  </>
);
```

### Header Completo

```tsx
<div className="border-b border-border bg-card">
  <div className="px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-4 mb-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-foreground" />
            <h1 className="text-xl font-semibold text-foreground">Approval Queue 2</h1>
          </div>
          <Badge variant="secondary">Split View</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Select items from the list to review and approve
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          <Button
            variant={viewMode === 'pending' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('pending')}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Pending
            {(pendingTitlesCount + pendingThumbnailsCount) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingTitlesCount + pendingThumbnailsCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={viewMode === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('history')}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            History
            {(titleHistory.length + thumbnailHistory.length) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {titleHistory.length + thumbnailHistory.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Auto-Approval Toggle - Only show in pending mode */}
        {viewMode === 'pending' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30">
            <Label htmlFor={`auto-approval-${activeTab}`} className="text-xs cursor-pointer">
              Auto-Approve
            </Label>
            <Switch
              id={`auto-approval-${activeTab}`}
              checked={activeTab === 'titles' ? autoApprovalTitles : autoApprovalThumbnails}
              onCheckedChange={(checked) => {
                if (activeTab === 'titles') {
                  setAutoApprovalTitles(checked);
                } else {
                  setAutoApprovalThumbnails(checked);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  </div>
</div>
```

### Sidebar Esquerda - Estrutura

```tsx
<div className="w-96 border-r border-border bg-card flex flex-col overflow-hidden">
  {/* Tabs no topo */}
  <div className="p-4 border-b border-border flex-shrink-0">
    <Tabs value={activeTab} onValueChange={(newTab) => {
      setActiveTab(newTab);
      setSelectedItemId(newTab === 'titles' ? (filteredTitles[0]?.id || null) : (filteredThumbnails[0]?.id || null));
      setSelectedTitleIndex(undefined);
      setSelectedThumbnailId(undefined);
    }} className="w-full">
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
    </Tabs>
  </div>

  {/* Campo de busca */}
  <div className="p-4 border-b border-border flex-shrink-0">
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9"
      />
    </div>
  </div>

  {/* Lista de items com scroll */}
  <div className="flex-1 overflow-y-auto">
    {/* Lista de titles ou thumbnails */}
  </div>
</div>
```

### Sidebar Esquerda - Lista de Titles

```tsx
{activeTab === 'titles' && (
  <div className="p-2">
    {filteredTitles.length === 0 ? (
      <div className="py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No pending titles</p>
      </div>
    ) : (
      filteredTitles.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setSelectedItemId(item.id);
            setSelectedTitleIndex(undefined);
          }}
          className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
            selectedItemId === item.id
              ? 'bg-accent border-2 border-primary'
              : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
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
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(item.createdAt)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
            {item.referenceTitle}
          </p>
          <p className="text-xs font-medium line-clamp-2">
            {item.generatedData.title}
          </p>
        </button>
      ))
    )}
  </div>
)}
```

### Sidebar Esquerda - Lista de Thumbnails

```tsx
{activeTab === 'thumbnails' && (
  <div className="p-2">
    {filteredThumbnails.length === 0 ? (
      <div className="py-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No pending thumbnails</p>
      </div>
    ) : (
      filteredThumbnails.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setSelectedItemId(item.id);
            setSelectedThumbnailId(undefined);
          }}
          className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
            selectedItemId === item.id
              ? 'bg-accent border-2 border-primary'
              : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
          }`}
        >
          <img 
            src={item.referenceThumbnail}
            alt="Reference"
            className="w-full aspect-video object-cover rounded mb-2"
          />
          <div className="flex items-center gap-2 mb-2">
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
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(item.createdAt)}
            </Badge>
          </div>
          <p className="text-xs font-medium line-clamp-2">
            {item.videoTitle}
          </p>
        </button>
      ))
    )}
  </div>
)}
```

### Painel Direito - Estrutura de Renderização Condicional

```tsx
<div className="flex-1 flex flex-col overflow-hidden">
  {viewMode === 'history' ? (
    /* MODO HISTORY */
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <ApprovalHistory
          titleHistory={titleHistory}
          thumbnailHistory={thumbnailHistory}
          activeTab={activeTab as 'titles' | 'thumbnails'}
        />
      </div>
    </div>
  ) : !selectedItemId ? (
    /* NENHUM ITEM SELECIONADO */
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Select an item to review</p>
      </div>
    </div>
  ) : (
    /* MODO PENDING - ITEM SELECIONADO */
    <>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Conteúdo de review (titles ou thumbnails) */}
      </div>

      {/* Action Bar fixa no rodapé */}
      <div className="border-t border-border bg-card p-4 flex-shrink-0">
        {/* Botões de aprovação/rejeição */}
      </div>
    </>
  )}
</div>
```

### Painel Direito - Review de Titles

**Estrutura visual:**
1. Seção de referência (fundo cinza)
2. Título principal sugerido (fundo amarelo/laranja gradient com border-left amarelo)
3. Lista de 11 opções em radio buttons

```tsx
{selectedTitleItem && (
  <div className="max-w-4xl mx-auto space-y-4">
    {/* Reference Section */}
    <div className="bg-muted/50 border border-border p-4 rounded-lg">
      <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">
        Título de Referência (Benchmark)
      </p>
      <p className="text-sm font-medium text-foreground mb-2">
        {selectedTitleItem.referenceTitle}
      </p>
      <div className="bg-background/50 border border-border/50 px-3 py-2 rounded">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Formula:</span> {selectedTitleItem.generatedData.original.formula}
        </p>
      </div>
    </div>

    {/* Main Suggested Title */}
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-500 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
        <p className="text-xs uppercase tracking-wide font-medium text-yellow-700 dark:text-yellow-500">
          Título Principal Sugerido
        </p>
      </div>
      <p className="text-sm font-medium text-foreground mb-3">
        {selectedTitleItem.generatedData.title}
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-100/50 dark:bg-orange-950/30 p-2.5 rounded">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-3.5 h-3.5 text-orange-600 dark:text-orange-500" />
            <p className="text-xs uppercase tracking-wide text-orange-700 dark:text-orange-500">Emoção</p>
          </div>
          <p className="text-sm font-medium">{selectedTitleItem.generatedData.analysis.emotional}</p>
        </div>
        <div className="bg-blue-100/50 dark:bg-blue-950/30 p-2.5 rounded">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
            <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-500">Racional</p>
          </div>
          <p className="text-sm font-medium">{selectedTitleItem.generatedData.analysis.rationale}</p>
        </div>
      </div>
    </div>

    {/* Alternatives */}
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Selecione 1 de 11 opções
      </p>

      {getAllTitleOptions(selectedTitleItem).map((option, index) => (
        <label
          key={index}
          className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
            selectedTitleIndex === index
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/30'
          }`}
        >
          <input
            type="radio"
            name="title-option"
            checked={selectedTitleIndex === index}
            onChange={() => setSelectedTitleIndex(index)}
            className="mt-0.5 w-4 h-4 text-primary"
          />
          <div className="flex-1">
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground font-medium min-w-[22px]">{index + 1}.</span>
              <p className="text-sm text-foreground">{option.text}</p>
              {option.isMain && (
                <Badge variant="default" className="ml-auto flex-shrink-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Principal
                </Badge>
              )}
            </div>
          </div>
        </label>
      ))}
    </div>
  </div>
)}
```

### Painel Direito - Review de Thumbnails

**Estrutura visual:**
1. Thumbnail de referência (grande, centralizada)
2. Separador
3. Grid 2x2 de thumbnails geradas
4. Cada thumbnail tem: radio button, imagem, badge "AI Pick" (se aplicável), prompt no hover, botão "Preview" no hover

```tsx
{selectedThumbnailItem && (
  <div className="max-w-5xl mx-auto space-y-4">
    {/* Reference */}
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Reference Thumbnail</p>
      <div className="w-full max-w-2xl aspect-video rounded-lg border border-border overflow-hidden mx-auto">
        <img 
          src={selectedThumbnailItem.referenceThumbnail}
          alt="Reference"
          className="w-full h-full object-cover"
        />
      </div>
    </div>

    <Separator />

    {/* Generated Options */}
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
        Select 1 of {selectedThumbnailItem.generatedThumbnails.length} options
      </p>
      <div className="grid grid-cols-2 gap-4">
        {selectedThumbnailItem.generatedThumbnails.map((thumbnail) => (
          <div key={thumbnail.id} className="relative group">
            <label
              className={`relative rounded-lg border-2 cursor-pointer transition-all overflow-hidden aspect-video block ${
                selectedThumbnailId === thumbnail.id
                  ? 'border-primary ring-4 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                type="radio"
                name="thumbnail-option"
                checked={selectedThumbnailId === thumbnail.id}
                onChange={() => setSelectedThumbnailId(thumbnail.id)}
                className="absolute top-3 left-3 w-4 h-4 text-primary z-10"
              />
              <img 
                src={thumbnail.url}
                alt={`Option ${thumbnail.id}`}
                className="w-full h-full object-cover"
              />
              {thumbnail.isClaudePick && (
                <div className="absolute top-3 right-3">
                  <Badge variant="default">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Pick
                  </Badge>
                </div>
              )}
              {thumbnail.prompt && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-xs text-white">{thumbnail.prompt}</p>
                </div>
              )}
              
              {/* Preview Button on Hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    setPreviewThumbnailUrl(thumbnail.url);
                  }}
                >
                  <Maximize2 className="w-4 h-4" />
                  Preview
                </Button>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

### Action Bar (Rodapé do Painel Direito)

```tsx
<div className="border-t border-border bg-card p-4 flex-shrink-0">
  <div className="max-w-4xl mx-auto flex items-center justify-between">
    <div className="text-sm text-muted-foreground">
      {activeTab === 'titles' && selectedTitleIndex !== undefined && (
        <span>Option {selectedTitleIndex + 1} selected</span>
      )}
      {activeTab === 'thumbnails' && selectedThumbnailId && (
        <span>Thumbnail {selectedThumbnailId} selected</span>
      )}
      {activeTab === 'titles' && selectedTitleIndex === undefined && (
        <span>Select a title to continue</span>
      )}
      {activeTab === 'thumbnails' && !selectedThumbnailId && (
        <span>Select a thumbnail to continue</span>
      )}
    </div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={activeTab === 'titles' ? handleRejectTitle : handleRejectThumbnail}
        className="gap-2"
      >
        <XCircle className="w-4 h-4" />
        Reject
      </Button>
      <Button
        onClick={activeTab === 'titles' ? handleApproveTitle : handleApproveThumbnail}
        disabled={
          activeTab === 'titles' 
            ? selectedTitleIndex === undefined 
            : !selectedThumbnailId
        }
        className="gap-2"
      >
        <CheckCircle2 className="w-4 h-4" />
        Approve & Next
      </Button>
    </div>
  </div>
</div>
```

### Modal de Preview de Thumbnail

```tsx
<Dialog open={!!previewThumbnailUrl} onOpenChange={(open) => !open && setPreviewThumbnailUrl(null)}>
  <DialogContent className="max-w-6xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Maximize2 className="w-5 h-5" />
        Thumbnail Preview
      </DialogTitle>
      <DialogDescription>
        Full-size preview of the thumbnail.
      </DialogDescription>
    </DialogHeader>
    <div className="w-full aspect-video rounded-lg border border-border overflow-hidden bg-black">
      {previewThumbnailUrl && (
        <img 
          src={previewThumbnailUrl}
          alt="Full preview"
          className="w-full h-full object-contain"
        />
      )}
    </div>
  </DialogContent>
</Dialog>
```

## 📦 Componente 2: `/components/ApprovalHistory.tsx`

Este é um componente separado para exibir o histórico de aprovações/rejeições.

### Imports e Interfaces

```tsx
import { CheckCircle2, XCircle, Clock, Sparkles, User } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface ApprovalHistoryTitle {
  id: number;
  itemId: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  referenceTitle: string;
  selectedOption: string;
  selectedIndex: number;
  status: 'approved' | 'rejected';
  approvedAt: string;
  approvedBy: string;
  autoApproved: boolean;
}

interface ApprovalHistoryThumbnail {
  id: number;
  itemId: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  videoTitle: string;
  referenceThumbnail: string;
  selectedThumbnailUrl: string;
  selectedThumbnailId: number;
  status: 'approved' | 'rejected';
  approvedAt: string;
  approvedBy: string;
  autoApproved: boolean;
}

interface ApprovalHistoryProps {
  titleHistory: ApprovalHistoryTitle[];
  thumbnailHistory: ApprovalHistoryThumbnail[];
  activeTab: 'titles' | 'thumbnails';
}
```

### Funções de Formatação

```tsx
const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

const formatFullDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### Renderização - Histórico de Titles

```tsx
export function ApprovalHistory({ titleHistory, thumbnailHistory, activeTab }: ApprovalHistoryProps) {
  if (activeTab === 'titles') {
    return (
      <div className="space-y-3">
        {titleHistory.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No approval history yet</p>
          </div>
        ) : (
          titleHistory.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className={`mt-0.5 ${item.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.status === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
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
                    <Badge 
                      variant={item.status === 'approved' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {item.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Badge>
                    {item.autoApproved && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        Auto
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatFullDate(item.approvedAt)}
                    </span>
                  </div>

                  {/* Reference Title */}
                  <p className="text-xs text-muted-foreground mb-1">
                    <span className="font-medium">Ref:</span> {item.referenceTitle}
                  </p>

                  {/* Selected Option - Only for approved */}
                  {item.status === 'approved' && (
                    <div className="bg-primary/5 border border-primary/20 rounded px-3 py-2 mt-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-primary font-medium">Option {item.selectedIndex + 1}:</span>
                        <p className="text-sm flex-1">{item.selectedOption}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{item.approvedBy}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(item.approvedAt)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  }
  
  // ... renderização de thumbnails continua abaixo ...
}
```

### Renderização - Histórico de Thumbnails

```tsx
// Thumbnails History (continuação do componente ApprovalHistory)
return (
  <div className="space-y-3">
    {thumbnailHistory.length === 0 ? (
      <div className="py-16 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">No approval history yet</p>
      </div>
    ) : (
      thumbnailHistory.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className={`mt-0.5 ${item.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
              {item.status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
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
                <Badge 
                  variant={item.status === 'approved' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {item.status === 'approved' ? 'Approved' : 'Rejected'}
                </Badge>
                {item.autoApproved && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatFullDate(item.approvedAt)}
                </span>
              </div>

              {/* Video Title */}
              <p className="text-sm font-medium mb-2">{item.videoTitle}</p>

              {/* Thumbnails Comparison - Only for approved */}
              {item.status === 'approved' && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {/* Reference */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reference</p>
                    <img 
                      src={item.referenceThumbnail}
                      alt="Reference"
                      className="w-full aspect-video object-cover rounded border border-border"
                    />
                  </div>
                  {/* Selected */}
                  <div>
                    <p className="text-xs text-primary font-medium mb-1">Selected (#{item.selectedThumbnailId})</p>
                    <img 
                      src={item.selectedThumbnailUrl}
                      alt="Selected"
                      className="w-full aspect-video object-cover rounded border-2 border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>{item.approvedBy}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(item.approvedAt)}</span>
              </div>
            </div>
          </div>
        </Card>
      ))
    )}
  </div>
);
```

## 🎨 Classes CSS e Tailwind Importantes

### Layout Split-Screen
- Container principal: `flex h-[calc(100vh-120px)] overflow-hidden`
- Coluna esquerda: `w-96 border-r border-border bg-card flex flex-col overflow-hidden`
- Coluna direita: `flex-1 flex flex-col overflow-hidden`
- Scroll independente: `overflow-y-auto` nos elementos filhos apropriados

### Badges Coloridos por Canal
```tsx
style={{
  backgroundColor: `${channelColor}20`,
  color: channelColor,
  borderColor: `${channelColor}40`
}}
```

### Destaque do Título Principal
- Gradient: `bg-gradient-to-r from-yellow-500/10 to-orange-500/10`
- Border lateral: `border-l-4 border-yellow-500`
- Ícone sparkles: `text-yellow-600 dark:text-yellow-500`

### Radio Buttons Customizados
- Label wrapper: `border-2 cursor-pointer transition-all`
- Estado selecionado: `border-primary bg-primary/5`
- Hover: `hover:border-primary/50 hover:bg-accent/30`

### Thumbnails com Hover
- Container: `relative group`
- Overlay no hover: `bg-black/0 group-hover:bg-black/40 transition-all`
- Botão aparece: `opacity-0 group-hover:opacity-100`

## ⚠️ Cuidados Importantes

### 1. Bug de Conteúdo não Acompanhar Sidebar
**PROBLEMA**: Conteúdo pode não se mover junto com a sidebar quando ela expande/colapsa.

**SOLUÇÃO**: Usar a classe condicional correta no `<main>`:
```tsx
<main className={`bg-background min-h-screen transition-all duration-300 ${
  isSidebarExpanded ? 'ml-64' : 'ml-16'
}`}>
```

**NUNCA USE**: Posições absolutas ou fixed no main sem considerar a sidebar.

### 2. Overflow e Scroll Independente
- Container pai: `overflow-hidden`
- Elementos com scroll: `overflow-y-auto` + altura definida
- Altura do container principal: `h-[calc(100vh-120px)]` (ajustar conforme header)

### 3. Estados e Sincronização
- Ao trocar de tab: limpar seleções específicas (selectedTitleIndex, selectedThumbnailId)
- Ao aprovar/rejeitar: adicionar ao histórico ANTES de remover da lista
- Ao filtrar: usar dois filtros encadeados (removidos + busca)

### 4. Performance
- Usar `Set` para items removidos (operações O(1))
- Adicionar `key` única em todas as listas
- Memoizar funções pesadas se necessário (não é o caso aqui)

### 5. Acessibilidade
- Radio buttons devem ter `name` único por grupo
- Labels devem envolver inputs para área clicável maior
- Empty states devem ter mensagens claras
- Botões desabilitados quando falta seleção

## 🔧 Integração com App.tsx

No arquivo `App.tsx`, adicionar a rota:

```tsx
import { ProductionApprovalQueue2 } from './components/ProductionApprovalQueue2';

// ... dentro do componente App

{currentRoute === 'productionApprovalQueue2' && (
  <ProductionApprovalQueue2 
    onNavigate={setCurrentRoute}
    isSidebarExpanded={isSidebarExpanded}
    onSidebarExpandedChange={setIsSidebarExpanded}
  />
)}
```

## ✅ Checklist de Implementação

- [ ] Criar interfaces TypeScript completas
- [ ] Criar mock data de titles (3 items)
- [ ] Criar mock data de thumbnails (2 items)
- [ ] Implementar estados de controle
- [ ] Implementar handlers de aprovação/rejeição
- [ ] Implementar funções auxiliares (formatTimeAgo, getAllTitleOptions, filtros)
- [ ] Criar estrutura HTML/JSX do header
- [ ] Criar sidebar esquerda com tabs no topo
- [ ] Criar lista de titles na sidebar
- [ ] Criar lista de thumbnails na sidebar
- [ ] Criar painel direito com renderização condicional
- [ ] Criar review de titles com 11 opções
- [ ] Criar review de thumbnails com grid 2x2
- [ ] Criar action bar com botões de aprovação
- [ ] Criar modal de preview de thumbnail
- [ ] Criar componente ApprovalHistory separado
- [ ] Integrar ApprovalHistory no painel direito
- [ ] Testar aprovação de titles (deve sumir e ir pro histórico)
- [ ] Testar rejeição de titles (deve sumir e ir pro histórico)
- [ ] Testar aprovação de thumbnails (deve sumir e ir pro histórico)
- [ ] Testar rejeição de thumbnails (deve sumir e ir pro histórico)
- [ ] Testar navegação automática entre items
- [ ] Testar busca/filtro
- [ ] Testar troca de tabs
- [ ] Testar toggle pending/history
- [ ] Testar responsividade da sidebar (expandir/colapsar)
- [ ] Verificar empty states
- [ ] Verificar tema escuro/claro

## 🎯 Resultado Final Esperado

Uma tela de aprovação profissional com:
- ✅ Layout split-screen moderno
- ✅ Tabs de Titles/Thumbnails no topo da sidebar
- ✅ Lista de items com scroll independente
- ✅ Detalhes inline no painel direito
- ✅ Sistema completo de aprovação/rejeição
- ✅ Items somem da fila ao serem processados
- ✅ Navegação automática para próximo item
- ✅ Histórico completo e visual
- ✅ Preview de thumbnails em modal
- ✅ Badge counts dinâmicos
- ✅ Busca/filtro funcional
- ✅ Tema escuro/claro
- ✅ Totalmente responsivo com a sidebar

---

**Boa implementação! 🚀**
