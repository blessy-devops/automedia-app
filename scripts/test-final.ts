// Teste final para verificar se o fix funcionou
import { createClient } from '@supabase/supabase-js'

const GOBBI_URL = 'https://eafkhsmgrzywrhviisdl.supabase.co'
const GOBBI_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZmtoc21ncnp5d3Jodmlpc2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1MjIzMywiZXhwIjoyMDYzNTI4MjMzfQ.Tiaai7QQLOhuRnd-l2mg1RVC_NXM7XVgOKNxjQQY98E'

const gobbiClient = createClient(GOBBI_URL, GOBBI_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function testFix() {
  console.log('🧪 Testando correção do progresso...\n')

  // Teste 1: Lista de vídeos
  console.log('📋 Teste 1: get_production_videos_list')
  const { data: listData, error: listError } = await gobbiClient.rpc(
    'get_production_videos_list',
    {
      p_status: null,
      p_search: null,
      p_page: 1,
      p_per_page: 100,
    }
  )

  if (listError) {
    console.error('❌ Erro:', listError)
    return
  }

  const videos = listData.videos.filter((v: any) => v.id === 176 || v.id === 177)
  console.table(videos.map((v: any) => ({
    id: v.id,
    status: v.status,
    progress: v.progress,
  })))

  // Teste 2: Detalhes individuais
  console.log('\n📋 Teste 2: get_production_video_details')

  for (const id of [176, 177]) {
    const { data, error } = await gobbiClient.rpc('get_production_video_details', {
      p_video_id: id,
    })

    if (error) {
      console.error(`❌ Erro no vídeo ${id}:`, error)
      continue
    }

    console.log(`\nVídeo #${id}:`)
    console.log(`  Status: ${data.status}`)
    console.log(`  Progresso: ${data.progressPercentage}%`)
    console.log(`  Stage: ${data.currentStage}`)
  }

  // Verificação final
  console.log('\n✅ VERIFICAÇÃO FINAL:')
  const video176 = videos.find((v: any) => v.id === 176)
  const video177 = videos.find((v: any) => v.id === 177)

  if (video176?.progress === 8 && video177?.progress === 0) {
    console.log('🎉 SUCESSO! Ambos os vídeos estão com progresso correto!')
    console.log('   - Vídeo #176 (create_title): 8% ✅')
    console.log('   - Vídeo #177 (queued): 0% ✅')
  } else {
    console.log('⚠️  Algo ainda não está correto:')
    console.log(`   - Vídeo #176: ${video176?.progress}% (esperado: 8%)`)
    console.log(`   - Vídeo #177: ${video177?.progress}% (esperado: 0%)`)
  }
}

testFix().catch(console.error)
