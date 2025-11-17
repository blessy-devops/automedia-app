// supabase/functions/production-queue-control/index.ts
// Production Queue Control - Substitui WF0 do N8N
// Trigger: Supabase Cron (a cada 2 minutos)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Edge Functions rodando no Supabase já têm acesso automático ao banco do mesmo projeto
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ProductionVideo {
  id: number
  status: string
  is_processing: boolean
}

interface BenchmarkVideo {
  id: number
  title: string
  status: string
  categorization: Record<string, any>
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

    console.log('[Queue Control] Starting queue check...')

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
    // Step 1: Verificar se já tem vídeo em processamento
    // ========================================================================
    const { data: processingVideos, error: checkError } = await supabase
      .from('production_videos')
      .select('id, status, is_processing')
      .eq('is_processing', true)
      .neq('status', 'canceled')
      .limit(1)

    if (checkError) {
      console.error('[Queue Control] Error checking processing videos:', checkError)
      throw new Error(`Failed to check processing videos: ${checkError.message}`)
    }

    // Se já tem vídeo processando, para por aqui (catraca)
    if (processingVideos && processingVideos.length > 0) {
      console.log('[Queue Control] ⏸️  Queue blocked - video already processing:', processingVideos[0].id)
      return new Response(
        JSON.stringify({
          status: 'blocked',
          message: 'A video is already being processed',
          processing_video_id: processingVideos[0].id,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('[Queue Control] ✅ No videos processing - queue is clear')

    // ========================================================================
    // Step 2: Pegar próximo vídeo em 'add_to_production'
    // ========================================================================
    const { data: nextVideos, error: fetchError } = await supabase
      .from('benchmark_videos')
      .select('id, title, status, categorization')
      .eq('status', 'add_to_production')
      .order('created_at', { ascending: true })
      .limit(1)

    if (fetchError) {
      console.error('[Queue Control] Error fetching next video:', fetchError)
      throw new Error(`Failed to fetch next video: ${fetchError.message}`)
    }

    // Se não tem vídeo aguardando, nada a fazer
    if (!nextVideos || nextVideos.length === 0) {
      console.log('[Queue Control] 📭 No videos waiting for distribution')
      return new Response(
        JSON.stringify({
          status: 'idle',
          message: 'No videos in queue',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const nextVideo = nextVideos[0] as BenchmarkVideo

    console.log('[Queue Control] 🎬 Found next video:', {
      id: nextVideo.id,
      title: nextVideo.title,
    })

    // ========================================================================
    // Step 3: Marcar vídeo como 'pending_distribution'
    // ========================================================================
    const { error: updateError } = await supabase
      .from('benchmark_videos')
      .update({
        status: 'pending_distribution',
        updated_at: new Date().toISOString(),
      })
      .eq('id', nextVideo.id)

    if (updateError) {
      console.error('[Queue Control] Error updating video status:', updateError)
      throw new Error(`Failed to update video status: ${updateError.message}`)
    }

    console.log('[Queue Control] ✅ Video marked as pending_distribution:', nextVideo.id)

    // ========================================================================
    // Step 4: Retornar sucesso
    // ========================================================================
    return new Response(
      JSON.stringify({
        status: 'processed',
        message: 'Video moved to pending distribution',
        video_id: nextVideo.id,
        video_title: nextVideo.title,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Queue Control] Fatal error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
