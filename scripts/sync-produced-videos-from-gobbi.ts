/**
 * Script: Sync Produced Videos from Gobbi
 *
 * Este script busca todos os youtube_video_id que estão em production_videos
 * no banco do Gobbi e gera um SQL para atualizar o banco local.
 *
 * Usage: npx tsx scripts/sync-produced-videos-from-gobbi.ts
 */

import { createClient } from '@supabase/supabase-js'

// Gobbi credentials (from environment or hardcoded for this one-time script)
const GOBBI_URL = process.env.GOBBI_SUPABASE_URL || 'https://eafkhsmgrzywrhviisdl.supabase.co'
const GOBBI_KEY = process.env.GOBBI_SUPABASE_SERVICE_ROLE_KEY || process.env.GOBBI_SUPABASE_ANON_KEY

if (!GOBBI_KEY) {
  console.error('❌ GOBBI_SUPABASE_SERVICE_ROLE_KEY or GOBBI_SUPABASE_ANON_KEY must be set')
  process.exit(1)
}

const gobbiClient = createClient(GOBBI_URL, GOBBI_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function main() {
  console.log('🔍 Buscando vídeos produzidos no Gobbi...\n')

  // Buscar todos os benchmark_id de production_videos
  // e fazer join com benchmark_videos para pegar o youtube_video_id
  const { data: productionVideos, error } = await gobbiClient
    .from('production_videos')
    .select(`
      id,
      benchmark_id,
      benchmark_videos!inner (
        youtube_video_id
      )
    `)
    .not('benchmark_id', 'is', null)

  if (error) {
    console.error('❌ Erro ao buscar dados do Gobbi:', error)
    process.exit(1)
  }

  if (!productionVideos || productionVideos.length === 0) {
    console.log('ℹ️ Nenhum vídeo em produção encontrado no Gobbi')
    process.exit(0)
  }

  // Extrair youtube_video_ids únicos
  const youtubeVideoIds = [...new Set(
    productionVideos
      .map((pv: any) => pv.benchmark_videos?.youtube_video_id)
      .filter(Boolean)
  )]

  console.log(`✅ Encontrados ${youtubeVideoIds.length} vídeos em produção no Gobbi\n`)

  // Gerar SQL
  const sql = `-- ============================================================================
-- Migration: Mark videos sent to production (synced from Gobbi)
-- Generated: ${new Date().toISOString()}
-- Total videos: ${youtubeVideoIds.length}
-- ============================================================================

-- Update benchmark_videos to mark as sent to production
UPDATE benchmark_videos
SET is_sent_to_production = TRUE
WHERE youtube_video_id IN (
${youtubeVideoIds.map(id => `  '${id}'`).join(',\n')}
);

-- Verify count
SELECT COUNT(*) as updated_count
FROM benchmark_videos
WHERE is_sent_to_production = TRUE;
`

  console.log('📄 SQL gerado:\n')
  console.log('─'.repeat(80))
  console.log(sql)
  console.log('─'.repeat(80))

  // Também mostrar os IDs para debug
  console.log('\n📋 YouTube Video IDs:')
  youtubeVideoIds.forEach((id, i) => {
    console.log(`  ${i + 1}. ${id}`)
  })

  console.log(`\n✅ Total: ${youtubeVideoIds.length} vídeos`)
  console.log('\n💡 Copie o SQL acima e execute no seu banco local (Supabase SQL Editor)')
}

main().catch(console.error)
