# 🎯 Feature-Based Architecture - Plano de Migração

## Estrutura Proposta para AutoMedia

```
automedia/
├── features/                    ← NOVO: Features de negócio
│   │
│   ├── videos/                  ← Feature: Gestão de Videos
│   │   ├── components/
│   │   │   ├── videos-table.tsx
│   │   │   ├── simple-videos-table-new.tsx
│   │   │   ├── video-card.tsx
│   │   │   ├── delete-video-dialog.tsx
│   │   │   └── bulk-delete-videos-dialog.tsx
│   │   ├── hooks/
│   │   │   ├── use-videos.ts
│   │   │   ├── use-video-actions.ts
│   │   │   └── use-video-filters.ts
│   │   ├── actions/
│   │   │   └── video-actions.ts
│   │   ├── types/
│   │   │   └── video.types.ts
│   │   ├── utils/
│   │   │   └── video-helpers.ts
│   │   └── README.md
│   │
│   ├── channels/                ← Feature: Gestão de Canais
│   │   ├── components/
│   │   │   ├── channels-table.tsx (consolidated)
│   │   │   ├── channel-card.tsx
│   │   │   ├── channel-stats.tsx
│   │   │   ├── delete-channel-dialog.tsx
│   │   │   └── toolbar/
│   │   │       └── channels-toolbar.tsx (unified)
│   │   ├── hooks/
│   │   │   ├── use-channels.ts
│   │   │   ├── use-channel-actions.ts
│   │   │   └── use-channel-sync.ts
│   │   ├── actions/
│   │   │   └── channel-actions.ts
│   │   ├── types/
│   │   │   └── channel.types.ts
│   │   └── README.md
│   │
│   ├── production/              ← Feature: Produção de Vídeos
│   │   ├── components/
│   │   │   ├── production-video-list/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── list-item.tsx
│   │   │   │   └── list-filters.tsx
│   │   │   ├── production-video-details/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── metadata-card.tsx
│   │   │   │   ├── steps-progress.tsx
│   │   │   │   ├── enrichment-data.tsx
│   │   │   │   └── actions-toolbar.tsx
│   │   │   └── distribution-flow/
│   │   │       ├── phase0-creation.tsx
│   │   │       ├── phase1-enrichment.tsx
│   │   │       ├── phase2-distribution.tsx
│   │   │       └── phase3-monitoring.tsx
│   │   ├── hooks/
│   │   │   ├── use-production-videos.ts
│   │   │   ├── use-enrichment-pipeline.ts
│   │   │   └── use-distribution-flow.ts
│   │   ├── actions/
│   │   │   ├── production-actions.ts
│   │   │   └── distribution-actions.ts
│   │   └── README.md
│   │
│   ├── benchmark/               ← Feature: Benchmark
│   │   ├── components/
│   │   │   ├── benchmark-table.tsx
│   │   │   ├── benchmark-chart.tsx
│   │   │   └── benchmark-filters.tsx
│   │   ├── hooks/
│   │   │   └── use-benchmark.ts
│   │   ├── actions/
│   │   │   └── benchmark-actions.ts
│   │   └── README.md
│   │
│   ├── radar/                   ← Feature: Radar
│   │   ├── components/
│   │   │   └── radar-dashboard.tsx
│   │   ├── hooks/
│   │   │   └── use-radar.ts
│   │   └── README.md
│   │
│   ├── settings/                ← Feature: Configurações
│   │   ├── components/
│   │   │   ├── api-keys-manager.tsx
│   │   │   ├── webhook-config.tsx
│   │   │   └── user-preferences.tsx
│   │   ├── hooks/
│   │   │   └── use-settings.ts
│   │   ├── actions/
│   │   │   └── settings-actions.ts
│   │   └── README.md
│   │
│   └── auth/                    ← Feature: Autenticação
│       ├── components/
│       │   ├── login-form.tsx
│       │   └── auth-provider.tsx
│       ├── hooks/
│       │   └── use-auth.ts
│       └── README.md
│
├── shared/                      ← NOVO: Código compartilhado
│   ├── components/              ← UI Components genéricos
│   │   ├── ui/                  ← shadcn/ui (Button, Dialog, etc)
│   │   ├── data-table/          ← Generic data table
│   │   │   ├── data-table.tsx
│   │   │   ├── data-table-toolbar.tsx (generic)
│   │   │   └── data-table-pagination.tsx
│   │   ├── layouts/
│   │   │   ├── dashboard-layout.tsx
│   │   │   └── sidebar/
│   │   └── common/
│   │       ├── loading-spinner.tsx
│   │       └── error-boundary.tsx
│   │
│   ├── hooks/                   ← Hooks genéricos
│   │   ├── use-toast.ts
│   │   ├── use-media-query.ts
│   │   ├── use-debounce.ts
│   │   └── use-async-action.ts  ← Generic async handler
│   │
│   ├── lib/                     ← Bibliotecas e utilitários
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── admin.ts
│   │   │   └── middleware.ts
│   │   ├── utils/
│   │   │   ├── cn.ts
│   │   │   ├── format.ts
│   │   │   └── validators.ts
│   │   └── constants/
│   │       └── app-constants.ts
│   │
│   └── types/                   ← Tipos compartilhados
│       ├── database.types.ts    ← Auto-generated
│       ├── api.types.ts
│       └── common.types.ts
│
├── app/                         ← Next.js App Router (thin layer)
│   ├── (dashboard)/
│   │   ├── videos/
│   │   │   ├── page.tsx         ← Import from features/videos
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── channels/
│   │   │   ├── page.tsx         ← Import from features/channels
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── production/
│   │   │   ├── page.tsx         ← Import from features/production
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── benchmark/
│   │   │   └── page.tsx
│   │   ├── radar/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/                     ← API Routes
│   │   └── webhooks/
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── supabase/                    ← Supabase config
│   ├── functions/               ← Edge functions
│   ├── migrations/
│   └── config.toml
│
├── docs/                        ← Documentação
├── scripts/                     ← Scripts de build/deploy
└── public/                      ← Assets estáticos
```

---

## 📋 Plano de Migração (4 Fases)

### FASE 0: Preparação (2 horas)

```bash
# 1. Criar estrutura de diretórios
mkdir -p features/{videos,channels,production,benchmark,radar,settings,auth}
mkdir -p shared/{components,hooks,lib,types}

# 2. Criar README.md em cada feature
for dir in features/*/; do
  echo "# ${dir#features/}" > "$dir/README.md"
done

# 3. Backup do estado atual
git checkout -b backup-before-feature-refactor
git commit -m "backup: before feature-based refactor"
```

### FASE 1: Mover Código Compartilhado (4 horas)

**1.1 - Mover UI Components Genéricos**
```bash
# shadcn/ui components
mv components/ui shared/components/ui

# Generic data table
mkdir shared/components/data-table
mv components/data-table.tsx shared/components/data-table/
mv components/data-table-pagination.tsx shared/components/data-table/

# Layouts
mkdir shared/components/layouts
mv components/dashboard-layout.tsx shared/components/layouts/
mv components/sidebar shared/components/layouts/
```

**1.2 - Mover Hooks Genéricos**
```bash
mv hooks/use-toast.ts shared/hooks/
# Criar novos hooks genéricos:
# - shared/hooks/use-async-action.ts
# - shared/hooks/use-debounce.ts
```

**1.3 - Mover Lib e Utils**
```bash
mv lib shared/
mv types shared/
```

**1.4 - Atualizar Imports**
```typescript
// Antes:
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// Depois:
import { Button } from '@/shared/components/ui/button'
import { useToast } from '@/shared/hooks/use-toast'
```

### FASE 2: Migrar Feature por Feature (12 horas)

**2.1 - Videos Feature (3 horas)**

```bash
# Criar estrutura
mkdir -p features/videos/{components,hooks,actions,types,utils}

# Mover components
mv app/(dashboard)/videos/components/* features/videos/components/

# Mover actions
mv app/(dashboard)/videos/actions.ts features/videos/actions/video-actions.ts

# Criar hooks (extrair de components)
# features/videos/hooks/use-videos.ts
# features/videos/hooks/use-video-actions.ts

# Atualizar page.tsx
```

**Exemplo de `features/videos/hooks/use-videos.ts`:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import type { Video } from '@/shared/types/database.types'

export function useVideos(initialVideos: Video[] = []) {
  const [videos, setVideos] = useState(initialVideos)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { videos, loading, error, fetchVideos, setVideos }
}
```

**Exemplo de `app/(dashboard)/videos/page.tsx`:**
```typescript
// Agora é thin - apenas imports from feature
import { VideosList } from '@/features/videos/components/videos-list'
import { fetchVideos } from '@/features/videos/actions/video-actions'

export default async function VideosPage() {
  const videos = await fetchVideos()
  return <VideosList initialVideos={videos} />
}
```

**2.2 - Channels Feature (3 horas)**

Mesmo processo, consolidando as 3 versões de table:

```bash
mkdir -p features/channels/{components,hooks,actions,types}

# IMPORTANTE: Consolidar as 3 tables em 1
# - channels-table.tsx
# - simple-channels-table.tsx  
# - enhanced-channels-table.tsx
# → features/channels/components/channels-table.tsx (unified)
```

**2.3 - Production Feature (4 horas)**

```bash
mkdir -p features/production/{components,hooks,actions}

# Quebrar componente monolítico
# production-video-details.tsx (900 linhas)
# → production-video-details/
#   ├── index.tsx (orchestrator)
#   ├── metadata-card.tsx
#   ├── steps-progress.tsx
#   ├── enrichment-data.tsx
#   └── actions-toolbar.tsx
```

**2.4 - Outras Features (2 horas)**
- Benchmark
- Radar
- Settings (com admin auth fix!)
- Auth

### FASE 3: Configurar Path Aliases (1 hora)

**tsconfig.json:**
```json
{
  "compilerOptions": {
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
}
```

**Uso:**
```typescript
// Import de feature
import { VideosList } from '@/features/videos/components/videos-list'

// Import de shared
import { Button } from '@/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
```

### FASE 4: Adicionar Feature READMEs (2 horas)

**Exemplo de `features/videos/README.md`:**
```markdown
# Videos Feature

Gerenciamento de vídeos do YouTube para benchmark.

## Componentes

- `videos-table.tsx` - Tabela principal de vídeos
- `video-card.tsx` - Card de vídeo individual
- `delete-video-dialog.tsx` - Dialog de confirmação de delete

## Hooks

- `use-videos.ts` - Fetching e state de vídeos
- `use-video-actions.ts` - Actions (delete, update, etc)
- `use-video-filters.ts` - Filtros da tabela

## Actions (Server)

- `fetchVideos()` - Buscar vídeos do servidor
- `deleteVideo(id)` - Deletar vídeo
- `updateVideo(id, data)` - Atualizar vídeo

## Types

- `Video` - Tipo principal de vídeo
- `VideoFilters` - Filtros da tabela

## Usado Por

- `/app/(dashboard)/videos/page.tsx`
- `/app/(dashboard)/videos/[id]/page.tsx`
```

---

## ✅ Benefícios da Migração

### Antes (Type-Based):
```
Para adicionar "Bulk Edit Videos":
❌ Mexer em 5 pastas diferentes
❌ Procurar onde está cada coisa
❌ Risco de conflitos com outros devs
❌ Imports confusos
```

### Depois (Feature-Based):
```
Para adicionar "Bulk Edit Videos":
✅ Tudo em features/videos/
✅ Claro onde adicionar cada coisa
✅ Zero conflito (feature isolada)
✅ Imports óbvios
```

### Para Novos Desenvolvedores:

**Antes:**
```
"Onde está o código de Videos?"
→ components/videos-table.tsx
→ app/(dashboard)/videos/actions.ts
→ components/delete-video-dialog.tsx
→ ??? onde mais?
```

**Depois:**
```
"Onde está o código de Videos?"
→ features/videos/
   ├── Tudo aqui!
```

### Para Trabalho em Equipe:

```
Antes:
  Dev A: mexe em components/
  Dev B: mexe em components/
  → CONFLITO DE MERGE! 😱

Depois:
  Dev A: mexe em features/videos/
  Dev B: mexe em features/channels/
  → Zero conflitos! 🎉
```

---

## 📊 Estimativa de Esforço

| Fase | Tarefas | Tempo | Risco |
|------|---------|-------|-------|
| **Fase 0** | Preparação, estrutura | 2h | Baixo |
| **Fase 1** | Mover shared code | 4h | Médio |
| **Fase 2** | Migrar features | 12h | Alto |
| **Fase 3** | Config path aliases | 1h | Baixo |
| **Fase 4** | Feature READMEs | 2h | Baixo |
| **TOTAL** | | **21h** | Médio |

**Spread recomendado:** 1 semana (4-5 horas/dia)

---

## 🚨 Riscos e Mitigações

### Risco 1: Build quebrado durante migração
**Mitigação:** 
- Fazer em branch separada
- Commitar após cada feature migrada
- Testar build constantemente

### Risco 2: Imports quebrados
**Mitigação:**
- Usar find & replace em massa
- TypeScript vai mostrar erros
- Rodar `tsc --noEmit` constantemente

### Risco 3: Componentes compartilhados identificados errado
**Mitigação:**
- Fase 1 foca nisso
- Se dúvida, deixar em feature (mover depois)
- Iterar conforme uso

---

## 🎯 Quando Fazer Essa Migração?

### Cenário A: Fazer JUNTO com a limpeza
**Prós:**
- Aproveita momentum
- Consolida tudo de uma vez
- Remove duplicações no processo

**Contras:**
- Mais tempo (21h + 27.5h = 48.5h)
- Mudança grande de uma vez
- Maior risco

### Cenário B: Fazer DEPOIS da limpeza (RECOMENDADO)
**Prós:**
- Limpeza primeiro = menos arquivos pra mover
- Menos risco
- Pode testar limpeza antes

**Contras:**
- 2 grandes refactors

**Timeline:**
```
Semana 1-2: Limpeza (27.5h)
  ↓
Semana 3: Feature refactor (21h)
  ↓
PRONTO para equipe!
```

### Cenário C: Fazer GRADUALMENTE
**Prós:**
- Menor risco
- Pode fazer 1 feature por vez
- Aprende no processo

**Contras:**
- Estrutura mista por semanas
- Pode confundir

---

## 💡 Recomendação Final

**Fazer feature-based? SIM!**

**Quando?**
1. **AGORA:** Fase de limpeza (27.5h)
2. **DEPOIS:** Feature refactor (21h)
3. **Total:** 48.5h (~1.5-2 semanas)

**Por quê?**
- Seu projeto vai crescer
- Múltiplos devs vão trabalhar
- Features são bem definidas
- ROI alto para escalabilidade

**Alternativa mais rápida:**
- Fazer apenas Fase 1 (shared/) agora (4h)
- Migrar features gradualmente conforme mexer nelas

---

## 📚 Próximos Passos

1. **Decidir:** Feature-based agora ou depois?
2. **Se agora:** Seguir plano de 4 fases
3. **Se depois:** Anotar e fazer pós-limpeza
4. **Se gradual:** Começar por shared/ (Fase 1)

Quer que eu crie um plano mais detalhado de alguma fase específica?
