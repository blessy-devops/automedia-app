/**
 * Script para aplicar a migration de thumbnail approval no banco Gobbi
 * Execute: npx tsx scripts/apply-thumbnail-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const GOBBI_URL = process.env.GOBBI_SUPABASE_URL
const GOBBI_KEY = process.env.GOBBI_SUPABASE_ANON_KEY

if (!GOBBI_URL || !GOBBI_KEY) {
  console.error('❌ Credenciais do Gobbi não configuradas')
  process.exit(1)
}

// Ler SQL da migration
const migrationPath = path.join(__dirname, '../supabase/migrations/20251123200000_add_thumbnail_approval_system.sql')
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

// Criar client Supabase (anon key - pode não ter permissões DDL)
const supabase = createClient(GOBBI_URL, GOBBI_KEY)

async function applyMigration() {
  console.log('🔄 Aplicando migration de thumbnail approval...')
  console.log('📄 Arquivo:', migrationPath)
  console.log('')

  // Tentar executar via RPC (se houver function de migration)
  // Ou instruir execução manual
  console.log('⚠️  ATENÇÃO: Esta migration precisa ser executada manualmente')
  console.log('📋 Copie o SQL abaixo e execute no Supabase Studio do Gobbi:')
  console.log('')
  console.log('━'.repeat(80))
  console.log(migrationSQL)
  console.log('━'.repeat(80))
  console.log('')
  console.log('🔗 Link: https://supabase.com/dashboard/project/eafkhsmgrzywrhviisdl/editor')
  console.log('')
  console.log('📝 Passos:')
  console.log('1. Acesse o link acima')
  console.log('2. Vá em "SQL Editor"')
  console.log('3. Cole o SQL acima')
  console.log('4. Execute (Run)')
  console.log('')
}

applyMigration().catch(console.error)
