'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Clock,
  AlertCircle,
  Brain,
  Target,
  Filter,
  History as HistoryIcon,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@supabase/supabase-js'
import { approveTitle, approveThumbnail, rejectThumbnail } from '../actions'
import { toast } from 'sonner'

// ============================================================================
// INTERFACES TYPESCRIPT
// ============================================================================

/**
 * Estrutura do title_approval_data vindo do banco
 * (formato validado com Gobbi)
 */
interface TitleApprovalData {
  title: string
  alternatives: Array<{ text: string; score: string }>
  analysis?: {
    emotional?: string | null
    rationale?: string | null
  }
  original?: {
    formula?: string | null
  }
  benchmark_title?: string | null
  generated_at?: string
}

/**
 * Vídeo pendente de aprovação de título
 * (dados vindos do backend: getPendingTitleApprovals)
 */
interface PendingTitle {
  id: number
  placeholder?: string | null
  title_approval_data: TitleApprovalData
  title_approval_status: string | null
  created_at: string
  benchmark_id: number | null
  benchmark_videos?: {
    id: number
    title: string
    thumbnail_url: string | null
  } | null
}

/**
 * Histórico de aprovação de título
 */
interface ApprovalHistoryTitle {
  id: number
  videoId: number
  channelName: string
  referenceTitle: string
  selectedOption: string
  selectedIndex: number
  status: 'approved' | 'rejected'
  approvedAt: string
  approvedBy: string
  autoApproved: boolean
}

/**
 * Thumbnail pendente de aprovação (alinhada com dados reais do banco)
 */
interface PendingThumbnail {
  id: number
  title: string | null
  thumbnail_url: string
  thumbnail_approval_data: any | null
  thumbnail_approval_status: string | null
  created_at: string
  benchmark_id: number | null
  placeholder: string | null
  status: string
  benchmark_videos?: {
    id: number
    title: string
    thumbnail_url: string | null
  } | null
}

/**
 * Histórico de aprovação de thumbnail
 */
interface ApprovalHistoryThumbnail {
  id: number
  videoId: number
  videoTitle: string
  channelName: string
  referenceThumbnail: string
  selectedThumbnailUrl: string
  status: 'approved' | 'rejected'
  approvedAt: string
  approvedBy: string
  autoApproved: boolean
}

/**
 * Props do componente
 */
interface TitleApprovalQueueProps {
  initialPendingTitles: PendingTitle[]
  initialPendingThumbnails: PendingThumbnail[]
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function TitleApprovalQueue({ initialPendingTitles, initialPendingThumbnails }: TitleApprovalQueueProps) {
  // ============================================================================
  // ESTADOS
  // ============================================================================

  // Navegação entre tabs (por enquanto só Titles, Thumbnails futuramente)
  const [activeTab, setActiveTab] = useState('titles')

  // Modo de visualização
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending')

  // Lista de títulos pendentes (com Realtime)
  const [pendingTitles, setPendingTitles] = useState<PendingTitle[]>(initialPendingTitles)

  // Seleção de item atual
  const [selectedItemId, setSelectedItemId] = useState<number | null>(
    initialPendingTitles.length > 0 ? initialPendingTitles[0].id : null
  )

  // Título selecionado pelo usuário (índice: 0 = sugerido, 1-10 = alternativas)
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | undefined>(undefined)

  // Auto-approval
  const [autoApprovalTitles, setAutoApprovalTitles] = useState(false)

  // Busca
  const [searchQuery, setSearchQuery] = useState('')

  // Loading states
  const [isApproving, setIsApproving] = useState(false)

  // Items removidos localmente (optimistic update)
  const [removedTitleIds, setRemovedTitleIds] = useState<Set<number>>(new Set())

  // Histórico de aprovações (TODO: buscar do backend)
  const [titleHistory, setTitleHistory] = useState<ApprovalHistoryTitle[]>([])

  // ============================================================================
  // ESTADOS - THUMBNAILS
  // ============================================================================

  // Lista de thumbnails pendentes (com Realtime)
  const [pendingThumbnails, setPendingThumbnails] = useState<PendingThumbnail[]>(initialPendingThumbnails)

  // Preview de thumbnail ampliado
  const [previewThumbnailUrl, setPreviewThumbnailUrl] = useState<string | null>(null)

  // Thumbnails removidos localmente (optimistic update)
  const [removedThumbnailIds, setRemovedThumbnailIds] = useState<Set<number>>(new Set())

  // Histórico de aprovações de thumbnails
  const [thumbnailHistory, setThumbnailHistory] = useState<ApprovalHistoryThumbnail[]>([])

  // Auto-approval para thumbnails
  const [autoApprovalThumbnails, setAutoApprovalThumbnails] = useState(false)

  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================

  useEffect(() => {
    console.log('🎬 [TitleApprovalQueue] Component mounted')
    console.log('📋 [TitleApprovalQueue] Initial pendingTitles:', pendingTitles.length)
    console.log('📊 [TitleApprovalQueue] Titles:', pendingTitles.map(t => ({
      id: t.id,
      approval_status: t.title_approval_status,
      has_data: !!t.title_approval_data
    })))

    // Create Gobbi client for Realtime subscriptions
    const supabase = createClient(
      process.env.NEXT_PUBLIC_GOBBI_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_GOBBI_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('title-approvals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_videos',
          filter: 'title_approval_status=eq.pending'
        },
        (payload) => {
          console.log('⚡ [Realtime] Update received:', payload)

          if (payload.eventType === 'INSERT') {
            // Novo título pendente
            setPendingTitles((prev) => [...prev, payload.new as PendingTitle])
          } else if (payload.eventType === 'UPDATE') {
            // Título foi aprovado ou rejeitado
            if (payload.new.title_approval_status !== 'pending') {
              setPendingTitles((prev) => prev.filter((t) => t.id !== payload.new.id))
            }
          } else if (payload.eventType === 'DELETE') {
            // Título foi deletado
            setPendingTitles((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Formatar timestamp como "X ago" (ex: "2h ago", "5m ago")
   */
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  /**
   * Combinar título sugerido + alternativas em uma lista única
   * Índice 0 = título sugerido, 1-10 = alternativas
   */
  const getAllTitleOptions = (title: PendingTitle) => {
    const options = [
      {
        text: title.title_approval_data.title,
        score: undefined, // Título principal não tem score
        isMain: true
      },
      ...title.title_approval_data.alternatives.map((alt) => ({
        text: alt.text,
        score: alt.score,
        isMain: false
      }))
    ]
    return options
  }

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Filtrar títulos removidos localmente
  const visiblePendingTitles = pendingTitles.filter((t) => !removedTitleIds.has(t.id))

  console.log('👀 [Computed] visiblePendingTitles:', visiblePendingTitles.length)
  console.log('🔍 [Computed] searchQuery:', searchQuery)

  // Filtrar por busca
  const filteredTitles = visiblePendingTitles.filter((t) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.title_approval_data.title.toLowerCase().includes(query) ||
      (t.benchmark_videos?.title || '').toLowerCase().includes(query)
    )
  })

  console.log('✅ [Computed] filteredTitles:', filteredTitles.length)

  // Item selecionado atual
  const selectedTitle = filteredTitles.find((t) => t.id === selectedItemId)

  console.log('🎯 [Computed] selectedTitle:', selectedTitle?.id || 'none')

  // Contadores
  const pendingCount = visiblePendingTitles.length

  // ============================================================================
  // COMPUTED VALUES - THUMBNAILS
  // ============================================================================

  // Filtrar thumbnails removidos localmente
  const visiblePendingThumbnails = pendingThumbnails.filter((t) => !removedThumbnailIds.has(t.id))

  // Filtrar por busca
  const filteredThumbnails = visiblePendingThumbnails.filter((t) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (t.title?.toLowerCase().includes(query) || false) ||
      (t.placeholder?.toLowerCase().includes(query) || false)
    )
  })

  // Item de thumbnail selecionado atual
  const selectedThumbnailItem = activeTab === 'thumbnails'
    ? filteredThumbnails.find((t) => t.id === selectedItemId)
    : null

  // Contadores de thumbnails
  const pendingThumbnailsCount = visiblePendingThumbnails.length

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Aprovar título selecionado e avançar para próximo
   */
  const handleApproveTitle = async () => {
    if (!selectedTitle || selectedTitleIndex === undefined) {
      toast.error('Selecione um título antes de aprovar')
      return
    }

    setIsApproving(true)

    try {
      // Determinar qual título foi selecionado
      const selectedText =
        selectedTitleIndex === 0
          ? selectedTitle.title_approval_data.title // Título sugerido
          : selectedTitle.title_approval_data.alternatives[selectedTitleIndex - 1].text // Alternativa

      // Chamar Server Action
      const result = await approveTitle(selectedTitle.id, selectedText)

      if (result.success) {
        toast.success('Título aprovado com sucesso!')

        // Optimistic update: remover da lista imediatamente
        setRemovedTitleIds((prev) => new Set(prev).add(selectedTitle.id))

        // Auto-avançar para próximo item
        const currentIndex = visiblePendingTitles.findIndex((t) => t.id === selectedItemId)
        const nextTitle = visiblePendingTitles[currentIndex + 1] || visiblePendingTitles[currentIndex - 1]

        if (nextTitle) {
          setSelectedItemId(nextTitle.id)
          setSelectedTitleIndex(undefined)
        } else {
          // Não há mais itens
          setSelectedItemId(null)
          setSelectedTitleIndex(undefined)
        }
      } else {
        toast.error(result.error || 'Erro ao aprovar título')
      }
    } catch (error) {
      console.error('Error approving title:', error)
      toast.error('Erro ao aprovar título')
    } finally {
      setIsApproving(false)
    }
  }

  /**
   * Rejeitar título atual e avançar para próximo
   */
  const handleRejectTitle = async () => {
    if (!selectedTitle) {
      toast.error('Nenhum título selecionado')
      return
    }

    // TODO: Implementar rejeição no backend
    // Por enquanto, apenas remove da lista localmente
    toast.info('Funcionalidade de rejeição será implementada em breve')

    setRemovedTitleIds((prev) => new Set(prev).add(selectedTitle.id))

    // Auto-avançar
    const currentIndex = visiblePendingTitles.findIndex((t) => t.id === selectedItemId)
    const nextTitle = visiblePendingTitles[currentIndex + 1] || visiblePendingTitles[currentIndex - 1]

    if (nextTitle) {
      setSelectedItemId(nextTitle.id)
      setSelectedTitleIndex(undefined)
    } else {
      setSelectedItemId(null)
      setSelectedTitleIndex(undefined)
    }
  }

  /**
   * Selecionar item da lista
   */
  const handleSelectItem = (id: number) => {
    setSelectedItemId(id)
    setSelectedTitleIndex(undefined) // Reset selection
  }

  // ============================================================================
  // HANDLERS - THUMBNAILS
  // ============================================================================

  /**
   * Aprovar thumbnail e avançar para próximo
   */
  const handleApproveThumbnail = async () => {
    if (!selectedThumbnailItem) {
      toast.error('Nenhuma thumbnail selecionada')
      return
    }

    setIsApproving(true)

    try {
      // Chamar Server Action
      const result = await approveThumbnail(selectedThumbnailItem.id)

      if (result.success) {
        toast.success('Thumbnail aprovada com sucesso!')

        // Optimistic update - remover da lista
        setRemovedThumbnailIds((prev) => new Set(prev).add(selectedThumbnailItem.id))

        // Mover para próximo item
        const currentIndex = filteredThumbnails.findIndex((t) => t.id === selectedItemId)
        const nextItem = filteredThumbnails[currentIndex + 1] || filteredThumbnails[currentIndex - 1]

        if (nextItem) {
          setSelectedItemId(nextItem.id)
        } else {
          setSelectedItemId(null)
        }
      } else {
        toast.error(result.error || 'Erro ao aprovar thumbnail')
      }
    } catch (error) {
      console.error('Error approving thumbnail:', error)
      toast.error('Erro ao aprovar thumbnail')
    } finally {
      setIsApproving(false)
    }
  }

  /**
   * Reprovar thumbnail e solicitar regeneração (por enquanto só marca como rejeitado)
   */
  const handleRejectAndRegenerateThumbnail = async () => {
    if (!selectedThumbnailItem) {
      toast.error('Nenhuma thumbnail selecionada')
      return
    }

    try {
      // Chamar Server Action
      const result = await rejectThumbnail(selectedThumbnailItem.id)

      if (result.success) {
        toast.info('Thumbnail reprovada. Por enquanto, não será regerada automaticamente.')

        // Optimistic update - remover da lista
        setRemovedThumbnailIds((prev) => new Set(prev).add(selectedThumbnailItem.id))

        // Mover para próximo item
        const currentIndex = filteredThumbnails.findIndex((t) => t.id === selectedItemId)
        const nextItem = filteredThumbnails[currentIndex + 1] || filteredThumbnails[currentIndex - 1]

        if (nextItem) {
          setSelectedItemId(nextItem.id)
        } else {
          setSelectedItemId(null)
        }
      } else {
        toast.error(result.error || 'Erro ao reprovar thumbnail')
      }
    } catch (error) {
      console.error('Error rejecting thumbnail:', error)
      toast.error('Erro ao reprovar thumbnail')
    }
  }

  /**
   * Abrir preview ampliado de thumbnail
   */
  const handlePreviewThumbnail = (url: string) => {
    setPreviewThumbnailUrl(url)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Layout Split-Screen */}
      <div className="flex flex-1 flex-col">
        {/* ================================================================= */}
        {/* HEADER */}
        {/* ================================================================= */}
        <div className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-foreground" />
                    <h1 className="text-xl font-semibold text-foreground">Approval Queue</h1>
                  </div>
                  <Badge variant="secondary">Split View</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select items from the list to review and approve
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                  <Button
                    variant={viewMode === 'pending' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('pending')}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Pending
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {pendingCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={viewMode === 'history' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('history')}
                    className="gap-2"
                  >
                    <HistoryIcon className="w-4 h-4" />
                    History
                    {titleHistory.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {titleHistory.length}
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Auto-Approval Toggle - Only show in pending mode */}
                {viewMode === 'pending' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30">
                    <Label htmlFor="auto-approval-titles" className="text-xs cursor-pointer">
                      Auto-Approve
                    </Label>
                    <Switch
                      id="auto-approval-titles"
                      checked={autoApprovalTitles}
                      onCheckedChange={setAutoApprovalTitles}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ================================================================= */}
          {/* SIDEBAR ESQUERDA - Lista de Items */}
          {/* ================================================================= */}
          {viewMode === 'pending' && (
            <div className="w-[410px] border-r border-border bg-card flex flex-col overflow-hidden">
              {/* Tabs no topo */}
              <div className="p-4 border-b border-border flex-shrink-0">
                <Tabs
                  value={activeTab}
                  onValueChange={(newTab) => {
                    setActiveTab(newTab)
                    // Auto-selecionar primeiro item da nova tab
                    if (newTab === 'titles' && filteredTitles.length > 0) {
                      setSelectedItemId(filteredTitles[0].id)
                      setSelectedTitleIndex(undefined)
                    }
                  }}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="titles" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Titles
                      {pendingCount > 0 && (
                        <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
                          {pendingCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="thumbnails" className="gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Thumbnails
                      {pendingThumbnailsCount > 0 && (
                        <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
                          {pendingThumbnailsCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Campo de busca */}
              <div className="p-4 border-b border-border flex-shrink-0">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Lista de items com scroll */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'titles' && (
                  <div className="p-2">
                    {filteredTitles.length === 0 ? (
                      <div className="py-12 text-center">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'No titles match your search' : 'No pending titles'}
                        </p>
                      </div>
                    ) : (
                      filteredTitles.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item.id)}
                          className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                            selectedItemId === item.id
                              ? 'bg-accent border-2 border-primary'
                              : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
                          }`}
                        >
                          {/* Row 1: Canal + ID + Time (3 badges) */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {item.placeholder && (
                              <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                                {item.placeholder}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              ID: {item.id}
                            </Badge>
                            <Badge variant="outline" className="text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(item.created_at)}
                            </Badge>
                          </div>

                          {/* Row 3: Reference Title */}
                          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                            {item.benchmark_videos?.title || 'No reference title'}
                          </p>

                          {/* Row 4: Suggested Title */}
                          <p className="text-xs font-medium line-clamp-2">
                            {item.title_approval_data.title}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'thumbnails' && (
                  <div className="p-2">
                    {filteredThumbnails.length === 0 ? (
                      <div className="py-12 text-center px-4">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          {searchQuery ? 'No thumbnails match your search' : 'No pending thumbnails'}
                        </p>
                      </div>
                    ) : (
                      filteredThumbnails.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item.id)}
                          className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                            selectedItemId === item.id
                              ? 'bg-accent border-2 border-primary'
                              : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
                          }`}
                        >
                          {/* Thumbnail preview image */}
                          <div className="aspect-video rounded mb-2 overflow-hidden border border-border">
                            <img
                              src={item.benchmark_videos?.thumbnail_url || '/placeholder-thumbnail.jpg'}
                              alt={item.title || 'Thumbnail'}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Row 1: Canal + ID + Time (3 badges) */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {item.placeholder && (
                              <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                                {item.placeholder}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              ID: {item.id}
                            </Badge>
                            <Badge variant="outline" className="text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(item.created_at)}
                            </Badge>
                          </div>

                          {/* Video Title */}
                          <p className="text-xs font-medium line-clamp-2">
                            {item.title || 'Sem título'}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PAINEL DIREITO - Detalhes e Aprovação */}
          {/* ================================================================= */}
          {viewMode === 'pending' && (
            <div className="flex-1 flex flex-col bg-background overflow-hidden">
              {/* Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {!selectedTitle && !selectedThumbnailItem ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-medium text-foreground mb-2">No Item Selected</p>
                      <p className="text-sm text-muted-foreground">
                        Select an item from the list to review
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* =============================================== */}
                {/* TÍTULOS - Conteúdo de Aprovação de Título */}
                {/* =============================================== */}
                {activeTab === 'titles' && selectedTitle && (
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Reference Section */}
                    <div className="bg-muted/50 border border-border p-4 rounded-lg">
                      <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">
                        Título de Referência (Benchmark)
                      </p>
                      <p className="text-sm font-medium text-foreground mb-2">
                        {selectedTitle.benchmark_videos?.title || 'No reference title available'}
                      </p>
                      {selectedTitle.title_approval_data.original?.formula && (
                        <div className="bg-background/50 border border-border/50 px-3 py-2 rounded">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Formula:</span>{' '}
                            {selectedTitle.title_approval_data.original.formula}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Main Suggested Title */}
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-500 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                        <p className="text-xs uppercase tracking-wide font-medium text-yellow-700 dark:text-yellow-500">
                          Título Principal Sugerido
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-3">
                        {selectedTitle.title_approval_data.title}
                      </p>

                      {(selectedTitle.title_approval_data.analysis?.emotional ||
                        selectedTitle.title_approval_data.analysis?.rationale) && (
                        <div className="grid grid-cols-2 gap-3">
                          {selectedTitle.title_approval_data.analysis?.emotional && (
                            <div className="bg-orange-100/50 dark:bg-orange-950/30 p-2.5 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <Brain className="w-3.5 h-3.5 text-orange-600 dark:text-orange-500" />
                                <p className="text-xs uppercase tracking-wide text-orange-700 dark:text-orange-500">
                                  Emoção
                                </p>
                              </div>
                              <p className="text-sm font-medium">
                                {selectedTitle.title_approval_data.analysis.emotional}
                              </p>
                            </div>
                          )}
                          {selectedTitle.title_approval_data.analysis?.rationale && (
                            <div className="bg-blue-100/50 dark:bg-blue-950/30 p-2.5 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
                                <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-500">
                                  Racional
                                </p>
                              </div>
                              <p className="text-sm font-medium">
                                {selectedTitle.title_approval_data.analysis.rationale}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Alternatives - Radio Buttons */}
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Selecione 1 de {getAllTitleOptions(selectedTitle).length} opções
                      </p>

                      {getAllTitleOptions(selectedTitle).map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedTitleIndex === index
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        >
                          {/* 1. RADIO CUSTOMIZADO - Sempre visível, À ESQUERDA */}
                          <div className="flex-shrink-0">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedTitleIndex === index
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground/50 bg-background'
                              }`}
                            >
                              {selectedTitleIndex === index && (
                                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                            {/* Input radio escondido mas funcional */}
                            <input
                              type="radio"
                              name="title-option"
                              value={index}
                              checked={selectedTitleIndex === index}
                              onChange={() => setSelectedTitleIndex(index)}
                              className="sr-only"
                            />
                          </div>

                          {/* 2. NÚMERO - Container centralizado */}
                          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                            <span className="text-sm font-medium text-muted-foreground">
                              {index + 1}.
                            </span>
                          </div>

                          {/* 3. TEXTO - Ocupa espaço restante */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-foreground leading-relaxed">
                                {option.text}
                              </p>
                              {option.isMain && (
                                <Badge className="flex-shrink-0 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/30 gap-1 text-xs">
                                  <Sparkles className="w-3 h-3" />
                                  Sugerido
                                </Badge>
                              )}
                            </div>
                            {option.score && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Score: {option.score}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* =============================================== */}
                {/* THUMBNAILS - Comparação Lado-a-Lado */}
                {/* =============================================== */}
                {activeTab === 'thumbnails' && selectedThumbnailItem && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Seção 1: Grid de Comparação 2 Colunas */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Coluna 1: Thumbnail de Referência (Original) */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                            Referência (Original)
                          </p>
                        </div>
                        <div className="aspect-video rounded-lg border-2 border-border overflow-hidden bg-muted/20">
                          <img
                            src={selectedThumbnailItem.benchmark_videos?.thumbnail_url || '/placeholder-thumbnail.jpg'}
                            alt="Reference Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Coluna 2: Thumbnail Gerada pelo Claude */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                          <p className="text-xs uppercase tracking-wide font-medium text-yellow-700 dark:text-yellow-500">
                            Gerada pelo Claude
                          </p>
                        </div>
                        <div className="aspect-video rounded-lg border-2 border-primary overflow-hidden bg-muted/20 relative group cursor-pointer">
                          <img
                            src={selectedThumbnailItem.thumbnail_url}
                            alt="Generated Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay com botão de preview ao hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handlePreviewThumbnail(selectedThumbnailItem.thumbnail_url)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                            >
                              <Maximize2 className="w-4 h-4" />
                              Visualizar Ampliado
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Dica Informativa */}
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        <span className="font-medium">Dica:</span> Se a thumbnail gerada não atender às expectativas,
                        clique em "Reprovar e Regerar" para gerar uma nova versão.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar - Fixed at bottom */}
              {/* Action Bar para Títulos */}
              {activeTab === 'titles' && selectedTitle && (
                <div className="border-t border-border bg-card p-4 flex-shrink-0">
                  <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {selectedTitleIndex !== undefined ? (
                        <span>Option {selectedTitleIndex + 1} selected</span>
                      ) : (
                        <span>Select a title to continue</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleRejectTitle}
                        disabled={isApproving}
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={handleApproveTitle}
                        disabled={selectedTitleIndex === undefined || isApproving}
                        className="gap-2"
                      >
                        {isApproving ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Approve & Next
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bar para Thumbnails */}
              {activeTab === 'thumbnails' && selectedThumbnailItem && (
                <div className="border-t border-border bg-card p-4 flex-shrink-0">
                  <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span>Ready to approve or regenerate</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleRejectAndRegenerateThumbnail}
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reprovar e Regerar
                      </Button>
                      <Button onClick={handleApproveThumbnail} className="gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar & Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* HISTORY MODE */}
          {/* ================================================================= */}
          {viewMode === 'history' && (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center">
                <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-foreground mb-2">History View</p>
                <p className="text-sm text-muted-foreground">
                  History functionality will be implemented soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL DE PREVIEW AMPLIADO DA THUMBNAIL */}
      {/* ================================================================= */}
      <Dialog open={!!previewThumbnailUrl} onOpenChange={() => setPreviewThumbnailUrl(null)}>
        <DialogContent className="w-[90vw] max-w-7xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Maximize2 className="w-5 h-5" />
              Thumbnail Preview
            </DialogTitle>
            <DialogDescription>Full-size preview of the thumbnail.</DialogDescription>
          </DialogHeader>
          <div className="w-full aspect-video rounded-lg border overflow-hidden bg-black">
            {previewThumbnailUrl && (
              <img
                src={previewThumbnailUrl}
                alt="Full preview"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
