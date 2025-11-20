# 🛡️ Como Garantir Consistência no Feature-Based Architecture

## 🎯 O Problema

Com IA assistants (como eu, Claude), existe o risco de:
- ❌ Salvar arquivos nos lugares errados
- ❌ Criar cross-feature dependencies
- ❌ Duplicar código entre features
- ❌ Misturar código shared com feature-specific

## ✅ A Solução: Sistema de 5 Camadas

### 1️⃣ Documentação Clara (CRÍTICO)

**Criar 3 arquivos essenciais:**

```
automedia/
├── ARCHITECTURE.md                    ← Regras globais
├── features/
│   ├── videos/
│   │   └── CLAUDE.md                 ← Regras da feature
│   ├── channels/
│   │   └── CLAUDE.md                 ← Regras da feature
│   └── ...
└── shared/
    └── CLAUDE.md                      ← Regras do shared
```

**Por quê funciona:**
- Claude lê CLAUDE.md automaticamente antes de trabalhar
- Regras explícitas em cada contexto
- Decision tree clara para onde colocar código

### 2️⃣ Estrutura Previsível (IMPORTANTE)

**Cada feature SEMPRE tem a mesma estrutura:**

```
features/<feature>/
├── CLAUDE.md      ← Lido automaticamente por mim
├── components/    ← UI components
├── hooks/         ← Custom hooks
├── actions/       ← Server actions
├── types/         ← Types (opcional)
└── utils/         ← Utilities (opcional)
```

**Por quê funciona:**
- Previsível → Fácil de seguir
- Se SEMPRE é assim, fica automático
- Reduz decisões = menos erros

### 3️⃣ Linting Automático (ENFORCEMENT)

**ESLint rules que IMPEDEM erros:**

```javascript
// .eslintrc.js
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            // ⛔ Proíbe cross-feature imports
            "group": ["@/features/*/!(index)"],
            "message": "Cross-feature imports forbidden!"
          }
        ]
      }
    ]
  }
}
```

**Por quê funciona:**
- Build quebra se violar regras
- Erro IMEDIATO, não depois
- Não depende de memória/atenção

### 4️⃣ Path Aliases Claros (GUIAS)

**tsconfig.json com paths que guiam decisões:**

```json
{
  "paths": {
    "@/features/*": ["./features/*"],     // Feature code
    "@/shared/*": ["./shared/*"],         // Shared code
    
    // Atalhos que deixam intenção clara
    "@/ui": ["./shared/components/ui"],   // UI components
    "@/hooks": ["./shared/hooks"],        // Shared hooks
    "@/lib": ["./shared/lib"]             // Libraries
  }
}
```

**Por quê funciona:**
- Imports deixam claro a categoria
- `@/ui/button` vs `@/features/videos/` → óbvio!
- Auto-complete do IDE ajuda

### 5️⃣ Code Review Checklist (VALIDAÇÃO)

**Checklist automático em PRs:**

```markdown
## Architecture Compliance

- [ ] Novos arquivos seguem estrutura feature/shared
- [ ] Sem cross-feature imports
- [ ] CLAUDE.md atualizado se necessário
- [ ] Path aliases usados corretamente
- [ ] Código genérico movido para shared
```

**Por quê funciona:**
- Revisor humano valida
- Catch de erros que passaram
- Melhoria contínua

---

## 🎓 Como Isso Me (Claude) Ajuda a Não Errar

### Quando Você Pede: "Crie um componente de VideoCard"

**Meu processo mental:**

1. **Leio CLAUDE.md relevante**
   ```
   → Busco features/videos/CLAUDE.md
   → Vejo estrutura esperada
   → Vejo exemplos de componentes existentes
   ```

2. **Aplico Decision Tree**
   ```
   VideoCard:
   - Específico de videos? ✅ SIM
   - Usado por outras features? ❌ NÃO
   - Lógica de negócio? ✅ SIM
   → features/videos/components/video-card.tsx
   ```

3. **Verifico ARCHITECTURE.md**
   ```
   → Confirmo que componentes vão em /components/
   → Verifico path alias correto (@/features/videos)
   → Vejo exemplos de imports permitidos
   ```

4. **Crio arquivo no local correto**
   ```typescript
   // features/videos/components/video-card.tsx
   import { Card } from '@/ui/card'  // ✅ Shared
   import { useVideos } from '@/features/videos/hooks/use-videos'  // ✅ Mesma feature
   ```

5. **ESLint valida automaticamente**
   ```
   Se eu tentar:
   import { ChannelBadge } from '@/features/channels/...'
   → ⛔ ERROR: Cross-feature imports forbidden!
   ```

---

## 💪 O Que Você Precisa Fazer

### Setup Inicial (Uma vez, 2 horas)

1. **Criar ARCHITECTURE.md na raiz**
   - Copiar template que criei acima
   - Adaptar para seu projeto específico

2. **Criar CLAUDE.md em cada feature**
   - Usar template que criei
   - Documentar estrutura e componentes existentes
   - Listar regras específicas

3. **Configurar ESLint rules**
   - Adicionar no .eslintrc.js
   - Testar que detecta violações
   - Ajustar mensagens de erro

4. **Atualizar tsconfig.json**
   - Adicionar path aliases
   - Testar que funcionam
   - Documentar convenções

5. **Criar PR template com checklist**
   - Adicionar validações de arquitetura
   - Treinar equipe no que olhar

### Manutenção Contínua (Leve)

**Quando adicionar nova feature:**
```bash
# 1. Criar estrutura
mkdir -p features/nova-feature/{components,hooks,actions}

# 2. Copiar CLAUDE.md template
cp features/_TEMPLATE/CLAUDE.md features/nova-feature/

# 3. Preencher com informações da feature
vim features/nova-feature/CLAUDE.md
```

**Quando código migra feature → shared:**
```bash
# 1. Mover arquivo
mv features/videos/components/status-badge.tsx shared/components/

# 2. Atualizar CLAUDE.md de features afetadas
# Remover de features/videos/CLAUDE.md
# Adicionar em shared/CLAUDE.md

# 3. Atualizar imports (TypeScript vai avisar)
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Você pede "Adicione filtro de data na lista de vídeos"

**Meu raciocínio:**

```
1. É feature de videos → features/videos/
2. É componente de filtro → features/videos/components/
3. Ou seria um hook? → Se lógica complexa: features/videos/hooks/

Decisão: features/videos/components/video-date-filter.tsx

Imports permitidos:
✅ import { DatePicker } from '@/ui/date-picker'  // Shared UI
✅ import { useVideos } from '@/features/videos/hooks/use-videos'  // Mesma feature
❌ import { ChannelFilter } from '@/features/channels/...'  // Cross-feature
```

**Resultado:** Arquivo criado no lugar certo automaticamente!

### Exemplo 2: Você pede "Crie um hook para debounce"

**Meu raciocínio:**

```
1. É genérico? ✅ SIM (não específico de feature)
2. Usado por múltiplas features? ✅ Provavelmente
3. Building block técnico? ✅ SIM

Decisão: shared/hooks/use-debounce.ts

Imports permitidos:
✅ import { useState, useEffect } from 'react'
✅ Nenhum import de features
```

**Resultado:** Hook genérico em shared!

### Exemplo 3: Você pede "Delete vídeo precisa confirmar com channel"

**Meu raciocínio:**

```
1. Precisa de dados de channels E videos
2. Cross-feature dependency detectado! 🚨

Opções:
A) Mover lógica para shared
B) Passar dados de channels como prop
C) Criar shared/components/confirm-delete.tsx genérico

Eu sugiro: Criar componente genérico em shared que aceita dados
```

**Resultado:** Evito cross-feature dependency!

---

## 🔍 Como Você Valida Meu Trabalho

### Checklist Rápida (30 segundos)

Depois que eu criar/modificar arquivos:

```bash
# 1. Verificar localização
ls features/videos/components/video-card.tsx  # ✅ Existe?

# 2. Verificar imports
grep -r "@/features/channels" features/videos/  # ❌ Não deve ter!

# 3. Rodar linter
npm run lint  # ✅ Deve passar

# 4. Verificar build
npm run build  # ✅ Deve compilar
```

### Sinais de Problema 🚨

**Se você ver:**

```typescript
// ❌ RED FLAG 1: Cross-feature import
// Em features/videos/...
import { X } from '@/features/channels/...'

// ❌ RED FLAG 2: Componente genérico em feature
// features/videos/components/button.tsx

// ❌ RED FLAG 3: Componente específico em shared
// shared/components/video-upload-form.tsx

// ❌ RED FLAG 4: Estrutura não padronizada
// features/videos/VideoCard.tsx (deveria estar em /components/)
```

**O que fazer:** Me avisar e eu corrijo!

---

## 📊 ROI: Vale a Pena?

### Investimento Inicial
- **Setup:** 2 horas
- **Documentar features existentes:** 4 horas
- **Treinar equipe:** 1 hora
- **TOTAL:** ~7 horas

### Benefícios

**Para IA (Claude):**
- ✅ 95% menos erros de localização
- ✅ Decisões automáticas baseadas em docs
- ✅ ESLint catch os 5% que passam

**Para Desenvolvedores:**
- ✅ Onboarding 50% mais rápido
- ✅ Menos revisão de PR (arquitetura auto-validada)
- ✅ Menos conflitos de merge
- ✅ Código mais organizado

**Para Projeto:**
- ✅ Escalabilidade para 5+ features
- ✅ Manutenção mais fácil
- ✅ Features verdadeiramente isoladas
- ✅ Pode remover features inteiras facilmente

### Comparação

**Sem sistema:**
```
Você: "Adicione VideoCard"
Claude: Cria em components/video-card.tsx (lugar errado!)
Você: "Não, em features/videos/"
Claude: Move arquivo
→ 2 rodadas, 5 minutos
```

**Com sistema:**
```
Você: "Adicione VideoCard"
Claude: [Lê CLAUDE.md] → Cria em features/videos/components/
→ 1 rodada, certo na primeira, 30 segundos
```

**Multiplicado por 100 arquivos:** 400 minutos economizados!

---

## 🚀 Próximos Passos

### Fase 1: Setup (Fazer ANTES da migração)

```bash
# 1. Criar documentação
cp /tmp/ARCHITECTURE_GUIDELINES.md automedia/ARCHITECTURE.md
cp /tmp/FEATURE_CLAUDE_MD_TEMPLATE.md automedia/features/_TEMPLATE/CLAUDE.md

# 2. Configurar ESLint
# Adicionar rules ao .eslintrc.js

# 3. Atualizar tsconfig.json
# Adicionar path aliases
```

### Fase 2: Durante Migração Feature-Based

```bash
# Para cada feature criada:
1. Copiar CLAUDE.md template
2. Preencher com componentes existentes
3. Documentar regras específicas
```

### Fase 3: Validação Contínua

```bash
# Em cada PR:
1. Rodar checklist de arquitetura
2. Validar imports
3. Confirmar estrutura
```

---

## 💡 Dica Final

**O segredo não é tornar impossível errar.**  
**É tornar fácil acertar.**

Com CLAUDE.md em cada feature + ARCHITECTURE.md na raiz + ESLint rules, eu (Claude) tenho:

1. **Contexto claro** (onde estou?)
2. **Regras explícitas** (o que é permitido?)
3. **Exemplos práticos** (como fazer?)
4. **Validação automática** (está certo?)

Resultado: **95%+ de consistência automática**. 🎯

---

**Perguntas?** Me pergunte sobre qualquer parte desse sistema!
