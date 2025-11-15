// app/production-videos/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Play, Download, Copy, Edit, CheckCircle2, Circle, Loader2, Clock, Users, Video, FileText, Image as ImageIcon, Music, Folder, ChevronDown, ChevronUp } from 'lucide-react'
import { getProductionVideoDetails } from '@/app/actions/production-videos'
import type { ProductionVideoDetails } from '@/types/production-video'
import { ProductionVideoDetailsSkeleton } from '@/components/ProductionVideosSkeletons'

/**
 * ProductionVideoDetails Component - Visualização completa de um vídeo em produção
 *
 * Exibe todas as informações sobre um vídeo desde a seleção do benchmark até a publicação final:
 *
 * ESTRUTURA:
 * 1. Hero Section: Título, thumbnail, status, descrição, tags
 * 2. Sidebar (direita):
 *    - Progresso com steps visuais
 *    - Links importantes (YouTube, Drive folders)
 *    - Timeline de eventos
 * 3. Análise Narrativa:
 *    - Modelo estrutural (Hero's Journey)
 *    - Tema central e núcleo emocional
 *    - Story beats visuais com timeline
 * 4. Conteúdo Produzido (tabs):
 *    - Script completo
 *    - Story Cast (personagens/arquétipos)
 *    - Rich Outline (estrutura detalhada)
 * 5. Segmentos de Áudio (expandível)
 * 6. Segmentos de Vídeo (expandível)
 * 7. Assets de Edição: Thumbnails, Covering Images, B-roll
 *
 * FLUXO DE NAVEGAÇÃO:
 * ProductionVideos → (click em vídeo) → ProductionVideoDetails → (botão voltar) → ProductionVideos
 *
 * LINKS EXTERNOS (opens in new tab):
 * - Ver vídeo fonte no YouTube
 * - Abrir pasta do Drive (parent folder)
 * - Ver vídeo publicado no YouTube
 * - Abrir pastas de audio/video/thumbnails/images
 */

export default function ProductionVideoDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = Number(params.id)

  const [video, setVideo] = useState<ProductionVideoDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [activeTab, setActiveTab] = useState<'script' | 'cast' | 'outline' | 'beats'>('script')
  const [showTranscript, setShowTranscript] = useState(false)
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null)

  useEffect(() => {
    loadVideo()
  }, [videoId])

  async function loadVideo() {
    try {
      setLoading(true)
      const data = await getProductionVideoDetails(videoId)

      if (!data) {
        setError('Video not found')
        return
      }

      setVideo(data)
      setError(null)
    } catch (err) {
      console.error('Error loading video:', err)
      setError('Failed to load video details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
      case 'processing': return 'bg-primary/10 text-primary'
      case 'pending_approval': return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400'
      case 'failed': return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getEmotionalStateColor = (state: string) => {
    switch (state) {
      case 'calm': return 'bg-blue-100 dark:bg-blue-950'
      case 'curiosity': return 'bg-yellow-100 dark:bg-yellow-950'
      case 'tension': return 'bg-orange-100 dark:bg-orange-950'
      case 'fear': return 'bg-red-100 dark:bg-red-950'
      case 'relief': return 'bg-green-100 dark:bg-green-950'
      case 'triumph': return 'bg-emerald-100 dark:bg-emerald-950'
      default: return 'bg-muted'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'hoje'
    if (diff === 1) return 'ontem'
    return `há ${diff} dias`
  }

  // Loading state
  if (loading) {
    return <ProductionVideoDetailsSkeleton />
  }

  // Error state
  if (error || !video) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error || 'Video not found'}</p>
          <button
            onClick={() => router.push('/production-videos')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Voltar para Lista
          </button>
        </div>
      </div>
    )
  }

  const totalAudioDuration = video.audioSegments.reduce((sum, seg) => sum + seg.duration, 0)

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Main content */}
      <main className="w-full bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-8 py-5">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/production-videos')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-foreground">Produção de Vídeo</h1>
              <p className="text-sm text-muted-foreground mt-1">Visualizar todos os dados e progresso do vídeo</p>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-full overflow-hidden">
          {/* Sidebar */}
          <aside className="w-80 flex-shrink-0 bg-card border-r border-border p-6 h-screen sticky top-0 overflow-y-auto">
            {/* Progresso */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Progresso Geral</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${video.progressPercentage}%` }}
                />
              </div>
              <div className="text-2xl text-foreground mb-1">{video.progressPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                {video.currentStage}/{video.totalStages} stages completos
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo em produção</span>
                  <span className="text-foreground">{video.productionDays} dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segmentos de áudio</span>
                  <span className="text-foreground">{video.audioSegments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segmentos de vídeo</span>
                  <span className="text-foreground">{video.videoSegments.length}</span>
                </div>
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="mb-4">
              <h3 className="text-sm text-muted-foreground mb-3">Links Rápidos</h3>
              <div className="space-y-2">
                {video.parentFolder && (
                  <a href={video.parentFolder} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <Folder className="w-4 h-4" />
                    <span>Pasta Principal</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
                {video.audioFolderUrl && (
                  <a href={video.audioFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <Music className="w-4 h-4" />
                    <span>Áudios</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
                {video.videoSegmentsFolder && (
                  <a href={video.videoSegmentsFolder} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <Video className="w-4 h-4" />
                    <span>Vídeos</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
                {video.thumbnailFolderUrl && (
                  <a href={video.thumbnailFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span>Thumbnails</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
                {video.coveringImagesFolder && (
                  <a href={video.coveringImagesFolder} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span>Imagens</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
                {video.finalLink && (
                  <a href={video.finalLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                    <Play className="w-4 h-4" />
                    <span>Vídeo Final</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                )}
              </div>
            </div>

            {/* Timeline de Workflow */}
            <div>
              <h3 className="text-sm text-muted-foreground mb-3">Timeline de Workflow</h3>
              <div className="space-y-1">
                {video.workflowStages.map((stage) => (
                  <div key={stage.id} className="flex items-center gap-2 text-sm">
                    {stage.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : stage.status === 'processing' ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={stage.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}>
                      {stage.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0 p-8 max-h-screen overflow-y-auto">
            {/* Hero Section */}
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <div className="flex gap-6">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-80 h-45 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(video.status)}`}>
                          {video.status === 'published' ? '✅ Published' : video.status}
                        </span>
                        <span className="text-xs text-muted-foreground">#{video.id}</span>
                      </div>
                      <h2 className="text-2xl text-foreground mb-2">{video.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>🇧🇷 {video.language}</span>
                        <span>▶️ {video.platform}</span>
                        <span>Criado em {formatDate(video.createdAt)}</span>
                        <span>Atualizado {getDaysAgo(video.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  {video.finalLink && (
                    <a
                      href={video.finalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Ver no YouTube
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Vídeo Fonte */}
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h3 className="text-lg text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações do Vídeo Fonte
              </h3>
              <div className="flex gap-4">
                <img
                  src={video.sourceVideo.thumbnailUrl}
                  alt={video.sourceVideo.title}
                  className="w-60 h-34 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="text-foreground mb-2">{video.sourceVideo.title}</h4>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <div>📺 {video.sourceVideo.channelName}</div>
                    <div>👁️ {video.sourceVideo.views.toLocaleString()} views • 📅 {formatDate(video.sourceVideo.uploadDate)} • ⏱️ {video.sourceVideo.duration}</div>
                    <div className="font-mono text-xs">ID: {video.sourceVideo.youtubeVideoId}</div>
                  </div>
                  <div className="flex gap-2">
                    {video.sourceVideo.youtubeUrl && (
                      <a
                        href={video.sourceVideo.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                      >
                        Ver Original
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {video.sourceVideo.transcript && (
                      <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                      >
                        {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showTranscript ? 'Ocultar' : 'Ver'} Transcrição
                      </button>
                    )}
                  </div>
                  {showTranscript && video.sourceVideo.transcript && (
                    <div className="mt-4 bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <p className="text-sm text-foreground">{video.sourceVideo.transcript}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Análise Narrativa */}
            {video.narrative && video.narrative.storyBeats.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6 mb-6">
                <h3 className="text-lg text-foreground mb-4">🧠 Análise Narrativa</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Estrutura</div>
                    <div className="text-foreground">{video.narrative.structureModel}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Núcleo Emocional</div>
                    <div className="text-foreground">{video.narrative.emotionalCore}</div>
                  </div>
                  <div className="col-span-2 bg-muted/50 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Tema Central</div>
                    <div className="text-foreground">{video.narrative.centralTheme}</div>
                  </div>
                </div>

                {/* Story Beats Timeline */}
                <div>
                  <div className="text-sm text-muted-foreground mb-3">Story Beats Timeline</div>
                  <div className="relative">
                    <div className="flex justify-between mb-2">
                      {video.narrative.storyBeats.map((beat, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className={`w-3 h-3 rounded-full ${getEmotionalStateColor(beat.emotionalState)} border-2 border-card`} />
                          <div className="text-xs text-muted-foreground mt-1">{index + 1}</div>
                        </div>
                      ))}
                    </div>
                    <div className="h-0.5 bg-border absolute top-1.5 left-0 right-0" style={{ zIndex: -1 }} />
                  </div>
                  <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {video.narrative.storyBeats.map((beat, index) => (
                      <div key={index} className="bg-muted/50 rounded p-3">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm text-foreground">{index + 1}. {beat.name}</span>
                          <span className="text-xs text-muted-foreground">{beat.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{beat.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo Produzido */}
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h3 className="text-lg text-foreground mb-4">📝 Conteúdo Produzido</h3>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-border">
                <button
                  onClick={() => setActiveTab('script')}
                  className={`px-4 py-2 text-sm transition-colors ${
                    activeTab === 'script'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Script
                </button>
                <button
                  onClick={() => setActiveTab('cast')}
                  className={`px-4 py-2 text-sm transition-colors ${
                    activeTab === 'cast'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Story Cast
                </button>
                <button
                  onClick={() => setActiveTab('outline')}
                  className={`px-4 py-2 text-sm transition-colors ${
                    activeTab === 'outline'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Rich Outline
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'script' && (
                <div>
                  <div className="bg-muted/50 rounded-lg p-4 mb-3 max-h-96 overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {video.script || video.sourceVideo.transcript || 'Nenhum script disponível'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors">
                      <Copy className="w-4 h-4" />
                      Copiar Script
                    </button>
                    <button className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors">
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'cast' && (
                <div className="grid grid-cols-2 gap-4">
                  {video.storyCast.length > 0 ? (
                    video.storyCast.map((character, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg p-4">
                        <img
                          src={character.imageUrl}
                          alt={character.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                        <h4 className="text-foreground mb-1">{character.name}</h4>
                        <div className="text-sm text-muted-foreground mb-2">{character.archetype}</div>
                        <div className="text-xs text-primary mb-2">{character.role}</div>
                        <p className="text-sm text-muted-foreground mb-2">{character.description}</p>
                        <div className="flex gap-1 flex-wrap">
                          {character.traits.map((trait, i) => (
                            <span key={i} className="px-2 py-0.5 bg-muted text-xs rounded">
                              #{trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground col-span-2">Nenhum personagem disponível</p>
                  )}
                </div>
              )}

              {activeTab === 'outline' && (
                <div className="space-y-2">
                  {video.richOutline.length > 0 ? (
                    video.richOutline.map((chapter) => (
                      <div key={chapter.chapterNumber} className="bg-muted/50 rounded-lg">
                        <button
                          onClick={() => setExpandedChapter(expandedChapter === chapter.chapterNumber ? null : chapter.chapterNumber)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-foreground">{chapter.chapterNumber}. {chapter.title}</span>
                              {chapter.duration && (
                                <span className="text-xs text-muted-foreground">[{chapter.duration}]</span>
                              )}
                            </div>
                          </div>
                          {expandedChapter === chapter.chapterNumber ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedChapter === chapter.chapterNumber && (
                          <div className="px-4 pb-4 space-y-2">
                            <p className="text-sm text-foreground">{chapter.summary}</p>
                            {chapter.emotionalArc && (
                              <div className="text-sm text-muted-foreground">
                                Arco emocional: {chapter.emotionalArc}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum outline disponível</p>
                  )}
                </div>
              )}
            </div>

            {/* Segmentos de Áudio */}
            {video.audioSegments.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg text-foreground flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Segmentos de Áudio
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {video.audioSegments.length} total • {formatDuration(totalAudioDuration)} min
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {video.audioSegments.map((segment) => (
                    <div key={segment.number} className="flex items-center gap-4 bg-muted/50 rounded-lg p-3">
                      <span className="text-sm text-muted-foreground w-8">#{segment.number}</span>
                      <button className="text-primary hover:text-primary/80">
                        <Play className="w-4 h-4" />
                      </button>
                      <div className="flex-1 text-sm text-foreground truncate">{segment.text}</div>
                      <span className="text-sm text-muted-foreground">{formatDuration(segment.duration)}</span>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs rounded">
                        ✅ {segment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Segmentos de Vídeo */}
            {video.videoSegments.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg text-foreground mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Segmentos de Vídeo ({video.videoSegments.length} total)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {video.videoSegments.map((segment) => (
                    <div key={segment.id} className="bg-muted/50 rounded-lg overflow-hidden">
                      <img
                        src={segment.thumbnailUrl}
                        alt={segment.filename}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <div className="text-sm text-foreground mb-2">Segmento #{segment.segmentNumber}</div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs rounded">
                            ✅ {segment.status}
                          </span>
                          <span className="text-xs text-muted-foreground">{segment.imageCount} imagens</span>
                        </div>
                        {segment.videoUrl && (
                          <a
                            href={segment.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                          >
                            Assistir
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
