# 🏗️ Architecture Guidelines - Feature-Based

**LEIA ISTO ANTES DE CRIAR/MOVER QUALQUER ARQUIVO**

## 📂 Estrutura de Diretórios

```
automedia/
├── features/          ← Código específico de features de negócio
├── shared/            ← Código compartilhado entre features
├── app/               ← Next.js App Router (thin routing layer)
├── supabase/          ← Database, migrations, edge functions
└── docs/              ← Documentação
```

## 🎯 Regra de Ouro: "Feature vs Shared"

### ✅ Vai em `features/<nome>/` quando:

1. **É específico de UMA feature de negócio**
   - `VideoCard` → específico de videos
   - `ChannelStats` → específico de channels
   - `useVideos` → manipula estado de videos

2. **Não será usado por outras features**
   - Se só `videos/` usa, fica em `features/videos/`

3. **Tem lógica de negócio específica**
   - Validações específicas de Video
   - Cálculos específicos de Channel

### ✅ Vai em `shared/` quando:

1. **É genérico e reutilizável**
   - `Button`, `Dialog`, `Input` → UI components
   - `useDebounce`, `useMediaQuery` → generic hooks
   - `formatDate`, `cn` → utility functions

2. **É usado por MÚLTIPLAS features**
   - Se `videos/` E `channels/` usam → `shared/`

3. **É infraestrutura técnica**
   - Supabase clients
   - API clients
   - Types do database

## 📋 Decision Tree - Onde Colocar Código?

```
Novo código para adicionar
    │
    ├─ É um componente UI?
    │   ├─ Genérico (Button, Dialog)? → shared/components/ui/
    │   ├─ Layout (Sidebar, Header)? → shared/components/layouts/
    │   └─ Específico (VideoCard)? → features/videos/components/
    │
    ├─ É um hook?
    │   ├─ Genérico (useDebounce)? → shared/hooks/
    │   └─ Específico (useVideos)? → features/videos/hooks/
    │
    ├─ É uma server action?
    │   └─ Específico (deleteVideo)? → features/videos/actions/
    │
    ├─ É um tipo TypeScript?
    │   ├─ Database type? → shared/types/database.types.ts
    │   ├─ Genérico (ActionResult)? → shared/types/common.types.ts
    │   └─ Específico (VideoFilters)? → features/videos/types/
    │
    ├─ É um utility/helper?
    │   ├─ Genérico (formatDate)? → shared/lib/utils/
    │   └─ Específico (calculateVideoScore)? → features/videos/utils/
    │
    └─ É uma página Next.js?
        └─ Sempre em app/ (import de features/)
```

## 🚫 Regras PROIBIDAS (NEVER DO THIS)

### ❌ Cross-Feature Imports

```typescript
// ❌ PROIBIDO: Feature importando de outra feature
// features/videos/components/video-card.tsx
import { ChannelBadge } from '@/features/channels/components/channel-badge'

// ✅ CORRETO: Mova para shared se precisa compartilhar
import { ChannelBadge } from '@/shared/components/channel-badge'
```

### ❌ Código Genérico em Feature

```typescript
// ❌ ERRADO: Hook genérico dentro de feature
// features/videos/hooks/use-debounce.ts
export function useDebounce(value, delay) { ... }

// ✅ CORRETO: Hooks genéricos em shared
// shared/hooks/use-debounce.ts
export function useDebounce(value, delay) { ... }
```

### ❌ Código Específico em Shared

```typescript
// ❌ ERRADO: Componente específico em shared
// shared/components/video-upload-form.tsx
export function VideoUploadForm() { ... }

// ✅ CORRETO: Código específico em feature
// features/videos/components/video-upload-form.tsx
export function VideoUploadForm() { ... }
```

## 📦 Path Aliases Configurados

```typescript
// tsconfig.json
{
  "paths": {
    "@/features/*": ["./features/*"],
    "@/shared/*": ["./shared/*"],
    "@/app/*": ["./app/*"],
    
    // Atalhos convenientes
    "@/ui": ["./shared/components/ui"],
    "@/components": ["./shared/components"],
    "@/hooks": ["./shared/hooks"],
    "@/lib": ["./shared/lib"],
    "@/types": ["./shared/types"]
  }
}
```

**Uso correto:**
```typescript
// ✅ Import de UI genérico
import { Button } from '@/ui/button'

// ✅ Import de feature
import { VideoCard } from '@/features/videos/components/video-card'

// ✅ Import de shared utility
import { formatDate } from '@/lib/utils'
```

## 🏛️ Estrutura Interna de Feature

Cada feature DEVE seguir esta estrutura:

```
features/<feature-name>/
├── CLAUDE.md           ← Documentação da feature (OBRIGATÓRIO)
├── components/         ← UI components da feature
├── hooks/              ← Custom hooks da feature
├── actions/            ← Server actions
├── types/              ← Types específicos (opcional)
├── utils/              ← Utilities específicos (opcional)
└── __tests__/          ← Testes (quando implementado)
```

## 🔍 Como Decidir: Shared vs Feature?

### Pergunta 1: "Quantas features usam isso?"

- **0-1 features** → Feature-specific
- **2+ features** → Shared

### Pergunta 2: "Tem lógica de negócio específica?"

- **Sim** → Feature-specific
- **Não** → Shared

### Pergunta 3: "É um building block técnico?"

- **Sim** (Button, Dialog, useDebounce) → Shared
- **Não** (VideoCard, useVideos) → Feature

### Exemplos Práticos:

```typescript
// VideoCard
// Q1: Só videos usa? SIM
// Q2: Lógica específica de video? SIM
// Q3: Building block técnico? NÃO
// → features/videos/components/video-card.tsx ✅

// Button
// Q1: Múltiplas features usam? SIM
// Q2: Lógica específica? NÃO
// Q3: Building block técnico? SIM
// → shared/components/ui/button.tsx ✅

// DataTable
// Q1: Múltiplas features usam? SIM
// Q2: Lógica específica? NÃO (genérico)
// Q3: Building block técnico? SIM
// → shared/components/data-table/data-table.tsx ✅

// useVideos
// Q1: Só videos usa? SIM
// Q2: Lógica específica de video? SIM
// Q3: Building block técnico? NÃO
// → features/videos/hooks/use-videos.ts ✅

// useDebounce
// Q1: Múltiplas features usam? SIM
// Q2: Lógica específica? NÃO
// Q3: Building block técnico? SIM
// → shared/hooks/use-debounce.ts ✅
```

## 📝 Checklist Antes de Criar Arquivo

Antes de criar QUALQUER arquivo novo:

1. [ ] Li o CLAUDE.md da feature relevante (se aplicável)
2. [ ] Passei pelo Decision Tree acima
3. [ ] Respondi as 3 perguntas (Shared vs Feature)
4. [ ] Verifiquei que não existe arquivo similar
5. [ ] Escolhi o path correto baseado nas regras
6. [ ] Vou atualizar CLAUDE.md da feature depois (se relevante)

## 🚨 Red Flags - Avisos de Problema

Se você se pegar fazendo isso, PARE e revisite as regras:

- ❌ Importando de `@/features/X` dentro de `@/features/Y`
- ❌ Criando componente genérico dentro de feature
- ❌ Criando componente específico dentro de shared
- ❌ Duplicando código entre features (mova para shared!)
- ❌ Arquivo sem categoria clara (não sei onde colocar)

## 🔄 Refatoração: Movendo Entre Feature e Shared

Se código de feature começar a ser usado por outra feature:

```bash
# 1. Mova para shared
mv features/videos/components/status-badge.tsx shared/components/status-badge.tsx

# 2. Atualize imports
# features/videos/... e features/channels/...
import { StatusBadge } from '@/shared/components/status-badge'

# 3. Atualize CLAUDE.md de ambas features
```

## 📚 Recursos

- `/docs/CODEBASE_REVIEW_2025-11-18.md` - Review completo
- `/docs/git-conventions.md` - Git workflow
- `features/*/CLAUDE.md` - Documentação de cada feature
- `shared/components/ui/` - shadcn/ui components

---

**Última atualização:** 2025-11-18

⚠️ **IMPORTANTE:** Claude Code lerá este arquivo antes de criar/mover código.
Mantenha atualizado!
