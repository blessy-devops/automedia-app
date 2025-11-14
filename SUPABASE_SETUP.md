# Supabase Configuration Guide

Este documento descreve a configuração e uso dos diferentes clientes Supabase no projeto.

## Estrutura de Clientes

O projeto utiliza **três clientes Supabase distintos**, cada um otimizado para um caso de uso específico:

### 1. Server Client ([lib/supabase/server.ts](lib/supabase/server.ts))

**Quando usar:**
- Server Components
- Server Actions
- Route Handlers (API Routes)

**Características:**
- ✅ Respeita Row Level Security (RLS)
- ✅ Usa contexto do usuário autenticado
- ✅ Gerencia cookies automaticamente
- ✅ Type-safe com TypeScript

**Exemplo:**
```tsx
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function ChannelsPage() {
  const supabase = await createClient()
  const { data: channels } = await supabase
    .from('benchmark_channels')
    .select('*')
    .limit(10)

  return (
    <div>
      <h1>Channels ({channels?.length})</h1>
      {channels?.map(channel => (
        <div key={channel.id}>{channel.channel_name}</div>
      ))}
    </div>
  )
}
```

```tsx
// Server Action
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createChannel(formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('benchmark_channels')
    .insert({
      channel_id: formData.get('channelId') as string,
      channel_name: formData.get('channelName') as string,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 2. Browser Client ([lib/supabase/client.ts](lib/supabase/client.ts))

**Quando usar:**
- Client Components (marcados com `'use client'`)
- Event handlers no browser
- React hooks

**Características:**
- ✅ Respeita Row Level Security (RLS)
- ✅ Usa contexto do usuário autenticado
- ✅ Gerencia cookies automaticamente no browser
- ✅ Ideal para interações em tempo real

**Exemplo:**
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function ChannelsList() {
  const [channels, setChannels] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function loadChannels() {
      const { data } = await supabase
        .from('benchmark_channels')
        .select('*')
        .order('subscriber_count', { ascending: false })
        .limit(10)

      setChannels(data || [])
    }

    loadChannels()

    // Real-time subscription
    const subscription = supabase
      .channel('channels-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'benchmark_channels' },
        (payload) => {
          console.log('Channel changed:', payload)
          loadChannels() // Reload data
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <ul>
      {channels.map(channel => (
        <li key={channel.id}>{channel.channel_name}</li>
      ))}
    </ul>
  )
}
```

### 3. Admin Client ([lib/supabase/admin.ts](lib/supabase/admin.ts))

⚠️ **ATENÇÃO: Use com extremo cuidado!**

**Quando usar:**
- Edge Functions (ambiente seguro)
- Acesso ao Supabase Vault (secrets)
- Operações em bulk que precisam bypassar RLS
- Tarefas administrativas do sistema

**Quando NÃO usar:**
- ❌ Client Components
- ❌ API Routes acessíveis a usuários finais
- ❌ Operações CRUD regulares (use server.ts ou client.ts)

**Características:**
- ⚠️ **BYPASSA Row Level Security (RLS)**
- ⚠️ **Privilégios administrativos completos**
- ✅ Acesso ao Vault para secrets
- ✅ Validação de ambiente (não funciona no browser)

**Exemplo:**
```tsx
// Edge Function / API Route (seguro)
import { createAdminClient, getVaultSecret } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  // Get API key from Vault
  const youtubeApiKey = await getVaultSecret('youtube_api_key')

  if (!youtubeApiKey) {
    return Response.json({ error: 'API key not found' }, { status: 500 })
  }

  // Perform bulk operation with admin privileges
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('benchmark_channels')
    .insert(bulkChannelData) // Bypasses RLS

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
```

## Middleware

O [middleware.ts](middleware.ts) é executado em **todas as requisições** e mantém a sessão do usuário atualizada automaticamente.

**Funcionalidades:**
- Refresh automático de tokens expirados
- Gerenciamento de cookies de auth
- Preparado para proteção de rotas (comentado)

**Como proteger rotas:**
```tsx
// Descomente no middleware.ts:
if (!user && !request.nextUrl.pathname.startsWith('/login')) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}
```

## Variáveis de Ambiente

### Obrigatórias:

```bash
# Public - podem ser expostas ao client
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Private - NUNCA expor ao client
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Como obter as chaves:

1. Acesse: https://app.supabase.com/project/xlpkabexmwsugkmbngwm/settings/api
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Importante**: O `service_role` key deve ser mantido em segredo e **nunca** commitado ao Git.

## Integração com Drizzle ORM

O projeto usa **duas estratégias** para acessar o banco:

### Opção 1: Supabase Client (Recomendado para Auth)

```tsx
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('benchmark_channels').select()
```

**Vantagens:**
- ✅ Respeita RLS automaticamente
- ✅ Usa contexto do usuário autenticado
- ✅ Ideal para operações que dependem de auth

### Opção 2: Drizzle ORM (Recomendado para Workflows)

```tsx
import { db, dbDirect } from '@/lib/drizzle'
import { benchmarkChannelsTable } from '@/lib/drizzle'

// Queries rápidas - shared pooler
const channels = await db.select().from(benchmarkChannelsTable).limit(10)

// Workflows complexos - direct connection
const tasks = await dbDirect.select().from(channelEnrichmentTasksTable)
```

**Vantagens:**
- ✅ Type-safety superior com Drizzle
- ✅ Melhor performance para queries complexas
- ✅ Duas conexões (pooler vs direct)

## Geração de Tipos

Para gerar tipos TypeScript atualizados do banco de dados:

### Opção 1: Via Supabase CLI
```bash
supabase gen types typescript --linked > types/supabase.ts
```

### Opção 2: Via npx (sem CLI instalada)
```bash
npx supabase gen types typescript --project-id xlpkabexmwsugkmbngwm > types/supabase.ts
```

## Segurança

### ✅ Boas Práticas:

1. **Server Client** para Server Components
2. **Browser Client** para Client Components
3. **Admin Client** APENAS em ambientes seguros
4. Nunca expor `SUPABASE_SERVICE_ROLE_KEY`
5. Sempre usar RLS quando possível

### ❌ Erros Comuns:

```tsx
// ❌ ERRADO: Admin client no Client Component
'use client'
import { createAdminClient } from '@/lib/supabase/admin' // SECURITY RISK!

// ✅ CORRETO: Browser client no Client Component
'use client'
import { createClient } from '@/lib/supabase/client'
```

```tsx
// ❌ ERRADO: Browser client no Server Component
import { createClient } from '@/lib/supabase/client' // Won't work properly

// ✅ CORRETO: Server client no Server Component
import { createClient } from '@/lib/supabase/server'
```

## Arquivos Criados

- [lib/supabase/server.ts](lib/supabase/server.ts) - Server Components
- [lib/supabase/client.ts](lib/supabase/client.ts) - Client Components
- [lib/supabase/admin.ts](lib/supabase/admin.ts) - Admin operations
- [middleware.ts](middleware.ts) - Session management
- [types/supabase.ts](types/supabase.ts) - TypeScript types
- [.env](.env) - Environment variables (não commitar!)
- [.env.example](.env.example) - Template de variáveis

## Recursos Adicionais

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
