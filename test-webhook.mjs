#!/usr/bin/env node
// test-webhook.mjs - Script para testar o webhook send-to-gobbi

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Debugging send-to-gobbi webhook...\n')

// 1. Check environment variables
console.log('1️⃣ Checking environment variables:')
console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`)
console.log(`   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅' : '❌'}`)
console.log()

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables!')
  process.exit(1)
}

// 2. Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 3. Check production_webhooks table
console.log('2️⃣ Checking production_webhooks table:')
const { data: webhook, error: webhookError } = await supabase
  .from('production_webhooks')
  .select('id, name, webhook_url, api_key, is_active')
  .eq('name', 'receive-benchmark-videos')
  .single()

if (webhookError) {
  console.error('   ❌ Error:', webhookError.message)
  console.log()
} else if (!webhook) {
  console.log('   ❌ Webhook not found!')
  console.log()
} else {
  console.log(`   ✅ Webhook found:`)
  console.log(`      ID: ${webhook.id}`)
  console.log(`      Name: ${webhook.name}`)
  console.log(`      URL: ${webhook.webhook_url}`)
  console.log(`      API Key: ${webhook.api_key ? '✅ Set (length: ' + webhook.api_key.length + ')' : '❌ NOT SET'}`)
  console.log(`      Active: ${webhook.is_active ? '✅' : '❌'}`)
  console.log()
}

// 4. Check if api_key column exists
console.log('3️⃣ Checking if api_key column exists:')
const { data: columns, error: columnsError } = await supabase
  .from('production_webhooks')
  .select('*')
  .limit(0)

if (columnsError) {
  console.error('   ❌ Error:', columnsError.message)
} else {
  console.log('   ✅ api_key column exists')
}
console.log()

// 5. Check benchmark_videos for test data
console.log('4️⃣ Checking benchmark_videos for test data:')
const { data: videos, error: videosError } = await supabase
  .from('benchmark_videos')
  .select('id, youtube_video_id, title')
  .in('id', [1976, 2123])

if (videosError) {
  console.error('   ❌ Error:', videosError.message)
} else if (!videos || videos.length === 0) {
  console.log('   ❌ No videos found with IDs 1976, 2123')
} else {
  console.log(`   ✅ Found ${videos.length} videos:`)
  videos.forEach(v => {
    console.log(`      - ID ${v.id}: ${v.youtube_video_id} - ${v.title?.substring(0, 50)}...`)
  })
}
console.log()

// 6. Test the Edge Function
console.log('5️⃣ Testing Edge Function call:')
const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/send-to-gobbi`

try {
  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_ids: [1976, 2123],
      options: {
        include_transcript: false,
        batch_size: 10
      }
    })
  })

  console.log(`   Status: ${response.status} ${response.statusText}`)

  const result = await response.json()
  console.log('   Response:')
  console.log(JSON.stringify(result, null, 2))

  if (!result.success) {
    console.log('\n❌ Edge Function returned error!')
    if (result.errors && result.errors.length > 0) {
      console.log('\n📋 Errors:')
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Video ${err.youtube_video_id}: ${err.error}`)
      })
    }
  } else {
    console.log('\n✅ Edge Function succeeded!')
  }
} catch (error) {
  console.error('   ❌ Fetch error:', error.message)
}

console.log('\n✨ Debug complete!')
