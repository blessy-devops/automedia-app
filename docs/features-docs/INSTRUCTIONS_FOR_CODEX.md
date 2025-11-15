# INSTRUÇÕES PARA O CODEX CORRIGIR O CLAUDE

## CONTEXTO

O Claude tentou importar o design do Figma redesign para as telas de Production Videos, mas NÃO FICOU IDÊNTICO. Ele deixou parecido, mas faltam detalhes de estilização, alguns componentes visuais, e tem problemas de layout (como conteúdo infinito para direita na tela de detalhes).

## ARQUIVOS DE REFERÊNCIA (DESIGN CORRETO - FIGMA)

**Estes são os arquivos que contêm o design CORRETO do Figma:**

1. `/Users/daviluis/Documents/automedia-platform/redesign-figma-new-version/src/components/ProductionVideos.tsx`
2. `/Users/daviluis/Documents/automedia-platform/redesign-figma-new-version/src/components/ProductionVideoDetails.tsx`

## ARQUIVOS QUE O CLAUDE FEZ (INCORRETOS)

**Estes são os arquivos que precisam ser corrigidos:**

1. `/Users/daviluis/Documents/automedia-platform/automedia/app/production-videos/page.tsx`
2. `/Users/daviluis/Documents/automedia-platform/automedia/app/production-videos/[id]/page.tsx`

## PROBLEMAS IDENTIFICADOS

### Problema #1: Layout Quebrado na Tela de Detalhes
**Arquivo**: `app/production-videos/[id]/page.tsx`

**Problema**: O layout está infinito para direita. O conteúdo não está contido.

**Solução**: Comparar LINHA POR LINHA com o arquivo do Figma (`ProductionVideoDetails.tsx`) e replicar EXATAMENTE:
- Estrutura de divs
- Classes de container (`max-w-`, `overflow-hidden`, etc)
- Flex containers e suas propriedades
- Width constraints

### Problema #2: Diferenças de Estilização

**O que está faltando:**

1. **Backgrounds sutis**: O Figma tem alguns backgrounds `bg-muted/30` ou `bg-muted/50` que o Claude não replicou
2. **Sombras**: Falta `shadow-sm` em alguns cards/componentes
3. **Bordas arredondadas**: Alguns componentes têm `rounded-lg` vs `rounded-md` - precisa ser EXATO
4. **Espaçamentos**: Gaps, paddings e margins precisam ser IDÊNTICOS (ex: `gap-3` vs `gap-2`)
5. **Tamanhos de fonte**: Alguns textos são `text-sm` no Figma mas o Claude colocou `text-base`
6. **Cores de ícones**: Algumas cores de ícones estão diferentes (ex: `text-muted-foreground` vs `text-foreground`)

### Problema #3: Componentes Visuais Faltando

**Verifique se TODOS estes elementos do Figma estão presentes:**

1. Linhas divisórias (`border-b`, `border-t`)
2. Estados de hover (`hover:bg-accent`)
3. Transições (`transition-colors`, `transition-all`)
4. Status badges com cores EXATAS
5. Progress bars com estilos EXATOS
6. Ícones posicionados corretamente

## INSTRUÇÕES DETALHADAS PARA O CODEX

### PASSO 1: Análise Linha por Linha

Para CADA arquivo (lista e detalhes):

1. Abra o arquivo do Figma lado a lado com o arquivo do Claude
2. Compare LINHA POR LINHA a estrutura de divs
3. Compare TODAS as classes Tailwind
4. Anote TODAS as diferenças em uma lista

### PASSO 2: Correção Sistemática

**Para cada diferença encontrada:**

1. Copie a classe/estrutura EXATA do Figma
2. Cole no arquivo do Claude
3. NÃO invente. NÃO melhore. APENAS copie.

**Áreas críticas para verificar:**

#### Na Lista (ProductionVideos/page.tsx):

- [ ] Container principal tem as classes corretas
- [ ] Stats cards têm backgrounds, sombras e espaçamentos EXATOS
- [ ] Tabela tem zebra striping correto (`bg-muted/30` nas rows alternadas)
- [ ] Input de busca tem border radius, padding, sombra EXATOS
- [ ] Botões de paginação têm estados hover/disabled EXATOS
- [ ] Progress bars têm altura, cor, border radius EXATOS

#### Nos Detalhes (ProductionVideoDetails/[id]/page.tsx):

- [ ] **CRÍTICO**: Main container tem `overflow-hidden` ou `max-w-` para prevenir scroll horizontal
- [ ] Sidebar tem largura EXATA (`w-80`)
- [ ] Content area tem `flex-1` e constraints corretos
- [ ] Hero section tem layout flex EXATO
- [ ] Thumbnail tem tamanho EXATO (`w-80 h-45`)
- [ ] Tabs têm border-bottom e estados ativos EXATOS
- [ ] Story beats timeline tem spacing e cores EXATAS
- [ ] Segmentos de áudio/vídeo têm grid/layout EXATO

### PASSO 3: Verificação de Consistência

Depois de corrigir:

1. Compare visualmente no browser com screenshots do Figma
2. Verifique que NÃO há scroll horizontal
3. Verifique que todos os espaçamentos estão corretos
4. Verifique que todas as cores estão corretas
5. Verifique estados hover/active

## DIFERENÇAS ESPECÍFICAS ENCONTRADAS

### Lista (ProductionVideos)

**O que o Figma tem que o Claude não copiou:**

1. **Stats Cards**:
   ```tsx
   // FIGMA (correto):
   <div className="bg-card rounded-lg border border-border p-5 shadow-sm">

   // CLAUDE (pode estar faltando shadow-sm ou padding diferente)
   ```

2. **Table rows alternadas**:
   ```tsx
   // FIGMA (correto):
   className={`border-b border-border hover:bg-accent transition-colors cursor-pointer ${
     index % 2 === 0 ? '' : 'bg-muted/30'
   }`}
   ```

3. **Progress bar**:
   ```tsx
   // FIGMA (correto):
   <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
     <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${video.progress}%` }} />
   </div>
   ```

### Detalhes (ProductionVideoDetails)

**O que o Figma tem que o Claude não copiou:**

1. **Main container** (CRÍTICO para fix do scroll horizontal):
   ```tsx
   // FIGMA (correto):
   <div className="flex min-h-screen">
     <main className="flex-1 bg-background">
       <div className="flex">
         <aside className="w-80 bg-card border-r border-border p-6 min-h-screen">
           {/* sidebar */}
         </aside>
         <div className="flex-1 p-8">
           {/* content - DEVE ter max-width ou overflow control */}
         </div>
       </div>
     </main>
   </div>
   ```

2. **Hero section com thumbnail**:
   ```tsx
   // FIGMA (correto):
   <div className="flex gap-6">
     <img src="..." className="w-80 h-45 object-cover rounded-lg" />
     <div className="flex-1">
       {/* content */}
     </div>
   </div>
   ```

3. **Tabs border**:
   ```tsx
   // FIGMA (correto):
   <div className="flex gap-2 mb-4 border-b border-border">
     <button className={`px-4 py-2 text-sm transition-colors ${
       activeTab === 'script' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
     }`}>
   ```

4. **Story beats timeline**:
   ```tsx
   // FIGMA (correto - tem positioning e z-index):
   <div className="relative">
     <div className="flex justify-between mb-2">
       {/* dots */}
     </div>
     <div className="h-0.5 bg-border absolute top-1.5 left-0 right-0" style={{ zIndex: -1 }} />
   </div>
   ```

## CHECKLIST FINAL

Antes de dizer que está pronto, o Codex DEVE verificar:

- [ ] NÃO há scroll horizontal na página de detalhes
- [ ] Todas as classes Tailwind são IDÊNTICAS ao Figma
- [ ] Todos os backgrounds estão corretos
- [ ] Todas as sombras estão presentes
- [ ] Todos os espaçamentos (gap, padding, margin) são EXATOS
- [ ] Todos os border-radius são EXATOS
- [ ] Todas as cores de texto/ícones são EXATAS
- [ ] Estados hover/active funcionam EXATAMENTE como no Figma
- [ ] Progress bars têm estilo EXATO
- [ ] Badges de status têm cores EXATAS

## REGRA DE OURO

**NÃO INVENTE. NÃO MELHORE. NÃO SIMPLIFIQUE.**

Se o Figma tem uma classe, COPIE EXATAMENTE.
Se o Figma tem uma estrutura de div, COPIE EXATAMENTE.
Se o Figma tem um espaçamento específico, COPIE EXATAMENTE.

## COMO EXECUTAR

1. O Codex vai receber este documento
2. O Codex vai ler os 4 arquivos mencionados
3. O Codex vai comparar linha por linha
4. O Codex vai corrigir TUDO que está diferente
5. O Codex vai testar no browser
6. O Codex vai confirmar que está 100% idêntico

---

**Data**: 2025-11-15
**Autor**: Davi Luis (via Claude que reconhece suas limitações)
**Objetivo**: Fazer o Codex corrigir o trabalho do Claude para atingir 100% de fidelidade ao Figma
