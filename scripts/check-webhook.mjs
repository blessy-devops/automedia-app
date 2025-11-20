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

async function checkWebhook() {
  console.log('\n🔍 Verificando webhook receive-benchmark-videos...\n')

  const { data: webhook, error } = await supabase
    .from('production_webhooks')
    .select('*')
    .eq('name', 'receive-benchmark-videos')
    .single()

  if (error) {
    console.log('❌ Erro ao buscar webhook:', error)
    return
  }

  if (!webhook) {
    console.log('❌ Webhook não encontrado')
    return
  }

  console.log('✅ Webhook encontrado:')
  console.log('   ID:', webhook.id)
  console.log('   Name:', webhook.name)
  console.log('   URL:', webhook.webhook_url)
  console.log('   Active:', webhook.is_active ? '✅ Sim' : '❌ Não')
  console.log('   Has API Key:', webhook.api_key ? '✅ Sim' : '❌ Não')
  console.log('   Description:', webhook.description)

  // Test webhook URL
  console.log('\n🧪 Testando conectividade com webhook...\n')

  try {
    const response = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videos: [],
        metadata: {
          sent_at: new Date().toISOString(),
          source: 'test',
          video_count: 0,
        },
      }),
    })

    console.log('   Status:', response.status, response.statusText)

    const text = await response.text()
    console.log('   Response:', text.substring(0, 200))
  } catch (error) {
    console.log('   ❌ Erro ao testar webhook:', error.message)
  }
}

checkWebhook().catch(console.error)
