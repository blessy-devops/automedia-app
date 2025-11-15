import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Clock, Video, CheckCircle2, Loader2, AlertCircle, Pause } from 'lucide-react';

/**
 * ProductionVideos Component - Lista todos os vídeos em produção
 * 
 * Funcionalidades:
 * - Exibe cards de estatísticas (total, published, processing, failed, on hold)
 * - Tabela de vídeos com thumbnail, status, progresso, stage atual, canal fonte e data
 * - Busca por título ou canal fonte
 * - Filtro por status (all, published, processing, pending_approval, failed, on_hold)
 * - Paginação completa
 * - Click em vídeo navega para ProductionVideoDetails
 * 
 * Fluxo de navegação:
 * ProductionVideos → (click em vídeo) → ProductionVideoDetails
 */

// Interface para os dados de um vídeo em produção
interface ProductionVideo {
  id: number;
  title: string;
  thumbnailUrl: string;
  status: 'published' | 'processing' | 'pending_approval' | 'failed' | 'on_hold';
  progress: number; // 0-100
  currentStage: string; // Ex: "Create Script", "Published", etc
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  language: string; // Ex: "pt-BR"
  platform: string; // Ex: "youtube"
  sourceChannel: string; // Nome do canal de origem
  productionDays: number; // Dias em produção
}

interface ProductionVideosProps {
  onVideoClick: (videoId: number) => void; // Callback para quando clicar em um vídeo
  onNavigate: (route: 'channels' | 'videos' | 'radar' | 'dashboard' | 'analytics' | 'settings' | 'productionVideo') => void;
}

export function ProductionVideos({ onVideoClick, onNavigate }: ProductionVideosProps) {
  // Estado local para busca, paginação e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const itemsPerPage = 10;

  // TODO: Substituir por dados reais da API/Supabase
  // Mock data - 8 vídeos de exemplo com diferentes status
  const videos: ProductionVideo[] = [
    {
      id: 168,
      title: 'O DEUS SUPREMO Africano que a História Tentou Apagar',
      thumbnailUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=300&h=169&fit=crop',
      status: 'published',
      progress: 100,
      currentStage: 'Published',
      createdAt: '2025-10-15T14:23:11Z',
      updatedAt: '2025-11-12T10:45:32Z',
      language: 'pt-BR',
      platform: 'youtube',
      sourceChannel: 'The Seal of the Bible',
      productionDays: 35
    },
    {
      id: 167,
      title: 'Os Segredos Ocultos das Pirâmides do Egito',
      thumbnailUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=300&h=169&fit=crop',
      status: 'processing',
      progress: 75,
      currentStage: 'Create Video Segments',
      createdAt: '2025-11-10T09:15:20Z',
      updatedAt: '2025-11-14T16:30:45Z',
      language: 'pt-BR',
      platform: 'youtube',
      sourceChannel: 'History Mysteries',
      productionDays: 4
    },
    {
      id: 166,
      title: 'A Verdadeira História de Atlântida',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=169&fit=crop',
      status: 'pending_approval',
      progress: 85,
      currentStage: 'Review Script',
      createdAt: '2025-11-08T11:45:00Z',
      updatedAt: '2025-11-13T14:20:10Z',
      language: 'pt-BR',
      platform: 'youtube',
      sourceChannel: 'Ancient Civilizations',
      productionDays: 6
    },
    {
      id: 165,
      title: 'Mitologia Nórdica: A Saga de Thor e Loki',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=300&h=169&fit=crop',
      status: 'published',
      progress: 100,
      currentStage: 'Published',
      createdAt: '2025-10-20T08:30:15Z',
      updatedAt: '2025-11-05T12:15:30Z',
      language: 'pt-BR',
      platform: 'youtube',
      sourceChannel: 'Norse Legends',
      productionDays: 28
    },
    {
      id: 164,
      title: 'Os Mistérios da Bíblia Revelados',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=169&fit=crop',
      status: 'failed',
      progress: 45,
      currentStage: 'Create Audio Segments',
      createdAt: '2025-11-11T13:20:00Z',
      updatedAt: '2025-11-14T09:10:25Z',
      language: 'pt-BR',
      platform: 'youtube',
      sourceChannel: 'Biblical Studies',
      productionDays: 3
    },
    {
      id: 163,
      title: 'A Origem do Universo Segundo a Ciência',
      thumbnailUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=169&fit=crop',
      status: 'on_hold',
      progress: 60,
      currentStage: 'Create Script',
      createdAt: '2025-11-05T15:45:30Z',
      updatedAt: '2025-11-09T11:30:15Z',
      language: 'pt-BR',
      platform: 'youtube',
      sourceChannel: 'Science Today',
      productionDays: 9
    },
    {
      id: 162,
      title: 'Filosofia Antiga: Os Ensinamentos de Sócrates',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=169&fit=crop',
      status: 'published',
      progress: 100,
      currentStage: 'Published',
      createdAt: '2025-10-18T10:20:45Z',
      updatedAt: '2025-11-01T14:40:20Z',
      language: 'pt-BR',
      platform: 'youtube',
      sourceChannel: 'Philosophy Corner',
      productionDays: 30
    },
    {
      id: 161,
      title: 'A Queda do Império Romano',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542244232-82c31508aa92?w=300&h=169&fit=crop',
      status: 'processing',
      progress: 55,
      currentStage: 'Create Rich Outline',
      createdAt: '2025-11-12T07:30:00Z',
      updatedAt: '2025-11-14T18:45:10Z',
      language: 'pt-BR',
      platform: 'youtube',
      sourceChannel: 'Roman Empire History',
      productionDays: 2
    }
  ];

  // Estatísticas dos vídeos
  const stats = {
    totalVideos: 45,
    published: 28,
    processing: 12,
    failed: 3,
    onHold: 2
  };

  // Função para obter informações de status
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'published':
        return {
          label: 'Published',
          color: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
          icon: <CheckCircle2 className="w-3 h-3" />
        };
      case 'processing':
        return {
          label: 'Processing',
          color: 'bg-primary/10 text-primary',
          icon: <Loader2 className="w-3 h-3 animate-spin" />
        };
      case 'pending_approval':
        return {
          label: 'Pending Review',
          color: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400',
          icon: <Clock className="w-3 h-3" />
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400',
          icon: <AlertCircle className="w-3 h-3" />
        };
      case 'on_hold':
        return {
          label: 'On Hold',
          color: 'bg-muted text-muted-foreground',
          icon: <Pause className="w-3 h-3" />
        };
      default:
        return {
          label: status,
          color: 'bg-muted text-muted-foreground',
          icon: null
        };
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Função para calcular dias atrás
  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'hoje';
    if (diff === 1) return 'ontem';
    return `há ${diff} dias`;
  };

  // Filtrar vídeos com base na busca e status
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.sourceChannel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcular total de páginas e índices para paginação
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVideos = filteredVideos.slice(startIndex, endIndex);

  // Função para navegar entre páginas
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Função para gerar números de página
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar currentRoute="productionVideo" onNavigate={onNavigate} />

      {/* Main content */}
      <main className="flex-1 bg-background min-h-screen">
        {/* Header */}
        <div className="bg-card border-b border-border px-8 py-5">
          <h1 className="text-foreground">Vídeos em Produção</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe o progresso de todos os vídeos em produção</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-5 mb-6">
            <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Video className="w-4 h-4" />
                <span className="text-sm">Total</span>
              </div>
              <div className="text-foreground">{stats.totalVideos}</div>
              <p className="text-xs text-muted-foreground mt-1">Vídeos</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Published</span>
              </div>
              <div className="text-foreground">{stats.published}</div>
              <p className="text-xs text-muted-foreground mt-1">{((stats.published / stats.totalVideos) * 100).toFixed(0)}% do total</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Loader2 className="w-4 h-4" />
                <span className="text-sm">Processing</span>
              </div>
              <div className="text-foreground">{stats.processing}</div>
              <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Failed</span>
              </div>
              <div className="text-foreground">{stats.failed}</div>
              <p className="text-xs text-muted-foreground mt-1">Com erro</p>
            </div>

            <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Pause className="w-4 h-4" />
                <span className="text-sm">On Hold</span>
              </div>
              <div className="text-foreground">{stats.onHold}</div>
              <p className="text-xs text-muted-foreground mt-1">Pausados</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="relative" style={{ width: '320px' }}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por título ou canal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <button className="border border-border bg-card rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors shadow-sm">
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </button>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-border bg-card rounded-md pl-3 pr-8 py-2.5 text-sm text-foreground hover:bg-accent transition-colors shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">Todos os status</option>
                  <option value="published">Published</option>
                  <option value="processing">Processing</option>
                  <option value="pending_approval">Pending Review</option>
                  <option value="failed">Failed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                      Vídeo
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                      Progresso
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                      Stage Atual
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                      Canal Fonte
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-muted-foreground uppercase tracking-wide">
                      Criado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentVideos.map((video, index) => {
                    const statusInfo = getStatusInfo(video.status);
                    return (
                      <tr
                        key={video.id}
                        onClick={() => onVideoClick(video.id)}
                        className={`border-b border-border hover:bg-accent transition-colors cursor-pointer ${
                          index % 2 === 0 ? '' : 'bg-muted/30'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-24 h-14 object-cover rounded"
                            />
                            <div>
                              <div className="text-sm text-foreground max-w-md">{video.title}</div>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">#{video.id}</span>
                                <span className="text-xs text-muted-foreground">🇧🇷 {video.language}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${video.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-foreground">{video.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground">
                          {video.currentStage}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {video.sourceChannel}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground">{formatDate(video.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">{getDaysAgo(video.updatedAt)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-border px-6 py-5 flex items-center justify-between bg-muted/50">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredVideos.length)} de {filteredVideos.length} vídeos
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border border-border rounded-md px-4 py-2.5 text-sm text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 bg-card"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                      <button
                        key={index}
                        onClick={() => goToPage(page)}
                        className={`min-w-[2.5rem] px-3 py-2.5 text-sm rounded-md transition-colors ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-card border border-border bg-card'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={index} className="px-2 text-muted-foreground">
                        {page}
                      </span>
                    )
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border border-border rounded-md px-4 py-2.5 text-sm text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 bg-card"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}