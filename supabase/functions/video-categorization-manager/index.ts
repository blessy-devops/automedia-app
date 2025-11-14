// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Video Categorization Manager (Sub-workflow)
 *
 * Manages the categorization of individual videos.
 * Matches the n8n workflow: "[automedia] [módulo] wf: benchmark oficial de categorização videos (batch)"
 *
 * Process:
 * 1. Fetch video data (transcript, title, description)
 * 2. If transcript missing, invoke video-transcript function (blocking)
 * 3. Fetch channel data (categorization, keywords, description)
 * 4. Fetch valid categorization options from structure tables
 * 5. Build prompt with video + channel context
 * 6. Call OpenRouter API with n8n agente_categorizador_v7.4_contextual prompt
 * 7. Parse response robustly
 * 8. Update benchmark_videos with categorization
 */
Deno.serve(async (req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('[Video Categorization Manager] Starting video categorization')

    const { youtube_video_id, channelId, taskId } = await req.json()

    if (!youtube_video_id) {
      throw new Error('Missing required parameter: youtube_video_id')
    }

    console.log(`[Video Categorization Manager] Processing video: ${youtube_video_id}`)

    // ========================================================================
    // STEP 1: Fetch video data from benchmark_videos
    // ========================================================================
    console.log('[Video Categorization Manager] Fetching video data...')

    const { data: videoData, error: videoError } = await supabase
      .from('benchmark_videos')
      .select('video_transcript, title, description, channel_id')
      .eq('youtube_video_id', youtube_video_id)
      .single()

    if (videoError || !videoData) {
      throw new Error(`Failed to fetch video data: ${videoError?.message || 'Not found'}`)
    }

    let videoTranscript = videoData.video_transcript
    const effectiveChannelId = channelId || videoData.channel_id

    console.log('[Video Categorization Manager] Video data fetched:', {
      hasTranscript: !!videoTranscript,
      hasTitle: !!videoData.title,
      hasDescription: !!videoData.description,
      channelId: effectiveChannelId,
    })

    // ========================================================================
    // STEP 2: Conditional transcript fetch (if missing)
    // ========================================================================
    if (!videoTranscript || videoTranscript.trim() === '') {
      console.log('[Video Categorization Manager] Transcript missing, invoking video-transcript function...')

      try {
        const transcriptResponse = await supabase.functions.invoke('video-transcript', {
          body: { youtube_video_id },
        })

        if (transcriptResponse.error) {
          console.warn('[Video Categorization Manager] Failed to fetch transcript:', transcriptResponse.error)
          videoTranscript = '' // Continue without transcript
        } else {
          videoTranscript = transcriptResponse.data?.transcript || ''
          console.log('[Video Categorization Manager] Transcript fetched successfully')
        }
      } catch (error) {
        console.warn('[Video Categorization Manager] Error fetching transcript:', error)
        videoTranscript = '' // Continue without transcript
      }
    }

    // ========================================================================
    // STEP 3: Fetch channel data
    // ========================================================================
    console.log('[Video Categorization Manager] Fetching channel data...')

    const { data: channelData, error: channelError } = await supabase
      .from('benchmark_channels')
      .select('categorization, channel_keywords, description, channel_name')
      .eq('channel_id', effectiveChannelId)
      .single()

    if (channelError || !channelData) {
      throw new Error(`Failed to fetch channel data: ${channelError?.message || 'Not found'}`)
    }

    console.log('[Video Categorization Manager] Channel data fetched:', {
      channelName: channelData.channel_name,
      hasCategorization: !!channelData.categorization,
      hasKeywords: !!channelData.channel_keywords,
    })

    // ========================================================================
    // STEP 4: Fetch valid categorization options (4 parallel queries)
    // ========================================================================
    console.log('[Video Categorization Manager] Fetching valid categorization options...')

    const [nichesResult, subnichesResult, categoriesResult, formatsResult] = await Promise.all([
      supabase.from('structure_categorization_niches').select('name'),
      supabase.from('structure_categorization_subniches').select('name'),
      supabase.from('structure_categorization_categories').select('name'),
      supabase.from('structure_categorization_formats').select('name'),
    ])

    if (nichesResult.error || subnichesResult.error || categoriesResult.error || formatsResult.error) {
      throw new Error('Failed to fetch categorization options from structure tables')
    }

    const niches = nichesResult.data?.map((n) => n.name) || []
    const subniches = subnichesResult.data?.map((s) => s.name) || []
    const categories = categoriesResult.data?.map((c) => c.name) || []
    const formats = formatsResult.data?.map((f) => f.name) || []

    console.log('[Video Categorization Manager] Options loaded:', {
      niches: niches.length,
      subniches: subniches.length,
      categories: categories.length,
      formats: formats.length,
    })

    // ========================================================================
    // STEP 5: Get OpenRouter API key from Environment Variables
    // ========================================================================
    console.log('[Video Categorization Manager] Getting OpenRouter API key from environment...')

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY environment variable not found. Please add it to Edge Function secrets.')
    }

    // ========================================================================
    // STEP 6: Build LLM prompt (n8n agente_categorizador_v7.4_contextual)
    // ========================================================================
    console.log('[Video Categorization Manager] Building LLM prompt...')

    // System prompt - EXACT from n8n workflow line 473
    const systemPrompt = `<agente_categorizador_v7.4_contextual>
    <system_prompt>
        <role>
            Você é um Especialista em Taxonomia de Conteúdo do YouTube. Sua função é analisar os dados de um VÍDEO específico, considerando o CONTEXTO do canal onde ele foi publicado, e classificá-lo em uma estrutura de categorização padronizada.
        </role>

        <critical_instruction>
            A Regra de Ouro: O conteúdo do VÍDEO (\`<video_data>\`) é a sua fonte primária de verdade. No entanto, o perfil do CANAL (\`<channel_data>\`) deve ser usado como o principal fator de desempate e para entender a INTENÇÃO por trás do vídeo. A padronização para os termos em \`<lista_de_opcoes_validas>\` é obrigatória.
        </critical_instruction>

        <taxonomia_e_definicoes>
            <niche>A prateleira mais ampla da biblioteca. Ex: religion, health, entertainment.</niche>
            <subniche>Uma seção específica na prateleira. Ex: biblical_stories, nutrition, fictional_stories.</subniche>
            <microniche>
              Uma etiqueta de agrupamento TEMÁTICO DENTRO do subniche. NÃO é o tema exato, NEM a categoria, NEM o formato.
              - **PROIBIÇÃO:** O microniche NUNCA pode ser um termo de \`category\` (como "podcast", "narrative") ou \`format\` (como "live_action").
              - **OBJETIVO:** Agrupar vídeos com sub-temas similares usando nomenclatura descritiva.

              - **ESTRUTURA RECOMENDADA quando aplicável:**
                [contexto]_[gênero]_[distintivo]
                • contexto: geocultural (brazilian, american) OU temático (universal, digital, subculture)
                • gênero: o tipo narrativo/propósito (redemption_journey, transformation, gossip)
                • distintivo: elemento único - arquétipo, promessa central ou diferencial

              - **QUANDO USAR A ESTRUTURA:**
                • Use quando o arquétipo/elemento distintivo for central na narrativa
                • Use quando houver clara jornada ou transformação
                • Use quando a fórmula CLARIFICAR o agrupamento

              - **QUANDO NÃO USAR:**
                • Conteúdo informativo direto → use termo simples (ex: 'keto_diet')
                • Tópico específico bem definido → use termo tradicional (ex: 'new_testament')
                • Quando a fórmula tornar mais confuso → use agrupamento temático direto

              - **Exemplos COM a fórmula:**
                • storytelling/drama → 'universal_redemption_journey_class_reversal'
                • comedy/gossip → 'brazilian_satire_celebrity_drama'
                • biblical_stories → 'ancient_faith_narrative_prophecy'

              - **Exemplos SEM a fórmula (ainda válidos):**
                • biblical_stories → 'new_testament'
                • nutrition → 'keto_diet'
                • comedy → 'standup_specials'
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
            1.  Analise os dados em \`<video_data>\` e \`<channel_data>\`.
            2.  **Decisão de Niche/Subniche:** Determine o tópico do vídeo. Se for ambíguo, a categorização do canal em \`<channel_categorization>\` tem maior peso para definir a intenção. Escolha o \`niche\` e \`subniche\` mais apropriados da \`<lista_de_opcoes_validas>\`, aplicando as regras de normalização.
            3.  **Decisão de Category/Format:** Determine a estrutura e o formato do vídeo. As escolhas DEVEM estar nas listas de \`<categories_validas>\` e \`<formats_validos>\`.
            4.  **Decisão de Microniche:** Seguindo a \`<taxonomia_e_definicoes>\`, gere um \`microniche\` de agrupamento que se encaixe abaixo do \`subniche\` escolhido.
            5.  Construa o objeto JSON final. Verifique se todos os campos estão preenchidos com valores válidos.
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
    </system_prompt>
</agente_categorizador_v7.4_contextual>`

    // User prompt - EXACT from n8n workflow line 470
    const userPrompt = `# DADOS DO VÍDEO A SER ANALISADO
<video_data>
    <title>${videoData.title || 'Not provided'}</title>
    <description>${videoData.description || 'Not provided'}</description>
    <transcript>${videoTranscript || 'Not available'}</transcript>
</video_data>

# DADOS DO CANAL
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

    <channel_categorization>
      ${JSON.stringify(channelData.categorization || {})}
    </channel_categorization>

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
</lista_de_opcoes_validas>
`

    // ========================================================================
    // STEP 7: Call OpenRouter API
    // ========================================================================
    console.log('[Video Categorization Manager] Calling OpenRouter API...')

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': supabaseUrl,
        'X-Title': 'AutoMedia Video Categorization',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Using gpt-4o-mini (n8n uses gpt-5-nano which doesn't exist yet)
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

    console.log('[Video Categorization Manager] LLM raw response:', llmResponse.substring(0, 200))

    // ========================================================================
    // STEP 8: Parse response robustly (n8n parser from line 434)
    // ========================================================================
    console.log('[Video Categorization Manager] Parsing LLM response...')

    let categorizationObject = null

    try {
      // Clean markdown code blocks if present
      llmResponse = llmResponse.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim()

      const parsed = JSON.parse(llmResponse)

      // Try different response structures (matching n8n parser logic)
      if (parsed && parsed.output && typeof parsed.output.categorization === 'object') {
        // Scenario 1: { "output": { "categorization": {...} } }
        categorizationObject = parsed.output.categorization
      } else if (parsed && typeof parsed.categorization === 'object') {
        // Scenario 2: { "categorization": {...} }
        categorizationObject = parsed.categorization
      } else if (parsed && typeof parsed.output === 'string') {
        // Scenario 3: { "output": "{\"categorization\":{...}}" }
        const cleanedString = parsed.output.replace(/```json\n?/g, '').replace(/\n?```/g, '')
        const parsedString = JSON.parse(cleanedString)
        if (parsedString && parsedString.categorization) {
          categorizationObject = parsedString.categorization
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to parse LLM output: ${error instanceof Error ? error.message : 'Unknown error'}. Input: ${llmResponse.substring(0, 500)}`
      )
    }

    // Validation: Ensure we have a valid categorization object
    if (!categorizationObject || typeof categorizationObject.niche === 'undefined') {
      throw new Error(
        `Categorization object not found or malformed. Input: ${llmResponse.substring(0, 500)}`
      )
    }

    console.log('[Video Categorization Manager] Parsed categorization:', categorizationObject)

    // ========================================================================
    // STEP 9: Update benchmark_videos with categorization using Supabase Client
    // ========================================================================
    console.log('[Video Categorization Manager] Updating benchmark_videos...')

    const { error: updateError } = await supabase
      .from('benchmark_videos')
      .update({
        categorization: categorizationObject,
        updated_at: new Date().toISOString(),
      })
      .eq('youtube_video_id', youtube_video_id)

    if (updateError) {
      console.error('[Video Categorization Manager] Error updating categorization:', updateError)
      throw new Error(`Failed to update categorization: ${updateError.message}`)
    }

    console.log('[Video Categorization Manager] Successfully categorized video')

    // ========================================================================
    // STEP 10: Return success (end of sub-workflow)
    // ========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video categorization completed',
        youtube_video_id,
        categorization: categorizationObject,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Video Categorization Manager] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
