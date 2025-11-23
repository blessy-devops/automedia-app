# 📜 Estrutura Completa de Scroll - Approval Queue 2

## 🎯 Visão Geral do Comportamento de Scroll

Esta página tem **4 áreas distintas** com comportamentos de scroll **independentes**:

1. **Header** → FIXO (não rola NUNCA)
2. **Sidebar da Plataforma** → FIXA (não rola NUNCA)
3. **Painel Esquerdo (Lista de Items)** → Rola INTERNAMENTE (independente)
4. **Painel Direito** → Dividido em 2 partes:
   - **Conteúdo (títulos/thumbnails)** → Rola INTERNAMENTE
   - **Bottom Bar (botões)** → FIXA dentro do painel direito

---

## 📐 Diagrama Visual Completo

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (FIXO - Nunca rola)                                     │ ← FIXO
│  - Título "Approval Queue 2"                                    │
│  - Badges, Toggle Pending/History, Auto-Approve                 │
└─────────────────────────────────────────────────────────────────┘
┌──────┬──────────────────┬───────────────────────────────────────┐
│      │                  │                                       │
│ SIDE │  PAINEL ESQUERDO │       PAINEL DIREITO                  │
│ BAR  │  (Lista Items)   │                                       │
│      │                  │                                       │
│ FIXO │  ┌────────────┐  │  ┌─────────────────────────────────┐ │
│      │  │ [Tabs]     │  │  │  CONTEÚDO (Rola internamente)   │ │
│      │  │ Titles/    │  │  │                                 │ │
│      │  │ Thumbnails │  │  │  • Reference Section            │ │
│      │  └────────────┘  │  │  • Main Title                   │ │
│  │   │  ┌────────────┐  │  │  • Alternative 1                │ │
│  │   │  │ [Search]   │  │  │  • Alternative 2                │ │ ← ROLA
│  │   │  └────────────┘  │  │  • Alternative 3                │ │
│  ↕   │  ┌────────────┐  │  │  • ...                          │ │
│      │  │ Item 1     │  │  │  • Alternative 10               │ │
│ NÃO  │  │ ┌────────┐ │  │  │                                 │ │
│ ROLA │  │ │ Image  │ │  │  │                                 │ │
│      │  │ └────────┘ │  │  └─────────────────────────────────┘ │
│      │  │ Channel    │  │  ┌─────────────────────────────────┐ │
│  │   │  │ Badge      │  │  │  BOTTOM BAR (FIXA)              │ │ ← FIXO
│  │   │  └────────────┘  │  │  "Option 3 selected"            │ │
│      │  │ Item 2     │  │  │  [Reject] [Approve & Next]      │ │
│      │  │ ...        │  │  └─────────────────────────────────┘ │
│      │  │            │  │                                       │
│      │  │ Item 3     │  │                                       │
│      │  └────────────┘  │                                       │
│      │       ↕          │              ↕                        │
│      │   ROLA AQUI      │         ROLA AQUI                     │
│      │  INDEPENDENTE    │        INDEPENDENTE                   │
└──────┴──────────────────┴───────────────────────────────────────┘
```

---

## 🔍 Detalhamento de Cada Área

### 1️⃣ HEADER (Topo da Página)

**Comportamento**: FIXO - Nunca rola

**Conteúdo**:
- Título "Approval Queue 2"
- Badge "Split View"
- Toggle Pending/History
- Toggle Auto-Approve (quando em modo Pending)

**Estrutura CSS**:
```tsx
<div className="border-b border-border bg-card">
  <div className="px-6 py-4">
    {/* Conteúdo do header */}
  </div>
</div>
```

**Características**:
- Não tem `overflow` (não rola)
- Não está dentro de nenhum container com scroll
- Fica fixo no topo da página
- Quando você rola QUALQUER coisa, o header fica parado

---

### 2️⃣ SIDEBAR DA PLATAFORMA (Coluna Lateral Esquerda)

**Comportamento**: FIXA - Nunca rola (é o menu de navegação)

**Conteúdo**:
- Logo Automídia
- Menu de navegação (Dashboard, Channels, Videos, etc.)
- Ícones de navegação

**Estrutura**:
```tsx
<Sidebar 
  currentRoute="productionApprovalQueue2" 
  onNavigate={onNavigate} 
  onExpandedChange={onSidebarExpandedChange} 
/>
```

**Características**:
- Componente padrão da plataforma
- Fica SEMPRE visível
- Não rola (é fixa)
- Expande/colapsa mas não rola verticalmente

---

### 3️⃣ PAINEL ESQUERDO (Lista de Items)

**Comportamento**: ROLA INTERNAMENTE - Scroll independente

**Conteúdo**:
- Tabs (Titles/Thumbnails) - FIXAS no topo do painel
- Campo de busca - FIXO abaixo das tabs
- Lista de items - ROLA

**Estrutura CSS**:
```tsx
<div className="w-96 border-r border-border bg-card flex flex-col overflow-hidden">
  {/* Container principal do painel - NÃO rola */}
  
  {/* 1. TABS - FIXAS */}
  <div className="p-4 border-b border-border flex-shrink-0">
    <Tabs>
      <TabsList>
        <TabsTrigger>Titles</TabsTrigger>
        <TabsTrigger>Thumbnails</TabsTrigger>
      </TabsList>
    </Tabs>
  </div>

  {/* 2. BUSCA - FIXA */}
  <div className="p-4 border-b border-border flex-shrink-0">
    <Input placeholder="Search..." />
  </div>

  {/* 3. LISTA - ROLA */}
  <div className="flex-1 overflow-y-auto">
    {/* Items da lista */}
    <div className="p-2">
      {items.map(item => (
        <button className="w-full p-3 rounded-lg mb-2">
          {/* Item */}
        </button>
      ))}
    </div>
  </div>
</div>
```

**Como funciona o scroll**:
- **Container**: `flex flex-col overflow-hidden` (organiza verticalmente, sem scroll)
- **Tabs**: `flex-shrink-0` (nunca encolhe, fica fixa no topo)
- **Busca**: `flex-shrink-0` (nunca encolhe, fica fixa)
- **Lista**: `flex-1 overflow-y-auto` (cresce e tem scroll próprio)

**Comportamento visual**:
```
┌─────────────────┐
│ [Tabs]          │ ← FIXO (sempre visível)
├─────────────────┤
│ [Search]        │ ← FIXO (sempre visível)
├─────────────────┤
│ Item 1          │ ↑
│ Item 2          │ │
│ Item 3          │ │ ROLA
│ Item 4          │ │ (scroll interno)
│ ...             │ ↓
└─────────────────┘
```

**Importante**:
- ✅ Quando você rola a lista, APENAS a lista rola
- ✅ As tabs e a busca ficam fixas no topo
- ✅ Rolar essa lista NÃO afeta o painel direito
- ✅ Rolar o painel direito NÃO afeta essa lista

---

### 4️⃣ PAINEL DIREITO (Detalhes e Aprovação)

**Comportamento**: Dividido em 2 partes

#### 4.1 - CONTEÚDO (Rola internamente)

**Conteúdo**:
- Seção de referência
- Título principal sugerido
- 11 alternativas (ou 4 thumbnails)

**Estrutura CSS**:
```tsx
<div className="flex-1 flex flex-col overflow-hidden">
  {/* Container principal - NÃO rola */}

  {/* CONTEÚDO - ROLA */}
  <div className="flex-1 overflow-y-auto p-6">
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Reference Section */}
      <div className="bg-muted/50 border p-4 rounded-lg">
        {/* ... */}
      </div>

      {/* Main Title */}
      <div className="bg-gradient-to-r from-yellow-500/10 p-4">
        {/* ... */}
      </div>

      {/* 11 Alternatives */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <label className="flex items-start p-3 rounded-lg border-2">
            <input type="radio" />
            <p>{option.text}</p>
          </label>
        ))}
      </div>
    </div>
  </div>

  {/* BOTTOM BAR - FIXA (próxima seção) */}
</div>
```

**Como funciona**:
- Container externo: `flex flex-col overflow-hidden` (organiza verticalmente)
- Área de conteúdo: `flex-1 overflow-y-auto` (cresce e TEM SCROLL)
- Quando o conteúdo é maior que a tela, aparece scroll SOMENTE nessa div

**Comportamento visual**:
```
┌───────────────────────────┐
│ Reference Section         │ ↑
│ ┌───────────────────────┐ │ │
│ │ Benchmark title...    │ │ │
│ └───────────────────────┘ │ │
│                           │ │
│ Main Title Suggested      │ │
│ ┌───────────────────────┐ │ │ ROLA
│ │ Generated title...    │ │ │ (scroll interno)
│ └───────────────────────┘ │ │
│                           │ │
│ ○ Alternative 1           │ │
│ ○ Alternative 2           │ │
│ ○ Alternative 3           │ │
│ ...                       │ ↓
└───────────────────────────┘
```

#### 4.2 - BOTTOM BAR (Fixa dentro do painel)

**Conteúdo**:
- Texto indicativo ("Option 3 selected")
- Botões Reject e Approve & Next

**Estrutura CSS**:
```tsx
<div className="flex-1 flex flex-col overflow-hidden">
  {/* Conteúdo scrollável (acima) */}
  
  {/* BOTTOM BAR - FIXA */}
  <div className="border-t border-border bg-card p-4 flex-shrink-0">
    <div className="max-w-4xl mx-auto flex items-center justify-between">
      {/* Texto */}
      <div className="text-sm text-muted-foreground">
        Option 3 selected
      </div>

      {/* Botões */}
      <div className="flex gap-2">
        <Button variant="outline">Reject</Button>
        <Button>Approve & Next</Button>
      </div>
    </div>
  </div>
</div>
```

**Como funciona**:
- `flex-shrink-0`: NUNCA encolhe
- `border-t`: borda superior para separar do conteúdo
- Fica SEMPRE no final do container flex
- Não importa quanto você role o conteúdo acima, ela FICA FIXA

**Comportamento visual**:
```
┌───────────────────────────┐
│ (Conteúdo rolando acima)  │ ← Isso rola
│ ...                       │
├───────────────────────────┤ ← Borda separadora
│ Option 3 selected         │ ← FIXO
│         [Reject] [Approve]│ ← FIXO
└───────────────────────────┘
```

**Importante**:
- ✅ A bottom bar NUNCA some da tela
- ✅ A bottom bar NUNCA rola junto com o conteúdo
- ✅ Você sempre vê os botões, não importa onde está no conteúdo

---

## 🎬 Como Funciona na Prática

### Cenário 1: Rolando a Lista de Items (Painel Esquerdo)

Você está na lista e rola para baixo para ver mais items.

**O que acontece**:
- ✅ Lista de items rola para baixo
- ✅ Header continua fixo
- ✅ Sidebar da plataforma continua fixa
- ✅ Tabs (Titles/Thumbnails) continuam fixas no topo da lista
- ✅ Campo de busca continua fixo
- ✅ Painel direito NÃO se move (fica parado)
- ✅ Bottom bar do painel direito NÃO se move

**Código que permite isso**:
```tsx
{/* Painel Esquerdo */}
<div className="w-96 ... flex flex-col overflow-hidden">
  <div className="... flex-shrink-0">Tabs</div>
  <div className="... flex-shrink-0">Busca</div>
  <div className="flex-1 overflow-y-auto">  {/* ← Scroll AQUI */}
    {/* Lista */}
  </div>
</div>
```

---

### Cenário 2: Rolando o Conteúdo (Painel Direito)

Você está vendo as 11 alternativas de títulos e rola para ver as últimas opções.

**O que acontece**:
- ✅ Conteúdo (referência, título principal, alternativas) rola para baixo
- ✅ Header continua fixo
- ✅ Sidebar da plataforma continua fixa
- ✅ Painel esquerdo NÃO se move (fica parado)
- ✅ Bottom bar (botões) continua fixa NO RODAPÉ DO PAINEL DIREITO

**Código que permite isso**:
```tsx
{/* Painel Direito */}
<div className="flex-1 flex flex-col overflow-hidden">
  <div className="flex-1 overflow-y-auto p-6">  {/* ← Scroll AQUI */}
    {/* Conteúdo */}
  </div>
  <div className="... flex-shrink-0">  {/* ← FIXO */}
    {/* Bottom bar */}
  </div>
</div>
```

---

### Cenário 3: Modo History

Quando você clica em "History" no header.

**O que acontece**:
- ✅ Painel esquerdo continua funcionando igual (scroll independente)
- ✅ Painel direito mostra histórico (sem bottom bar)
- ✅ Histórico tem scroll próprio
- ✅ NÃO há bottom bar no modo history (não faz sentido)

**Código**:
```tsx
{viewMode === 'history' ? (
  <div className="flex-1 overflow-y-auto p-6">  {/* ← Scroll do histórico */}
    <ApprovalHistory />
  </div>
) : (
  <>
    <div className="flex-1 overflow-y-auto p-6">  {/* ← Conteúdo */}
    <div className="... flex-shrink-0">           {/* ← Bottom bar */}
  </>
)}
```

---

## 📋 Estrutura HTML Completa e Anotada

```tsx
export function ProductionApprovalQueue2() {
  return (
    <>
      {/* SIDEBAR DA PLATAFORMA - FIXA */}
      <Sidebar currentRoute="productionApprovalQueue2" {...} />

      {/* MAIN CONTENT */}
      <main className={`... ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        
        {/* 1. HEADER - FIXO */}
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            {/* Título, badges, toggles */}
          </div>
        </div>

        {/* 2. SPLIT VIEW CONTAINER */}
        <div className="flex h-[calc(100vh-120px)] overflow-hidden">
          {/* ↑ IMPORTANTE: overflow-hidden aqui impede scroll no container pai */}

          {/* 3. PAINEL ESQUERDO - Lista de Items */}
          <div className="w-96 border-r border-border bg-card flex flex-col overflow-hidden">
            {/* ↑ flex-col: organiza filhos verticalmente
                 ↑ overflow-hidden: sem scroll AQUI, scroll vai estar nos filhos */}

            {/* 3.1 TABS - FIXAS */}
            <div className="p-4 border-b border-border flex-shrink-0">
              {/* ↑ flex-shrink-0: nunca encolhe, fica sempre visível */}
              <Tabs>...</Tabs>
            </div>

            {/* 3.2 BUSCA - FIXA */}
            <div className="p-4 border-b border-border flex-shrink-0">
              {/* ↑ flex-shrink-0: nunca encolhe, fica sempre visível */}
              <Input placeholder="Search..." />
            </div>

            {/* 3.3 LISTA - ROLA */}
            <div className="flex-1 overflow-y-auto">
              {/* ↑ flex-1: cresce para ocupar espaço restante
                   ↑ overflow-y-auto: SCROLL VERTICAL AQUI */}
              <div className="p-2">
                {items.map(item => (
                  <button key={item.id} className="...">
                    {/* Item da lista */}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. PAINEL DIREITO - Detalhes e Aprovação */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* ↑ flex-1: cresce horizontalmente para preencher espaço
                 ↑ flex-col: organiza filhos verticalmente
                 ↑ overflow-hidden: sem scroll AQUI, scroll vai estar nos filhos */}

            {viewMode === 'pending' && selectedItemId ? (
              <>
                {/* 4.1 CONTEÚDO - ROLA */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* ↑ flex-1: cresce verticalmente para ocupar espaço
                       ↑ overflow-y-auto: SCROLL VERTICAL AQUI */}
                  
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Reference Section */}
                    <div className="bg-muted/50 border p-4 rounded-lg">
                      {/* ... */}
                    </div>

                    {/* Main Title */}
                    <div className="bg-gradient-to-r ... p-4">
                      {/* ... */}
                    </div>

                    {/* 11 Alternatives */}
                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <label key={index} className="...">
                          <input type="radio" />
                          <p>{option.text}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4.2 BOTTOM BAR - FIXA */}
                <div className="border-t border-border bg-card p-4 flex-shrink-0">
                  {/* ↑ flex-shrink-0: NUNCA encolhe, SEMPRE visível no rodapé
                       ↑ border-t: borda superior para separar do conteúdo */}
                  
                  <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Option 3 selected
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">Reject</Button>
                      <Button>Approve & Next</Button>
                    </div>
                  </div>
                </div>
              </>
            ) : viewMode === 'history' ? (
              {/* MODO HISTORY - Sem bottom bar */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* ↑ Scroll do histórico, sem bottom bar */}
                <ApprovalHistory />
              </div>
            ) : (
              {/* EMPTY STATE - Sem bottom bar */}
              <div className="flex-1 flex items-center justify-center">
                <p>Select an item to review</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
```

---

## 🎨 Resumo Visual de Todas as Áreas

```
LAYOUT GERAL:
┌─────────────────────────────────────────────────────────────┐
│  HEADER (FIXO - nunca rola)                                 │
├────┬────────────────┬───────────────────────────────────────┤
│SIDE│  PAINEL ESQ    │  PAINEL DIR                           │
│BAR │                │                                       │
│FIXO│  ┌──────────┐  │  ┌─────────────────────────────────┐ │
│    │  │Tabs FIXO │  │  │ Conteúdo ROLA                   │ │
│    │  ├──────────┤  │  │ - Reference                     │ │
│    │  │Busca FIXO│  │  │ - Main Title                    │ │
│    │  ├──────────┤  │  │ - Alt 1                         │ │
│    │  │          │  │  │ - Alt 2                         │ │
│    │  │ Lista    │  │  │ - ...                           │ │
│    │  │ ROLA     │  │  └─────────────────────────────────┘ │
│    │  │ ↕        │  │  ┌─────────────────────────────────┐ │
│    │  │          │  │  │ Bottom Bar FIXA                 │ │
│    │  └──────────┘  │  │ [Reject] [Approve]              │ │
│    │                │  └─────────────────────────────────┘ │
└────┴────────────────┴───────────────────────────────────────┘
     ↕                         ↕
  Rola aqui              Rola aqui
 independente           independente
```

---

## ✅ Checklist de Verificação

Quando implementar, teste cada área:

**Header:**
- [ ] Header fica fixo quando rolo a lista?
- [ ] Header fica fixo quando rolo o conteúdo?

**Sidebar da Plataforma:**
- [ ] Sidebar fica fixa sempre?

**Painel Esquerdo:**
- [ ] Tabs ficam fixas no topo da lista?
- [ ] Campo de busca fica fixo?
- [ ] Lista de items rola independentemente?
- [ ] Quando rolo a lista, o painel direito fica parado?

**Painel Direito:**
- [ ] Conteúdo (alternativas) rola quando há muitos items?
- [ ] Bottom bar fica SEMPRE visível no rodapé?
- [ ] Bottom bar NÃO rola junto com o conteúdo?
- [ ] Quando rolo o conteúdo, o painel esquerdo fica parado?

**Independência:**
- [ ] Rolar painel esquerdo NÃO afeta painel direito?
- [ ] Rolar painel direito NÃO afeta painel esquerdo?
- [ ] Cada área tem seu próprio scroll?

---

## 🔑 Palavras-Chave para Lembrar

- **FIXO** = Não rola NUNCA (header, sidebar, tabs, busca, bottom bar)
- **ROLA INTERNAMENTE** = Tem scroll próprio dentro da área (lista, conteúdo)
- **INDEPENDENTE** = Rolar uma área não afeta outras áreas
- **flex-shrink-0** = Nunca encolhe, sempre visível (elementos fixos)
- **flex-1** = Cresce para ocupar espaço (áreas com scroll)
- **overflow-hidden** = Sem scroll aqui, scroll está nos filhos
- **overflow-y-auto** = Scroll vertical ATIVADO aqui

---

**Use este documento para entender TODA a estrutura de scroll da página!** 📜✨
