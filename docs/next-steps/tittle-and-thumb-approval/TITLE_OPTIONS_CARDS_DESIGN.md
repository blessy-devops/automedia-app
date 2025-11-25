# 🎨 Design dos Cards de Opções de Títulos

## 🎯 Objetivo

Criar cards de opções de títulos que sejam **visualmente idênticos** independente de estarem selecionados ou não, com radio button **sempre visível** e **número centralizado**.

---

## ❌ PROBLEMAS COMUNS (O QUE NÃO FAZER)

### Problema 1: Radio button invisível quando não selecionado
❌ O círculo do radio desaparece quando não está selecionado

### Problema 2: Número descentralizado
❌ O número fica desalinhado quando selecionado

### Problema 3: Cards diferentes
❌ Card selecionado tem aparência diferente (tamanho, padding, layout)

### Problema 4: Bolinha azul estranha
❌ Aparece um círculo azul no canto superior esquerdo quando selecionado

---

## ✅ SOLUÇÃO CORRETA

### Estrutura do Card

Cada card de opção deve ter **EXATAMENTE** a mesma estrutura, mudando apenas:
- Cor da borda (selecionado vs não selecionado)
- Cor de fundo (selecionado vs não selecionado)
- Estado do radio button (checked vs unchecked)

**TUDO O MAIS FICA IDÊNTICO!**

---

## 🏗️ Código Correto Completo

```tsx
{/* Lista de 11 opções */}
<div className="space-y-2">
  {getAllTitleOptions(selectedTitleItem).map((option, index) => (
    <label
      key={index}
      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selectedTitleIndex === index
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
      }`}
    >
      {/* IMPORTANTE: Usar div com estrutura flex para garantir alinhamento */}
      <div className="flex items-center gap-3 w-full">
        {/* 1. NÚMERO - Sempre visível, mesma estrutura */}
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">
            {index + 1}.
          </span>
        </div>

        {/* 2. TEXTO - Ocupa espaço restante */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">
            {option.text}
          </p>
          {option.score && (
            <p className="text-xs text-muted-foreground mt-1">
              Score: {option.score}
            </p>
          )}
        </div>

        {/* 3. RADIO BUTTON - Sempre visível, estilizado customizado */}
        <div className="flex-shrink-0">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selectedTitleIndex === index
                ? 'border-primary bg-primary'
                : 'border-muted-foreground/50 bg-background'
            }`}
          >
            {selectedTitleIndex === index && (
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
            )}
          </div>
          {/* Input radio escondido mas funcional */}
          <input
            type="radio"
            name="title-option"
            value={index}
            checked={selectedTitleIndex === index}
            onChange={() => setSelectedTitleIndex(index)}
            className="sr-only"
          />
        </div>
      </div>
    </label>
  ))}
</div>
```

---

## 📋 Explicação Detalhada

### 1. Container do Card (`<label>`)

```tsx
<label
  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
    selectedTitleIndex === index
      ? 'border-primary bg-primary/5'
      : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
  }`}
>
```

**Classes importantes:**
- `flex items-start gap-3`: Layout flex horizontal, itens no topo, gap de 12px
- `p-4`: Padding consistente de 16px (SEMPRE O MESMO)
- `rounded-lg`: Bordas arredondadas (SEMPRE O MESMO)
- `border-2`: Borda de 2px (SEMPRE O MESMO)
- `cursor-pointer`: Cursor de clique
- `transition-all`: Transição suave

**Classes condicionais** (ÚNICA DIFERENÇA):
- Selecionado: `border-primary bg-primary/5`
- Não selecionado: `border-border bg-card hover:border-primary/50 hover:bg-accent/50`

---

### 2. Container Interno (`<div>`)

```tsx
<div className="flex items-center gap-3 w-full">
```

**Por que precisa disso:**
- Garante que número, texto e radio ficam **alinhados horizontalmente**
- `items-center`: Centraliza verticalmente todos os elementos
- `gap-3`: Espaçamento consistente entre elementos
- `w-full`: Ocupa toda a largura disponível

---

### 3. Número (Sempre Visível)

```tsx
<div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
  <span className="text-sm font-medium text-muted-foreground">
    {index + 1}.
  </span>
</div>
```

**Classes importantes:**
- `flex-shrink-0`: NUNCA encolhe (mantém tamanho fixo)
- `w-6 h-6`: Tamanho fixo de 24x24px
- `flex items-center justify-center`: Centraliza o número dentro
- `text-sm`: Tamanho de fonte pequeno
- `text-muted-foreground`: Cor discreta

**Resultado**: Número sempre centralizado, mesmo tamanho, sempre visível!

---

### 4. Texto (Flexível)

```tsx
<div className="flex-1 min-w-0">
  <p className="text-sm text-foreground leading-relaxed">
    {option.text}
  </p>
  {option.score && (
    <p className="text-xs text-muted-foreground mt-1">
      Score: {option.score}
    </p>
  )}
</div>
```

**Classes importantes:**
- `flex-1`: Cresce para ocupar espaço disponível
- `min-w-0`: Permite que o texto quebre linha se necessário
- `text-sm`: Tamanho de fonte pequeno
- `leading-relaxed`: Espaçamento entre linhas confortável

---

### 5. Radio Button Customizado (Sempre Visível)

```tsx
<div className="flex-shrink-0">
  {/* Circle container */}
  <div
    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
      selectedTitleIndex === index
        ? 'border-primary bg-primary'
        : 'border-muted-foreground/50 bg-background'
    }`}
  >
    {/* Dot inside (only when selected) */}
    {selectedTitleIndex === index && (
      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
    )}
  </div>
  
  {/* Hidden but functional input */}
  <input
    type="radio"
    name="title-option"
    value={index}
    checked={selectedTitleIndex === index}
    onChange={() => setSelectedTitleIndex(index)}
    className="sr-only"
  />
</div>
```

#### Por que usar radio customizado?

**Problema do radio nativo:**
- Navegadores mostram o radio de forma inconsistente
- Alguns escondem o círculo quando não selecionado
- Difícil de estilizar

**Solução:**
1. Criar um círculo customizado com `<div>`
2. Estilizar como quiser
3. Esconder o input nativo com `sr-only` (screen reader only)
4. Input continua funcional para acessibilidade

#### Estados do Radio:

**Não selecionado:**
```
┌─────┐
│  ○  │  ← Círculo vazio, borda cinza
└─────┘
```
- `border-muted-foreground/50`: Borda cinza com 50% opacidade
- `bg-background`: Fundo transparente/background
- Sem dot interno

**Selecionado:**
```
┌─────┐
│  ◉  │  ← Círculo preenchido, borda primary
└─────┘
```
- `border-primary`: Borda na cor primary (azul)
- `bg-primary`: Fundo na cor primary (azul)
- `bg-primary-foreground`: Dot branco interno

---

## 🎨 Estados Visuais

### Estado 1: Não Selecionado

```tsx
┌──────────────────────────────────────────────────────┐
│  3.  On My 70th Birthday, My Executive Son...    ○  │
│      Score: 6/7                                      │
└──────────────────────────────────────────────────────┘
```

**Classes aplicadas:**
- Border: `border-border` (cinza neutro)
- Background: `bg-card` (fundo do card)
- Radio: `border-muted-foreground/50 bg-background` (círculo vazio)

---

### Estado 2: Hover (Não Selecionado)

```tsx
┌──────────────────────────────────────────────────────┐
│  3.  On My 70th Birthday, My Executive Son...    ○  │ ← Hover!
│      Score: 6/7                                      │
└──────────────────────────────────────────────────────┘
```

**Classes aplicadas:**
- Border: `hover:border-primary/50` (azul com 50% opacidade)
- Background: `hover:bg-accent/50` (fundo leve)
- Radio: (mesmo do não selecionado)

---

### Estado 3: Selecionado

```tsx
┌──────────────────────────────────────────────────────┐
│  4.  At Thanksgiving, My Director Son Asked...   ◉  │ ← Selecionado!
│      Score: 7/7                                      │
└──────────────────────────────────────────────────────┘
```

**Classes aplicadas:**
- Border: `border-primary` (azul sólido)
- Background: `bg-primary/5` (azul muito leve, 5% opacidade)
- Radio: `border-primary bg-primary` (círculo preenchido azul)

---

## 🔧 Código Simplificado (Versão Mínima)

Se quiser uma versão mais simples sem score:

```tsx
<div className="space-y-2">
  {getAllTitleOptions(selectedTitleItem).map((option, index) => (
    <label
      key={index}
      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selectedTitleIndex === index
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50'
      }`}
    >
      {/* Número */}
      <span className="flex-shrink-0 w-6 text-sm font-medium text-muted-foreground">
        {index + 1}.
      </span>

      {/* Texto */}
      <p className="flex-1 text-sm text-foreground">
        {option.text}
      </p>

      {/* Radio customizado */}
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selectedTitleIndex === index
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/50'
        }`}
      >
        {selectedTitleIndex === index && (
          <div className="w-2 h-2 rounded-full bg-white" />
        )}
      </div>

      {/* Input escondido */}
      <input
        type="radio"
        name="title-option"
        checked={selectedTitleIndex === index}
        onChange={() => setSelectedTitleIndex(index)}
        className="sr-only"
      />
    </label>
  ))}
</div>
```

---

## ✅ Checklist de Verificação

Ao implementar, verifique:

**Layout:**
- [ ] Todos os cards têm a MESMA altura quando não selecionados?
- [ ] Todos os cards têm a MESMA altura quando selecionados?
- [ ] Padding é CONSISTENTE em todos os cards?
- [ ] Gap entre elementos é CONSISTENTE?

**Número:**
- [ ] Número fica centralizado verticalmente?
- [ ] Número tem a mesma cor em todos os cards?
- [ ] Número tem o mesmo tamanho em todos os cards?
- [ ] Número está alinhado à esquerda consistentemente?

**Texto:**
- [ ] Texto ocupa todo o espaço disponível?
- [ ] Texto quebra linha corretamente se muito longo?
- [ ] Texto tem a mesma cor em selecionado e não selecionado?

**Radio Button:**
- [ ] Círculo é SEMPRE visível (selecionado E não selecionado)?
- [ ] Círculo não selecionado tem borda cinza visível?
- [ ] Círculo selecionado tem borda azul + fundo azul + dot branco?
- [ ] Não aparece "bolinha azul estranha" em lugar nenhum?
- [ ] Radio está alinhado à direita consistentemente?

**Interação:**
- [ ] Clicar no card inteiro seleciona a opção?
- [ ] Hover mostra feedback visual?
- [ ] Transição é suave?

---

## 🚨 ERROS COMUNS E COMO EVITAR

### Erro 1: Radio button nativo visível

❌ **Errado:**
```tsx
<input type="radio" className="mr-2" />
```

✅ **Correto:**
```tsx
<input type="radio" className="sr-only" />
{/* + radio customizado com divs */}
```

---

### Erro 2: Usar componente Radio do shadcn/ui

❌ **Errado:**
```tsx
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
```

**Por que evitar**: Componente do shadcn pode ter estilos que escondem o círculo quando não selecionado.

✅ **Correto:**
Criar radio customizado com `<div>` estilizado manualmente (como mostrado acima).

---

### Erro 3: Número dentro do radio

❌ **Errado:**
```tsx
<input type="radio" />
<span>1. Texto aqui</span>
```

✅ **Correto:**
```tsx
<span>1.</span>
<p>Texto aqui</p>
<div>{/* radio customizado */}</div>
```

---

### Erro 4: Padding diferente quando selecionado

❌ **Errado:**
```tsx
className={selectedTitleIndex === index 
  ? 'p-4 border-2'  // padding diferente
  : 'p-3 border'
}
```

✅ **Correto:**
```tsx
className={`p-4 border-2 ${  // padding SEMPRE o mesmo
  selectedTitleIndex === index 
    ? 'border-primary'
    : 'border-border'
}`}
```

---

## 🎯 Resultado Final Esperado

### Visualmente:

```
3.  On My 70th Birthday, My Executive Son Said, "Dad, Wasn't It Nice of Derek to Fix Your Roof?"    ○
    Score: 6/7

4.  At Thanksgiving, My Director Son Asked, "Dad, Do You Appreciate The $7500 Kevin Gives You?"     ◉
    Score: 7/7

5.  On My 70th Birthday, My Chief Son Said, "Dad, Wasn't It Nice of Derek to Fix Your Roof?"        ○
    Score: 6/7
```

**Características:**
- ✅ Todos os cards têm a MESMA estrutura
- ✅ Números alinhados à esquerda
- ✅ Textos ocupam espaço central
- ✅ Radios alinhados à direita
- ✅ Radio SEMPRE visível (vazio ou preenchido)
- ✅ Cards com bordas consistentes
- ✅ Selecionado: borda azul + fundo azul leve + radio preenchido
- ✅ Não selecionado: borda cinza + fundo normal + radio vazio

---

## 📦 Função Helper getAllTitleOptions

```tsx
const getAllTitleOptions = (item: TitleItem) => {
  return [
    {
      text: item.mainTitle,
      score: item.mainTitleScore,
      isMain: true
    },
    ...item.alternatives.map(alt => ({
      text: alt.text,
      score: alt.score,
      isMain: false
    }))
  ];
};
```

---

**Use este documento para implementar os cards de opções PERFEITAMENTE!** 🎨✨
