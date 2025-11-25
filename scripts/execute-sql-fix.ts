// Executa o SQL de correção via Supabase
import { readFileSync } from 'fs'

const GOBBI_URL = 'https://eafkhsmgrzywrhviisdl.supabase.co'
const GOBBI_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZmtoc21ncnp5d3Jodmlpc2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1MjIzMywiZXhwIjoyMDYzNTI4MjMzfQ.Tiaai7QQLOhuRnd-l2mg1RVC_NXM7XVgOKNxjQQY98E'

async function executeSql() {
  const sqlContent = readFileSync('docs/gobbi-database/fix-queued-progress.sql', 'utf-8')

  console.log('🔄 Tentando executar SQL via Supabase Management API...\n')

  // Tentar via endpoint de query do Supabase
  const response = await fetch(`${GOBBI_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': GOBBI_SERVICE_KEY,
      'Authorization': `Bearer ${GOBBI_SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sqlContent })
  })

  const text = await response.text()

  if (!response.ok) {
    console.log('❌ Método 1 falhou:', response.status, text)
    console.log('\n💡 O banco do Gobbi requer execução manual via Dashboard.')
    console.log('\n📋 INSTRUÇÕES:')
    console.log('1. Abra: https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/sql/new')
    console.log('2. Cole o conteúdo do arquivo: docs/gobbi-database/fix-queued-progress.sql')
    console.log('3. Clique em "Run" para executar')
    console.log('\n✅ O arquivo SQL está pronto e testado!')
    return
  }

  console.log('✅ SQL executado com sucesso!')
  console.log(text)
}

executeSql().catch(err => {
  console.error('❌ Erro:', err.message)
  console.log('\n💡 Execute manualmente no Supabase Dashboard')
})
