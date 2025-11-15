import { useState } from 'react';
import { ArrowLeft, ExternalLink, Play, Download, Copy, Edit, CheckCircle2, Circle, Loader2, Clock, Users, Video, FileText, Image as ImageIcon, Music, Folder, ChevronDown, ChevronUp } from 'lucide-react';

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

interface ProductionVideoDetailsProps {
  videoId: number;
  onBack: () => void; // Callback para voltar para a lista de vídeos
  onNavigate: (route: 'channels' | 'videos' | 'radar' | 'dashboard' | 'analytics' | 'settings') => void;
}

// TODO: Substituir por dados reais da API/Supabase
// Mock data baseado no vídeo #168 real da plataforma
const mockVideoData = {
  id: 168,
  title: 'O DEUS SUPREMO Africano que a História Tentou Apagar',
  thumbnailUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=450&fit=crop',
  status: 'published',
  language: 'pt-BR',
  platform: 'youtube',
  createdAt: '2025-10-15T14:23:11Z',
  updatedAt: '2025-11-12T10:45:32Z',
  finalLink: 'https://youtu.be/QR9GhtZZUVQ',
  youtubeId: 'QR9GhtZZUVQ',
  description: 'Descubra a incrível história de Olodumare...',
  tags: 'religião, história, África, Yoruba',
  
  // Links
  parentFolder: 'https://drive.google.com/drive/folders/abc123',
  audioFolderUrl: 'https://drive.google.com/drive/folders/audio123',
  videoSegmentsFolder: 'https://drive.google.com/drive/folders/video123',
  thumbnailFolderUrl: 'https://drive.google.com/drive/folders/thumb123',
  coveringImagesFolder: 'https://drive.google.com/drive/folders/images123',
  
  // Stats
  productionDays: 35,
  progressPercentage: 100,
  currentStage: 12,
  totalStages: 12,
  
  // Vídeo fonte
  sourceVideo: {
    id: 13093,
    title: 'The Original Religion? The African God Worshiped Above All!',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=225&fit=crop',
    channelName: 'The Seal of the Bible',
    channelId: 'UCeqDoZL10bjiPvEcgrzF8FQ',
    views: 15772,
    uploadDate: '2025-09-21',
    duration: '48:32',
    youtubeUrl: 'https://www.youtube.com/watch?v=qbSYXAFtYZ0',
    youtubeVideoId: 'qbSYXAFtYZ0',
    transcript: 'Por que tantas pessoas nunca ouviram falar de Olodumare? Como pode o nome de um deus tão importante ter sido quase apagado da memória coletiva? Isso não foi apenas um mal-entendido. Foi um apagamento deliberado...'
  },
  
  // Análise narrativa
  narrative: {
    structureModel: "Hero's Journey (12 Steps)",
    centralTheme: 'O apagamento histórico e redescoberta de Olodumare como símbolo de resistência cultural',
    emotionalCore: 'Indignação / Esperança',
    conflictType: 'Homem vs. Sistema',
    storyBeats: [
      { name: 'Ordinary World', timestamp: '00:00-02:30', emotionalState: 'calm', description: 'Introdução ao mistério de Olodumare' },
      { name: 'Call to Adventure', timestamp: '02:30-05:00', emotionalState: 'curiosity', description: 'Por que ninguém conhece esse deus?' },
      { name: 'Refusal', timestamp: '05:00-08:15', emotionalState: 'tension', description: 'A negação histórica do conhecimento africano' },
      { name: 'Meeting Mentor', timestamp: '08:15-12:00', emotionalState: 'relief', description: 'Descoberta de fontes antigas' },
      { name: 'Crossing Threshold', timestamp: '12:00-16:30', emotionalState: 'curiosity', description: 'Entrando na mitologia Yoruba' },
      { name: 'Tests & Allies', timestamp: '16:30-22:00', emotionalState: 'tension', description: 'Enfrentando o apagamento colonial' },
      { name: 'Approach', timestamp: '22:00-28:00', emotionalState: 'curiosity', description: 'Aproximação da verdade sobre Olodumare' },
      { name: 'Ordeal', timestamp: '28:00-34:00', emotionalState: 'fear', description: 'O processo violento de colonização' },
      { name: 'Reward', timestamp: '34:00-38:00', emotionalState: 'relief', description: 'A sobrevivência do conhecimento' },
      { name: 'Road Back', timestamp: '38:00-42:00', emotionalState: 'curiosity', description: 'O renascimento do interesse' },
      { name: 'Resurrection', timestamp: '42:00-46:00', emotionalState: 'triumph', description: 'A redescoberta moderna' },
      { name: 'Return', timestamp: '46:00-48:32', emotionalState: 'triumph', description: 'O legado eterno de Olodumare' }
    ]
  },
  
  // Story Cast
  storyCast: [
    {
      name: 'Olodumare',
      archetype: 'Supreme Creator',
      role: 'protagonist',
      description: 'O deus supremo da mitologia Yoruba, criador de tudo',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      traits: ['wise', 'powerful', 'forgotten']
    },
    {
      name: 'Colonizadores',
      archetype: 'Antagonist',
      role: 'antagonist',
      description: 'Forças que tentaram apagar a memória de Olodumare',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
      traits: ['oppressor', 'destructive']
    }
  ],
  
  // Rich Outline
  richOutline: [
    { chapterNumber: 1, title: 'O Nome Esquecido', summary: 'Apresentação do mistério sobre Olodumare', emotionalArc: 'Curiosidade → Intriga', duration: '4-5 min' },
    { chapterNumber: 2, title: 'O Apagamento Histórico', summary: 'Como a colonização tentou destruir o conhecimento', emotionalArc: 'Indignação → Revolta', duration: '5-6 min' },
    { chapterNumber: 3, title: 'A Verdadeira Origem', summary: 'As raízes da mitologia Yoruba', emotionalArc: 'Descoberta → Admiração', duration: '4-5 min' },
    { chapterNumber: 4, title: 'O Poder de Olodumare', summary: 'Entendendo o papel do deus supremo', emotionalArc: 'Reverência → Inspiração', duration: '5-6 min' },
    { chapterNumber: 5, title: 'A Resistência Cultural', summary: 'Como o conhecimento sobreviveu', emotionalArc: 'Esperança → Força', duration: '4-5 min' }
  ],
  
  // Segmentos de áudio
  audioSegments: [
    { number: 1, text: 'Por que tantas pessoas nunca ouviram falar de Olodumare...', duration: 242.81, status: 'concatenated', audioUrl: 'https://example.com/audio1.mp3' },
    { number: 2, text: 'Isso não foi apenas um mal-entendido, foi um apagamento...', duration: 267.13, status: 'concatenated', audioUrl: 'https://example.com/audio2.mp3' },
    { number: 3, text: 'É precisamente aqui que a história se torna fascinante...', duration: 224.47, status: 'concatenated', audioUrl: 'https://example.com/audio3.mp3' },
    { number: 4, text: 'A resposta está nas raízes da mitologia africana...', duration: 248.92, status: 'concatenated', audioUrl: 'https://example.com/audio4.mp3' },
    { number: 5, text: 'Olodumare não é apenas um deus entre muitos...', duration: 256.34, status: 'concatenated', audioUrl: 'https://example.com/audio5.mp3' },
    { number: 6, text: 'Mas como esse conhecimento foi preservado...', duration: 243.18, status: 'concatenated', audioUrl: 'https://example.com/audio6.mp3' },
    { number: 7, text: 'A colonização trouxe uma destruição sistemática...', duration: 239.76, status: 'concatenated', audioUrl: 'https://example.com/audio7.mp3' },
    { number: 8, text: 'No entanto, algo notável aconteceu...', duration: 251.45, status: 'concatenated', audioUrl: 'https://example.com/audio8.mp3' },
    { number: 9, text: 'Hoje, estudiosos e praticantes redescobrem...', duration: 244.63, status: 'concatenated', audioUrl: 'https://example.com/audio9.mp3' },
    { number: 10, text: 'A história de Olodumare é um testemunho...', duration: 237.89, status: 'concatenated', audioUrl: 'https://example.com/audio10.mp3' },
    { number: 11, text: 'Cada vez que alguém aprende sobre Olodumare...', duration: 229.54, status: 'concatenated', audioUrl: 'https://example.com/audio11.mp3' },
    { number: 12, text: 'Porque no final, a verdade sempre prevalece...', duration: 241.23, status: 'concatenated', audioUrl: 'https://example.com/audio12.mp3' }
  ],
  
  // Segmentos de vídeo
  videoSegments: [
    { id: 1, thumbnailUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=300&h=169&fit=crop', filename: '168_video_segment_1.mp4', status: 'used', imageCount: 15, videoUrl: 'https://example.com/video1.mp4' },
    { id: 2, thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=169&fit=crop', filename: '168_video_segment_2.mp4', status: 'used', imageCount: 18, videoUrl: 'https://example.com/video2.mp4' },
    { id: 3, thumbnailUrl: 'https://images.unsplash.com/photo-1542244232-82c31508aa92?w=300&h=169&fit=crop', filename: '168_video_segment_3.mp4', status: 'used', imageCount: 12, videoUrl: 'https://example.com/video3.mp4' },
    { id: 4, thumbnailUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=300&h=169&fit=crop', filename: '168_video_segment_4.mp4', status: 'used', imageCount: 14, videoUrl: 'https://example.com/video4.mp4' },
    { id: 5, thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=169&fit=crop', filename: '168_video_segment_5.mp4', status: 'used', imageCount: 16, videoUrl: 'https://example.com/video5.mp4' }
  ],
  
  // Workflow stages
  workflowStages: [
    { id: 1, name: 'Create Title', status: 'completed' },
    { id: 2, name: 'Create Outline', status: 'completed' },
    { id: 3, name: 'Create Cast', status: 'completed' },
    { id: 4, name: 'Create Rich Outline', status: 'completed' },
    { id: 5, name: 'Create Script', status: 'completed' },
    { id: 6, name: 'Review Script', status: 'completed' },
    { id: 7, name: 'Create SEO Description', status: 'completed' },
    { id: 8, name: 'Create Thumbnail', status: 'completed' },
    { id: 9, name: 'Create Audio Segments', status: 'completed' },
    { id: 10, name: 'Create Video Segments', status: 'completed' },
    { id: 11, name: 'Concatenate Audios', status: 'completed' },
    { id: 12, name: 'Create Final Video', status: 'completed' },
    { id: 13, name: 'Published', status: 'completed' }
  ]
};

export function ProductionVideoDetails({ videoId, onBack, onNavigate }: ProductionVideoDetailsProps) {
  const [activeTab, setActiveTab] = useState<'script' | 'cast' | 'outline' | 'beats'>('script');
  const [showTranscript, setShowTranscript] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400';
      case 'processing': return 'bg-primary/10 text-primary';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEmotionalStateColor = (state: string) => {
    switch (state) {
      case 'calm': return 'bg-blue-100 dark:bg-blue-950';
      case 'curiosity': return 'bg-yellow-100 dark:bg-yellow-950';
      case 'tension': return 'bg-orange-100 dark:bg-orange-950';
      case 'fear': return 'bg-red-100 dark:bg-red-950';
      case 'relief': return 'bg-green-100 dark:bg-green-950';
      case 'triumph': return 'bg-emerald-100 dark:bg-emerald-950';
      default: return 'bg-muted';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'hoje';
    if (diff === 1) return 'ontem';
    return `há ${diff} dias`;
  };

  const totalAudioDuration = mockVideoData.audioSegments.reduce((sum, seg) => sum + seg.duration, 0);

  return (
    <div className="flex min-h-screen">
      {/* Main content */}
      <main className="flex-1 bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-8 py-5">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={onBack}
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

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-80 bg-card border-r border-border p-6 min-h-screen">
            {/* Progresso */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Progresso Geral</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${mockVideoData.progressPercentage}%` }}
                />
              </div>
              <div className="text-2xl text-foreground mb-1">{mockVideoData.progressPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                {mockVideoData.currentStage}/{mockVideoData.totalStages} stages completos
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo em produção</span>
                  <span className="text-foreground">{mockVideoData.productionDays} dias</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segmentos de áudio</span>
                  <span className="text-foreground">{mockVideoData.audioSegments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segmentos de vídeo</span>
                  <span className="text-foreground">{mockVideoData.videoSegments.length}</span>
                </div>
              </div>
            </div>

            {/* Links Rápidos */}
            <div className="mb-4">
              <h3 className="text-sm text-muted-foreground mb-3">Links Rápidos</h3>
              <div className="space-y-2">
                <a href={mockVideoData.parentFolder} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                  <Folder className="w-4 h-4" />
                  <span>Pasta Principal</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a href={mockVideoData.audioFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                  <Music className="w-4 h-4" />
                  <span>Áudios</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a href={mockVideoData.videoSegmentsFolder} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                  <Video className="w-4 h-4" />
                  <span>Vídeos</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a href={mockVideoData.thumbnailFolderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  <span>Thumbnails</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a href={mockVideoData.coveringImagesFolder} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  <span>Imagens</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                {mockVideoData.finalLink && (
                  <a href={mockVideoData.finalLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
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
                {mockVideoData.workflowStages.map((stage) => (
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
          <div className="flex-1 p-8">
            {/* Hero Section */}
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <div className="flex gap-6">
                <img
                  src={mockVideoData.thumbnailUrl}
                  alt={mockVideoData.title}
                  className="w-80 h-45 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(mockVideoData.status)}`}>
                          {mockVideoData.status === 'published' ? '✅ Published' : mockVideoData.status}
                        </span>
                        <span className="text-xs text-muted-foreground">#{mockVideoData.id}</span>
                      </div>
                      <h2 className="text-2xl text-foreground mb-2">{mockVideoData.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>🇧🇷 {mockVideoData.language}</span>
                        <span>▶️ {mockVideoData.platform}</span>
                        <span>Criado em {formatDate(mockVideoData.createdAt)}</span>
                        <span>Atualizado {getDaysAgo(mockVideoData.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  {mockVideoData.finalLink && (
                    <a
                      href={mockVideoData.finalLink}
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
                  src={mockVideoData.sourceVideo.thumbnailUrl}
                  alt={mockVideoData.sourceVideo.title}
                  className="w-60 h-34 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="text-foreground mb-2">{mockVideoData.sourceVideo.title}</h4>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <div>📺 {mockVideoData.sourceVideo.channelName}</div>
                    <div>👁️ {mockVideoData.sourceVideo.views.toLocaleString()} views • 📅 {formatDate(mockVideoData.sourceVideo.uploadDate)} • ⏱️ {mockVideoData.sourceVideo.duration}</div>
                    <div className="font-mono text-xs">ID: {mockVideoData.sourceVideo.youtubeVideoId}</div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={mockVideoData.sourceVideo.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                    >
                      Ver Original
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                    >
                      {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showTranscript ? 'Ocultar' : 'Ver'} Transcrição
                    </button>
                  </div>
                  {showTranscript && (
                    <div className="mt-4 bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <p className="text-sm text-foreground">{mockVideoData.sourceVideo.transcript}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Análise Narrativa */}
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h3 className="text-lg text-foreground mb-4">🧠 Análise Narrativa</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Estrutura</div>
                  <div className="text-foreground">{mockVideoData.narrative.structureModel}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Núcleo Emocional</div>
                  <div className="text-foreground">{mockVideoData.narrative.emotionalCore}</div>
                </div>
                <div className="col-span-2 bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Tema Central</div>
                  <div className="text-foreground">{mockVideoData.narrative.centralTheme}</div>
                </div>
              </div>

              {/* Story Beats Timeline */}
              <div>
                <div className="text-sm text-muted-foreground mb-3">Story Beats Timeline</div>
                <div className="relative">
                  <div className="flex justify-between mb-2">
                    {mockVideoData.narrative.storyBeats.map((beat, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className={`w-3 h-3 rounded-full ${getEmotionalStateColor(beat.emotionalState)} border-2 border-card`} />
                        <div className="text-xs text-muted-foreground mt-1">{index + 1}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-0.5 bg-border absolute top-1.5 left-0 right-0" style={{ zIndex: -1 }} />
                </div>
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {mockVideoData.narrative.storyBeats.map((beat, index) => (
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
                      {mockVideoData.sourceVideo.transcript}
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
                  {mockVideoData.storyCast.map((character, index) => (
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
                  ))}
                </div>
              )}

              {activeTab === 'outline' && (
                <div className="space-y-2">
                  {mockVideoData.richOutline.map((chapter) => (
                    <div key={chapter.chapterNumber} className="bg-muted/50 rounded-lg">
                      <button
                        onClick={() => setExpandedChapter(expandedChapter === chapter.chapterNumber ? null : chapter.chapterNumber)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-foreground">{chapter.chapterNumber}. {chapter.title}</span>
                            <span className="text-xs text-muted-foreground">[{chapter.duration}]</span>
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
                          <div className="text-sm text-muted-foreground">
                            Arco emocional: {chapter.emotionalArc}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Segmentos de Áudio */}
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-foreground flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Segmentos de Áudio
                </h3>
                <div className="text-sm text-muted-foreground">
                  {mockVideoData.audioSegments.length} total • {formatDuration(totalAudioDuration)} min
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {mockVideoData.audioSegments.map((segment) => (
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

            {/* Segmentos de Vídeo */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg text-foreground mb-4 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Segmentos de Vídeo ({mockVideoData.videoSegments.length} total)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {mockVideoData.videoSegments.map((segment) => (
                  <div key={segment.id} className="bg-muted/50 rounded-lg overflow-hidden">
                    <img
                      src={segment.thumbnailUrl}
                      alt={segment.filename}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <div className="text-sm text-foreground mb-2">Segmento #{segment.id}</div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs rounded">
                          ✅ {segment.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{segment.imageCount} imagens</span>
                      </div>
                      <a
                        href={segment.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                      >
                        Assistir
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}