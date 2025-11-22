# 🎯 REPLICAR MY CHANNELS - Visual Idêntico ao Figma Make

## ⚠️ OBJETIVO
Replicar **EXATAMENTE** a aparência visual da página MyChannels do Figma Make (projeto atual) no Claude Code. Copiar classes, estrutura e layout pixel-perfect.

## 🚨 AVISO CRÍTICO - BUG DA SIDEBAR
**NÃO COPIAR:** A página atual tem um bug onde o conteúdo não se move quando a sidebar expande/colapsa.

**SOLUÇÃO:** Garantir que o `<main>` tenha:
```tsx
<main className={`min-h-screen bg-background transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}>
```

**VERIFICAR:** A prop `isSidebarExpanded` está sendo recebida e usada corretamente.

---

## 📐 ESTRUTURA COMPLETA DA PÁGINA

### **LAYOUT PRINCIPAL**

```tsx
interface MyChannelsProps {
  onNavigate: (route: string) => void;
  onChannelClick: (channelId: number) => void;
  isSidebarExpanded: boolean;
  onSidebarExpandedChange: (expanded: boolean) => void;
}

export function MyChannels({ onNavigate, onChannelClick, isSidebarExpanded, onSidebarExpandedChange }: MyChannelsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <Sidebar currentRoute="mychannels" onNavigate={onNavigate} onExpandedChange={onSidebarExpandedChange} />

      <main className={`min-h-screen bg-background transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        {/* Conteúdo aqui */}
      </main>
    </>
  );
}
```

**Classes EXATAS do main:**
- `min-h-screen bg-background transition-all duration-300`
- Margin left dinâmico: `${isSidebarExpanded ? 'ml-64' : 'ml-16'}`

---

## 📋 SECTION 1: HEADER (Título + Search)

### **Estrutura HTML/TSX:**

```tsx
{/* Header */}
<div className="border-b border-border bg-card">
  <div className="p-8">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-foreground mb-2">My Channels</h1>
        <p className="text-muted-foreground">
          Manage your YouTube channels, brand bibles, and production settings
        </p>
      </div>
      <Button className="gap-2">
        <Plus className="w-4 h-4" />
        New Channel
      </Button>
    </div>

    {/* Search */}
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search channels..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>
</div>
```

**Classes EXATAS:**

**Container principal do header:**
- `border-b border-border bg-card`

**Padding interno:**
- `p-8`

**Título e botão:**
- Container: `flex items-center justify-between mb-6`
- H1: `text-foreground mb-2` (SEM font-size, usa globals.css)
- Subtitle: `text-muted-foreground`
- Button: `className="gap-2"` (padrão)
- Ícone Plus: `w-4 h-4`

**Search bar:**
- Container: `relative max-w-md`
- Ícone Search: `absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`
- Input: `className="pl-10"` (padding left para o ícone)

---

## 🎴 SECTION 2: CHANNELS GRID

### **Estrutura do Grid:**

```tsx
{/* Channels Grid */}
<div className="p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {filteredChannels.map((channel) => (
      <Card 
        key={channel.id}
        className="group hover:shadow-lg transition-all cursor-pointer"
        onClick={() => onChannelClick(channel.id)}
      >
        {/* Card content aqui */}
      </Card>
    ))}
  </div>
</div>
```

**Classes EXATAS:**

**Container externo:**
- `p-8` (padding ao redor do grid)

**Grid:**
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
  - Mobile: 1 coluna
  - Tablet (md): 2 colunas
  - Desktop (lg): 3 colunas
  - Large desktop (xl): 4 colunas
  - Gap entre cards: `gap-4`

**Card:**
- `group hover:shadow-lg transition-all cursor-pointer`
- Usa `group` para efeitos de hover nos filhos

---

## 🃏 SECTION 3: CHANNEL CARD (Estrutura Completa)

### **Card Content:**

```tsx
<Card 
  key={channel.id}
  className="group hover:shadow-lg transition-all cursor-pointer"
  onClick={() => onChannelClick(channel.id)}
>
  <CardContent className="p-6">
    {/* Header */}
    <div className="flex items-start gap-3 mb-4">
      <img 
        src={channel.avatar} 
        alt={channel.name}
        className="w-12 h-12 rounded-full flex-shrink-0"
        style={{ backgroundColor: channel.color }}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground mb-0.5 truncate">
          {channel.name}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {channel.handle}
        </p>
      </div>
      {getStatusBadge(channel.status)}
    </div>

    {/* Metrics */}
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Subscribers
        </span>
        <span className="font-medium">{channel.subscribers}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" />
          Videos
        </span>
        <span className="font-medium">{channel.totalVideos}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Total Views
        </span>
        <span className="font-medium">{channel.totalViews}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Avg Views
        </span>
        <span className="font-medium">{channel.avgViews}</span>
      </div>
    </div>

    {/* Footer */}
    <div className="pt-4 border-t border-border space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Publishing</span>
        <span className="font-medium">{channel.publishingFrequency}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last published
        </span>
        <span className="font-medium">{channel.lastPublished}</span>
      </div>
    </div>

    {/* Actions (visible on hover) */}
    <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex-1 gap-1.5"
        onClick={(e) => {
          e.stopPropagation();
          onChannelClick(channel.id);
        }}
      >
        <Settings className="w-3.5 h-3.5" />
        Manage
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          window.open(`https://youtube.com/${channel.handle}`, '_blank');
        }}
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </Button>
    </div>
  </CardContent>
</Card>
```

### **Classes DETALHADAS de cada seção:**

#### **1. CardContent:**
- `p-6` (padding do card)

#### **2. Header do Card:**
- Container: `flex items-start gap-3 mb-4`
- Avatar: `w-12 h-12 rounded-full flex-shrink-0`
- Info container: `flex-1 min-w-0`
- Nome: `font-medium text-foreground mb-0.5 truncate`
- Handle: `text-xs text-muted-foreground truncate`

#### **3. Metrics Section:**
- Container: `space-y-3 mb-4`
- Cada metric row: `flex items-center justify-between text-sm`
- Label com ícone: `text-muted-foreground flex items-center gap-1.5`
- Ícones: `w-3.5 h-3.5`
- Valor: `font-medium`

#### **4. Footer:**
- Container: `pt-4 border-t border-border space-y-2`
- Rows: `flex items-center justify-between text-xs`
- Label: `text-muted-foreground`
- Label com ícone: `text-muted-foreground flex items-center gap-1`
- Ícone Clock: `w-3 h-3` (menor que os outros)
- Valor: `font-medium`

#### **5. Actions (Hover):**
- Container: `mt-4 pt-4 border-t border-border flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity`
- Button Manage: `variant="outline" size="sm" className="flex-1 gap-1.5"`
- Button External: `variant="outline" size="sm"`
- Ícones: `w-3.5 h-3.5`

**IMPORTANTE:** 
- Actions começam com `opacity-0`
- Aparecem com `group-hover:opacity-100` (usa o `group` do Card)
- `e.stopPropagation()` para não acionar o onClick do Card

---

## 🎨 SECTION 4: STATUS BADGES

### **Função getStatusBadge:**

```tsx
const getStatusBadge = (status: Channel['status']) => {
  const styles = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  };
  const labels = {
    active: 'Active',
    paused: 'Paused',
    draft: 'Draft'
  };
  return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>;
};
```

**Cores EXATAS:**

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| **Active** | `bg-green-500/10` | `text-green-500` | `border-green-500/20` |
| **Paused** | `bg-yellow-500/10` | `text-yellow-500` | `border-yellow-500/20` |
| **Draft** | `bg-gray-500/10` | `text-gray-500` | `border-gray-500/20` |

Todos usam `variant="outline"` do Badge.

---

## 📭 SECTION 5: EMPTY STATE

### **Estrutura:**

```tsx
{/* Empty State */}
{filteredChannels.length === 0 && (
  <div className="text-center py-12">
    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-foreground mb-2">No channels found</h3>
    <p className="text-sm text-muted-foreground mb-4">
      Try adjusting your search query
    </p>
    <Button variant="outline" onClick={() => setSearchQuery('')}>
      Clear Search
    </Button>
  </div>
)}
```

**Classes EXATAS:**
- Container: `text-center py-12`
- Ícone Video: `w-12 h-12 text-muted-foreground mx-auto mb-4`
- H3: `text-foreground mb-2`
- Paragraph: `text-sm text-muted-foreground mb-4`
- Button: `variant="outline"`

---

## 📊 SECTION 6: INTERFACE CHANNEL (TypeScript)

### **Interface completa:**

```tsx
interface Channel {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  subscribers: string;
  totalVideos: number;
  totalViews: string;
  avgViews: string;
  publishingFrequency: string;
  lastPublished: string;
  status: 'active' | 'paused' | 'draft';
  color: string;
}
```

**Campos importantes:**
- `avatar`: URL do Dicebear com seed e cor de fundo
- `status`: union type com 3 opções
- `color`: hex color para o avatar background
- `subscribers`, `totalViews`, `avgViews`: strings (ex: "247K", "12.4M")

---

## 🎲 SECTION 7: MOCK DATA (8 Canais)

### **Array myChannels:**

```tsx
const myChannels: Channel[] = [
  {
    id: 1,
    name: 'Canal Bíblico',
    handle: '@CanalBiblico',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CB&backgroundColor=10B981',
    subscribers: '247K',
    totalVideos: 342,
    totalViews: '12.4M',
    avgViews: '36.2K',
    publishingFrequency: 'Daily',
    lastPublished: '2 hours ago',
    status: 'active',
    color: '#10B981'
  },
  {
    id: 2,
    name: 'Canal Saúde',
    handle: '@CanaldaSaude',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CS&backgroundColor=3B82F6',
    subscribers: '189K',
    totalVideos: 256,
    totalViews: '8.7M',
    avgViews: '34.0K',
    publishingFrequency: '3x week',
    lastPublished: '1 day ago',
    status: 'active',
    color: '#3B82F6'
  },
  {
    id: 3,
    name: 'Canal Tech',
    handle: '@TechAutomidia',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CT&backgroundColor=8B5CF6',
    subscribers: '92K',
    totalVideos: 178,
    totalViews: '4.2M',
    avgViews: '23.6K',
    publishingFrequency: '2x week',
    lastPublished: '3 days ago',
    status: 'active',
    color: '#8B5CF6'
  },
  {
    id: 4,
    name: 'Canal Motivação',
    handle: '@MotivaDiaria',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CM&backgroundColor=F59E0B',
    subscribers: '156K',
    totalVideos: 289,
    totalViews: '6.8M',
    avgViews: '23.5K',
    publishingFrequency: 'Daily',
    lastPublished: '5 hours ago',
    status: 'active',
    color: '#F59E0B'
  },
  {
    id: 5,
    name: 'Canal Finanças',
    handle: '@FinancasInteligentes',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CF&backgroundColor=EF4444',
    subscribers: '67K',
    totalVideos: 134,
    totalViews: '2.9M',
    avgViews: '21.6K',
    publishingFrequency: 'Weekly',
    lastPublished: '2 days ago',
    status: 'active',
    color: '#EF4444'
  },
  {
    id: 6,
    name: 'Canal História',
    handle: '@HistoriasAntrigas',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CH&backgroundColor=EC4899',
    subscribers: '34K',
    totalVideos: 67,
    totalViews: '1.2M',
    avgViews: '17.9K',
    publishingFrequency: '2x week',
    lastPublished: '1 week ago',
    status: 'paused',
    color: '#EC4899'
  },
  {
    id: 7,
    name: 'Canal Viagens',
    handle: '@ViagemAutomática',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CV&backgroundColor=14B8A6',
    subscribers: '12K',
    totalVideos: 23,
    totalViews: '456K',
    avgViews: '19.8K',
    publishingFrequency: 'Monthly',
    lastPublished: '3 weeks ago',
    status: 'draft',
    color: '#14B8A6'
  },
  {
    id: 8,
    name: 'Canal Receitas',
    handle: '@ReceitasRapidas',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CR&backgroundColor=F97316',
    subscribers: '78K',
    totalVideos: 145,
    totalViews: '3.4M',
    avgViews: '23.4K',
    publishingFrequency: '3x week',
    lastPublished: '6 hours ago',
    status: 'active',
    color: '#F97316'
  }
];
```

**Padrão dos avatars:**
- URL: `https://api.dicebear.com/7.x/initials/svg?seed={INICIAIS}&backgroundColor={COR_SEM_#}`
- Seed: iniciais do nome (CB, CS, CT, etc)
- backgroundColor: cor hex sem o # (10B981, 3B82F6, etc)

---

## 🔍 SECTION 8: FILTRO DE BUSCA

### **Lógica de filtro:**

```tsx
const filteredChannels = myChannels.filter(channel =>
  channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  channel.handle.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**Funcionalidade:**
- Busca no `name` do canal
- Busca no `handle` do canal
- Case insensitive (usa `toLowerCase()`)
- Retorna array filtrado para mapear no grid

---

## 📦 IMPORTS NECESSÁRIOS

```tsx
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  Video, 
  Users, 
  Eye,
  Clock,
  Settings,
  ExternalLink
} from 'lucide-react';
```

**Lucide Icons necessários:**
- Search (search bar)
- Plus (botão New Channel)
- TrendingUp (métrica Avg Views)
- Video (métrica Videos + empty state)
- Users (métrica Subscribers)
- Eye (métrica Total Views)
- Clock (Last Published)
- Settings (botão Manage)
- ExternalLink (botão abrir YouTube)

---

## 🎯 COMPORTAMENTOS IMPORTANTES

### **1. Click no Card:**
```tsx
onClick={() => onChannelClick(channel.id)}
```
- Card inteiro é clicável
- Chama `onChannelClick` passando o ID do canal

### **2. Click nos Botões de Action:**
```tsx
onClick={(e) => {
  e.stopPropagation();  // ← IMPORTANTE: não aciona o onClick do Card
  onChannelClick(channel.id);
}}
```
- Usa `e.stopPropagation()` para não acionar o click do Card pai
- Button External abre YouTube em nova aba: `window.open(..., '_blank')`

### **3. Hover Effect:**
- Card usa `group` class
- Actions usam `group-hover:opacity-100`
- Shadow aumenta: `hover:shadow-lg`

---

## ✅ CHECKLIST FINAL

### **Layout Geral:**
- [ ] Main com `ml-64`/`ml-16` baseado em `isSidebarExpanded`
- [ ] Sidebar recebe `currentRoute="mychannels"`
- [ ] Sidebar recebe `onExpandedChange={onSidebarExpandedChange}`

### **Header:**
- [ ] Container: `border-b border-border bg-card`
- [ ] Padding: `p-8`
- [ ] H1: `text-foreground mb-2` (sem font-size)
- [ ] Button "New Channel" com ícone Plus
- [ ] Search bar com ícone interno (`pl-10` no input)
- [ ] Search container: `relative max-w-md`

### **Grid:**
- [ ] Padding externo: `p-8`
- [ ] Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- [ ] Cards: `group hover:shadow-lg transition-all cursor-pointer`

### **Card Structure:**
- [ ] CardContent: `p-6`
- [ ] Header: avatar (12x12), nome, handle, status badge
- [ ] Metrics: 4 rows (Subscribers, Videos, Total Views, Avg Views)
- [ ] Footer: Publishing frequency + Last published
- [ ] Actions: 2 botões (Manage + External) com `opacity-0 group-hover:opacity-100`

### **Status Badges:**
- [ ] Active: green-500 (bg/10, text normal, border/20)
- [ ] Paused: yellow-500 (bg/10, text normal, border/20)
- [ ] Draft: gray-500 (bg/10, text normal, border/20)

### **Mock Data:**
- [ ] 8 canais com dados completos
- [ ] Avatars do Dicebear com seeds corretos
- [ ] 3 status diferentes (6 active, 1 paused, 1 draft)

### **Funcionalidades:**
- [ ] Filtro de busca (name + handle)
- [ ] Empty state quando sem resultados
- [ ] Click no card chama `onChannelClick`
- [ ] Botões de action com `e.stopPropagation()`
- [ ] Botão External abre YouTube em nova aba

---

## 🎯 RESULTADO ESPERADO

A página deve ficar **VISUALMENTE IDÊNTICA** à MyChannels do Figma Make, com:
- ✅ Header fixo no topo com background
- ✅ Search bar funcional com ícone
- ✅ Grid responsivo (1-4 colunas)
- ✅ Cards com hover effect suave
- ✅ Avatars coloridos do Dicebear
- ✅ Status badges com cores corretas
- ✅ Métricas organizadas com ícones
- ✅ Actions aparecem no hover
- ✅ Empty state quando sem resultados
- ✅ Sidebar funcionando corretamente (SEM o bug do margin-left)

---

**Status:** 📋 Pronto para implementação no Claude Code  
**Baseado em:** MyChannels.tsx do Figma Make  
**Data:** 22/11/2025  
**Objetivo:** Replicação pixel-perfect da UI
