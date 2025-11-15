# Documentação Automedia Platform

## Índice

### Features

- **[Video Production Sync](./features/video-production-sync.md)**: Sistema de sincronização de vídeos para bancos de produção via webhooks

### Integrações Externas

- **[Edge Function: receive-benchmark-videos](./external-integration/receive-benchmark-videos-webhook.md)**: Especificação completa da Edge Function para receber vídeos no banco de produção

### Setup & Deployment

- **[Production Deployment Guide](./setup/production-deployment-guide.md)**: Guia completo de deployment do sistema de produção

---

## Quick Start: Video Production Sync

### Resumo

O sistema permite enviar vídeos enriquecidos da plataforma Automedia para bancos de dados de produção externos através de webhooks HTTP.

### Fluxo Simplificado

```
1. Configurar webhook em /settings/webhooks
2. Selecionar vídeos em /videos
3. Clicar "Enviar para Produção"
4. Selecionar webhook de destino
5. Confirmar envio
```

### Arquivos Principais

**Backend:**
- `supabase/migrations/20251114_create_production_webhooks.sql` - Schema das tabelas
- `app/(dashboard)/videos/actions.ts` - Server action `sendVideosToProduction()`
- `app/(dashboard)/settings/webhooks/actions.ts` - CRUD de webhooks

**Frontend:**
- `app/(dashboard)/settings/webhooks/page.tsx` - Página de configuração
- `app/(dashboard)/videos/components/send-to-production-button.tsx` - Botão e dialog
- `app/(dashboard)/settings/webhooks/components/*` - Componentes de UI

**Tipos:**
- `types/supabase.ts` - Tipos do banco (`production_webhooks`, `webhook_logs`)

### Para Implementar no Banco de Produção

1. Crie a tabela `benchmark_videos` (ver documentação)
2. Crie a Edge Function `receive-benchmark-videos`
3. Deploy da função
4. Configure o webhook na plataforma com a URL da função

**Documentação completa:** [production-deployment-guide.md](./setup/production-deployment-guide.md)

---

## Estrutura das Documentações

```
docs/
├── README.md (este arquivo)
├── features/
│   └── video-production-sync.md          # Como usar a feature
├── external-integration/
│   └── receive-benchmark-videos-webhook.md  # Implementar Edge Function
└── setup/
    └── production-deployment-guide.md    # Deploy completo
```

---

## Tecnologias

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: React Server Components + Server Actions
- **API**: Edge Functions (Deno)

---

## Manutenção

### Atualizar Tipos TypeScript

Quando o schema do banco mudar:

```bash
npx supabase gen types typescript --project-id [PROJECT-ID] > types/supabase.ts
```

### Criar Nova Migration

```bash
# Formato: YYYYMMDD_description.sql
touch supabase/migrations/$(date +%Y%m%d)_description.sql
```

### Deploy

```bash
# Frontend (Next.js)
npm run build
vercel --prod

# Backend (Supabase)
supabase db push
supabase functions deploy [function-name]
```

---

## Contribuindo

Ao adicionar novas features:

1. ✅ Crie migration se necessário
2. ✅ Atualize tipos TypeScript
3. ✅ Implemente backend (Server Actions)
4. ✅ Implemente frontend (componentes)
5. ✅ Crie documentação em `docs/features/`
6. ✅ Atualize este README se relevante

---

## Licença

Proprietary - Automedia Platform
