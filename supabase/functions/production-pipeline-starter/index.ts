// supabase/functions/production-pipeline-starter/index.ts
// Production Pipeline Starter - Controle de Fila de Produção
// Trigger: Supabase Cron (a cada 2 minutos)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Edge Functions rodando no Supabase já têm acesso automático ao banco do mesmo projeto
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Número máximo de vídeos em produção simultânea (default: 3)
const MAX_CONCURRENT_VIDEOS = parseInt(Deno.env.get('MAX_CONCURRENT_VIDEOS') || '3', 10)

interface ProductionVideo {
  id: number
  benchmark_id: number
  placeholder: string
  status: string
  is_processing: boolean
}

serve(async (req) => {
  try {
    // ========================================================================
    // Validação: Apenas aceitar chamadas do Supabase Cron
    // ========================================================================
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Pipeline Starter] Starting production queue check...')

    // ========================================================================
    // Conectar ao banco (usa variáveis padrão do Supabase)
    // ========================================================================
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // ========================================================================
    // Step 1: Verificar se já tem vídeo em processamento (CATRACA)
    // ========================================================================
    // SCHEDULED e PUBLISHED = vídeo finalizado (não trava a fila)
    // Conforme feedback do Gobbi: "SCHEDULED tem que ter o mesmo valor de PUBLISHED pra fins de andamento da fila"
    const { data: processingVideos, error: checkError } = await supabase
      .from('production_videos')
      .select('id, placeholder, status, is_processing')
      .eq('is_processing', true)
      .neq('status', 'canceled')
      .neq('status', 'completed')
      .neq('status', 'scheduled')
      .neq('status', 'published')
      .limit(MAX_CONCURRENT_VIDEOS)

    if (checkError) {
      console.error('[Pipeline Starter] Error checking processing videos:', checkError)
      throw new Error(`Failed to check processing videos: ${checkError.message}`)
    }

    const currentCount = processingVideos?.length || 0

    // Se já atingiu o limite de vídeos em produção, para por aqui (catraca)
    if (currentCount >= MAX_CONCURRENT_VIDEOS) {
      console.log(
        `[Pipeline Starter] ⏸️  Queue blocked - ${currentCount}/${MAX_CONCURRENT_VIDEOS} videos already processing:`,
        processingVideos?.map(v => `#${v.id} (${v.placeholder})`).join(', ')
      )
      return new Response(
        JSON.stringify({
          status: 'blocked',
          message: `Maximum concurrent videos reached (${currentCount}/${MAX_CONCURRENT_VIDEOS})`,
          current_count: currentCount,
          max_concurrent: MAX_CONCURRENT_VIDEOS,
          processing_videos: processingVideos?.map(v => ({
            id: v.id,
            placeholder: v.placeholder,
            status: v.status,
          })),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Pipeline Starter] ✅ Queue has capacity (${currentCount}/${MAX_CONCURRENT_VIDEOS} slots used)`)

    // ========================================================================
    // Step 2: Pegar próximo vídeo em 'queued'
    // ========================================================================
    const { data: nextVideos, error: fetchError } = await supabase
      .from('production_videos')
      .select('id, benchmark_id, placeholder, status, is_processing')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)

    if (fetchError) {
      console.error('[Pipeline Starter] Error fetching next video:', fetchError)
      throw new Error(`Failed to fetch next video: ${fetchError.message}`)
    }

    // Se não tem vídeo aguardando, nada a fazer
    if (!nextVideos || nextVideos.length === 0) {
      console.log('[Pipeline Starter] 📭 No videos in queue')
      return new Response(
        JSON.stringify({
          status: 'idle',
          message: 'No videos in queue',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const nextVideo = nextVideos[0] as ProductionVideo

    console.log('[Pipeline Starter] 🎬 Found next video:', {
      id: nextVideo.id,
      placeholder: nextVideo.placeholder,
      benchmark_id: nextVideo.benchmark_id,
    })

    // ========================================================================
    // Step 3: Iniciar processamento do vídeo
    // ========================================================================
    const { error: updateError } = await supabase
      .from('production_videos')
      .update({
        is_processing: true,
        status: 'create_title', // Primeira etapa do pipeline
      })
      .eq('id', nextVideo.id)

    if (updateError) {
      console.error('[Pipeline Starter] Error updating video status:', updateError)
      throw new Error(`Failed to update video status: ${updateError.message}`)
    }

    console.log(
      '[Pipeline Starter] ✅ Video started processing:',
      nextVideo.id,
      `(${nextVideo.placeholder})`
    )

    // ========================================================================
    // Step 4: Retornar sucesso
    // ========================================================================
    return new Response(
      JSON.stringify({
        status: 'started',
        message: 'Video processing started',
        video_id: nextVideo.id,
        video_placeholder: nextVideo.placeholder,
        benchmark_id: nextVideo.benchmark_id,
        new_status: 'create_title',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Pipeline Starter] Fatal error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
