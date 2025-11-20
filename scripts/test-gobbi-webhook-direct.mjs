import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testGobbiWebhookDirect() {
  console.log('\n🧪 Teste DIRETO no webhook do Gobbi\n')

  // 1. Buscar um vídeo + canal
  const { data: video } = await supabase
    .from('benchmark_videos')
    .select('*')
    .eq('youtube_video_id', 'sDseVQpnCvw')
    .single()

  if (!video) {
    console.log('❌ Vídeo não encontrado')
    return
  }

  // 2. Buscar canal associado
  const { data: channel } = await supabase
    .from('benchmark_channels')
    .select('*')
    .eq('channel_id', video.channel_id)
    .single()

  console.log('✅ Dados preparados:')
  console.log('   Vídeo:', video.youtube_video_id)
  console.log('   Canal:', channel ? channel.channel_id : 'NÃO ENCONTRADO')

  // 3. Mapear campos do canal (nosso schema → Gobbi schema)
  // Note: Only send fields that exist in Gobbi's benchmark_channels table
  const mappedChannel = channel ? {
    channel_id: channel.channel_id,
    channel_name: channel.channel_name,
    description: channel.description,
    subscriber_count: channel.subscriber_count,
    // Note: video_count, view_count, published_at removed - columns don't exist in Gobbi's table
    thumbnail_url: channel.thumbnail_url,
    banner_url: channel.banner_url,
    custom_url: channel.custom_url,
    country: channel.country,
    is_verified: channel.is_verified,
  } : null

  // 4. Preparar payload
  const payload = {
    ...(mappedChannel && { channels: [mappedChannel] }),
    videos: [{
      youtube_video_id: video.youtube_video_id,
      channel_id: video.channel_id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      upload_date: video.upload_date,
      video_length: video.video_length,
      views: video.views,
      channel_name: video.channel_name,
      status: 'add_to_production',
    }],
    metadata: {
      sent_at: new Date().toISOString(),
      source: 'test-script',
      video_count: 1,
      ...(mappedChannel && { channel_count: 1 }),
    },
  }

  console.log('\n📦 Payload a ser enviado:')
  console.log(JSON.stringify(payload, null, 2))

  // 5. Enviar para webhook do Gobbi
  const webhookUrl = 'https://eafkhsmgrzywrhviisdl.supabase.co/functions/v1/receive-benchmark-videos'

  console.log('\n📤 Enviando para:', webhookUrl)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('\n✅ Status:', response.status, response.statusText)

    const result = await response.json()

    console.log('\n📥 Resposta do webhook:')
    console.log(JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('\n🎉 SUCESSO!')
    } else {
      console.log('\n❌ FALHOU')
      console.log('   Error:', result.error)
      console.log('   Message:', result.message)

      if (result.errors && result.errors.length > 0) {
        console.log('\n   Erros detalhados:')
        result.errors.forEach((err, i) => {
          console.log(`   ${i + 1}. [${err.type}] ${err.id}: ${err.error}`)
        })
      }
    }
  } catch (error) {
    console.log('\n❌ EXCEÇÃO ao chamar webhook:')
    console.log('   Error:', error.message)
    console.log('   Stack:', error.stack)
  }
}

testGobbiWebhookDirect().catch(console.error)
