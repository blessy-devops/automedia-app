import { createClient } from '@supabase/supabase-js'

// Gobbi's database credentials
const gobbiUrl = 'https://eafkhsmgrzywrhviisdl.supabase.co'
const gobbiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZmtoc21ncnp5d3Jodmlpc2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1MjIzMywiZXhwIjoyMDYzNTI4MjMzfQ.Tiaai7QQLOhuRnd-l2mg1RVC_NXM7XVgOKNxjQQY98E'

const gobbiClient = createClient(gobbiUrl, gobbiKey)

async function checkVideoStatus() {
  console.log('\n🔍 Verificando status do vídeo no banco do Gobbi...\n')

  // Buscar vídeo recém-enviado
  const { data: videos, error } = await gobbiClient
    .from('benchmark_videos')
    .select('*')
    .eq('youtube_video_id', 'sDseVQpnCvw')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.log('❌ Erro:', error.message)
    return
  }

  if (!videos || videos.length === 0) {
    console.log('❌ Vídeo não encontrado no banco do Gobbi')
    return
  }

  const video = videos[0]

  console.log('✅ Vídeo encontrado:')
  console.log('   ID:', video.id)
  console.log('   YouTube ID:', video.youtube_video_id)
  console.log('   Title:', video.title)
  console.log('   Status:', video.status)
  console.log('   Channel ID:', video.channel_id)
  console.log('   Created at:', video.created_at)

  console.log('\n📋 Status esperado para aparecer na tela de distribuição:')
  console.log('   ✅ "pending_distribution"')
  console.log('   ❌ Atual:', video.status)

  if (video.status !== 'pending_distribution') {
    console.log('\n⚠️  PROBLEMA: Status incorreto!')
    console.log('   O vídeo foi enviado com status "add_to_production"')
    console.log('   Mas a tela de distribuição busca apenas "pending_distribution"')
    console.log('\n💡 SOLUÇÃO: Atualizar o status para "pending_distribution"')
  } else {
    console.log('\n✅ Status correto!')
  }

  // Testar a RPC function
  console.log('\n🔍 Testando RPC get_videos_awaiting_distribution...\n')

  const { data: rpcData, error: rpcError } = await gobbiClient.rpc('get_videos_awaiting_distribution')

  if (rpcError) {
    console.log('❌ Erro na RPC:', rpcError.message)
    return
  }

  const result = rpcData
  console.log('   Vídeos retornados:', result.videos?.length || 0)

  if (result.videos && result.videos.length > 0) {
    const foundVideo = result.videos.find(v => v.youtube_video_id === 'sDseVQpnCvw')
    if (foundVideo) {
      console.log('   ✅ Vídeo ENCONTRADO na RPC!')
    } else {
      console.log('   ❌ Vídeo NÃO encontrado na RPC')
    }
  } else {
    console.log('   ❌ Nenhum vídeo retornado pela RPC')
  }
}

checkVideoStatus().catch(console.error)
