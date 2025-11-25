/**
 * Brand Bible Adapter
 * Maps structure_brand_bible JSONB data to Brand Bible Tab UI format
 */

export interface BrandBibleRow {
  id: string  // UUID (returned as string from Supabase)
  brand_name: string
  placeholder?: string
  brand_context?: any  // Complex nested JSONB structure
  audience_description?: string  // Plain markdown string, NOT an object!
  host_profile?: {
    bio?: string
    name?: string
    point_of_view?: string
    avatar_concept?: string
  }
  writing_style_guide?: any  // Complex nested JSONB structure
  voice_profile?: {
    provider?: string
    voice_id?: string
    artistic_direction?: string | { style?: string; key_attributes?: any }
    technical_parameters?: any
  }
  visual_profile?: any  // Complex nested JSONB structure
  finalization_profile?: any  // Complex nested JSONB structure
  typography_profile?: {
    h1_title?: any
    h2_subtitle?: any
    h3_header?: any
    body_text?: any
  }
  world_context_map?: any  // Complex nested JSONB structure
  channel_cast_map?: any  // Complex nested JSONB structure
}

export interface BrandBibleField {
  title: string
  description: string
  value: string
  usedIn: Array<{
    title: string
    description: string
    step: string
  }>
}

export interface BrandBibleData {
  visualStyle: BrandBibleField
  hostProfile: BrandBibleField
  writingStyle: BrandBibleField
  targetAudience: BrandBibleField
  contentPillars: BrandBibleField
  productionGuidelines: BrandBibleField
}

/**
 * Maps structure_brand_bible JSONB to Brand Bible Tab format
 */
export function mapBrandBibleToBrandBibleTab(row: BrandBibleRow | null): BrandBibleData {
  if (!row) {
    return getEmptyBrandBible()
  }

  return {
    visualStyle: {
      title: 'Visual Style',
      description: 'Color palette, composition rules, and visual references',
      value: formatVisualStyle(row),
      usedIn: [
        {
          title: 'Thumbnail Generation',
          description: 'Color profiles and composition rules applied',
          step: 'Step 1'
        },
        {
          title: 'Video Editing',
          description: 'Visual references guide editing style',
          step: 'Step 2'
        },
        {
          title: 'Brand Assets',
          description: 'Typography and color schemes',
          step: 'Step 3'
        }
      ]
    },
    hostProfile: {
      title: 'Host Profile',
      description: 'Bio, personality, point of view, and avatar concept',
      value: formatHostProfile(row),
      usedIn: [
        {
          title: 'Script Generation',
          description: 'Host POV and personality inform script tone',
          step: 'Step 1'
        },
        {
          title: 'Avatar Generation',
          description: 'Avatar concept drives visual character',
          step: 'Step 2'
        },
        {
          title: 'Voice Synthesis',
          description: 'Bio and personality guide voice parameters',
          step: 'Step 3'
        }
      ]
    },
    writingStyle: {
      title: 'Writing Style',
      description: 'Writing manual, vocabulary rules, and content guardrails',
      value: formatWritingStyle(row),
      usedIn: [
        {
          title: 'Script Writing',
          description: 'Writing manual defines script structure',
          step: 'Step 1'
        },
        {
          title: 'Title Generation',
          description: 'Vocabulary rules ensure brand voice',
          step: 'Step 2'
        },
        {
          title: 'Description Writing',
          description: 'Content guardrails maintain brand safety',
          step: 'Step 3'
        }
      ]
    },
    targetAudience: {
      title: 'Target Audience',
      description: 'Detailed persona, demographics, and psychographic traits',
      value: formatTargetAudience(row),
      usedIn: [
        {
          title: 'Content Strategy',
          description: 'Persona informs content topics and angle',
          step: 'Step 1'
        },
        {
          title: 'Tone Calibration',
          description: 'Demographics guide language complexity',
          step: 'Step 2'
        },
        {
          title: 'Topic Selection',
          description: 'Psychographic traits drive engagement',
          step: 'Step 3'
        }
      ]
    },
    contentPillars: {
      title: 'Content Pillars',
      description: 'Strategic dossier, battlefield analysis, and content classification',
      value: formatContentPillars(row),
      usedIn: [
        {
          title: 'Video Planning',
          description: 'Strategic dossier defines content themes',
          step: 'Step 1'
        },
        {
          title: 'Topic Research',
          description: 'Battlefield analysis identifies opportunities',
          step: 'Step 2'
        },
        {
          title: 'Content Calendar',
          description: 'Classification guides video mix',
          step: 'Step 3'
        }
      ]
    },
    productionGuidelines: {
      title: 'Production Guidelines',
      description: 'Fixed assets, asset selection filters, and finalization rules',
      value: formatProductionGuidelines(row),
      usedIn: [
        {
          title: 'Asset Selection',
          description: 'Filters ensure brand consistency',
          step: 'Step 1'
        },
        {
          title: 'Video Finalization',
          description: 'Fixed assets applied to all videos',
          step: 'Step 2'
        },
        {
          title: 'Quality Control',
          description: 'Finalization rules verify output',
          step: 'Step 3'
        }
      ]
    }
  }
}

function formatVisualStyle(row: BrandBibleRow): string {
  const parts: string[] = []

  // Visual Profile can be nested object
  const visualProfile = row.visual_profile || {}

  // Color Profile (can be object or string)
  const colorProfile = visualProfile.color_profile
  if (colorProfile) {
    if (typeof colorProfile === 'object') {
      const colors = colorProfile.color_scheme_hex || []
      const desc = colorProfile.grading_description || ''
      parts.push(`**Color Profile:**\n${desc}\n**Colors:** ${Array.isArray(colors) ? colors.join(', ') : ''}`)
    } else {
      parts.push(`**Color Profile:**\n${colorProfile}`)
    }
  }

  // Composition Rules (can be object or string)
  const compositionRules = visualProfile.composition_rules
  if (compositionRules) {
    if (typeof compositionRules === 'object') {
      const framing = compositionRules.framing_notes || ''
      parts.push(`**Composition Rules:**\n${framing}`)
    } else {
      parts.push(`**Composition Rules:**\n${compositionRules}`)
    }
  }

  // Style & References (can be object or string)
  const styleRefs = visualProfile.style_and_references
  if (styleRefs) {
    if (typeof styleRefs === 'object') {
      const genre = styleRefs.visual_genre || ''
      const era = styleRefs.visual_era || ''
      parts.push(`**Style & References:**\n${era} - ${genre}`)
    } else {
      parts.push(`**Style & References:**\n${styleRefs}`)
    }
  }

  // Typography (nested objects)
  if (row.typography_profile) {
    const typo = row.typography_profile
    const typoParts: string[] = []

    if (typo.h1_title) {
      const h1 = typeof typo.h1_title === 'object' ? typo.h1_title.font_family || '' : typo.h1_title
      if (h1) typoParts.push(`H1: ${h1}`)
    }
    if (typo.h2_subtitle) {
      const h2 = typeof typo.h2_subtitle === 'object' ? typo.h2_subtitle.font_family || '' : typo.h2_subtitle
      if (h2) typoParts.push(`H2: ${h2}`)
    }
    if (typo.body_text) {
      const body = typeof typo.body_text === 'object' ? typo.body_text.font_family || '' : typo.body_text
      if (body) typoParts.push(`Body: ${body}`)
    }

    if (typoParts.length > 0) {
      parts.push(`**Typography:**\n${typoParts.join('\n')}`)
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : 'No visual style defined yet'
}

function formatHostProfile(row: BrandBibleRow): string {
  const parts: string[] = []

  if (row.host_profile?.name) {
    parts.push(`**Name:** ${row.host_profile.name}`)
  }

  if (row.host_profile?.bio) {
    // Truncate long bio text for display
    const bio = row.host_profile.bio
    const truncated = bio.length > 500 ? bio.substring(0, 500) + '...' : bio
    parts.push(`**Bio:**\n${truncated}`)
  }

  if (row.host_profile?.point_of_view) {
    parts.push(`**Point of View:** ${row.host_profile.point_of_view}`)
  }

  if (row.host_profile?.avatar_concept) {
    const concept = row.host_profile.avatar_concept
    const truncated = concept.length > 300 ? concept.substring(0, 300) + '...' : concept
    parts.push(`**Avatar Concept:**\n${truncated}`)
  }

  // Voice Profile
  if (row.voice_profile) {
    const provider = row.voice_profile.provider || ''
    const voiceId = row.voice_profile.voice_id || ''
    if (provider && voiceId) {
      parts.push(`**Voice:** ${provider} - ${voiceId}`)
    }

    // Artistic Direction (can be object or string)
    const artisticDir = row.voice_profile.artistic_direction
    if (artisticDir) {
      if (typeof artisticDir === 'object') {
        const style = artisticDir.style || ''
        if (style) {
          const truncated = style.length > 400 ? style.substring(0, 400) + '...' : style
          parts.push(`**Artistic Direction:**\n${truncated}`)
        }
      } else {
        parts.push(`**Artistic Direction:**\n${artisticDir}`)
      }
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : 'No host profile defined yet'
}

function formatWritingStyle(row: BrandBibleRow): string {
  const parts: string[] = []

  const guide = row.writing_style_guide || {}

  // Writing Manual (can be nested object)
  const writingManual = guide.writing_manual
  if (writingManual) {
    if (typeof writingManual === 'object') {
      const tone = writingManual.tone_and_voice?.description || ''
      if (tone) {
        const truncated = tone.length > 400 ? tone.substring(0, 400) + '...' : tone
        parts.push(`**Tone & Voice:**\n${truncated}`)
      }
    } else {
      parts.push(`**Writing Manual:**\n${writingManual}`)
    }
  }

  // Vocabulary Rules (can be nested object)
  const vocabRules = guide.vocabulary_rules
  if (vocabRules) {
    if (typeof vocabRules === 'object') {
      const whitelist = vocabRules.whitelist || []
      const blacklist = vocabRules.blacklist || []
      if (whitelist.length > 0 || blacklist.length > 0) {
        parts.push(`**Vocabulary:**\nPreferred: ${whitelist.join(', ')}\nAvoid: ${blacklist.join(', ')}`)
      }
    } else {
      parts.push(`**Vocabulary Rules:**\n${vocabRules}`)
    }
  }

  // Content Guardrails (string)
  const guardrails = guide.content_guardrails
  if (guardrails) {
    parts.push(`**Content Guardrails:** ${guardrails}`)
  }

  // Default word count
  const wordCount = guide.default_word_count || guide.default_script_total_character_count_goal
  if (wordCount) {
    const label = guide.default_word_count ? 'Words' : 'Characters'
    parts.push(`**Target Length:** ${wordCount.toLocaleString()} ${label}`)
  }

  return parts.length > 0 ? parts.join('\n\n') : 'No writing style defined yet'
}

function formatTargetAudience(row: BrandBibleRow): string {
  // audience_description is a plain markdown STRING, not an object!
  if (row.audience_description && typeof row.audience_description === 'string') {
    // Truncate very long descriptions
    const desc = row.audience_description
    return desc.length > 1000 ? desc.substring(0, 1000) + '...' : desc
  }

  // Fallback: check if it's accidentally an object
  if (row.audience_description && typeof row.audience_description === 'object') {
    const parts: string[] = []
    const aud: any = row.audience_description

    if (aud.detailed_persona) {
      parts.push(`**Persona:**\n${aud.detailed_persona}`)
    }
    if (aud.demographic_profile) {
      parts.push(`**Demographics:**\n${aud.demographic_profile}`)
    }
    if (aud.psychographic_traits) {
      parts.push(`**Psychographic Traits:**\n${aud.psychographic_traits}`)
    }

    return parts.length > 0 ? parts.join('\n\n') : 'No target audience defined yet'
  }

  return 'No target audience defined yet'
}

function formatContentPillars(row: BrandBibleRow): string {
  const parts: string[] = []
  const brandContext = row.brand_context || {}

  // Strategic Dossier (can be nested)
  const strategicDossier = brandContext.strategic_dossier
  if (strategicDossier) {
    if (typeof strategicDossier === 'object') {
      const thesis = strategicDossier.channel_thesis || strategicDossier.high_concept || ''
      if (thesis) {
        const truncated = thesis.length > 400 ? thesis.substring(0, 400) + '...' : thesis
        parts.push(`**Channel Thesis:**\n${truncated}`)
      }
    } else {
      const truncated = strategicDossier.length > 400 ? strategicDossier.substring(0, 400) + '...' : strategicDossier
      parts.push(`**Strategic Dossier:**\n${truncated}`)
    }
  }

  // Battlefield Analysis
  const battlefield = brandContext.battlefield_analysis
  if (battlefield) {
    if (typeof battlefield === 'object') {
      const primaryKpi = battlefield.primary_kpi?.metric || ''
      if (primaryKpi) {
        parts.push(`**Primary KPI:** ${primaryKpi}`)
      }
    } else {
      parts.push(`**Battlefield Analysis:**\n${battlefield}`)
    }
  }

  // Classification (nested)
  const classification = brandContext.classification_rationale
  if (classification) {
    if (typeof classification === 'object') {
      const niche = classification.niche_rationale || ''
      if (niche) {
        parts.push(`**Niche:** ${niche}`)
      }
    } else {
      parts.push(`**Classification:**\n${classification}`)
    }
  }

  // World Context
  const world = row.world_context_map || {}
  const universe = world.universe
  if (universe) {
    const truncated = typeof universe === 'string' && universe.length > 200
      ? universe.substring(0, 200) + '...'
      : universe
    parts.push(`**Universe:**\n${truncated}`)
  }

  return parts.length > 0 ? parts.join('\n\n') : 'No content pillars defined yet'
}

function formatProductionGuidelines(row: BrandBibleRow): string {
  const parts: string[] = []
  const finalization = row.finalization_profile || {}

  // Fixed Assets (nested object)
  const fixedAssets = finalization.fixed_assets
  if (fixedAssets && typeof fixedAssets === 'object') {
    const assetParts: string[] = []

    if (fixedAssets.intro_video_file) {
      assetParts.push(`Intro: ${fixedAssets.intro_video_file}`)
    }
    if (fixedAssets.outro_video_file) {
      assetParts.push(`Outro: ${fixedAssets.outro_video_file}`)
    }
    if (fixedAssets.watermark?.file) {
      assetParts.push(`Watermark: ${fixedAssets.watermark.file}`)
    }
    if (fixedAssets.mastering_lut_file_name) {
      assetParts.push(`LUT: ${fixedAssets.mastering_lut_file_name}`)
    }

    if (assetParts.length > 0) {
      parts.push(`**Fixed Assets:**\n${assetParts.join('\n')}`)
    }
  }

  // Asset Selection Filters (nested object)
  const filters = finalization.asset_selection_filters
  if (filters && typeof filters === 'object') {
    const filterParts: string[] = []

    if (filters.soundtracks) {
      const st = filters.soundtracks
      filterParts.push(`Soundtracks: ${st.genre || ''} / ${st.mood || ''}`)
    }
    if (filters.visual_fx_overlays) {
      const vfx = filters.visual_fx_overlays
      filterParts.push(`VFX: ${vfx.style || ''} / ${vfx.effect_type || ''}`)
    }

    if (filterParts.length > 0) {
      parts.push(`**Asset Filters:**\n${filterParts.join('\n')}`)
    }
  }

  // Audio Mixing (if present in fixed_assets)
  if (fixedAssets && typeof fixedAssets === 'object' && fixedAssets.audio_mixing_rules) {
    const audio = fixedAssets.audio_mixing_rules
    if (audio.normalize_target) {
      parts.push(`**Audio Normalization:** ${audio.normalize_target} LUFS`)
    }
  }

  // Channel Cast Map
  const castMap = row.channel_cast_map || {}
  const engineThesis = castMap.engine_thesis
  if (engineThesis) {
    const truncated = engineThesis.length > 300 ? engineThesis.substring(0, 300) + '...' : engineThesis
    parts.push(`**Production Engine:**\n${truncated}`)
  }

  return parts.length > 0 ? parts.join('\n\n') : 'No production guidelines defined yet'
}

function getEmptyBrandBible(): BrandBibleData {
  return {
    visualStyle: {
      title: 'Visual Style',
      description: 'Color palette, composition rules, and visual references',
      value: 'No visual style defined yet',
      usedIn: []
    },
    hostProfile: {
      title: 'Host Profile',
      description: 'Bio, personality, point of view, and avatar concept',
      value: 'No host profile defined yet',
      usedIn: []
    },
    writingStyle: {
      title: 'Writing Style',
      description: 'Writing manual, vocabulary rules, and content guardrails',
      value: 'No writing style defined yet',
      usedIn: []
    },
    targetAudience: {
      title: 'Target Audience',
      description: 'Detailed persona, demographics, and psychographic traits',
      value: 'No target audience defined yet',
      usedIn: []
    },
    contentPillars: {
      title: 'Content Pillars',
      description: 'Strategic dossier, battlefield analysis, and content classification',
      value: 'No content pillars defined yet',
      usedIn: []
    },
    productionGuidelines: {
      title: 'Production Guidelines',
      description: 'Fixed assets, asset selection filters, and finalization rules',
      value: 'No production guidelines defined yet',
      usedIn: []
    }
  }
}
