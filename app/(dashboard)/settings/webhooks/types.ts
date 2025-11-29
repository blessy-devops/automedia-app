// ============================================================================
// WEBHOOK TYPES - Shared constants and types
// ============================================================================

export type WebhookType = 'benchmark' | 'regeneration' | 'creation' | 'notification'

export const WEBHOOK_TYPES: { value: WebhookType; label: string; description: string }[] = [
  { value: 'benchmark', label: 'Benchmark', description: 'Envio de vídeos para produção' },
  { value: 'regeneration', label: 'Regeneração', description: 'Regerar thumb/script/content' },
  { value: 'creation', label: 'Criação', description: 'Criar conteúdo novo' },
  { value: 'notification', label: 'Notificação', description: 'Alertas gerais' },
]
