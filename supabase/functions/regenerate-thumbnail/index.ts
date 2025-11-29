// ============================================================================
// REGENERATE THUMBNAIL - Edge Function
// ============================================================================
// Chamada quando uma thumbnail é reprovada na tela de aprovação.
// Busca o webhook configurado e envia payload para N8N regerar a thumbnail.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ThumbnailRegenerationPayload {
  video_id: number
  thumb_text: string
}

interface WebhookResponse {
  success: boolean
  status?: number
  error?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
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
    const payload: ThumbnailRegenerationPayload = await req.json()

    console.log('Received regenerate-thumbnail request:', {
      video_id: payload.video_id,
      thumb_text_length: payload.thumb_text?.length || 0,
    })

    // Validar payload
    if (!payload.video_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'video_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar webhook ativo para regeneração de thumbnail
    // Busca por nome específico 'n8n-regenerate-thumbnail'
    const { data: webhook, error: webhookError } = await supabase
      .from('production_webhooks')
      .select('id, webhook_url, api_key, name')
      .eq('name', 'n8n-regenerate-thumbnail')
      .eq('is_active', true)
      .single()

    if (webhookError || !webhook) {
      console.log('No active thumbnail regeneration webhook found:', webhookError?.message)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active thumbnail regeneration webhook configured. Please create a webhook named "n8n-regenerate-thumbnail" in Settings > Webhooks.',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found webhook: ${webhook.name} (${webhook.webhook_url})`)

    // Payload mínimo conforme especificado: apenas video_id e thumb_text
    const webhookPayload = {
      video_id: payload.video_id,
      thumb_text: payload.thumb_text || '',
    }

    console.log('Sending webhook payload:', webhookPayload)

    // Enviar para N8N
    const response = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhook.api_key && { 'X-Webhook-Key': webhook.api_key }),
      },
      body: JSON.stringify(webhookPayload),
    })

    const responseStatus = response.status
    let responseBody = ''
    try {
      responseBody = await response.text()
    } catch {
      responseBody = 'Unable to read response body'
    }

    console.log(`Webhook response: ${responseStatus}`, responseBody)

    const result: WebhookResponse = {
      success: response.ok,
      status: responseStatus,
    }

    if (!response.ok) {
      result.error = `Webhook returned ${responseStatus}: ${responseBody}`
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in regenerate-thumbnail:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
