// types/production-video.ts
// TypeScript interfaces for Production Videos

export type ProductionVideoStatus =
  | 'published'
  | 'scheduled'
  | 'processing'
  | 'waiting'
  | 'pending_approval'
  | 'failed'
  | 'on_hold'
  | 'canceled'

export type EmotionalState = 'calm' | 'curiosity' | 'tension' | 'fear' | 'relief' | 'triumph'

export type CharacterRole = 'protagonist' | 'antagonist' | 'mentor' | 'ally' | 'supporting'

export type SegmentStatus = 'concatenated' | 'completed' | 'failed' | 'processing' | 'pending'

export type WorkflowStageStatus = 'completed' | 'processing' | 'pending' | 'failed'

// Lista de vídeos (para a página de listagem)
export interface ProductionVideo {
  id: number
  title: string
  thumbnailUrl: string
  status: ProductionVideoStatus
  progress: number // 0-100
  currentStage: string
  createdAt: string
  updatedAt: string
  language: string
  platform: string
  sourceChannel: string
  sourceYoutubeVideoId?: string
  youtubeId?: string
  productionDays: number
  plannedUploadDate?: string
}

// Stats para os cards
export interface ProductionStats {
  total: number
  published: number
  processing: number
  failed: number
  onHold: number
}

// Detalhes completos do vídeo
export interface ProductionVideoDetails {
  // Basic info
  id: number
  title: string
  thumbnailUrl: string
  status: ProductionVideoStatus
  language: string
  platform: string
  createdAt: string
  updatedAt: string
  description: string
  tags: string
  finalLink?: string
  youtubeId?: string

  // Links (Google Drive)
  parentFolder: string
  audioFolderUrl: string
  videoSegmentsFolder: string
  thumbnailFolderUrl: string
  coveringImagesFolder: string

  // Progress
  productionDays: number
  progressPercentage: number
  currentStage: number
  totalStages: number

  // Source video
  sourceVideo: SourceVideo

  // Narrative
  narrative: NarrativeAnalysis

  // Content
  script: string
  storyCast: CharacterProfile[]
  richOutline: Chapter[]

  // Production assets
  audioSegments: AudioSegment[]
  videoSegments: VideoSegment[]

  // Workflow
  workflowStages: WorkflowStage[]
}

export interface SourceVideo {
  id: number
  title: string
  thumbnailUrl: string
  channelName: string
  channelId: string
  views: number
  uploadDate: string
  duration: string
  youtubeUrl: string
  youtubeVideoId: string
  transcript: string
}

export interface NarrativeAnalysis {
  structureModel: string
  centralTheme: string
  emotionalCore: string
  conflictType: string
  storyBeats: StoryBeat[]
}

export interface StoryBeat {
  name: string
  timestamp: string
  emotionalState: EmotionalState
  description: string
  keyElements?: string[]
}

export interface CharacterProfile {
  name: string
  archetype: string
  role: CharacterRole
  description: string
  imageUrl: string
  traits: string[]
}

export interface Chapter {
  chapterNumber: number
  title: string
  summary: string
  emotionalArc: string
  duration: string
  keyScenes?: string[]
}

export interface AudioSegment {
  number: number
  text: string
  duration: number // in seconds
  status: SegmentStatus
  audioUrl: string
  jobId?: string
}

export interface VideoSegment {
  id: number
  segmentNumber: number
  thumbnailUrl: string
  filename: string
  status: SegmentStatus
  imageCount: number
  videoUrl: string
}

export interface WorkflowStage {
  id: number
  name: string
  status: WorkflowStageStatus
  completedAt?: string
}

// Filters for list page
export interface ProductionVideosFilters {
  status?: ProductionVideoStatus | 'all'
  search?: string
  page?: number
  perPage?: number
}

// RPC function response types
export interface GetProductionVideosResponse {
  videos: ProductionVideo[]
  total: number
  stats: ProductionStats
}
