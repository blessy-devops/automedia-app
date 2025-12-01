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
  webhookFailed?: boolean // Indica se o webhook falhou (para mostrar botão de retry)
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Rejeita o título atual e dispara regeneração via webhook.
 *
 * Fluxo:
 * 1. Valida se o vídeo está em 'create_title' e 'pending'
 * 2. Atualiza status para 'regenerate_title'
 * 3. Atualiza title_approval_status para 'regenerating'
 * 4. Chama webhook 'create-tittle' para N8N regenerar
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error
 */
export async function rejectTitle(
  videoId: number
): Promise<ApproveTitleResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Buscar vídeo atual para validações
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, title_approval_status')
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
        error: 'Título não está pendente de aprovação'
      }
    }

    // 3. Atualizar vídeo: marcar para regeneração
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        status: 'regenerate_title',
        title_approval_status: 'regenerating',
        updated_at: now
        // NÃO limpa title_approval_data - mantém para mostrar loading
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return { success: false, error: 'Erro ao atualizar vídeo no banco de dados' }
    }

    // 4. Revalidar página
    revalidatePath('/production/approval-queue')

    console.log(`❌ Title rejected for video ${videoId} - Status changed to 'regenerate_title'`)

    // 5. Chamar webhook create-tittle para regenerar
    let webhookFailed = false

    try {
      const { data: webhook, error: webhookFetchError } = await supabase
        .from('production_webhooks')
        .select('webhook_url, api_key')
        .eq('name', 'create-tittle')
        .eq('is_active', true)
        .single()

      if (webhookFetchError) {
        console.warn(`⚠️ [rejectTitle] Webhook create-tittle not found or inactive:`, webhookFetchError.message)
        webhookFailed = true
      } else if (webhook) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (webhook.api_key) {
          headers['X-API-Key'] = webhook.api_key
        }

        const payload = {
          production_video_id: videoId,
          triggered_at: new Date().toISOString(),
          is_regeneration: true,
        }

        console.log(`📤 [rejectTitle] Calling webhook create-tittle for video ${videoId} (regeneration)...`)

        const webhookResponse = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (webhookResponse.ok) {
          console.log(`✅ [rejectTitle] Webhook create-tittle called successfully (${webhookResponse.status})`)
        } else {
          const errorText = await webhookResponse.text()
          console.error(`❌ [rejectTitle] Webhook create-tittle failed (${webhookResponse.status}):`, errorText)
          webhookFailed = true
        }
      } else {
        webhookFailed = true
      }
    } catch (webhookError) {
      console.error(`❌ [rejectTitle] Webhook error:`, webhookError)
      webhookFailed = true
    }

    return { success: true, videoId, webhookFailed }

  } catch (error) {
    console.error('Unexpected error in rejectTitle:', error)
    return {
      success: false,
      error: 'Erro interno ao rejeitar título'
    }
  }
}

/**
 * Retry do webhook de regeneração de título.
 * Usado quando o webhook falhou na primeira tentativa.
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error
 */
export async function retryTitleRegenerationWebhook(
  videoId: number
): Promise<ApproveTitleResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Verificar se o vídeo está em regenerate_title
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, title_approval_status')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      return { success: false, error: 'Vídeo não encontrado' }
    }

    if (video.status !== 'regenerate_title') {
      return {
        success: false,
        error: `Vídeo não está em regeneração. Status atual: ${video.status}`
      }
    }

    // 2. Chamar webhook create-tittle
    const { data: webhook, error: webhookFetchError } = await supabase
      .from('production_webhooks')
      .select('webhook_url, api_key')
      .eq('name', 'create-tittle')
      .eq('is_active', true)
      .single()

    if (webhookFetchError || !webhook) {
      return {
        success: false,
        error: 'Webhook create-tittle não encontrado ou inativo',
        webhookFailed: true
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (webhook.api_key) {
      headers['X-API-Key'] = webhook.api_key
    }

    const payload = {
      production_video_id: videoId,
      triggered_at: new Date().toISOString(),
      is_regeneration: true,
    }

    console.log(`📤 [retryTitleRegenerationWebhook] Retrying webhook for video ${videoId}...`)

    const webhookResponse = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (webhookResponse.ok) {
      console.log(`✅ [retryTitleRegenerationWebhook] Webhook called successfully (${webhookResponse.status})`)
      return { success: true, videoId, webhookFailed: false }
    } else {
      const errorText = await webhookResponse.text()
      console.error(`❌ [retryTitleRegenerationWebhook] Webhook failed (${webhookResponse.status}):`, errorText)
      return {
        success: false,
        error: `Webhook falhou: ${webhookResponse.status}`,
        webhookFailed: true
      }
    }

  } catch (error) {
    console.error('Unexpected error in retryTitleRegenerationWebhook:', error)
    return {
      success: false,
      error: 'Erro ao chamar webhook',
      webhookFailed: true
    }
  }
}

/**
 * Aprova um título selecionado e avança o vídeo para a próxima etapa do workflow.
 *
 * Fluxo:
 * 1. Valida se o vídeo está na etapa 'create_title' e status 'pending'
 * 2. Atualiza o campo 'title' com o título escolhido
 * 3. Marca title_approval_status como 'approved' com timestamp
 * 4. Avança o status do vídeo para 'create_script' (próxima etapa)
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
        status: 'create_script', // ⚡ AVANÇA PARA PRÓXIMA ETAPA DO WORKFLOW
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

    // 5. Chamar webhook create-content para iniciar geração de roteiro
    try {
      const { data: webhook, error: webhookFetchError } = await supabase
        .from('production_webhooks')
        .select('webhook_url, api_key')
        .eq('name', 'create-content')
        .eq('is_active', true)
        .single()

      if (webhookFetchError) {
        console.warn(`⚠️ [approveTitle] Webhook create-content not found or inactive:`, webhookFetchError.message)
      } else if (webhook) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (webhook.api_key) {
          headers['X-API-Key'] = webhook.api_key
        }

        const payload = {
          production_video_id: videoId,
          triggered_at: new Date().toISOString(),
        }

        console.log(`📤 [approveTitle] Calling webhook create-content for video ${videoId}...`)

        const webhookResponse = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (webhookResponse.ok) {
          console.log(`✅ [approveTitle] Webhook create-content called successfully (${webhookResponse.status})`)
        } else {
          const errorText = await webhookResponse.text()
          console.error(`❌ [approveTitle] Webhook create-content failed (${webhookResponse.status}):`, errorText)
        }
      }
    } catch (webhookError) {
      console.error(`❌ [approveTitle] Webhook error:`, webhookError)
      // Não falha a operação principal - webhook é secundário
    }

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
    // Inclui tanto títulos pendentes (pending) quanto em regeneração (regenerating)
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
      .in('title_approval_status', ['pending', 'regenerating'])
      .in('status', ['create_title', 'regenerate_title'])
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
        .in('title_approval_status', ['pending', 'regenerating'])
        .in('status', ['create_title', 'regenerate_title'])
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
  thumb_text: string | null // Texto que aparece na thumbnail
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
  webhookFailed?: boolean // true se webhook falhou (para mostrar botão Retry)
}

// ============================================================================
// SERVER ACTIONS - THUMBNAILS
// ============================================================================

/**
 * Aprova a thumbnail gerada e chama webhook create-audio-segments.
 *
 * Fluxo:
 * 1. Valida se o vídeo está na etapa 'create_thumbnail' e status 'pending'
 * 2. Extrai thumbnail_url de dentro do JSONB thumbnail_approval_data
 * 3. Copia thumbnail_url extraído para a coluna thumbnail_url (thumbnail final aprovada)
 * 4. Atualiza thumbnail_approval_status para 'approved' com timestamp (NÃO muda status ainda)
 * 5. Chama webhook 'create-audio-segments' para continuar pipeline
 * 6. SE webhook OK: avança status para 'create_audio_segments' (sai da fila)
 * 7. SE webhook FALHA: status fica 'create_thumbnail', continua na fila com visual de erro + Retry
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error e webhookFailed
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

    // 4. Marcar como aprovado + copiar URL (mas NÃO avança status ainda - só avança se webhook funcionar)
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        thumbnail_url: thumbnailUrl, // ⚡ COPIA URL DO JSONB PARA COLUNA FINAL
        thumbnail_approval_status: 'approved',
        thumbnail_approved_at: now,
        // thumbnail_approved_by: 'user_email', // TODO: Integrar com sistema de autenticação
        // status: NÃO MUDA AINDA - só muda se webhook funcionar
        updated_at: now
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return { success: false, error: 'Erro ao atualizar vídeo no banco de dados' }
    }

    // 5. Revalidar página para atualizar UI
    revalidatePath('/production/approval-queue')

    console.log(`✅ Thumbnail marked as approved for video ${videoId} - Now calling webhook...`)

    // 6. Chamar webhook create-audio-segments para continuar pipeline
    let webhookFailed = false

    try {
      const { data: webhook, error: webhookFetchError } = await supabase
        .from('production_webhooks')
        .select('webhook_url, api_key')
        .eq('name', 'create-audio-segments')
        .eq('is_active', true)
        .single()

      if (webhookFetchError) {
        console.warn(`⚠️ [approveThumbnail] Webhook create-audio-segments not found or inactive:`, webhookFetchError.message)
        webhookFailed = true
      } else if (webhook) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (webhook.api_key) {
          headers['X-API-Key'] = webhook.api_key
        }

        const payload = {
          production_video_id: videoId,
          triggered_at: new Date().toISOString(),
        }

        console.log(`📤 [approveThumbnail] Calling webhook create-audio-segments for video ${videoId}...`)

        const webhookResponse = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (webhookResponse.ok) {
          console.log(`✅ [approveThumbnail] Webhook create-audio-segments called successfully (${webhookResponse.status})`)

          // 7. Webhook OK! Agora sim avança o status para create_audio_segments
          const { error: advanceError } = await supabase
            .from('production_videos')
            .update({
              status: 'create_audio_segments', // ⚡ AVANÇA PARA PRÓXIMA ETAPA
              updated_at: new Date().toISOString()
            })
            .eq('id', videoId)

          if (advanceError) {
            console.error(`❌ [approveThumbnail] Failed to advance status:`, advanceError)
            // Não marca webhookFailed porque o webhook funcionou, só o update falhou
          } else {
            console.log(`✅ [approveThumbnail] Video ${videoId} advanced to create_audio_segments`)
          }

          revalidatePath('/production/approval-queue')
        } else {
          const errorText = await webhookResponse.text()
          console.error(`❌ [approveThumbnail] Webhook create-audio-segments failed (${webhookResponse.status}):`, errorText)
          webhookFailed = true
        }
      } else {
        webhookFailed = true
      }
    } catch (webhookError) {
      console.error(`❌ [approveThumbnail] Webhook error:`, webhookError)
      webhookFailed = true
    }

    return { success: true, videoId, webhookFailed }

  } catch (error) {
    console.error('Unexpected error in approveThumbnail:', error)
    return {
      success: false,
      error: 'Erro interno ao aprovar thumbnail'
    }
  }
}

/**
 * Rejeita a thumbnail gerada, marca para regeneração e chama webhook create-thumbnail.
 *
 * Fluxo:
 * 1. Valida se o vídeo está na etapa 'create_thumbnail' e status 'pending'
 * 2. Salva o novo thumb_text editado pelo usuário (se fornecido)
 * 3. Limpa thumbnail_url e thumbnail_approval_data para regeneração
 * 4. Atualiza thumbnail_approval_status para 'regenerating' e status para 'regenerate_thumbnail'
 * 5. Chama webhook 'create-thumbnail' para regenerar (N8N busca thumb_text da tabela)
 * 6. Vídeo fica na fila com visual de loading (regenerando)
 * 7. SE webhook FALHA: visual de erro + botão Retry
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @param newThumbText - Texto editado pelo usuário para a thumbnail (opcional)
 * @returns Resultado da operação com success/error e webhookFailed
 */
export async function rejectThumbnail(
  videoId: number,
  newThumbText?: string
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

    // 3. Marcar como regenerating (não rejected!), salvar novo thumb_text e limpar dados
    const now = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      thumbnail_approval_status: 'regenerating', // ⚡ REGENERATING, não rejected
      thumbnail_url: null, // Limpar thumbnail_url para regeneração
      thumbnail_approval_data: null, // Limpar dados de aprovação para regeneração
      status: 'regenerate_thumbnail',
      updated_at: now
    }

    // Se foi fornecido um novo thumb_text, atualizar
    if (newThumbText !== undefined) {
      updateData.thumb_text = newThumbText
    }

    const { error: updateError } = await supabase
      .from('production_videos')
      .update(updateData)
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return { success: false, error: 'Erro ao atualizar vídeo' }
    }

    revalidatePath('/production/approval-queue')

    console.log(`❌ Thumbnail rejected for video ${videoId} - Status changed to 'regenerate_thumbnail'${newThumbText ? ` - New thumb_text: "${newThumbText.substring(0, 50)}..."` : ''}`)

    // 4. Chamar webhook create-thumbnail para regenerar
    // N8N busca thumb_text diretamente da tabela production_videos
    let webhookFailed = false

    try {
      const { data: webhook, error: webhookFetchError } = await supabase
        .from('production_webhooks')
        .select('webhook_url, api_key')
        .eq('name', 'create-thumbnail')
        .eq('is_active', true)
        .single()

      if (webhookFetchError) {
        console.warn(`⚠️ [rejectThumbnail] Webhook create-thumbnail not found or inactive:`, webhookFetchError.message)
        webhookFailed = true
      } else if (webhook) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (webhook.api_key) {
          headers['X-API-Key'] = webhook.api_key
        }

        // Payload simples: só production_video_id
        // N8N busca thumb_text da tabela production_videos
        const payload = {
          production_video_id: videoId,
          triggered_at: new Date().toISOString(),
          is_regeneration: true,
        }

        console.log(`📤 [rejectThumbnail] Calling webhook create-thumbnail for video ${videoId} (regeneration)...`)

        const webhookResponse = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (webhookResponse.ok) {
          console.log(`✅ [rejectThumbnail] Webhook create-thumbnail called successfully (${webhookResponse.status})`)
        } else {
          const errorText = await webhookResponse.text()
          console.error(`❌ [rejectThumbnail] Webhook create-thumbnail failed (${webhookResponse.status}):`, errorText)
          webhookFailed = true
        }
      } else {
        webhookFailed = true
      }
    } catch (webhookError) {
      console.error(`❌ [rejectThumbnail] Webhook error:`, webhookError)
      webhookFailed = true
    }

    return { success: true, videoId, webhookFailed }

  } catch (error) {
    console.error('Unexpected error in rejectThumbnail:', error)
    return { success: false, error: 'Erro interno ao rejeitar thumbnail' }
  }
}

/**
 * Retry de webhook de thumbnail quando falhou.
 *
 * Detecta automaticamente qual webhook chamar baseado no estado:
 * - Se thumbnail_approval_status = 'approved' e status = 'create_thumbnail': chama 'create-audio-segments'
 *   (aprovação que falhou no webhook)
 * - Se thumbnail_approval_status = 'regenerating' e status = 'regenerate_thumbnail': chama 'create-thumbnail'
 *   (regeneração que falhou no webhook)
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error e webhookFailed
 */
export async function retryThumbnailWebhook(
  videoId: number
): Promise<ApproveThumbnailResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Buscar vídeo para determinar qual webhook chamar
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, thumbnail_approval_status')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      return { success: false, error: 'Vídeo não encontrado' }
    }

    // 2. Determinar qual webhook chamar baseado no estado
    let webhookName: string
    let isRegeneration = false

    if (video.thumbnail_approval_status === 'approved' && video.status === 'create_thumbnail') {
      // Caso: Aprovação que falhou no webhook create-audio-segments
      webhookName = 'create-audio-segments'
    } else if (video.thumbnail_approval_status === 'regenerating' && video.status === 'regenerate_thumbnail') {
      // Caso: Regeneração que falhou no webhook create-thumbnail
      webhookName = 'create-thumbnail'
      isRegeneration = true
    } else {
      return {
        success: false,
        error: `Estado inválido para retry. Status: ${video.status}, Approval: ${video.thumbnail_approval_status}`
      }
    }

    // 3. Buscar e chamar o webhook
    let webhookFailed = false

    try {
      const { data: webhook, error: webhookFetchError } = await supabase
        .from('production_webhooks')
        .select('webhook_url, api_key')
        .eq('name', webhookName)
        .eq('is_active', true)
        .single()

      if (webhookFetchError) {
        console.warn(`⚠️ [retryThumbnailWebhook] Webhook ${webhookName} not found or inactive:`, webhookFetchError.message)
        webhookFailed = true
      } else if (webhook) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (webhook.api_key) {
          headers['X-API-Key'] = webhook.api_key
        }

        const payload = {
          production_video_id: videoId,
          triggered_at: new Date().toISOString(),
          is_regeneration: isRegeneration,
          is_retry: true,
        }

        console.log(`📤 [retryThumbnailWebhook] Calling webhook ${webhookName} for video ${videoId} (retry)...`)

        const webhookResponse = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (webhookResponse.ok) {
          console.log(`✅ [retryThumbnailWebhook] Webhook ${webhookName} called successfully (${webhookResponse.status})`)

          // Se foi create-audio-segments e deu certo, agora avança o status
          if (webhookName === 'create-audio-segments') {
            const { error: advanceError } = await supabase
              .from('production_videos')
              .update({
                status: 'create_audio_segments',
                updated_at: new Date().toISOString()
              })
              .eq('id', videoId)

            if (advanceError) {
              console.error(`❌ [retryThumbnailWebhook] Failed to advance status:`, advanceError)
            } else {
              console.log(`✅ [retryThumbnailWebhook] Video ${videoId} advanced to create_audio_segments`)
            }
          }

          revalidatePath('/production/approval-queue')
        } else {
          const errorText = await webhookResponse.text()
          console.error(`❌ [retryThumbnailWebhook] Webhook ${webhookName} failed (${webhookResponse.status}):`, errorText)
          webhookFailed = true
        }
      } else {
        webhookFailed = true
      }
    } catch (webhookError) {
      console.error(`❌ [retryThumbnailWebhook] Webhook error:`, webhookError)
      webhookFailed = true
    }

    return { success: true, videoId, webhookFailed }

  } catch (error) {
    console.error('Unexpected error in retryThumbnailWebhook:', error)
    return { success: false, error: 'Erro interno ao reenviar webhook' }
  }
}

/**
 * Busca todos os vídeos com thumbnails para exibir na fila de aprovação.
 *
 * Critérios (inclui múltiplos estados):
 * 1. pending + create_thumbnail = aguardando aprovação normal (com thumbnail gerada)
 * 2. regenerating + regenerate_thumbnail = regenerando thumbnail (visual loading)
 * 3. approved + create_thumbnail = aprovado mas webhook create-audio-segments falhou (precisa retry)
 *
 * NOTA: Quando webhook create-audio-segments funciona, status muda para 'create_audio_segments' e sai da query.
 *
 * Retorna ordenado por created_at (mais antigos primeiro).
 * Inclui dados do vídeo de benchmark para exibir thumbnail de referência.
 *
 * @returns Array de vídeos com thumbnails para aprovação/retry
 */
export async function getPendingThumbnailApprovals(): Promise<PendingThumbnail[]> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      console.error('❌ [getPendingThumbnailApprovals] Gobbi client not configured')
      return []
    }

    console.log('🔍 [getPendingThumbnailApprovals] Fetching thumbnails from Gobbi database...')

    // Query com JOIN para pegar thumbnail do benchmark
    // Inclui múltiplos estados: pending, regenerating, approved (webhook falhou)
    const { data, error } = await supabase
      .from('production_videos')
      .select(`
        id,
        title,
        thumbnail_url,
        thumbnail_approval_data,
        thumbnail_approval_status,
        thumb_text,
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
      .in('thumbnail_approval_status', ['pending', 'regenerating', 'approved'])
      .in('status', ['create_thumbnail', 'regenerate_thumbnail'])
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

    // Filtrar: para 'pending', só mostrar se thumbnail foi gerada
    // Para 'regenerating' e 'approved' (retry), mostrar sempre
    const filtered = (data || []).filter(item => {
      if (item.thumbnail_approval_status === 'pending') {
        // Só mostrar pending se thumbnail já foi gerada
        return item.thumbnail_approval_data?.thumbnail_url != null
      }
      // Para regenerating e approved, sempre mostrar
      return true
    })

    return filtered

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

// ============================================================================
// CONTENT APPROVAL SYSTEM
// ============================================================================

// ============================================================================
// TYPES - CONTENT
// ============================================================================

interface PendingContent {
  id: number
  title: string | null
  script: string | null
  teaser_script: string | null
  description: string | null
  content_approval_status: string | null
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

interface ApproveContentResult {
  success: boolean
  error?: string
  videoId?: number
  webhookFailed?: boolean
}

interface ApprovalHistoryContent {
  id: number
  title: string | null
  script: string | null
  teaser_script: string | null
  description: string | null
  content_approval_status: string
  content_approved_at: string | null
  content_approved_by: string | null
  created_at: string
  placeholder: string | null
  benchmark_videos?: {
    id: number
    title: string
    thumbnail_url: string | null
  } | null
}

// ============================================================================
// SERVER ACTIONS - CONTENT
// ============================================================================

/**
 * Aprova o pacote de conteúdo (script, teaser, description) e chama webhook create-cast.
 *
 * Fluxo:
 * 1. Valida se o vídeo está na etapa 'review_script' e content_approval_status 'pending'
 * 2. Atualiza content_approval_status para 'approved' com timestamp (mas NÃO muda status ainda)
 * 3. Chama webhook 'create-cast' para continuar pipeline
 * 4. SE webhook OK: avança status para 'create_cast' (sai da fila)
 * 5. SE webhook FALHA: status fica 'review_script', continua na fila com visual de erro + Retry
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error e webhookFailed
 */
export async function approveContent(
  videoId: number
): Promise<ApproveContentResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Buscar vídeo atual para validações
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, content_approval_status, script, teaser_script, description')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      console.error('Error fetching video:', fetchError)
      return { success: false, error: 'Vídeo não encontrado' }
    }

    // 2. Validações de estado
    if (video.status !== 'review_script') {
      return {
        success: false,
        error: `Vídeo não está na etapa de revisão de script. Status atual: ${video.status}`
      }
    }

    if (video.content_approval_status !== 'pending') {
      return {
        success: false,
        error: 'Conteúdo já foi aprovado ou não está pendente de aprovação'
      }
    }

    // Validar que há conteúdo para aprovar
    if (!video.script && !video.teaser_script && !video.description) {
      return {
        success: false,
        error: 'Nenhum conteúdo disponível para aprovar'
      }
    }

    // 3. Marcar como aprovado (mas NÃO avança status ainda - só avança se webhook funcionar)
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        content_approval_status: 'approved',
        content_approved_at: now,
        // content_approved_by: 'user_email', // TODO: Integrar com sistema de autenticação
        // status: NÃO MUDA AINDA - só muda se webhook funcionar
        updated_at: now
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return { success: false, error: 'Erro ao atualizar vídeo no banco de dados' }
    }

    // 4. Revalidar página para atualizar UI
    revalidatePath('/production/approval-queue')

    console.log(`✅ Content marked as approved for video ${videoId} - Now calling webhook...`)

    // 5. Chamar webhook create-cast para continuar pipeline
    let webhookFailed = false

    try {
      const { data: webhook, error: webhookFetchError } = await supabase
        .from('production_webhooks')
        .select('webhook_url, api_key')
        .eq('name', 'create-cast')
        .eq('is_active', true)
        .single()

      if (webhookFetchError) {
        console.warn(`⚠️ [approveContent] Webhook create-cast not found or inactive:`, webhookFetchError.message)
        webhookFailed = true
      } else if (webhook) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (webhook.api_key) {
          headers['X-API-Key'] = webhook.api_key
        }

        const payload = {
          production_video_id: videoId,
          triggered_at: new Date().toISOString(),
        }

        console.log(`📤 [approveContent] Calling webhook create-cast for video ${videoId}...`)

        const webhookResponse = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (webhookResponse.ok) {
          console.log(`✅ [approveContent] Webhook create-cast called successfully (${webhookResponse.status})`)

          // 6. Webhook OK! Agora sim avança o status para create_cast
          const { error: advanceError } = await supabase
            .from('production_videos')
            .update({
              status: 'create_cast', // ⚡ AVANÇA PARA PRÓXIMA ETAPA
              updated_at: new Date().toISOString()
            })
            .eq('id', videoId)

          if (advanceError) {
            console.error(`❌ [approveContent] Failed to advance status:`, advanceError)
            // Não marca webhookFailed porque o webhook funcionou, só o update falhou
          } else {
            console.log(`✅ [approveContent] Video ${videoId} advanced to create_cast`)
          }

          revalidatePath('/production/approval-queue')
        } else {
          const errorText = await webhookResponse.text()
          console.error(`❌ [approveContent] Webhook create-cast failed (${webhookResponse.status}):`, errorText)
          webhookFailed = true
        }
      } else {
        webhookFailed = true
      }
    } catch (webhookError) {
      console.error(`❌ [approveContent] Webhook error:`, webhookError)
      webhookFailed = true
    }

    return { success: true, videoId, webhookFailed }

  } catch (error) {
    console.error('Unexpected error in approveContent:', error)
    return {
      success: false,
      error: 'Erro interno ao aprovar conteúdo'
    }
  }
}

/**
 * Rejeita o pacote de conteúdo, marca para regeneração e chama webhook create-content.
 *
 * Fluxo:
 * 1. Valida se o vídeo está na etapa 'review_script' e content_approval_status 'pending'
 * 2. Atualiza content_approval_status para 'regenerating' e status para 'regenerate_script'
 * 3. Chama webhook 'create-content' para regenerar conteúdo
 * 4. Vídeo fica na fila com visual de loading (regenerando)
 * 5. SE webhook FALHA: visual de erro + botão Retry
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error e webhookFailed
 */
export async function rejectContent(
  videoId: number
): Promise<ApproveContentResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Buscar vídeo atual
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, content_approval_status')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      return { success: false, error: 'Vídeo não encontrado' }
    }

    // 2. Validações
    if (video.status !== 'review_script') {
      return {
        success: false,
        error: `Vídeo não está na etapa de revisão de script`
      }
    }

    if (video.content_approval_status !== 'pending') {
      return {
        success: false,
        error: 'Conteúdo não está pendente de aprovação'
      }
    }

    // 3. Marcar como regenerating (não rejected!)
    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        content_approval_status: 'regenerating', // ⚡ REGENERATING, não rejected
        status: 'regenerate_script', // Status para regenerar conteúdo
        updated_at: now
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error updating video:', updateError)
      return { success: false, error: 'Erro ao atualizar vídeo' }
    }

    revalidatePath('/production/approval-queue')

    console.log(`❌ Content rejected for video ${videoId} - Status changed to 'regenerate_script'`)

    // 4. Chamar webhook create-content para regenerar
    let webhookFailed = false

    try {
      const { data: webhook, error: webhookFetchError } = await supabase
        .from('production_webhooks')
        .select('webhook_url, api_key')
        .eq('name', 'create-content')
        .eq('is_active', true)
        .single()

      if (webhookFetchError) {
        console.warn(`⚠️ [rejectContent] Webhook create-content not found or inactive:`, webhookFetchError.message)
        webhookFailed = true
      } else if (webhook) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (webhook.api_key) {
          headers['X-API-Key'] = webhook.api_key
        }

        const payload = {
          production_video_id: videoId,
          triggered_at: new Date().toISOString(),
          is_regeneration: true,
        }

        console.log(`📤 [rejectContent] Calling webhook create-content for video ${videoId} (regeneration)...`)

        const webhookResponse = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (webhookResponse.ok) {
          console.log(`✅ [rejectContent] Webhook create-content called successfully (${webhookResponse.status})`)
        } else {
          const errorText = await webhookResponse.text()
          console.error(`❌ [rejectContent] Webhook create-content failed (${webhookResponse.status}):`, errorText)
          webhookFailed = true
        }
      } else {
        webhookFailed = true
      }
    } catch (webhookError) {
      console.error(`❌ [rejectContent] Webhook error:`, webhookError)
      webhookFailed = true
    }

    return { success: true, videoId, webhookFailed }

  } catch (error) {
    console.error('Unexpected error in rejectContent:', error)
    return { success: false, error: 'Erro interno ao rejeitar conteúdo' }
  }
}

/**
 * Retry de webhook de conteúdo quando falhou.
 *
 * Detecta automaticamente qual webhook chamar baseado no estado:
 * - Se content_approval_status = 'approved' e status = 'review_script': chama 'create-cast'
 *   (aprovação que falhou no webhook)
 * - Se content_approval_status = 'regenerating' e status = 'regenerate_script': chama 'create-content'
 *   (regeneração que falhou no webhook)
 *
 * @param videoId - ID do vídeo na tabela production_videos
 * @returns Resultado da operação com success/error e webhookFailed
 */
export async function retryContentWebhook(
  videoId: number
): Promise<ApproveContentResult> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      return { success: false, error: 'Banco de dados do Gobbi não configurado' }
    }

    // 1. Buscar vídeo para determinar qual webhook chamar
    const { data: video, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, status, content_approval_status')
      .eq('id', videoId)
      .single()

    if (fetchError || !video) {
      return { success: false, error: 'Vídeo não encontrado' }
    }

    // 2. Determinar qual webhook chamar baseado no estado
    let webhookName: string
    let isRegeneration = false

    if (video.content_approval_status === 'approved' && video.status === 'review_script') {
      // Caso: Aprovação que falhou no webhook create-cast
      webhookName = 'create-cast'
    } else if (video.content_approval_status === 'regenerating' && video.status === 'regenerate_script') {
      // Caso: Regeneração que falhou no webhook create-content
      webhookName = 'create-content'
      isRegeneration = true
    } else {
      return {
        success: false,
        error: `Estado inválido para retry. Status: ${video.status}, Approval: ${video.content_approval_status}`
      }
    }

    // 3. Buscar e chamar o webhook
    let webhookFailed = false

    try {
      const { data: webhook, error: webhookFetchError } = await supabase
        .from('production_webhooks')
        .select('webhook_url, api_key')
        .eq('name', webhookName)
        .eq('is_active', true)
        .single()

      if (webhookFetchError) {
        console.warn(`⚠️ [retryContentWebhook] Webhook ${webhookName} not found or inactive:`, webhookFetchError.message)
        webhookFailed = true
      } else if (webhook) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        if (webhook.api_key) {
          headers['X-API-Key'] = webhook.api_key
        }

        const payload = {
          production_video_id: videoId,
          triggered_at: new Date().toISOString(),
          is_regeneration: isRegeneration,
          is_retry: true,
        }

        console.log(`📤 [retryContentWebhook] Calling webhook ${webhookName} for video ${videoId} (retry)...`)

        const webhookResponse = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        if (webhookResponse.ok) {
          console.log(`✅ [retryContentWebhook] Webhook ${webhookName} called successfully (${webhookResponse.status})`)

          // Se foi create-cast e deu certo, agora avança o status
          if (webhookName === 'create-cast') {
            const { error: advanceError } = await supabase
              .from('production_videos')
              .update({
                status: 'create_cast',
                updated_at: new Date().toISOString()
              })
              .eq('id', videoId)

            if (advanceError) {
              console.error(`❌ [retryContentWebhook] Failed to advance status:`, advanceError)
            } else {
              console.log(`✅ [retryContentWebhook] Video ${videoId} advanced to create_cast`)
            }
          }

          revalidatePath('/production/approval-queue')
        } else {
          const errorText = await webhookResponse.text()
          console.error(`❌ [retryContentWebhook] Webhook ${webhookName} failed (${webhookResponse.status}):`, errorText)
          webhookFailed = true
        }
      } else {
        webhookFailed = true
      }
    } catch (webhookError) {
      console.error(`❌ [retryContentWebhook] Webhook error:`, webhookError)
      webhookFailed = true
    }

    return { success: true, videoId, webhookFailed }

  } catch (error) {
    console.error('Unexpected error in retryContentWebhook:', error)
    return { success: false, error: 'Erro interno ao reenviar webhook' }
  }
}

/**
 * Busca todos os vídeos com conteúdo para exibir na fila de aprovação.
 *
 * Critérios (inclui múltiplos estados):
 * 1. pending + review_script = aguardando aprovação normal
 * 2. regenerating + regenerate_script = regenerando conteúdo (visual loading)
 * 3. approved + review_script = aprovado mas webhook falhou (precisa retry)
 *
 * NOTA: Quando webhook create-cast funciona, status muda para 'create_cast' e sai da query.
 *
 * Retorna ordenado por created_at (mais antigos primeiro).
 *
 * @returns Array de vídeos com conteúdo para aprovação/retry
 */
export async function getPendingContentApprovals(): Promise<PendingContent[]> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      console.error('❌ [getPendingContentApprovals] Gobbi client not configured')
      return []
    }

    console.log('🔍 [getPendingContentApprovals] Fetching pending content from Gobbi database...')

    // Query com JOIN para pegar dados do benchmark
    // Inclui múltiplos estados para suportar regeneração e retry
    const { data, error } = await supabase
      .from('production_videos')
      .select(`
        id,
        title,
        script,
        teaser_script,
        description,
        content_approval_status,
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
      .in('content_approval_status', ['pending', 'regenerating', 'approved'])
      .in('status', ['review_script', 'regenerate_script'])
      .order('created_at', { ascending: true })
      .limit(50)

    console.log('📊 [getPendingContentApprovals] Query result:', {
      error: error ? JSON.stringify(error, null, 2) : null,
      dataCount: data?.length || 0,
      data: data?.map(d => ({ id: d.id, status: d.status, approval_status: d.content_approval_status }))
    })

    if (error) {
      console.error('❌ [getPendingContentApprovals] Error:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('❌ [getPendingContentApprovals] Unexpected error:', error)
    return []
  }
}

/**
 * Busca histórico de aprovações/rejeições de conteúdo.
 *
 * Retorna vídeos onde content_approval_status = 'approved' OR 'rejected'
 * Ordenado por content_approved_at (mais recente primeiro)
 */
export async function getContentApprovalHistory(): Promise<ApprovalHistoryContent[]> {
  try {
    const supabase = createGobbiClient()

    if (!supabase) {
      console.error('❌ [getContentApprovalHistory] Gobbi client not configured')
      return []
    }

    const { data, error } = await supabase
      .from('production_videos')
      .select(`
        id,
        title,
        script,
        teaser_script,
        description,
        content_approval_status,
        content_approved_at,
        content_approved_by,
        created_at,
        placeholder,
        benchmark_videos (
          id,
          title,
          thumbnail_url
        )
      `)
      .in('content_approval_status', ['approved', 'rejected'])
      .not('content_approved_at', 'is', null)
      .order('content_approved_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ [getContentApprovalHistory] Error:', error)
      return []
    }

    return data || []

  } catch (error) {
    console.error('❌ [getContentApprovalHistory] Unexpected error:', error)
    return []
  }
}
