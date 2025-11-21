# 🎯 REPLICAR API QUEUE - Visual Idêntico ao Figma Make

## ⚠️ OBJETIVO
Replicar **EXATAMENTE** a aparência visual da página ProductionApiQueue do Figma Make (o que tem aqui nesse docs) no projeto oficial que temos, usando claude code. Copiar classes, estrutura e layout pixel-perfect.

## 🚨 AVISO CRÍTICO - BUG DA SIDEBAR
**NÃO COPIAR:** A página atual aqui do figma tem um bug onde o conteúdo não se move quando a sidebar expande/colapsa.

**SOLUÇÃO: NÃO REPLIQUE ESSA PARTE, PORQUE O QUE TEMOS HOJE NO PROJETO OFICIAL QUE VOCÊ, CLAUDE CODE, ESTÁ MEXENDO, ESTÁ PERFEITO NESSE SENTIDO. Então cuidado com isso porque pode ter casca de banana aqui.

---

## 📐 ESTRUTURA COMPLETA DA PÁGINA

### **1. LAYOUT PRINCIPAL**

```tsx
export function ProductionApiQueue({ onNavigate, isSidebarExpanded, onSidebarExpandedChange }: ProductionApiQueueProps) {
  const [activeTab, setActiveTab] = useState('image');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('24h');

  return (
    <>
      <Sidebar currentRoute="productionApiQueue" onNavigate={onNavigate} onExpandedChange={onSidebarExpandedChange} />
      
      <main className={`bg-background min-h-screen transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        <div className="container mx-auto p-6 max-w-[1600px]">
          {/* Conteúdo aqui */}
        </div>
      </main>
    </>
  );
}
```

**Classes EXATAS:**
- Main: `bg-background min-h-screen transition-all duration-300` + margin left dinâmico
- Container interno: `container mx-auto p-6 max-w-[1600px]`

---

## 📋 SECTION 1: HEADER (Título + Actions)

### **Estrutura HTML/TSX:**

```tsx
{/* Header */}
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-foreground mb-1">API Queue</h1>
    <p className="text-sm text-muted-foreground">
      Centralized queue for all asset generation across the platform
    </p>
  </div>
  <div className="flex items-center gap-2">
    <Select value={periodFilter} onValueChange={setPeriodFilter}>
      <SelectTrigger className="w-[180px]">
        <CalendarDays className="w-4 h-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1h">Last 1 Hour</SelectItem>
        <SelectItem value="6h">Last 6 Hours</SelectItem>
        <SelectItem value="24h">Last 24 Hours</SelectItem>
        <SelectItem value="7d">Last 7 Days</SelectItem>
        <SelectItem value="30d">Last 30 Days</SelectItem>
        <SelectItem value="all">All Time</SelectItem>
      </SelectContent>
    </Select>
    <Button
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  </div>
</div>
```

**Classes EXATAS:**
- Container header: `flex items-center justify-between mb-6`
- H1: `text-foreground mb-1` (SEM text-3xl ou text-2xl, usa default do globals.css)
- Subtitle: `text-sm text-muted-foreground`
- Actions container: `flex items-center gap-2`
- Select width: `w-[180px]`
- Button: `variant="outline" size="sm" className="gap-2"`

---

## 📊 SECTION 2: STATS CARDS (Grid 4 colunas)

### **Estrutura Completa:**

```tsx
{/* Stats Cards */}
<div className="grid grid-cols-4 gap-5 mb-6">
  <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      <Play className="w-4 h-4" />
      <span className="text-sm">Processing</span>
    </div>
    <div className="text-foreground">4</div>
    <p className="text-xs text-muted-foreground mt-1">Active jobs</p>
  </div>

  <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      <Clock className="w-4 h-4" />
      <span className="text-sm">Queued</span>
    </div>
    <div className="text-foreground">3</div>
    <p className="text-xs text-muted-foreground mt-1">Waiting to process</p>
  </div>

  <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm">Completed (24h)</span>
    </div>
    <div className="text-foreground">87</div>
    <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
  </div>

  <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      <AlertCircle className="w-4 h-4" />
      <span className="text-sm">Failed (24h)</span>
    </div>
    <div className="text-foreground text-destructive">3</div>
    <p className="text-xs text-muted-foreground mt-1">Errors occurred</p>
  </div>
</div>
```

**Classes EXATAS de cada card:**
- Grid container: `grid grid-cols-4 gap-5 mb-6`
- Cada card: `bg-card rounded-lg border border-border p-5 shadow-sm`
- Header do card (ícone + label): `flex items-center gap-2 text-muted-foreground mb-2`
- Ícone: `w-4 h-4`
- Label: `text-sm`
- Valor: `text-foreground` (usa font-size do h1 do globals.css)
- Descrição: `text-xs text-muted-foreground mt-1`

**IMPORTANTE:**
- Gap entre cards: `gap-5` (não gap-4)
- Padding de cada card: `p-5` (não p-4)
- Todos os cards têm `shadow-sm`

---

## 📑 SECTION 3: TABS + CARD

### **Estrutura do Card Principal:**

```tsx
{/* Tabs */}
<Card>
  <CardHeader>
    <CardTitle>Generation Queues</CardTitle>
    <CardDescription>
      Monitor and manage asset generation across all providers
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="image" className="gap-2">
          <Zap className="w-4 h-4" />
          Image Generation
        </TabsTrigger>
        <TabsTrigger value="audio" className="gap-2">
          <Zap className="w-4 h-4" />
          Audio Generation
        </TabsTrigger>
        <TabsTrigger value="video" className="gap-2">
          <Zap className="w-4 h-4" />
          Video Processing
        </TabsTrigger>
        <TabsTrigger value="failed" className="gap-2">
          <AlertCircle className="w-4 h-4" />
          Failed Jobs ({failedJobs.length})
        </TabsTrigger>
      </TabsList>

      {/* Tab Contents abaixo */}
    </Tabs>
  </CardContent>
</Card>
```

**Classes EXATAS:**
- Card: componente `<Card>` padrão
- CardHeader: componente `<CardHeader>` padrão
- CardTitle: `"Generation Queues"`
- CardDescription: `"Monitor and manage asset generation across all providers"`
- TabsList: `grid w-full grid-cols-4` (SEM margin-bottom aqui)
- TabsTrigger: `className="gap-2"` (para espaçar ícone e texto)

---

## 📄 SECTION 4: TAB CONTENTS (Image, Audio, Video)

### **Estrutura de cada Tab (Image, Audio, Video):**

```tsx
<TabsContent value="image" className="mt-6">
  <div className="space-y-4">
    <div className="text-sm text-muted-foreground">
      <h3 className="font-medium text-foreground mb-2">Provider Configurations:</h3>
      <ul className="space-y-1 ml-4">
        <li>• <strong>Runware:</strong> N8N Workflow "Runware Image Generation A"</li>
        <li>• <strong>Gemini:</strong> N8N Workflow "Gemini Imagen B"</li>
        <li>• <strong>GPT:</strong> N8N Workflow "OpenAI DALL-E C"</li>
      </ul>
    </div>
    {renderJobsTable(mockImageJobs)}
  </div>
</TabsContent>
```

**Classes EXATAS:**
- TabsContent: `mt-6` (espaço após TabsList)
- Container: `space-y-4` (espaço entre provider configs e tabela)
- Section de configs: `text-sm text-muted-foreground`
- H3: `font-medium text-foreground mb-2`
- UL: `space-y-1 ml-4`

**Provider Configurations para cada tab:**

**Image Tab:**
- Runware: N8N Workflow "Runware Image Generation A"
- Gemini: N8N Workflow "Gemini Imagen B"
- GPT: N8N Workflow "OpenAI DALL-E C"

**Audio Tab:**
- ElevenLabs: N8N Workflow "ElevenLabs Voice A"
- Google TTS: N8N Workflow "Google TTS Workflow"

**Video Tab:**
- FFMPEG: N8N Workflow "Video Assembly Pipeline A" (1080p)
- FFMPEG: N8N Workflow "Video Assembly Pipeline B" (4K)

---

## 🚫 SECTION 5: FAILED JOBS TAB

### **Estrutura Completa:**

```tsx
<TabsContent value="failed" className="mt-6">
  {failedJobs.length === 0 ? (
    <div className="text-center py-12">
      <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
      <h3 className="text-foreground mb-2">No Failed Jobs</h3>
      <p className="text-sm text-muted-foreground">All jobs are running smoothly!</p>
    </div>
  ) : (
    <div className="space-y-4">
      {failedJobs.map(job => (
        <Card key={job.id} className="border-destructive/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">
                  {job.videoTitle || job.prompt}
                </CardTitle>
                <CardDescription className="mt-1">
                  {job.provider} - {job.model}
                </CardDescription>
              </div>
              {getStatusBadge(job.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {job.error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{job.error}</span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Zap className="w-4 h-4" />
                  Switch Provider
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View Logs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )}
</TabsContent>
```

**Classes EXATAS:**
- Empty state container: `text-center py-12`
- CheckCircle: `w-12 h-12 mx-auto text-green-500 mb-4`
- H3: `text-foreground mb-2`
- Cards de erro: `border-destructive/50`
- CardTitle: `text-base` (menor que default)
- Error box: `flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md`
- AlertCircle no erro: `w-4 h-4 mt-0.5 flex-shrink-0`

---

## 🎨 FUNÇÕES AUXILIARES

### **1. getStatusBadge:**

```tsx
const getStatusBadge = (status: ApiQueueJob['status']) => {
  switch (status) {
    case 'queued':
      return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Queued</Badge>;
    case 'processing':
      return <Badge variant="default" className="gap-1 bg-blue-500"><Play className="w-3 h-3" /> Processing</Badge>;
    case 'completed':
      return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>;
  }
};
```

**Classes EXATAS:**
- Todos os badges: `className="gap-1"` (espaço entre ícone e texto)
- Ícones: `w-3 h-3` (menores que no resto da página)
- Processing: `variant="default" bg-blue-500`
- Completed: `variant="default" bg-green-500`

### **2. getProviderBadge:**

```tsx
const getProviderBadge = (provider: string) => {
  const colors: Record<string, string> = {
    'Runware': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    'Gemini': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    'GPT': 'bg-green-500/10 text-green-700 dark:text-green-300',
    'ElevenLabs': 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
    'Google TTS': 'bg-red-500/10 text-red-700 dark:text-red-300',
    'FFMPEG': 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
  };

  return (
    <Badge variant="outline" className={colors[provider] || ''}>
      {provider}
    </Badge>
  );
};
```

**Cores EXATAS para cada provider:**
- Runware: purple (bg-purple-500/10)
- Gemini: blue (bg-blue-500/10)
- GPT: green (bg-green-500/10)
- ElevenLabs: orange (bg-orange-500/10)
- Google TTS: red (bg-red-500/10)
- FFMPEG: gray (bg-gray-500/10)

---

## 📊 TABELA DE JOBS (renderJobsTable)

### **Estrutura Completa:**

```tsx
const renderJobsTable = (jobs: ApiQueueJob[]) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Provider</TableHead>
        <TableHead>Model</TableHead>
        <TableHead>Video/Prompt</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>ETA</TableHead>
        <TableHead>Created</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {jobs.length === 0 ? (
        <TableRow>
          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
            No jobs in queue
          </TableCell>
        </TableRow>
      ) : (
        jobs.map(job => (
          <TableRow key={job.id}>
            <TableCell className="font-mono text-sm">#{job.id}</TableCell>
            <TableCell>{getProviderBadge(job.provider)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{job.model}</TableCell>
            <TableCell className="max-w-[300px]">
              <div className="space-y-1">
                {job.videoTitle && (
                  <div className="text-sm truncate">{job.videoTitle}</div>
                )}
                {job.prompt && (
                  <div className="text-xs text-muted-foreground truncate">{job.prompt}</div>
                )}
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(job.status)}</TableCell>
            <TableCell className="text-sm">
              {job.eta ? (
                <span className="text-muted-foreground">{job.eta}</span>
              ) : job.completedAt ? (
                <span className="text-green-600 dark:text-green-400">Done</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {new Date(job.createdAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Job Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <Eye className="w-4 h-4" />
                    View Logs
                  </DropdownMenuItem>
                  {job.status === 'failed' && (
                    <>
                      <DropdownMenuItem className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Retry
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Zap className="w-4 h-4" />
                        Switch Provider
                      </DropdownMenuItem>
                    </>
                  )}
                  {job.status === 'queued' && (
                    <DropdownMenuItem className="gap-2 text-destructive">
                      <X className="w-4 h-4" />
                      Cancel
                    </DropdownMenuItem>
                  )}
                  {job.status === 'completed' && (
                    <DropdownMenuItem className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Reprocess
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);
```

**Classes IMPORTANTES:**
- ID cell: `font-mono text-sm` (fonte monoespaçada)
- Model cell: `text-sm text-muted-foreground`
- Video/Prompt cell: `max-w-[300px]` (limita largura)
- Video title: `text-sm truncate`
- Prompt: `text-xs text-muted-foreground truncate`
- ETA cell: `text-sm`
- "Done" text: `text-green-600 dark:text-green-400`
- Created cell: `text-xs text-muted-foreground`
- Empty state: `text-center text-muted-foreground py-8` com `colSpan={8}`

---

## 🔧 ESTADO E HANDLERS

### **Estado:**
```tsx
const [activeTab, setActiveTab] = useState('image');
const [isRefreshing, setIsRefreshing] = useState(false);
const [periodFilter, setPeriodFilter] = useState('24h');
```

### **failedJobs calculado:**
```tsx
const failedJobs = [...mockImageJobs, ...mockAudioJobs, ...mockVideoJobs].filter(
  job => job.status === 'failed'
);
```

### **handleRefresh:**
```tsx
const handleRefresh = () => {
  setIsRefreshing(true);
  setTimeout(() => setIsRefreshing(false), 1000);
};
```

---

## 📦 IMPORTS NECESSÁRIOS

```tsx
import { useState } from 'react';
import { RefreshCw, Play, X, AlertCircle, CheckCircle, Clock, RotateCcw, Eye, Zap, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Sidebar } from './Sidebar';
```

---

## 📱 RESPONSIVIDADE

**Desktop (padrão):**
- Stats grid: 4 colunas
- Tabela: scroll horizontal se necessário

**Tablet/Mobile:**
- Considerar `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` para stats cards
- Header actions podem empilhar verticalmente em mobile

---

## ✅ CHECKLIST FINAL

### **Layout:**
- [ ] Main com `ml-64`/`ml-16` baseado em `isSidebarExpanded`
- [ ] Container: `container mx-auto p-6 max-w-[1600px]`
- [ ] Sidebar recebe `onExpandedChange={onSidebarExpandedChange}`

### **Header:**
- [ ] `flex items-center justify-between mb-6`
- [ ] H1: `text-foreground mb-1` (sem font-size)
- [ ] Select width: `w-[180px]`
- [ ] Refresh button com `animate-spin` quando `isRefreshing`

### **Stats Cards:**
- [ ] Grid: `grid-cols-4 gap-5 mb-6`
- [ ] Cada card: `p-5 shadow-sm`
- [ ] Ícones: `w-4 h-4`
- [ ] Labels: `text-sm`
- [ ] Valores: `text-foreground` (sem font-size)
- [ ] Descrições: `text-xs text-muted-foreground mt-1`

### **Tabs:**
- [ ] Card com CardHeader ("Generation Queues")
- [ ] TabsList: `grid w-full grid-cols-4`
- [ ] TabsContent: `mt-6`
- [ ] Provider Configurations em cada tab

### **Tabelas:**
- [ ] 8 colunas (ID, Provider, Model, Video/Prompt, Status, ETA, Created, Actions)
- [ ] ID com `font-mono text-sm`
- [ ] Video/Prompt com `max-w-[300px]` e `truncate`
- [ ] Dropdown actions condicional por status

### **Failed Tab:**
- [ ] Empty state com CheckCircle verde
- [ ] Cards com `border-destructive/50`
- [ ] Error box com `bg-destructive/10`
- [ ] 3 botões de ação

### **Badges:**
- [ ] Status badges com ícones `w-3 h-3`
- [ ] Provider badges com cores específicas por provider

---

## 🎯 RESULTADO ESPERADO

A página deve ficar **VISUALMENTE IDÊNTICA** à ProductionApiQueue do Figma Make, com:
- ✅ Header limpo e ações à direita
- ✅ 4 stats cards com ícones, valores grandes e descrições
- ✅ Card de tabs com título "Generation Queues"
- ✅ Seções de Provider Configurations antes de cada tabela
- ✅ Tabelas completas com 8 colunas
- ✅ Badges coloridas por status e provider
- ✅ Dropdown de ações condicional
- ✅ Failed tab com cards especiais de erro
- ✅ Sidebar funcionando corretamente (SEM o bug do margin-left)

---

**Status:** 📋 Pronto para implementação no Replit  
**Baseado em:** ProductionApiQueue.tsx do Figma Make  
**Data:** 21/11/2025  
**Objetivo:** Replicação pixel-perfect da UI
