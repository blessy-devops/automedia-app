import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVideoAndChannel() {
  console.log('\n🔍 Verificando vídeo sDseVQpnCvw...\n')

  // 1. Buscar o vídeo
  const { data: video, error: videoError } = await supabase
    .from('benchmark_videos')
    .select('id, youtube_video_id, channel_id, channel_name, title')
    .eq('youtube_video_id', 'sDseVQpnCvw')
    .single()

  if (videoError) {
    console.error('❌ Erro ao buscar vídeo:', videoError)
    return
  }

  if (!video) {
    console.log('❌ Vídeo não encontrado')
    return
  }

  console.log('✅ Vídeo encontrado:')
  console.log('   ID:', video.id)
  console.log('   YouTube ID:', video.youtube_video_id)
  console.log('   Channel ID:', video.channel_id)
  console.log('   Channel Name:', video.channel_name || '(null)')
  console.log('   Title:', video.title)

  // 2. Buscar o canal associado
  console.log('\n🔍 Buscando canal com channel_id:', video.channel_id, '\n')

  const { data: channel, error: channelError } = await supabase
    .from('benchmark_channels')
    .select('id, channel_id, channel_name, subscriber_count')
    .eq('channel_id', video.channel_id)
    .single()

  if (channelError) {
    if (channelError.code === 'PGRST116') {
      console.log('❌ PROBLEMA ENCONTRADO: Canal NÃO existe na tabela benchmark_channels!')
      console.log('   O vídeo tem channel_id:', video.channel_id)
      console.log('   Mas não há registro desse canal em benchmark_channels')
      console.log('\n💡 SOLUÇÃO: Precisamos enriquecer o canal antes de enviar o vídeo')
    } else {
      console.error('❌ Erro ao buscar canal:', channelError)
    }
    return
  }

  if (!channel) {
    console.log('❌ Canal não encontrado')
    return
  }

  console.log('✅ Canal encontrado:')
  console.log('   ID:', channel.id)
  console.log('   Channel ID:', channel.channel_id)
  console.log('   Channel Name:', channel.channel_name)
  console.log('   Subscribers:', channel.subscriber_count)

  // 3. Simular a query que send-to-gobbi faz
  console.log('\n🔍 Simulando query do send-to-gobbi...\n')

  const channelIds = [video.channel_id]
  const { data: channels } = await supabase
    .from('benchmark_channels')
    .select(`
      channel_id,
      channel_name,
      description,
      subscriber_count,
      video_count,
      view_count,
      published_at,
      thumbnail_url,
      banner_url,
      custom_url,
      country,
      is_verified
    `)
    .in('channel_id', channelIds)

  console.log('   Canais encontrados:', channels?.length || 0)
  if (channels && channels.length > 0) {
    console.log('   ✅ Canal seria incluído no payload')
  } else {
    console.log('   ❌ Nenhum canal seria incluído no payload!')
  }
}

checkVideoAndChannel().catch(console.error)
