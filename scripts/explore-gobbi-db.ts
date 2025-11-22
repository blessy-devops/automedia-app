/**
 * Script to explore Gobbi's database structure
 */

import { createGobbiClient } from '../lib/supabase/gobbi'

async function main() {
  const supabase = createGobbiClient()

  if (!supabase) {
    console.error('Failed to create Gobbi client')
    return
  }

  console.log('=== EXPLORING GOBBI DATABASE ===\n')

  // 1. structure_brand_bible
  console.log('1. structure_brand_bible:')
  const { data: brandBible, error: bbError } = await supabase
    .from('structure_brand_bible')
    .select('*')
    .limit(1)

  if (bbError) {
    console.error('Error:', bbError)
  } else {
    console.log(JSON.stringify(brandBible, null, 2))
  }
  console.log('\n---\n')

  // 2. structure_credentials
  console.log('2. structure_credentials:')
  const { data: credentials, error: credError } = await supabase
    .from('structure_credentials')
    .select('*')
    .limit(1)

  if (credError) {
    console.error('Error:', credError)
  } else {
    console.log(JSON.stringify(credentials, null, 2))
  }
  console.log('\n---\n')

  // 3. production_videos (for stats)
  console.log('3. production_videos count:')
  const { count, error: countError } = await supabase
    .from('production_videos')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Error:', countError)
  } else {
    console.log('Total videos:', count)
  }
  console.log('\n---\n')

  // 4. structure_accounts with brand_bible
  console.log('4. structure_accounts with brand_bible:')
  const { data: accounts, error: accError } = await supabase
    .from('structure_accounts')
    .select('id, name, brand_id')
    .limit(3)

  if (accError) {
    console.error('Error:', accError)
  } else {
    console.log(JSON.stringify(accounts, null, 2))
  }
}

main().catch(console.error)
