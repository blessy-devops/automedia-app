import { createClient } from '@supabase/supabase-js'

// Gobbi's database credentials
const gobbiUrl = 'https://eafkhsmgrzywrhviisdl.supabase.co'
const gobbiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZmtoc21ncnp5d3Jodmlpc2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1MjIzMywiZXhwIjoyMDYzNTI4MjMzfQ.Tiaai7QQLOhuRnd-l2mg1RVC_NXM7XVgOKNxjQQY98E'

const gobbiClient = createClient(gobbiUrl, gobbiKey)

async function verifyDistributionQueue() {
  console.log('\n🔍 Verificando fila de distribuição...\n')

  // 1. Buscar vídeo recém-enviado
  const { data: video } = await gobbiClient
    .from('benchmark_videos')
    .select('*')
    .eq('youtube_video_id', 'GHVs262gEXA')
    .single()

  if (!video) {
    console.log('❌ Vídeo não encontrado')
    return
  }

  console.log('✅ Vídeo no banco do Gobbi:')
  console.log('   YouTube ID:', video.youtube_video_id)
  console.log('   Title:', video.title)
  console.log('   Status:', video.status)
  console.log('   Channel ID:', video.channel_id)

  // 2. Testar a RPC function que a tela usa
  console.log('\n🔍 Chamando RPC get_videos_awaiting_distribution...\n')

  const { data: rpcData, error: rpcError } = await gobbiClient.rpc('get_videos_awaiting_distribution')

  if (rpcError) {
    console.log('❌ Erro na RPC:', rpcError.message)
    return
  }

  const result = rpcData
  console.log('   Total de vídeos na fila:', result.videos?.length || 0)

  if (result.videos && result.videos.length > 0) {
    const foundVideo = result.videos.find(v => v.youtube_video_id === 'GHVs262gEXA')

    if (foundVideo) {
      console.log('\n🎉 SUCESSO! Vídeo APARECE na fila de distribuição!')
      console.log('   Title:', foundVideo.title)
      console.log('   Status:', foundVideo.status)
      console.log('   Canais elegíveis:', foundVideo.eligibleChannels?.length || 0)

      if (foundVideo.eligibleChannels && foundVideo.eligibleChannels.length > 0) {
        console.log('\n   Canais compatíveis:')
        foundVideo.eligibleChannels.forEach((ch, i) => {
          console.log(`   ${i + 1}. ${ch.placeholder} (${ch.niche} > ${ch.subniche})`)
        })
      }
    } else {
      console.log('\n❌ Vídeo NÃO encontrado na RPC')
      console.log('   Outros vídeos na fila:')
      result.videos.slice(0, 3).forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.title} (${v.status})`)
      })
    }
  } else {
    console.log('   ❌ Nenhum vídeo na fila de distribuição')
  }
}

verifyDistributionQueue().catch(console.error)
