import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'OK' : 'MISSING')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyze() {
  // 1. Buscar vídeos com métricas zeradas
  const { data: zeradosVideos, error: err1 } = await supabase
    .from('benchmark_videos')
    .select('id, youtube_video_id, channel_id, views, performance_vs_avg_historical, performance_vs_median_historical, performance_vs_avg_14d, performance_vs_median_14d, updated_at')
    .or('performance_vs_avg_14d.is.null,performance_vs_median_14d.is.null')
    .not('views', 'is', null)
    .gt('views', 0)
    .order('updated_at', { ascending: false })
    .limit(50)

  console.log('=== VÍDEOS COM MÉTRICAS 14D NULL (mas com views) ===')
  console.log('Total encontrados (amostra):', zeradosVideos?.length)

  if (zeradosVideos && zeradosVideos.length > 0) {
    // Agrupar por channel_id
    const byChannel: Record<string, any[]> = {}
    zeradosVideos.forEach(v => {
      if (!byChannel[v.channel_id]) byChannel[v.channel_id] = []
      byChannel[v.channel_id].push(v)
    })

    console.log('\nCanais afetados:', Object.keys(byChannel).length)

    for (const [channelId, videos] of Object.entries(byChannel)) {
      console.log('\n--- Channel:', channelId, '---')
      console.log('Videos com problema:', videos.length)

      // Verificar baseline stats desse canal
      const { data: baseline } = await supabase
        .from('benchmark_channels_baseline_stats')
        .select('*')
        .eq('channel_id', channelId)
        .single()

      console.log('Baseline stats:')
      console.log('  is_available:', baseline?.is_available)
      console.log('  total_views_14d:', baseline?.total_views_14d)
      console.log('  media_diaria_views_14d:', baseline?.media_diaria_views_14d)
      console.log('  mediana_diaria_views_14d:', baseline?.mediana_diaria_views_14d)

      // Mostrar um exemplo de vídeo
      const sample = videos[0]
      console.log('\nExemplo de vídeo:')
      console.log('  video_id:', sample.youtube_video_id)
      console.log('  views:', sample.views)
      console.log('  perf_avg_historical:', sample.performance_vs_avg_historical)
      console.log('  perf_median_historical:', sample.performance_vs_median_historical)
      console.log('  perf_avg_14d:', sample.performance_vs_avg_14d)
      console.log('  perf_median_14d:', sample.performance_vs_median_14d)
    }
  }

  // 2. Verificar canais no radar
  console.log('\n\n=== CANAIS NO RADAR ===')
  const { data: radarChannels } = await supabase
    .from('channel_radar')
    .select('channel_id, last_update_at, is_active')
    .eq('is_active', true)

  console.log('Canais ativos no radar:', radarChannels?.length)

  for (const rc of radarChannels || []) {
    const { data: baseline } = await supabase
      .from('benchmark_channels_baseline_stats')
      .select('is_available, media_diaria_views_14d, mediana_diaria_views_14d')
      .eq('channel_id', rc.channel_id)
      .single()

    console.log('\nChannel:', rc.channel_id)
    console.log('  last_update:', rc.last_update_at)
    console.log('  baseline is_available:', baseline?.is_available)
    console.log('  media_diaria_14d:', baseline?.media_diaria_views_14d)
    console.log('  mediana_diaria_14d:', baseline?.mediana_diaria_views_14d)
  }

  // 3. Verificar últimas tasks de enrichment (radar)
  console.log('\n\n=== ÚLTIMAS TASKS DO RADAR ===')
  const { data: recentTasks } = await supabase
    .from('channel_enrichment_tasks')
    .select('id, channel_id, overall_status, socialblade_status, recent_videos_status, outlier_analysis_status, created_at')
    .is('enrichment_job_id', null) // Tasks do radar não têm job_id
    .order('created_at', { ascending: false })
    .limit(10)

  for (const task of recentTasks || []) {
    console.log('\nTask #' + task.id, '- Channel:', task.channel_id)
    console.log('  created_at:', task.created_at)
    console.log('  overall_status:', task.overall_status)
    console.log('  socialblade:', task.socialblade_status)
    console.log('  recent_videos:', task.recent_videos_status)
    console.log('  outlier_analysis:', task.outlier_analysis_status)
  }
}

analyze().catch(console.error)
