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

async function debugChannelQuery() {
  const channelId = 'UCAyLgiPKxZ36qRDWBqxtftg'

  console.log('\n🔍 Testando diferentes queries para o canal:', channelId, '\n')

  // Test 1: Simple query with .eq()
  console.log('Test 1: Query simples com .eq()')
  const { data: test1, error: error1 } = await supabase
    .from('benchmark_channels')
    .select('channel_id, channel_name')
    .eq('channel_id', channelId)

  console.log('  Resultado:', test1?.length || 0, 'canais')
  if (error1) console.log('  Erro:', error1)

  // Test 2: Query with .in()
  console.log('\nTest 2: Query com .in()')
  const { data: test2, error: error2 } = await supabase
    .from('benchmark_channels')
    .select('channel_id, channel_name')
    .in('channel_id', [channelId])

  console.log('  Resultado:', test2?.length || 0, 'canais')
  if (error2) console.log('  Erro:', error2)

  // Test 3: Exact query from send-to-gobbi (linha 164-180)
  console.log('\nTest 3: Query exata do send-to-gobbi')
  const { data: test3, error: error3 } = await supabase
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
    .in('channel_id', [channelId])

  console.log('  Resultado:', test3?.length || 0, 'canais')
  if (error3) {
    console.log('  ❌ ERRO:', error3)
    console.log('  Código:', error3.code)
    console.log('  Message:', error3.message)
    console.log('  Details:', error3.details)
    console.log('  Hint:', error3.hint)
  }

  // Test 4: Check which fields exist
  console.log('\nTest 4: Verificando campos existentes na tabela')
  const { data: test4, error: error4 } = await supabase
    .from('benchmark_channels')
    .select('*')
    .eq('channel_id', channelId)
    .single()

  if (test4) {
    console.log('  Campos disponíveis:', Object.keys(test4).join(', '))
  } else {
    console.log('  ❌ Não conseguiu buscar campos')
  }
}

debugChannelQuery().catch(console.error)
