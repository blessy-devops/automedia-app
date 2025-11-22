/**
 * Adapters to map database VIEW (vw_api_queue_enriched) to TypeScript interfaces
 */

import type { ApiQueueJob, Provider, JobType, JobStatus } from '../types'

/**
 * Maps API provider string from database to Provider type
 */
export function mapProvider(provider: string | null): Provider {
  if (!provider) return 'FFMPEG'

  const normalized = provider.toLowerCase()

  if (normalized.includes('runware')) return 'Runware'
  if (normalized.includes('gemini')) return 'Gemini'
  if (normalized.includes('pollinations')) return 'Gemini'  // Pollinations uses Gemini models
  if (normalized.includes('gpt') || normalized.includes('openai') || normalized.includes('dall')) return 'GPT'
  if (normalized.includes('eleven')) return 'ElevenLabs'
  if (normalized.includes('google') || normalized.includes('tts')) return 'Google TTS'

  return 'FFMPEG'
}

/**
 * Simplifies model name for display
 */
export function simplifyModel(model: string | null): string {
  if (!model) return 'Unknown'

  // Extract meaningful part from complex model strings
  // e.g., "rundiffusion:130@100" -> "Rundiffusion 130"
  if (model.includes('rundiffusion')) {
    const match = model.match(/rundiffusion:(\d+)/)
    return match ? `Rundiffusion ${match[1]}` : 'Rundiffusion'
  }

  // For other models, return simplified version
  if (model.includes('dall-e')) return 'DALL-E 3'
  if (model.includes('imagen')) return 'Imagen 2'
  if (model.includes('eleven')) return 'ElevenLabs TTS'
  if (model.includes('ffmpeg')) return 'FFMPEG'

  // Return first 30 chars if too long
  return model.length > 30 ? model.substring(0, 30) + '...' : model
}

/**
 * Truncates prompt to display length
 */
export function truncatePrompt(prompt: string | null, maxLength: number = 100): string | undefined {
  if (!prompt) return undefined

  if (prompt.length <= maxLength) return prompt

  return prompt.substring(0, maxLength) + '...'
}

/**
 * Calculates estimated time remaining for processing jobs
 */
export function calculateEta(createdAt: string, processedAt: string | null, status: string): string | undefined {
  if (status === 'completed' || processedAt) return undefined

  if (status === 'processing') {
    const created = new Date(createdAt)
    const now = new Date()
    const elapsedMinutes = Math.floor((now.getTime() - created.getTime()) / 1000 / 60)

    // Simple estimate: most jobs complete in 1-3 minutes
    if (elapsedMinutes < 1) return '1m'
    if (elapsedMinutes < 3) return `${3 - elapsedMinutes}m`
    return 'finishing...'
  }

  return undefined
}

/**
 * Maps database VIEW row to ApiQueueJob interface
 */
export function mapViewRowToApiQueueJob(row: any): ApiQueueJob {
  return {
    id: row.id?.toString() || '',
    type: (row.job_type || 'image') as JobType,
    provider: mapProvider(row.api_provider),
    model: simplifyModel(row.model),
    videoTitle: row.video_title || undefined,
    prompt: truncatePrompt(row.prompt),
    status: (row.job_status || 'queued') as JobStatus,
    eta: calculateEta(row.created_at, row.processed_at, row.job_status),
    completedAt: row.processed_at || undefined,
    createdAt: row.created_at,
    error: row.error_message || undefined,
  }
}

/**
 * Maps array of VIEW rows to ApiQueueJob array
 */
export function mapViewRowsToApiQueueJobs(rows: any[]): ApiQueueJob[] {
  if (!rows || rows.length === 0) return []

  return rows.map(mapViewRowToApiQueueJob)
}
