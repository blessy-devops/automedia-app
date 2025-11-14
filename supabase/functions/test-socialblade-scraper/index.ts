/**
 * TEST FUNCTION - SocialBlade Scraper
 *
 * Standalone Edge Function for testing the SocialBlade scraper.
 * This is ONLY for testing - not part of the production pipeline.
 *
 * Deploy:
 *   supabase functions deploy test-socialblade-scraper
 *
 * Test:
 *   curl -X POST https://xlpkabexmwsugkmbngwm.supabase.co/functions/v1/test-socialblade-scraper \
 *     -H "Authorization: Bearer YOUR_ANON_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"channelId": "UCuAXFkgsw1L7xaCfnd5JJOw"}'
 */

import { scrapeSocialBladeV2 } from '../_shared/socialblade-scraper-v2.ts'

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[Test SocialBlade] Received request')

    // Parse request body
    const { channelId } = await req.json()

    if (!channelId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing channelId in request body',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[Test SocialBlade] Testing scraper for channel: ${channelId}`)

    // Call the scraper V2 (lightweight version)
    const startTime = Date.now()
    const scrapedData = await scrapeSocialBladeV2(channelId)
    const duration = Date.now() - startTime

    console.log(`[Test SocialBlade] Scraping completed in ${duration}ms`)
    console.log(`[Test SocialBlade] Extracted ${scrapedData.dailyStats.length} days of data`)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        duration: `${duration}ms`,
        data: scrapedData,
        message: `Successfully scraped ${scrapedData.dailyStats.length} days of statistics`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('[Test SocialBlade] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
