# ✏️ THUMB TEXT - Implementação de Edição

## 🎯 CONTEXTO

**Localização:** Production Approval Queue 2 > Tab "Thumbnails"

**Estado ATUAL:**
```
┌────────────────────────────────────────────┐
│ 📸 Thumbnail de Benchmark                 │
│ [Imagem da thumb de referência]           │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 🎨 Thumbnail Gerada                        │
│ [Imagem da thumb gerada pela IA]          │
└────────────────────────────────────────────┘

[Aprovar] [Reprovar e Regerar]
```

**Estado DESEJADO:**
```
┌────────────────────────────────────────────┐
│ 📸 Thumbnail de Benchmark                 │
│ [Imagem da thumb de referência]           │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 🎨 Thumbnail Gerada                        │
│ [Imagem da thumb gerada pela IA]          │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐ <- NOVO!
│ 📝 TEXTO DA THUMBNAIL  [247 chars] [Mod]  │
│ ┌──────────────────────────────────────┐   │
│ │ MY CEO SON Asked about the $8000    │   │
│ │ I sent each month... The TRUTH will │   │
│ │ shock you 🔥                         │   │
│ └──────────────────────────────────────┘   │
│ ⓘ Texto corrido (sem quebras)...          │
│                      [Resetar ao Original] │
└────────────────────────────────────────────┘

[Aprovar] [Reprovar e Regerar]
```

---

## 📦 O QUE IMPLEMENTAR

### 1. Adicionar campo `thumbText` ao tipo
```tsx
interface PendingThumbnail {
  id: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  videoTitle: string;
  referenceThumbnail: string;
  generatedThumbnail: string;
  thumbText: string;              // <- NOVO
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  author: string;
}
```

### 2. Adicionar estados de edição
```tsx
// Dentro do componente ProductionApprovalQueue2
const [editedThumbText, setEditedThumbText] = useState('');
const [isThumbTextModified, setIsThumbTextModified] = useState(false);
```

### 3. Adicionar card de edição de texto
Card com gradient laranja, textarea editável, contador de caracteres e botão de reset.

### 4. Detectar modificação na aprovação
Ao aprovar, detectar se `thumbText` foi modificado e logar/enviar para backend.

---

## 🔧 IMPLEMENTAÇÃO PASSO A PASSO

### PASSO 1: Atualizar Interface (linha ~255)

**Localizar:**
```tsx
interface PendingThumbnail {
  id: number;
  videoId: number;
  // ... outros campos
}
```

**Adicionar:**
```tsx
interface PendingThumbnail {
  id: number;
  videoId: number;
  channelName: string;
  channelColor: string;
  videoTitle: string;
  referenceThumbnail: string;
  generatedThumbnail: string;
  thumbText: string;              // <- ADICIONAR
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  author: string;
}
```

---

### PASSO 2: Adicionar Estados (linha ~300)

**Localizar:**
```tsx
const [selectedThumbnailItem, setSelectedThumbnailItem] = useState<PendingThumbnail | null>(null);
```

**Adicionar logo abaixo:**
```tsx
const [selectedThumbnailItem, setSelectedThumbnailItem] = useState<PendingThumbnail | null>(null);

// Estados para edição de thumb_text
const [editedThumbText, setEditedThumbText] = useState('');
const [isThumbTextModified, setIsThumbTextModified] = useState(false);

// Sincronizar editedThumbText quando item muda
useEffect(() => {
  if (selectedThumbnailItem) {
    setEditedThumbText(selectedThumbnailItem.thumbText);
    setIsThumbTextModified(false);
  }
}, [selectedThumbnailItem]);
```

**Import necessário (adicionar no topo):**
```tsx
import { useEffect } from 'react'; // Se ainda não tiver
```

---

### PASSO 3: Atualizar Mock Data (linha ~265)

**Localizar:**
```tsx
const mockPendingThumbnails: PendingThumbnail[] = [
  {
    id: 1,
    videoId: 103,
    channelName: 'DramatizeMe',
    channelColor: '#DC2626',
    videoTitle: "On Father's Day, My CEO Son Asked...",
    referenceThumbnail: 'https://...',
    generatedThumbnail: 'https://...',
    // thumbText: ???  <- FALTA ISSO
    createdAt: '2025-11-23T12:00:00',
    status: 'pending',
    author: 'AI Agent'
  },
```

**Adicionar `thumbText` em TODOS os items:**
```tsx
const mockPendingThumbnails: PendingThumbnail[] = [
  {
    id: 1,
    videoId: 103,
    channelName: 'DramatizeMe',
    channelColor: '#DC2626',
    videoTitle: "On Father's Day, My CEO Son Asked, \"Dad, Do You Like The $8000 Marcus Sends You?\"",
    referenceThumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop',
    generatedThumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
    thumbText: 'AT THE $800M CONTRACT HEARING, MY FORMER BOSS CLAIMED MY ENGINEERING WORK AS HIS OWN. WHEN THE CTA BOARD ASKED HIM TO EXPLAIN THE CALCULATIONS ON PAGE 47, HE WENT PALE. THEN THEY TURNED TO ME AND ASKED: "CAN YOU EXPLAIN THIS, MR FREEMAN?"',
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
    thumbText: 'MY CEO SON Asked about the $8000 I sent each month... The TRUTH will shock you 🔥',
    createdAt: '2025-11-23T11:30:00',
    status: 'pending',
    author: 'AI Agent'
  },
];
```

**IMPORTANTE:** Adicionar `thumbText` em TODOS os items do array.

---

### PASSO 4: Adicionar Card de Edição (linha ~1450)

**Localizar dentro de "Thumbnail Review":**
```tsx
{/* Thumbnail Review */}
{selectedThumbnailItem && (
  <div className="max-w-4xl mx-auto space-y-6">
    
    {/* Video Info */}
    <div className="bg-muted/30 ...">
      ...
    </div>

    {/* Reference Thumbnail */}
    <div className="bg-muted/30 ...">
      ...
    </div>

    {/* Generated Thumbnail */}
    <div className="bg-muted/30 ...">
      ...
    </div>

    {/* ADICIONAR AQUI O CARD DE THUMB TEXT */}
```

**Adicionar DEPOIS do card "Generated Thumbnail":**
```tsx
{/* Thumb Text Editor */}
<div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-l-4 border-orange-500 p-4 rounded-lg">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className="text-2xl">📝</span>
      <h3 className="font-semibold">TEXTO DA THUMBNAIL</h3>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="font-mono text-xs">
        {editedThumbText.length} caracteres
      </Badge>
      {isThumbTextModified && (
        <Badge variant="secondary" className="text-xs">Modificado</Badge>
      )}
    </div>
  </div>
  
  {/* Textarea */}
  <Textarea
    value={editedThumbText}
    onChange={(e) => {
      setEditedThumbText(e.target.value);
      setIsThumbTextModified(e.target.value !== selectedThumbnailItem?.thumbText);
    }}
    placeholder="Digite o texto que aparecerá na thumbnail..."
    className="min-h-[120px] font-mono text-sm resize-y bg-background border-2 border-border focus:border-primary"
    rows={5}
  />
  
  {/* Helper + Reset Button */}
  <div className="mt-3 flex items-center justify-between">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <AlertCircle className="w-3 h-3" />
      <span>Texto corrido (sem quebras). Caixa alta e palavras-chave chamam atenção.</span>
    </div>
    {isThumbTextModified && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (selectedThumbnailItem) {
            setEditedThumbText(selectedThumbnailItem.thumbText);
            setIsThumbTextModified(false);
          }
        }}
        className="gap-2 text-xs"
      >
        <RotateCcw className="w-3 h-3" />
        Resetar ao Original
      </Button>
    )}
  </div>
</div>
```

**Imports necessários (adicionar no topo):**
```tsx
import { Textarea } from './ui/textarea';
import { AlertCircle, RotateCcw } from 'lucide-react';
// Badge e Button já devem estar importados
```

---

### PASSO 5: Detectar Modificação na Aprovação (linha ~1600)

**Localizar a função `handleApproveThumbnail`:**
```tsx
const handleApproveThumbnail = (itemId: number) => {
  const item = pendingThumbnails.find(t => t.id === itemId);
  if (!item) return;

  // Lógica de aprovação...
};
```

**Adicionar ANTES da lógica de aprovação:**
```tsx
const handleApproveThumbnail = (itemId: number) => {
  const item = pendingThumbnails.find(t => t.id === itemId);
  if (!item) return;

  // ✅ DETECTAR MODIFICAÇÃO DO THUMB TEXT
  if (isThumbTextModified && editedThumbText !== item.thumbText) {
    console.log('🔥 THUMB TEXT MODIFICADO DETECTADO!');
    console.log('Original:', item.thumbText);
    console.log('Editado:', editedThumbText);
    console.log('Diferença de caracteres:', editedThumbText.length - item.thumbText.length);
    
    // TODO: Enviar para backend
    // await supabase
    //   .from('thumbnails')
    //   .update({ thumb_text: editedThumbText })
    //   .eq('id', itemId);
    
    // TODO: Triggerar regeneração automática da thumbnail com novo texto
    // await fetch('/api/regenerate-thumbnail', {
    //   method: 'POST',
    //   body: JSON.stringify({ thumbnailId: itemId, newText: editedThumbText })
    // });
  }

  // Continua com a aprovação normal...
  setOpenThumbnails(prev => prev.filter(id => id !== itemId));
  setSelectedThumbnailItem(null);
  toast.success('Thumbnail aprovada com sucesso!');
};
```

---

## ✅ CHECKLIST COMPLETO

### Interface e Estados
- [ ] Adicionar campo `thumbText: string` em `PendingThumbnail`
- [ ] Criar estado `editedThumbText`
- [ ] Criar estado `isThumbTextModified`
- [ ] Adicionar `useEffect` para sincronizar com `selectedThumbnailItem`

### Mock Data
- [ ] Adicionar `thumbText` no item id: 1
- [ ] Adicionar `thumbText` no item id: 2
- [ ] Adicionar `thumbText` em TODOS os outros items (se houver)

### Visual
- [ ] Importar `Textarea` do shadcn/ui
- [ ] Importar ícones `AlertCircle` e `RotateCcw` do lucide-react
- [ ] Adicionar card com gradient laranja/âmbar
- [ ] Header com emoji 📝 + título + badges
- [ ] Textarea editável com font-mono
- [ ] Helper com ícone e texto
- [ ] Botão "Resetar ao Original" (condicional)

### Funcionalidade
- [ ] onChange do textarea atualiza `editedThumbText`
- [ ] onChange detecta modificação comparando com original
- [ ] Badge "Modificado" aparece quando `isThumbTextModified = true`
- [ ] Botão "Resetar" aparece quando `isThumbTextModified = true`
- [ ] Botão "Resetar" restaura texto original
- [ ] Função `handleApproveThumbnail` detecta modificação
- [ ] Console.log mostra texto original vs editado

### Testes
- [ ] Abrir Approval Queue 2 > Tab "Thumbnails"
- [ ] Selecionar um item pendente
- [ ] Ver card de edição de texto aparecer
- [ ] Editar o texto e ver badge "Modificado"
- [ ] Ver contador de caracteres atualizar
- [ ] Clicar "Resetar ao Original" e ver texto voltar
- [ ] Aprovar sem modificar (não deve logar)
- [ ] Aprovar com modificação (deve logar no console)

---

## 📏 LAYOUT FINAL

```
┌──────────────────────────────────────────────────────────┐
│ 🎬 Video Info                                            │
│ [DramatizeMe] On Father's Day...                         │
│ Gerado há 2 horas por AI Agent                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 📸 THUMBNAIL DE BENCHMARK                                │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │              [Imagem de referência]                  │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 🎨 THUMBNAIL GERADA                                      │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │              [Imagem gerada pela IA]                 │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 📝 TEXTO DA THUMBNAIL      [247 caracteres] [Modificado]│
│ ┌──────────────────────────────────────────────────────┐ │
│ │ AT THE $800M CONTRACT HEARING, MY FORMER BOSS       │ │
│ │ CLAIMED MY ENGINEERING WORK AS HIS OWN. WHEN THE    │ │
│ │ CTA BOARD ASKED HIM TO EXPLAIN THE CALCULATIONS     │ │
│ │ ON PAGE 47, HE WENT PALE. THEN THEY TURNED TO ME    │ │
│ │ AND ASKED: "CAN YOU EXPLAIN THIS, MR FREEMAN?"      │ │
│ └──────────────────────────────────────────────────────┘ │
│ ⓘ Texto corrido (sem quebras)...  [Resetar ao Original]│
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ ⓘ Dica: Se a thumbnail gerada não atender às            │
│ expectativas, clique em "Reprovar e Regerar"...          │
└──────────────────────────────────────────────────────────┘

              [Aprovar]  [Reprovar e Regerar]
```

---

## 🎨 CORES E CLASSES

### Card de Thumb Text
```tsx
className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-l-4 border-orange-500 p-4 rounded-lg"
```

### Header
- Emoji: `text-2xl` (24px)
- Título: `font-semibold`
- Badge contador: `variant="outline" font-mono text-xs`
- Badge modificado: `variant="secondary" text-xs`

### Textarea
```tsx
className="min-h-[120px] font-mono text-sm resize-y bg-background border-2 border-border focus:border-primary"
```

### Helper
- Ícone: `AlertCircle w-3 h-3` (12px)
- Texto: `text-xs text-muted-foreground`

### Botão Reset
- Variant: `ghost`
- Size: `sm`
- Ícone: `RotateCcw w-3 h-3`

---

## 🚨 REGRAS IMPORTANTES

### ✅ FAZER
1. **Texto corrido** - `thumbText` nunca tem `\n` (quebras de linha)
2. **Font mono** - Facilita contagem de caracteres
3. **Resize vertical** - `resize-y` permite usuário ajustar altura
4. **Detectar modificação** - Comparar `editedThumbText !== item.thumbText`
5. **Estado sincronizado** - `useEffect` atualiza quando item muda
6. **Badges condicionais** - "Modificado" só se `isThumbTextModified = true`
7. **Console.log** - Mostrar original vs editado ao aprovar

### ❌ NÃO FAZER
1. ~~Não usar `\n`~~ - Texto corrido sem quebras manuais
2. ~~Não hardcodar altura~~ - Usar `min-h` + `resize-y`
3. ~~Não esquecer useEffect~~ - Estado precisa sincronizar
4. ~~Não esquecer imports~~ - Textarea, ícones, etc.
5. ~~Não remover lógica original~~ - Só adicionar detecção

---

## 📝 EXEMPLO DE CONSOLE.LOG

Quando o usuário aprovar com texto modificado:

```
🔥 THUMB TEXT MODIFICADO DETECTADO!
Original: MY CEO SON Asked about the $8000 I sent each month... The TRUTH will shock you 🔥
Editado: MY CEO SON CONFRONTED ME about the $8000 I sent each month... The TRUTH will DESTROY you 💥
Diferença de caracteres: 15
```

---

## 🔌 PRÓXIMOS PASSOS (BACKEND)

Depois de implementar o frontend, será necessário:

1. **Supabase Schema:**
   - Criar campo `thumb_text` na tabela `thumbnails`
   
2. **Edge Function:**
   - Criar função para regerar thumbnail com novo texto
   - Endpoint: `POST /api/regenerate-thumbnail`
   
3. **Integração:**
   - Substituir `console.log` por chamada real ao backend
   - Atualizar banco de dados
   - Triggerar regeneração automática

**Mas isso é para depois!** Primeiro implementar o frontend completamente.

---

## 📦 ARQUIVO

**Localização:** `/components/ProductionApprovalQueue2.tsx`

**Linhas a modificar:**
- ~255: Interface `PendingThumbnail`
- ~265: Mock data `mockPendingThumbnails`
- ~300: Estados + useEffect
- ~1450: Card de edição de thumb text
- ~1600: Detecção na aprovação

**Imports a adicionar:**
```tsx
import { useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { AlertCircle, RotateCcw } from 'lucide-react';
```

---

**Documento único de implementação**  
**Versão:** 1.0 Final  
**Data:** 29 de Novembro de 2025
