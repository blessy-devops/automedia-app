import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSendWithDetails() {
  console.log('\n🧪 Teste completo de envio de vídeo\n')

  // 1. Pegar primeiro vídeo da lista
  const { data: videos } = await supabase
    .from('benchmark_videos')
    .select('id, youtube_video_id, channel_id, title')
    .limit(1)

  if (!videos || videos.length === 0) {
    console.log('❌ Nenhum vídeo encontrado')
    return
  }

  const video = videos[0]
  console.log('✅ Vídeo selecionado:')
  console.log('   ID:', video.id)
  console.log('   YouTube ID:', video.youtube_video_id)
  console.log('   Channel ID:', video.channel_id)
  console.log('   Title:', video.title)

  // 2. Verificar webhook
  console.log('\n🔍 Verificando webhook...')
  const { data: webhook, error: webhookError } = await supabase
    .from('production_webhooks')
    .select('*')
    .eq('name', 'receive-benchmark-videos')
    .eq('is_active', true)
    .single()

  if (webhookError || !webhook) {
    console.log('❌ Webhook não encontrado ou inativo:', webhookError)
    return
  }

  console.log('✅ Webhook encontrado:', webhook.name)
  console.log('   URL:', webhook.webhook_url)

  // 3. Invocar Edge Function
  console.log('\n📤 Invocando send-to-gobbi Edge Function...\n')

  try {
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
      console.log('❌ ERRO ao invocar Edge Function:')
      console.log('   Message:', error.message)
      console.log('   Context:', error.context)
      console.log('   Full error:', JSON.stringify(error, null, 2))
      return
    }

    console.log('✅ Edge Function respondeu:\n')
    console.log(JSON.stringify(data, null, 2))

    if (data.success) {
      console.log('\n🎉 SUCESSO!')
      console.log('   Canais enviados:', data.channels_sent)
      console.log('   Vídeos enviados:', data.videos_sent)
    } else {
      console.log('\n❌ FALHOU:')
      console.log('   Message:', data.message)

      if (data.errors && data.errors.length > 0) {
        console.log('\n   Erros detalhados:')
        data.errors.forEach((err, i) => {
          console.log(`   ${i + 1}. [${err.type}] ${err.id}: ${err.error}`)
        })
      }
    }
  } catch (err) {
    console.log('❌ EXCEÇÃO ao invocar Edge Function:')
    console.log('   Error:', err)
    console.log('   Stack:', err.stack)
  }
}

testSendWithDetails().catch(console.error)
