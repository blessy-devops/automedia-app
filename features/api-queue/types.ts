/**
 * API Queue Types - Simplified for Figma design
 */

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type JobType = 'image' | 'audio' | 'video'

export type Provider = 'Runware' | 'Gemini' | 'GPT' | 'ElevenLabs' | 'Google TTS' | 'FFMPEG'

export interface ApiQueueJob {
  id: string
  type: JobType
  provider: Provider
  model: string
  videoTitle?: string
  prompt?: string
  status: JobStatus
  eta?: string
  completedAt?: string
  createdAt: string
  error?: string
}

export interface QueueStats {
  processing: number
  queued: number
  completed24h: number
  failed24h: number
}
