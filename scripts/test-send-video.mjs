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

async function testSendVideo() {
  console.log('\n🚀 Testando envio de vídeo sDseVQpnCvw...\n')

  // Get video ID
  const { data: video } = await supabase
    .from('benchmark_videos')
    .select('id')
    .eq('youtube_video_id', 'sDseVQpnCvw')
    .single()

  if (!video) {
    console.log('❌ Vídeo não encontrado')
    return
  }

  console.log('✅ Vídeo encontrado, ID:', video.id)
  console.log('\n📤 Invocando Edge Function send-to-gobbi...\n')

  // Call send-to-gobbi Edge Function
  const { data, error } = await supabase.functions.invoke('send-to-gobbi', {
    body: {
      video_ids: [video.id],
      options: {
        include_transcript: false,
        batch_size: 50,
      },
    },
  })

  if (error) {
    console.log('❌ Erro ao invocar Edge Function:', error)
    return
  }

  console.log('✅ Edge Function respondeu:')
  console.log(JSON.stringify(data, null, 2))

  if (data.success) {
    console.log('\n🎉 SUCESSO! Canais e vídeos enviados corretamente!')
    console.log('   Canais enviados:', data.channels_sent)
    console.log('   Vídeos enviados:', data.videos_sent)
  } else {
    console.log('\n❌ Falhou:')
    console.log('   Message:', data.message)
    console.log('   Errors:', data.errors)
  }
}

testSendVideo().catch(console.error)
