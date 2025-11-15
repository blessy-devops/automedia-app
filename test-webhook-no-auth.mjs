#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🧪 Testing send-to-gobbi (assuming no auth on Gobbi side)...\n')

// Temporarily remove api_key to test without authentication
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

console.log('1️⃣ Temporarily removing api_key from production_webhooks...')
const { error: updateError } = await supabase
  .from('production_webhooks')
  .update({ api_key: null })
  .eq('name', 'receive-benchmark-videos')

if (updateError) {
  console.error('   ❌ Error:', updateError.message)
  process.exit(1)
}
console.log('   ✅ API key removed\n')

console.log('2️⃣ Testing Edge Function...')
try {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-to-gobbi`, {
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

  const result = await response.json()
  console.log('   Status:', response.status)
  console.log('   Result:', JSON.stringify(result, null, 2))

  if (result.success) {
    console.log('\n✅ SUCCESS! Videos sent to Gobbi!')
  } else {
    console.log('\n❌ Failed:', result.message)
  }
} catch (error) {
  console.error('   ❌ Error:', error.message)
}

console.log('\n✨ Test complete!')
