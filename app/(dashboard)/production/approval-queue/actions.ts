'use server'

import { createGobbiClient } from '@/lib/supabase/gobbi'
import { revalidatePath } from 'next/cache'

// ============================================================================
// TYPES
// ============================================================================

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

interface PendingApproval {
  id: number
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

interface ApproveTitleResult {
  success: boolean
  error?: string
  videoId?: number
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Aprova um título selecionado e avança o vídeo para a próxima etapa do workflow.
 *
 * Fluxo:
 * 1. Valida se o vídeo está na etapa 'create_title' e status 'pending'
 * 2. Atualiza o campo 'title' com o título escolhido
 * 3. Marca title_approval_status como 'approved' com timestamp
 * 4. Avança o status do vídeo para 'create_outline' (próxima etapa)
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @param selectedTitle - Título escolhido pelo usuário (pode ser o sugerido ou uma das alternativas)
 * @returns Resultado da operação com success/error
 */
export async function approveTitle(
  videoId: number,
  selectedTitle: string
): Promise<ApproveTitleResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Buscar vídeo atual para validações
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, title_approval_status, title_approval_data')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      console.error('Error fetching video:', fetchError)
      return { success: false, error: 'Vídeo não encontrado' }
    }

    // 2. Validações de estado
    if (video.status !== 'create_title') {
      return {
        success: false,
        error: `Vídeo não está na etapa de criação de título. Status atual: ${video.status}`
      }
    }

    if (video.title_approval_status !== 'pending') {
      return {
        success: false,
        error: 'Título já foi aprovado ou não está pendente de aprovação'
      }
    }

    if (!selectedTitle || selectedTitle.trim() === '') {
      return { success: false, error: 'Título selecionado inválido' }
    }

    // 3. Atualizar vídeo com título aprovado e avançar status
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        title: selectedTitle,
        title_approval_status: 'approved',
        title_approved_at: now,
        // title_approved_by: 'user_email', // TODO: Integrar com sistema de autenticação quando disponível
        status: 'create_outline', // ⚡ AVANÇA PARA PRÓXIMA ETAPA DO WORKFLOW
        updated_at: now
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return { success: false, error: 'Erro ao atualizar vídeo no banco de dados' }
    }

    // 4. Revalidar página para atualizar UI
    revalidatePath('/production/approval-queue')

    console.log(`✅ Title approved for video ${videoId}: "${selectedTitle.substring(0, 50)}..."`)

    return { success: true, videoId }

  } catch (error) {
    console.error('Unexpected error in approveTitle:', error)
    return {
      success: false,
      error: 'Erro interno ao aprovar título'
    }
  }
}

/**
 * Busca todos os vídeos com títulos pendentes de aprovação.
 *
 * Critérios:
 * - status = 'create_title' (etapa de criação de título)
 * - title_approval_status = 'pending' (aguardando aprovação)
 *
 * Retorna ordenado por created_at (mais antigos primeiro).
 * Inclui dados do vídeo de benchmark para exibir contexto.
 *
 * @returns Array de vídeos pendentes de aprovação
 */
export async function getPendingTitleApprovals(): Promise<PendingApproval[]> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      console.error('❌ [getPendingTitleApprovals] Gobbi client not configured')
      return []
    }

    console.log('🔍 [getPendingTitleApprovals] Fetching pending titles from Gobbi database...')

    // Primeiro: tentar query completa COM JOIN
    let { data, error } = await supabase
      .from('production_videos')
      .select(`
        id,
        placeholder,
        title_approval_data,
        title_approval_status,
        created_at,
        benchmark_id,
        status,
        benchmark_videos (
          id,
          title,
          thumbnail_url
        )
      `)
      .eq('title_approval_status', 'pending')
      .eq('status', 'create_title')
      .order('created_at', { ascending: true })
      .limit(50)

    // Se falhar, tentar SEM o JOIN
    if (error) {
      console.warn('⚠️ [getPendingTitleApprovals] Query with JOIN failed, trying without JOIN...')

      const result = await supabase
        .from('production_videos')
        .select(`
          id,
          placeholder,
          title_approval_data,
          title_approval_status,
          created_at,
          benchmark_id,
          status
        `)
        .eq('title_approval_status', 'pending')
        .eq('status', 'create_title')
        .order('created_at', { ascending: true })
        .limit(50)

      data = result.data
      error = result.error

      console.log('📊 [getPendingTitleApprovals] Query WITHOUT JOIN result:', {
        error: error ? JSON.stringify(error) : null,
        dataCount: data?.length || 0
      })
    }

    console.log('📊 [getPendingTitleApprovals] Query result:', {
      error: error ? JSON.stringify(error, null, 2) : null,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
      errorCode: error?.code,
      dataCount: data?.length || 0,
      data: data?.map(d => ({ id: d.id, status: d.status, approval_status: d.title_approval_status }))
    })

    if (error) {
      console.error('❌ [getPendingTitleApprovals] Full Error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      })
      return []
    }

    return data || []

  } catch (error) {
    console.error('❌ [getPendingTitleApprovals] Unexpected error:', error)
    return []
  }
}

/**
 * Busca estatísticas da fila de aprovação.
 * Útil para exibir badges/contadores na navegação.
 *
 * @returns Objeto com contagem de títulos pendentes
 */
export async function getApprovalQueueStats() {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { pendingCount: 0 }
    }

    const { count, error } = await supabase
      .from('production_videos')
      .select('id', { count: 'exact', head: true })
      .eq('title_approval_status', 'pending')
      .eq('status', 'create_title')

    if (error) {
      console.error('Error fetching approval queue stats:', error)
      return { pendingCount: 0 }
    }

    return { pendingCount: count || 0 }

  } catch (error) {
    console.error('Unexpected error in getApprovalQueueStats:', error)
    return { pendingCount: 0 }
  }
}

// ============================================================================
// HELPER: Validar estrutura do title_approval_data
// ============================================================================

/**
 * Valida se o JSONB title_approval_data está no formato esperado.
 * Útil para debug e validação ao receber dados do N8N.
 *
 * NOTA: Não é exportada pois não precisa ser Server Action
 *
 * @param data - Objeto JSONB do campo title_approval_data
 * @returns true se válido, false caso contrário
 */
function validateTitleApprovalData(data: any): data is TitleApprovalData {
  if (!data || typeof data !== 'object') return false

  return (
    typeof data.title === 'string' &&
    data.title.length > 0 &&
    Array.isArray(data.alternatives) &&
    data.alternatives.length > 0 &&
    data.alternatives.every((alt: any) =>
      typeof alt === 'object' &&
      typeof alt.text === 'string' &&
      typeof alt.score === 'string'
    )
  )
}

// ============================================================================
// THUMBNAIL APPROVAL SYSTEM
// ============================================================================

// ============================================================================
// TYPES - THUMBNAILS
// ============================================================================

interface ThumbnailApprovalData {
  thumbnail_url: string
  reference_thumbnail_url: string
  generation_prompt?: string
  ai_model?: string
  generation_metadata?: {
    seed?: number
    steps?: number
    guidance_scale?: number
    width: number
    height: number
  }
  generated_at: string
}

interface PendingThumbnail {
  id: number
  title: string | null
  thumbnail_url: string | null // Thumbnail final aprovada (pode estar vazia durante aprovação)
  thumbnail_approval_data: ThumbnailApprovalData | null // JSONB com thumbnail gerada aguardando aprovação
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

interface ApproveThumbnailResult {
  success: boolean
  error?: string
  videoId?: number
}

// ============================================================================
// SERVER ACTIONS - THUMBNAILS
// ============================================================================

/**
 * Aprova a thumbnail gerada e avança o vídeo para a próxima etapa do workflow.
 *
 * Fluxo:
 * 1. Valida se o vídeo está na etapa 'create_thumbnail' e status 'pending'
 * 2. Extrai thumbnail_url de dentro do JSONB thumbnail_approval_data
 * 3. Copia thumbnail_url extraído para a coluna thumbnail_url (thumbnail final aprovada)
 * 4. Atualiza thumbnail_approval_status para 'approved' com timestamp
 * 5. Avança o status do vídeo para 'create_audio_segments' (próxima etapa)
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error
 */
export async function approveThumbnail(
  videoId: number
): Promise<ApproveThumbnailResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Buscar vídeo atual para validações
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, thumbnail_approval_status, thumbnail_approval_data')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      console.error('Error fetching video:', fetchError)
      return { success: false, error: 'Vídeo não encontrado' }
    }

    // 2. Validações de estado
    if (video.status !== 'create_thumbnail') {
      return {
        success: false,
        error: `Vídeo não está na etapa de criação de thumbnail. Status atual: ${video.status}`
      }
    }

    if (video.thumbnail_approval_status !== 'pending') {
      return {
        success: false,
        error: 'Thumbnail já foi aprovada ou não está pendente de aprovação'
      }
    }

    if (!video.thumbnail_approval_data?.thumbnail_url) {
      return {
        success: false,
        error: 'Thumbnail ainda não foi gerada pelo sistema'
      }
    }

    // 3. Extrair thumbnail_url do JSONB
    const thumbnailUrl = video.thumbnail_approval_data.thumbnail_url

    // 4. Atualizar vídeo: copiar URL para coluna final + aprovar + avançar status
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        thumbnail_url: thumbnailUrl, // ⚡ COPIA URL DO JSONB PARA COLUNA FINAL
        thumbnail_approval_status: 'approved',
        thumbnail_approved_at: now,
        // thumbnail_approved_by: 'user_email', // TODO: Integrar com sistema de autenticação
        status: 'create_audio_segments', // ⚡ AVANÇA PARA PRÓXIMA ETAPA DO WORKFLOW
        updated_at: now
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return { success: false, error: 'Erro ao atualizar vídeo no banco de dados' }
    }

    // 5. Revalidar página para atualizar UI
    revalidatePath('/production/approval-queue')

    console.log(`✅ Thumbnail approved for video ${videoId}: ${thumbnailUrl}`)

    return { success: true, videoId }

  } catch (error) {
    console.error('Unexpected error in approveThumbnail:', error)
    return {
      success: false,
      error: 'Erro interno ao aprovar thumbnail'
    }
  }
}

/**
 * Rejeita a thumbnail gerada e marca para regeneração.
 *
 * ATENÇÃO: Por enquanto apenas marca como 'rejected' e faz log.
 * No futuro: dispará webhook para N8N regerar thumbnail automaticamente.
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error
 */
export async function rejectThumbnail(
  videoId: number
): Promise<ApproveThumbnailResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Buscar vídeo atual
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, thumbnail_approval_status')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      return { success: false, error: 'Vídeo não encontrado' }
    }

    // 2. Validações
    if (video.status !== 'create_thumbnail') {
      return {
        success: false,
        error: `Vídeo não está na etapa de criação de thumbnail`
      }
    }

    if (video.thumbnail_approval_status !== 'pending') {
      return {
        success: false,
        error: 'Thumbnail não está pendente de aprovação'
      }
    }

    // 3. Marcar como rejeitado e mudar status para regenerar
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        thumbnail_approval_status: 'rejected',
        thumbnail_approved_at: now,
        // thumbnail_approved_by: 'user_email',
        status: 'regenerate_thumbnail',
        updated_at: now
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return { success: false, error: 'Erro ao atualizar vídeo' }
    }

    revalidatePath('/production/approval-queue')

    console.log(`❌ Thumbnail rejected for video ${videoId} - Status changed to 'regenerate_thumbnail'`)

    return { success: true, videoId }

  } catch (error) {
    console.error('Unexpected error in rejectThumbnail:', error)
    return { success: false, error: 'Erro interno ao rejeitar thumbnail' }
  }
}

/**
 * Busca todos os vídeos com thumbnails pendentes de aprovação.
 *
 * Critérios:
 * - status = 'create_thumbnail' (etapa de criação de thumbnail)
 * - thumbnail_approval_status = 'pending' (aguardando aprovação)
 * - thumbnail_approval_data->>'thumbnail_url' IS NOT NULL (thumbnail já foi gerada pelo N8N)
 *
 * Retorna ordenado por created_at (mais antigos primeiro).
 * Inclui dados do vídeo de benchmark para exibir thumbnail de referência.
 *
 * @returns Array de vídeos com thumbnails pendentes de aprovação
 */
export async function getPendingThumbnailApprovals(): Promise<PendingThumbnail[]> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      console.error('❌ [getPendingThumbnailApprovals] Gobbi client not configured')
      return []
    }

    console.log('🔍 [getPendingThumbnailApprovals] Fetching pending thumbnails from Gobbi database...')

    // Query com JOIN para pegar thumbnail do benchmark
    const { data, error } = await supabase
      .from('production_videos')
      .select(`
        id,
        title,
        thumbnail_url,
        thumbnail_approval_data,
        thumbnail_approval_status,
        created_at,
        benchmark_id,
        placeholder,
        status,
        benchmark_videos (
          id,
          title,
          thumbnail_url
        )
      `)
      .eq('thumbnail_approval_status', 'pending')
      .eq('status', 'create_thumbnail')
      .not('thumbnail_approval_data->thumbnail_url', 'is', null)
      .order('created_at', { ascending: true })
      .limit(50)

    console.log('📊 [getPendingThumbnailApprovals] Query result:', {
      error: error ? JSON.stringify(error, null, 2) : null,
      dataCount: data?.length || 0,
      data: data?.map(d => ({ id: d.id, status: d.status, approval_status: d.thumbnail_approval_status }))
    })

    if (error) {
      console.error('❌ [getPendingThumbnailApprovals] Error:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('❌ [getPendingThumbnailApprovals] Unexpected error:', error)
    return []
  }
}

// ============================================================================
// HISTORY INTERFACES
// ============================================================================

interface ApprovalHistoryTitle {
  id: number
  title: string | null
  title_approval_status: string
  title_approved_at: string | null
  title_approved_by: string | null
  created_at: string
  placeholder: string | null
  benchmark_videos?: {
    id: number
    title: string
  } | null
}

interface ApprovalHistoryThumbnail {
  id: number
  title: string | null
  thumbnail_url: string | null
  thumbnail_approval_status: string
  thumbnail_approved_at: string | null
  thumbnail_approved_by: string | null
  created_at: string
  placeholder: string | null
  benchmark_videos?: {
    id: number
    title: string
    thumbnail_url: string | null
  } | null
}

// ============================================================================
// SERVER ACTIONS - HISTORY
// ============================================================================

/**
 * Busca histórico de aprovações/rejeições de títulos.
 *
 * Retorna vídeos onde title_approval_status = 'approved' OR 'rejected'
 * Ordenado por title_approved_at (mais recente primeiro)
 */
export async function getTitleApprovalHistory(): Promise<ApprovalHistoryTitle[]> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      console.error('❌ [getTitleApprovalHistory] Gobbi client not configured')
      return []
    }

    const { data, error } = await supabase
      .from('production_videos')
      .select(`
        id,
        title,
        title_approval_status,
        title_approved_at,
        title_approved_by,
        created_at,
        placeholder,
        benchmark_videos (
          id,
          title
        )
      `)
      .in('title_approval_status', ['approved', 'rejected'])
      .not('title_approved_at', 'is', null)
      .order('title_approved_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ [getTitleApprovalHistory] Error:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('❌ [getTitleApprovalHistory] Unexpected error:', error)
    return []
  }
}

/**
 * Busca histórico de aprovações/rejeições de thumbnails.
 *
 * Retorna vídeos onde thumbnail_approval_status = 'approved' OR 'rejected'
 * Ordenado por thumbnail_approved_at (mais recente primeiro)
 */
export async function getThumbnailApprovalHistory(): Promise<ApprovalHistoryThumbnail[]> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      console.error('❌ [getThumbnailApprovalHistory] Gobbi client not configured')
      return []
    }

    const { data, error } = await supabase
      .from('production_videos')
      .select(`
        id,
        title,
        thumbnail_url,
        thumbnail_approval_status,
        thumbnail_approved_at,
        thumbnail_approved_by,
        created_at,
        placeholder,
        benchmark_videos (
          id,
          title,
          thumbnail_url
        )
      `)
      .in('thumbnail_approval_status', ['approved', 'rejected'])
      .not('thumbnail_approved_at', 'is', null)
      .order('thumbnail_approved_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ [getThumbnailApprovalHistory] Error:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('❌ [getThumbnailApprovalHistory] Unexpected error:', error)
    return []
  }
}
