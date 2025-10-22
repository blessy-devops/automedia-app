// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface VideoData {
  videoId: string
  title: string
  viewCount?: number
  viewCountText?: string
  lengthText?: string
  duration?: string
  type?: string
}

interface CategorizationResult {
  niche: string
  subniche: string
  microniche: string
  category: string
  format: string
}

/**
 * Enrichment Step 1: Channel Categorization
 *
 * Categorizes a YouTube channel using an LLM with structured taxonomy.
 * Follows the exact logic from n8n workflow for consistency.
 *
 * Process:
 * 1. Check if categorization already exists (skip if yes)
 * 2. Update task status to 'processing'
 * 3. Fetch channel details from benchmark_channels
 * 4. Fetch popular videos from RapidAPI
 * 5. Filter videos (remove Shorts, < 240s)
 * 6. Sort by views and get top 10
 * 7. Fetch valid options from structure_categorization_* tables
 * 8. Build detailed prompt with taxonomy
 * 9. Call OpenRouter API (GPT-4o-mini) for categorization
 * 10. Parse and validate LLM response
 * 11. Update benchmark_channels with categorization result
 * 12. Update task status to 'completed'
 * 13. Invoke next step in pipeline
 */
Deno.serve(async (req) => {
  try {
    console.log('[Step 1: Categorization] Starting channel categorization')

    const { channelId, taskId } = await req.json()

    if (!channelId || !taskId) {
      throw new Error('Missing required parameters: channelId or taskId')
    }

    console.log(`[Step 1: Categorization] Processing channel: ${channelId}, task: ${taskId}`)

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Step 1: Check if categorization already exists
    console.log('[Step 1: Categorization] Checking if categorization already exists')
    const { data: existingChannel, error: checkError } = await supabase
      .from('benchmark_channels')
      .select('categorization')
      .eq('channel_id', channelId)
      .single()

    if (checkError) {
      throw new Error(`Failed to check existing categorization: ${checkError.message}`)
    }

    if (existingChannel?.categorization && Object.keys(existingChannel.categorization).length > 0) {
      console.log('[Step 1: Categorization] Categorization already exists, skipping...')

      // Mark as completed immediately
      await supabase
        .from('channel_enrichment_tasks')
        .update({
          categorization_status: 'completed',
          categorization_started_at: new Date().toISOString(),
          categorization_completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      // Invoke next step
      await supabase.functions.invoke('enrichment-step-2-socialblade', {
        body: { channelId, taskId },
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Categorization already exists, skipped',
          skipped: true,
          channelId,
          taskId,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Step 2: Update task status to 'processing'
    console.log('[Step 1: Categorization] Updating task status to processing')
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        categorization_status: 'processing',
        categorization_started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // Step 3: Fetch channel details from database
    console.log('[Step 1: Categorization] Fetching channel details from database')
    const { data: channelData, error: channelError } = await supabase
      .from('benchmark_channels')
      .select('channel_name, description, channel_keywords')
      .eq('channel_id', channelId)
      .single()

    if (channelError) {
      throw new Error(`Failed to fetch channel details: ${channelError.message}`)
    }

    console.log('[Step 1: Categorization] Channel data:', {
      name: channelData.channel_name,
      hasDescription: !!channelData.description,
      hasKeywords: !!channelData.channel_keywords,
    })

    // Step 4: Get RapidAPI key from Environment Variables
    console.log('[Step 1: Categorization] Getting RapidAPI key from environment')
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')

    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY environment variable not found. Please add it to Edge Function secrets.')
    }

    const videosResponse = await fetch(
      `https://yt-api.p.rapidapi.com/channel/videos?id=${channelId}&sort_by=popular&limit=30`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'yt-api.p.rapidapi.com',
        },
      }
    )

    if (!videosResponse.ok) {
      throw new Error(`RapidAPI request failed: ${videosResponse.statusText}`)
    }

    const videosData = await videosResponse.json()
    const rawVideos: VideoData[] = videosData.data || []

    console.log(`[Step 1: Categorization] Fetched ${rawVideos.length} raw videos`)

    // Step 5: Filter and process videos (remove Shorts, sort by views)
    const minDurationSeconds = 240 // 4 minutes minimum

    const durationToSeconds = (duration: string): number => {
      if (!duration || duration === 'SHORTS') return 0

      const parts = duration.split(':').map((p) => parseInt(p, 10))
      if (parts.length === 2) return parts[0] * 60 + parts[1] // MM:SS
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2] // H:MM:SS
      return 0
    }

    const parseViewCount = (viewText: string | number): number => {
      if (typeof viewText === 'number') return viewText

      const text = String(viewText).toLowerCase().replace(/[^0-9kmb.,]/g, '')
      const num = parseFloat(text)

      if (text.includes('k')) return Math.round(num * 1000)
      if (text.includes('m')) return Math.round(num * 1000000)
      if (text.includes('b')) return Math.round(num * 1000000000)

      return Math.round(num) || 0
    }

    const filteredVideos = rawVideos
      .filter((video) => {
        // Filter only videos (not playlists, etc)
        if (video.type && video.type !== 'video') {
          console.log(`[Filter] Removed (not video): "${video.title}" - type: ${video.type}`)
          return false
        }

        // Filter by duration
        const duration = video.lengthText || video.duration || ''
        const durationSeconds = durationToSeconds(duration)

        if (duration === 'SHORTS' || durationSeconds < minDurationSeconds) {
          console.log(
            `[Filter] Removed (duration): "${video.title}" - ${duration} (${durationSeconds}s < ${minDurationSeconds}s)`
          )
          return false
        }

        console.log(`[Filter] Kept: "${video.title}" - ${duration} (${durationSeconds}s)`)
        return true
      })
      .sort((a, b) => {
        // Sort by views (descending)
        const viewsA = a.viewCount || parseViewCount(a.viewCountText || '')
        const viewsB = b.viewCount || parseViewCount(b.viewCountText || '')
        return viewsB - viewsA
      })
      .slice(0, 10) // Take top 10 after filtering and sorting

    console.log(`[Step 1: Categorization] Filtered to ${filteredVideos.length} videos (removed Shorts)`)

    const videoTitles = filteredVideos.map((v) => v.title)

    // Step 6: Fetch valid options from structure tables (in parallel)
    console.log('[Step 1: Categorization] Fetching valid categorization options from database')

    const [nichesResult, subnichesResult, categoriesResult, formatsResult] = await Promise.all([
      supabase.from('structure_categorization_niches').select('name'),
      supabase.from('structure_categorization_subniches').select('name'),
      supabase.from('structure_categorization_categories').select('name'),
      supabase.from('structure_categorization_formats').select('name'),
    ])

    if (nichesResult.error || subnichesResult.error || categoriesResult.error || formatsResult.error) {
      throw new Error('Failed to fetch categorization options from database')
    }

    const niches = nichesResult.data?.map((n) => n.name) || []
    const subniches = subnichesResult.data?.map((s) => s.name) || []
    const categories = categoriesResult.data?.map((c) => c.name) || []
    const formats = formatsResult.data?.map((f) => f.name) || []

    console.log('[Step 1: Categorization] Loaded categorization options:', {
      niches: niches.length,
      subniches: subniches.length,
      categories: categories.length,
      formats: formats.length,
    })

    // Step 7: Fetch OpenRouter API key
    console.log('[Step 1: Categorization] Fetching OpenRouter API key from Vault')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY environment variable not found. Please add it to Edge Function secrets.')
    }

    // Step 8: Build LLM prompt (using n8n system prompt)
    console.log('[Step 1: Categorization] Building LLM prompt with taxonomy')

    const systemPrompt = `<system_prompt>
    <role>
      Você é um Especialista em Taxonomia de Canais do YouTube. Sua função é analisar os dados de um CANAL, incluindo seus vídeos populares, e classificá-lo em uma estrutura de categorização padronizada.
    </role>

    <critical_instruction>
A Regra de Ouro: O perfil do CANAL (\`<channel_data>\`) incluindo nome, descrição, keywords e vídeos populares são suas fontes primárias. A padronização para os termos em \`<lista_de_opcoes_validas>\` é obrigatória.
    </critical_instruction>

    <taxonomia_e_definicoes>
        <niche>A prateleira mais ampla da biblioteca. Ex: religion, health, entertainment.</niche>
        <subniche>Uma seção específica na prateleira. Ex: biblical_stories, nutrition, fictional_stories.</subniche>
        <microniche>
            Uma etiqueta de agrupamento TEMÁTICO que define o foco específico do canal DENTRO do subniche. NÃO é a categoria, NEM o formato.

            - **PROIBIÇÃO:** O microniche NUNCA pode ser um termo de \`category\` ou \`format\`.
            - **OBJETIVO:** Definir o posicionamento único do canal dentro do seu subniche.

            - **ESTRUTURA RECOMENDADA quando aplicável:**
              [contexto]_[gênero]_[distintivo]
              • contexto: geocultural (brazilian, american) OU temático (universal, digital, subculture)
              • gênero: o tipo de conteúdo/narrativa predominante do canal
              • distintivo: elemento único - arquétipo recorrente, promessa central ou diferencial do canal

            - **QUANDO USAR A ESTRUTURA:**
              • Canais narrativos com arquétipos claros
              • Canais com temática de transformação/jornada
              • Quando a fórmula CLARIFICAR o posicionamento

            - **QUANDO NÃO USAR:**
              • Canais informativos diretos → use termo simples
              • Tópico específico bem definido → use termo tradicional

            - **Exemplos:**
              • Canal de histórias de redenção → 'universal_redemption_journey_class_reversal'
              • Canal de fofocas brasileiro → 'brazilian_gossip_celebrity_drama'
              • Canal de receitas keto → 'keto_diet'
        </microniche>
        <category>A ESTRUTURA da apresentação. Ex: narrative, tutorial, top_list.</category>
        <format>A TÉCNICA de produção. Ex: animation, static_imagery.</format>
    </taxonomia_e_definicoes>

    <regras_de_normalizacao_obrigatorias>
        - SE a estrutura do conteúdo for uma história ("storytime", "folktale", "tale") -> o \`category\` DEVE ser "narrative".
        - SE o subniche parecer ser "christianity" ou "bible mysteries" -> o \`subniche\` DEVE ser "biblical_stories".
        - SE a estrutura for instrucional ("how-to", "guide") -> o \`category\` DEVE ser "tutorial".
    </regras_de_normalizacao_obrigatorias>

    <workflow>
        1. Analise os dados em \`<channel_data>\` incluindo nome, descrição, keywords e vídeos populares.
        2. **Decisão de Niche/Subniche:** Determine o tópico predominante do CANAL...
        3. **Decisão de Category/Format:** Determine a estrutura e formato predominantes do CANAL...
        4. **Decisão de Microniche:** Seguindo a estrutura recomendada quando aplicável...
        5. Construa o objeto JSON final.
    </workflow>

    <output_format>
        Responda APENAS com um único objeto JSON. Não inclua explicações ou markdown.
        {
          "categorization": {
            "niche": "string",
            "subniche": "string",
            "microniche": "string",
            "category": "string",
            "format": "string"
          }
        }
    </output_format>
</system_prompt>`

    const userPrompt = `# DADOS DO CANAL
<channel_data>

    <channel_name>
      ${channelData.channel_name || 'Not provided'}
    </channel_name>

    <channel_keywords>
      ${JSON.stringify(channelData.channel_keywords || [])}
    </channel_keywords>

    <channel_description>
      ${channelData.description || 'Not provided'}
    </channel_description>

    <channel_popular_videos>
      ${videoTitles.map((title, idx) => `${idx + 1}. ${title}`).join('\n      ')}
    </channel_popular_videos>

</channel_data>

# GABARITO DE RESPOSTAS
<lista_de_opcoes_validas>
    <niches_validos>
        ${niches.join(', ')}
    </niches_validos>
    <subniches_validos>
        ${subniches.join(', ')}
    </subniches_validos>
    <categories_validas>
        ${categories.join(', ')}
    </categories_validas>
    <formats_validos>
        ${formats.join(', ')}
    </formats_validos>
</lista_de_opcoes_validas>`

    // Step 9: Call OpenRouter API
    console.log('[Step 1: Categorization] Calling OpenRouter API with GPT-4o-mini')
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': supabaseUrl,
        'X-Title': 'AutoMedia Channel Categorization',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      throw new Error(`OpenRouter API failed: ${openRouterResponse.statusText} - ${errorText}`)
    }

    const openRouterData = await openRouterResponse.json()
    let llmResponse = openRouterData.choices[0].message.content

    console.log('[Step 1: Categorization] LLM raw response:', llmResponse)

    // Step 10: Parse and validate LLM response (robust parsing like n8n)
    let categorizationObject: CategorizationResult

    try {
      // Clean markdown code blocks if present
      llmResponse = llmResponse.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim()

      const parsed = JSON.parse(llmResponse)

      // Try different response structures
      if (parsed.categorization && typeof parsed.categorization === 'object') {
        categorizationObject = parsed.categorization
      } else if (parsed.output && typeof parsed.output.categorization === 'object') {
        categorizationObject = parsed.output.categorization
      } else if (parsed.output && typeof parsed.output === 'string') {
        const innerParsed = JSON.parse(parsed.output)
        categorizationObject = innerParsed.categorization
      } else if (parsed.niche) {
        // Direct categorization object
        categorizationObject = parsed
      } else {
        throw new Error('Categorization object not found in response')
      }

      // Validate required fields
      if (!categorizationObject.niche) {
        throw new Error('Missing required field: niche')
      }

      console.log('[Step 1: Categorization] Parsed categorization:', categorizationObject)
    } catch (parseError) {
      console.error('[Step 1: Categorization] Failed to parse LLM response:', parseError)
      throw new Error(`Invalid JSON response from LLM: ${parseError}. Response: ${llmResponse}`)
    }

    // Step 11: Update benchmark_channels with categorization
    console.log('[Step 1: Categorization] Updating benchmark_channels with categorization')
    const { error: updateError } = await supabase
      .from('benchmark_channels')
      .update({
        categorization: categorizationObject,
        updated_at: new Date().toISOString(),
      })
      .eq('channel_id', channelId)

    if (updateError) {
      throw new Error(`Failed to update benchmark_channels: ${updateError.message}`)
    }

    // Step 12: Update task status to 'completed'
    console.log('[Step 1: Categorization] Updating task status to completed')
    await supabase
      .from('channel_enrichment_tasks')
      .update({
        categorization_status: 'completed',
        categorization_completed_at: new Date().toISOString(),
        categorization_result: categorizationObject,
      })
      .eq('id', taskId)

    // Step 13: Invoke next step in pipeline (SocialBlade)
    console.log('[Step 1: Categorization] Invoking Step 2: SocialBlade')
    console.log('[Step 1: Categorization] Payload:', { channelId, taskId })

    const step2Response = await supabase.functions.invoke('enrichment-step-2-socialblade', {
      body: { channelId, taskId },
    })

    if (step2Response.error) {
      console.error('[Step 1: Categorization] Error invoking Step 2:', step2Response.error)
      console.error('[Step 1: Categorization] Step 2 error details:', JSON.stringify(step2Response.error, null, 2))
    } else {
      console.log('[Step 1: Categorization] Step 2 invoked successfully')
      console.log('[Step 1: Categorization] Step 2 response:', step2Response.data)
    }

    console.log('[Step 1: Categorization] Successfully completed categorization')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Channel categorization completed',
        categorization: categorizationObject,
        channelId,
        taskId,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Step 1: Categorization] Error:', error)

    // Update task status to 'failed' on error
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey)
      const { taskId } = await req.json()

      if (taskId) {
        await supabase
          .from('channel_enrichment_tasks')
          .update({
            categorization_status: 'failed',
            categorization_error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', taskId)
      }
    } catch (updateError) {
      console.error('[Step 1: Categorization] Failed to update error status:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
