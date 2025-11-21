/**
 * Mock Data for API Queue - Figma Design
 */

import { ApiQueueJob, Provider } from '../types'

const videoTitles = [
  'How to Build a Viral YouTube Channel in 2025',
  'React 19: Complete Tutorial for Beginners',
  'The Future of AI Development',
  'Next.js 15 App Router Deep Dive',
  'Supabase Full Stack Tutorial',
]

const imagePrompts = [
  'A futuristic cityscape at sunset with flying cars',
  'Professional headshot with modern office background',
  'Abstract geometric pattern in vibrant colors',
  'Minimalist logo design for tech startup',
  'Social media banner with gradient and typography',
]

function randomId(): string {
  return Math.random().toString(36).substr(2, 6)
}

function randomDate(hoursAgo: number): string {
  const date = new Date()
  date.setHours(date.getHours() - Math.floor(Math.random() * hoursAgo))
  return date.toISOString()
}

function randomEta(): string {
  const minutes = Math.floor(Math.random() * 10) + 1
  return `${minutes}m`
}

export const mockImageJobs: ApiQueueJob[] = [
  {
    id: randomId(),
    type: 'image',
    provider: 'Runware',
    model: 'SD XL 1.0',
    videoTitle: videoTitles[0],
    prompt: imagePrompts[0],
    status: 'processing',
    eta: randomEta(),
    createdAt: randomDate(1),
  },
  {
    id: randomId(),
    type: 'image',
    provider: 'Gemini',
    model: 'Imagen 2',
    videoTitle: videoTitles[1],
    prompt: imagePrompts[1],
    status: 'queued',
    createdAt: randomDate(2),
  },
  {
    id: randomId(),
    type: 'image',
    provider: 'GPT',
    model: 'DALL-E 3',
    videoTitle: videoTitles[2],
    prompt: imagePrompts[2],
    status: 'completed',
    completedAt: randomDate(3),
    createdAt: randomDate(4),
  },
  {
    id: randomId(),
    type: 'image',
    provider: 'Runware',
    model: 'SD XL 1.0',
    videoTitle: videoTitles[3],
    prompt: imagePrompts[3],
    status: 'failed',
    error: 'Rate limit exceeded. Provider API returned 429. Will retry in 5 minutes with exponential backoff.',
    createdAt: randomDate(2),
  },
]

export const mockAudioJobs: ApiQueueJob[] = [
  {
    id: randomId(),
    type: 'audio',
    provider: 'ElevenLabs',
    model: 'Eleven Turbo v2',
    videoTitle: videoTitles[0],
    status: 'processing',
    eta: randomEta(),
    createdAt: randomDate(1),
  },
  {
    id: randomId(),
    type: 'audio',
    provider: 'Google TTS',
    model: 'Neural2',
    videoTitle: videoTitles[4],
    status: 'queued',
    createdAt: randomDate(2),
  },
  {
    id: randomId(),
    type: 'audio',
    provider: 'ElevenLabs',
    model: 'Eleven Multilingual v2',
    videoTitle: videoTitles[1],
    status: 'completed',
    completedAt: randomDate(3),
    createdAt: randomDate(5),
  },
]

export const mockVideoJobs: ApiQueueJob[] = [
  {
    id: randomId(),
    type: 'video',
    provider: 'FFMPEG',
    model: 'Pipeline A (1080p)',
    videoTitle: videoTitles[0],
    status: 'processing',
    eta: '15m',
    createdAt: randomDate(1),
  },
  {
    id: randomId(),
    type: 'video',
    provider: 'FFMPEG',
    model: 'Pipeline B (4K)',
    videoTitle: videoTitles[3],
    status: 'queued',
    createdAt: randomDate(1),
  },
  {
    id: randomId(),
    type: 'video',
    provider: 'FFMPEG',
    model: 'Pipeline A (1080p)',
    videoTitle: videoTitles[2],
    status: 'completed',
    completedAt: randomDate(2),
    createdAt: randomDate(4),
  },
  {
    id: randomId(),
    type: 'video',
    provider: 'FFMPEG',
    model: 'Pipeline B (4K)',
    videoTitle: videoTitles[1],
    status: 'failed',
    error: 'FFmpeg process crashed due to insufficient memory. Consider reducing video resolution or enabling hardware acceleration.',
    createdAt: randomDate(3),
  },
]

export function getMockStats() {
  const allJobs = [...mockImageJobs, ...mockAudioJobs, ...mockVideoJobs]

  return {
    processing: allJobs.filter(j => j.status === 'processing').length,
    queued: allJobs.filter(j => j.status === 'queued').length,
    completed24h: allJobs.filter(j => j.status === 'completed').length,
    failed24h: allJobs.filter(j => j.status === 'failed').length,
  }
}
