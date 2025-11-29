# ⚙️ CONTENT APPROVAL - Funções e Action Bar

## 🎯 ETAPA 6: ACTION BAR (Barra de Ações)

### 6.1 - Atualizar Status Info

**LOCALIZAÇÃO:** Dentro da `<div className="border-t border-border bg-card p-4 flex-shrink-0">` (linha ~1600)

**CÓDIGO ATUAL:**
```tsx
<div className="text-sm text-muted-foreground">
  {activeTab === 'titles' && selectedTitleIndex !== undefined && (
    <span>Option {selectedTitleIndex + 1} selected</span>
  )}
  {activeTab === 'titles' && selectedTitleIndex === undefined && (
    <span>Select a title to continue</span>
  )}
  {activeTab === 'thumbnails' && (
    <span>Ready to approve or regenerate</span>
  )}
</div>
```

**CÓDIGO MODIFICADO (ADICIONAR ESTE BLOCO):**
```tsx
<div className="text-sm text-muted-foreground">
  {activeTab === 'titles' && selectedTitleIndex !== undefined && (
    <span>Option {selectedTitleIndex + 1} selected</span>
  )}
  {activeTab === 'titles' && selectedTitleIndex === undefined && (
    <span>Select a title to continue</span>
  )}
  {activeTab === 'thumbnails' && (
    <span>Ready to approve or regenerate</span>
  )}
  {activeTab === 'content' && (
    <div className="flex items-center gap-2">
      <Package className="w-4 h-4" />
      <span>Aprovando pacote completo (3 itens)</span>
    </div>
  )}
</div>
```

**VISUAL:**
```
┌────────────────────────────────────────────────────┐
│ 📦 Aprovando pacote completo (3 itens)            │
└────────────────────────────────────────────────────┘
```

**CLASSES:**
- Container: `flex items-center gap-2`
- Ícone: `<Package className="w-4 h-4" />`
- Text: Herdado do container pai (`text-sm text-muted-foreground`)

---

### 6.2 - Atualizar Botões de Ação

**LOCALIZAÇÃO:** Logo após o status info (linha ~1613)

**CÓDIGO ATUAL:**
```tsx
<div className="flex gap-2">
  {activeTab === 'titles' ? (
    <>
      <Button variant="outline" onClick={handleRejectTitle} className="gap-2">
        <XCircle className="w-4 h-4" />
        Reject
      </Button>
      <Button onClick={handleApproveTitle} disabled={selectedTitleIndex === undefined} className="gap-2">
        <CheckCircle2 className="w-4 h-4" />
        Approve & Next
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={handleRejectAndRegenerateThumbnail} className="gap-2">
        <XCircle className="w-4 h-4" />
        Reprovar e Regerar
      </Button>
      <Button onClick={handleApproveThumbnail} className="gap-2">
        <CheckCircle2 className="w-4 h-4" />
        Aprovar & Next
      </Button>
    </>
  )}
</div>
```

**CÓDIGO MODIFICADO (ADICIONAR NOVA CONDIÇÃO):**
```tsx
<div className="flex gap-2">
  {activeTab === 'titles' ? (
    <>
      <Button variant="outline" onClick={handleRejectTitle} className="gap-2">
        <XCircle className="w-4 h-4" />
        Reject
      </Button>
      <Button onClick={handleApproveTitle} disabled={selectedTitleIndex === undefined} className="gap-2">
        <CheckCircle2 className="w-4 h-4" />
        Approve & Next
      </Button>
    </>
  ) : activeTab === 'thumbnails' ? (
    <>
      <Button variant="outline" onClick={handleRejectAndRegenerateThumbnail} className="gap-2">
        <XCircle className="w-4 h-4" />
        Reprovar e Regerar
      </Button>
      <Button onClick={handleApproveThumbnail} className="gap-2">
        <CheckCircle2 className="w-4 h-4" />
        Aprovar & Next
      </Button>
    </>
  ) : activeTab === 'content' ? (
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
</div>
```

**VISUAL:**
```
┌────────────────────────────────────────────────────────────────┐
│                        [Reject Package]  [Approve All]         │
│                        ❌ outline        ✅ primary             │
└────────────────────────────────────────────────────────────────┘
```

**OBSERVAÇÕES:**
- Botão 1: `variant="outline"` (cinza)
- Botão 2: `variant="default"` (primary/azul)
- Ambos com `className="gap-2"` (espaço entre ícone e texto)
- Textos em inglês: "Reject Package" e "Approve All"

---

## 🎯 ETAPA 7: IMPLEMENTAR FUNÇÕES DE APROVAÇÃO/REJEIÇÃO

### 7.1 - handleApproveContent

**LOCALIZAÇÃO:** Logo após `handleRejectAndRegenerateThumbnail` (linha ~830)

**CÓDIGO COMPLETO DA FUNÇÃO:**

```tsx
const handleApproveContent = () => {
  const currentItem = mockPendingContent.find(c => c.id === selectedItemId);
  if (!currentItem) return;
  
  // Add to history
  const historyEntry: ApprovalHistoryContent = {
    id: Date.now(),
    itemId: currentItem.id,
    videoId: currentItem.videoId,
    channelName: currentItem.channelName,
    channelColor: currentItem.channelColor,
    videoTitle: currentItem.videoTitle,
    teaser: currentItem.teaser,
    script: currentItem.script,
    description: currentItem.description,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: 'You',
    autoApproved: autoApprovalContent
  };
  setContentHistory(prev => [historyEntry, ...prev]);
  
  console.log(`Approved content package for video ${currentItem.videoId}`);
  
  // Remove from list
  if (selectedItemId) {
    setRemovedContentIds(prev => new Set([...prev, selectedItemId]));
  }
  
  // Move to next item or clear selection
  const currentIndex = filteredContent.findIndex(c => c.id === selectedItemId);
  if (currentIndex < filteredContent.length - 1) {
    setSelectedItemId(filteredContent[currentIndex + 1].id);
  } else if (currentIndex > 0) {
    setSelectedItemId(filteredContent[currentIndex - 1].id);
  } else {
    setSelectedItemId(null);
  }
};
```

**FLUXO DA FUNÇÃO:**

1. **Buscar item atual:**
   ```tsx
   const currentItem = mockPendingContent.find(c => c.id === selectedItemId);
   if (!currentItem) return;
   ```

2. **Criar entrada no histórico:**
   - Usa timestamp atual: `Date.now()`
   - Status: `'approved'`
   - Salva TODOS os dados (teaser, script, description)
   - Usa flag `autoApproved: autoApprovalContent`

3. **Adicionar ao início do histórico:**
   ```tsx
   setContentHistory(prev => [historyEntry, ...prev]);
   ```

4. **Logar ação:**
   ```tsx
   console.log(`Approved content package for video ${currentItem.videoId}`);
   ```

5. **Remover da lista pendente:**
   ```tsx
   setRemovedContentIds(prev => new Set([...prev, selectedItemId]));
   ```

6. **Navegar para próximo item:**
   - Se tem próximo → seleciona próximo
   - Se não tem próximo mas tem anterior → seleciona anterior
   - Se é o último → limpa seleção (`null`)

---

### 7.2 - handleRejectContent

**LOCALIZAÇÃO:** Logo após `handleApproveContent`

**CÓDIGO COMPLETO DA FUNÇÃO:**

```tsx
const handleRejectContent = () => {
  const currentItem = mockPendingContent.find(c => c.id === selectedItemId);
  if (!currentItem) return;
  
  // Add to history
  const historyEntry: ApprovalHistoryContent = {
    id: Date.now(),
    itemId: currentItem.id,
    videoId: currentItem.videoId,
    channelName: currentItem.channelName,
    channelColor: currentItem.channelColor,
    videoTitle: currentItem.videoTitle,
    teaser: currentItem.teaser,
    script: currentItem.script,
    description: currentItem.description,
    status: 'rejected',
    approvedAt: new Date().toISOString(),
    approvedBy: 'You',
    autoApproved: false
  };
  setContentHistory(prev => [historyEntry, ...prev]);
  
  console.log(`Rejected content package for video ${currentItem.videoId} - Will regenerate`);
  
  // Remove from list
  if (selectedItemId) {
    setRemovedContentIds(prev => new Set([...prev, selectedItemId]));
  }
  
  // Move to next item or clear selection
  const currentIndex = filteredContent.findIndex(c => c.id === selectedItemId);
  if (currentIndex < filteredContent.length - 1) {
    setSelectedItemId(filteredContent[currentIndex + 1].id);
  } else if (currentIndex > 0) {
    setSelectedItemId(filteredContent[currentIndex - 1].id);
  } else {
    setSelectedItemId(null);
  }
};
```

**DIFERENÇAS EM RELAÇÃO AO APPROVE:**

1. **Status diferente:**
   ```tsx
   status: 'rejected'
   ```

2. **autoApproved sempre false:**
   ```tsx
   autoApproved: false
   ```

3. **Log diferente:**
   ```tsx
   console.log(`Rejected content package for video ${currentItem.videoId} - Will regenerate`);
   ```

4. **Restante IDÊNTICO ao approve:**
   - Mesma lógica de remoção
   - Mesma lógica de navegação
   - Mesma estrutura de histórico

---

## 🎯 ETAPA 8: ATUALIZAR COMPONENTE ApprovalHistory

### 8.1 - Adicionar ícone Package

**ARQUIVO:** `/components/ApprovalHistory.tsx`

**LOCALIZAÇÃO:** Linha 1

**CÓDIGO ATUAL:**
```tsx
import { CheckCircle2, XCircle, Clock, Sparkles, User } from 'lucide-react';
```

**CÓDIGO MODIFICADO:**
```tsx
import { CheckCircle2, XCircle, Clock, Sparkles, User, Package } from 'lucide-react';
```

---

### 8.2 - Adicionar interface ApprovalHistoryContent

**LOCALIZAÇÃO:** Logo após `interface ApprovalHistoryThumbnail` (linha ~34)

**ADICIONAR ESTE CÓDIGO:**

```tsx
interface ApprovalHistoryContent {
  id: number;
  itemId: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  videoTitle: string;
  teaser: string;
  script: string;
  description: string;
  status: 'approved' | 'rejected';
  approvedAt: string;
  approvedBy: string;
  autoApproved: boolean;
}
```

---

### 8.3 - Atualizar interface ApprovalHistoryProps

**LOCALIZAÇÃO:** Interface `ApprovalHistoryProps` (linha ~36)

**CÓDIGO ATUAL:**
```tsx
interface ApprovalHistoryProps {
  titleHistory: ApprovalHistoryTitle[];
  thumbnailHistory: ApprovalHistoryThumbnail[];
  activeTab: 'titles' | 'thumbnails';
}
```

**CÓDIGO MODIFICADO:**
```tsx
interface ApprovalHistoryProps {
  titleHistory: ApprovalHistoryTitle[];
  thumbnailHistory: ApprovalHistoryThumbnail[];
  contentHistory: ApprovalHistoryContent[];
  activeTab: 'titles' | 'thumbnails' | 'content';
}
```

---

### 8.4 - Atualizar assinatura da função

**LOCALIZAÇÃO:** Função `ApprovalHistory` (linha ~42)

**CÓDIGO ATUAL:**
```tsx
export function ApprovalHistory({ titleHistory, thumbnailHistory, activeTab }: ApprovalHistoryProps) {
```

**CÓDIGO MODIFICADO:**
```tsx
export function ApprovalHistory({ titleHistory, thumbnailHistory, contentHistory, activeTab }: ApprovalHistoryProps) {
```

---

### 8.5 - Adicionar renderização de Content History

**LOCALIZAÇÃO:** Logo após o bloco `if (activeTab === 'titles') { ... }` (linha ~164)

**ADICIONAR ESTE CÓDIGO COMPLETO:**

```tsx
if (activeTab === 'content') {
  return (
    <div className="space-y-3">
      {contentHistory.length === 0 ? (
        <div className="py-16 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No approval history yet</p>
        </div>
      ) : (
        contentHistory.map((item) => (
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
                  <Package className="w-4 h-4 text-muted-foreground" />
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
                <p className="text-sm font-medium mb-3">{item.videoTitle}</p>

                {/* Content Preview */}
                {item.status === 'approved' && (
                  <div className="space-y-2 mt-3">
                    {/* Teaser */}
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded p-2">
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">🎬 Teaser</p>
                      <p className="text-xs line-clamp-2">{item.teaser}</p>
                    </div>

                    {/* Script Preview */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded p-2">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">📝 Script ({item.script.length.toLocaleString()} chars)</p>
                      <p className="text-xs line-clamp-2 font-mono">{item.script.substring(0, 100)}...</p>
                    </div>

                    {/* Description Preview */}
                    <div className="bg-green-500/5 border border-green-500/20 rounded p-2">
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">📄 Description ({item.description.length} chars)</p>
                      <p className="text-xs line-clamp-2">{item.description.substring(0, 100)}...</p>
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
```

**ESTRUTURA DO CARD NO HISTÓRICO:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅  📦 [DramatizeMe] [Approved] [✨ Auto]     Nov 29, 2:30 PM   │
│                                                                 │
│     On Father's Day, My CEO Son Asked...                       │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ 🎬 Teaser                                           │   │
│     │ Um pai emocionado descobre a verdade sobre...      │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ 📝 Script (28.450 chars)                            │   │
│     │ [INT. SALA DE ESTAR - DIA] FADE IN: JOHN...        │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ 📄 Description (450 chars)                          │   │
│     │ 🎬 Uma história emocionante sobre sacrifício...     │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│     👤 You  •  🕐 2h ago                                        │
└─────────────────────────────────────────────────────────────────┘
```

**PREVIEW BOXES - CORES:**
- Teaser: `bg-purple-500/5 border border-purple-500/20`
- Script: `bg-blue-500/5 border border-blue-500/20`
- Description: `bg-green-500/5 border border-green-500/20`

**PREVIEW BOXES - LABELS:**
- Teaser: `text-purple-700 dark:text-purple-400`
- Script: `text-blue-700 dark:text-blue-400`
- Description: `text-green-700 dark:text-green-400`

**PREVIEW BOXES - TRUNCAMENTO:**
- Teaser: `line-clamp-2` (2 linhas)
- Script: `line-clamp-2` + `substring(0, 100)` (primeiros 100 chars em 2 linhas)
- Description: `line-clamp-2` + `substring(0, 100)`

---

### 8.6 - Atualizar chamada do ApprovalHistory

**ARQUIVO:** `/components/ProductionApprovalQueue2.tsx`

**LOCALIZAÇÃO:** Onde `<ApprovalHistory>` é chamado (linha ~1280)

**CÓDIGO ATUAL:**
```tsx
<ApprovalHistory
  titleHistory={titleHistory}
  thumbnailHistory={thumbnailHistory}
  activeTab={activeTab as 'titles' | 'thumbnails'}
/>
```

**CÓDIGO MODIFICADO:**
```tsx
<ApprovalHistory
  titleHistory={titleHistory}
  thumbnailHistory={thumbnailHistory}
  contentHistory={contentHistory}
  activeTab={activeTab as 'titles' | 'thumbnails' | 'content'}
/>
```

---

Continua no próximo documento (Auto-Approval e Finalizações)...
