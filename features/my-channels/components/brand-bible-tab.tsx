'use client'

/**
 * Brand Bible Tab Component
 * Displays expandable fields for channel branding and production guidelines
 */

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  FileText,
  Palette,
  User,
  MessageSquare,
  Target,
  Lightbulb,
  Settings,
  Image,
  Mic,
  Film,
  Users,
  BookOpen,
  TestTube,
  Save,
  Copy,
  Edit,
  Sparkles,
  Video,
  Layout
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ColorSwatch } from '@/components/ui/color-swatch'
import type { BrandBibleData } from '../lib/brand-bible-adapter'

/**
 * Detecta hex codes no texto e retorna array de elementos JSX
 * com ColorSwatch renderizado inline
 */
function parseTextWithHexCodes(text: string): React.ReactNode[] {
  // Regex para detectar hex codes: #RRGGBB ou #RGB
  const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = hexRegex.exec(text)) !== null) {
    // Adiciona texto antes do hex code
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Adiciona o ColorSwatch
    const hexCode = match[0]
    parts.push(
      <ColorSwatch key={`hex-${match.index}`} hex={hexCode} />
    )

    lastIndex = match.index + hexCode.length
  }

  // Adiciona texto restante após último hex code
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

interface BrandBibleFieldProps {
  icon: React.ReactNode
  title: string
  description: string
  value: string | string[]
  usedIn: Array<{
    icon: React.ReactNode
    label: string
    description: string
  }>
  onEdit: () => void
}

function BrandBibleField({ icon, title, description, value, usedIn, onEdit }: BrandBibleFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base mb-1">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="flex-shrink-0">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Value */}
        <div className="bg-muted/50 rounded-lg p-3">
          {Array.isArray(value) ? (
            <div className="space-y-1">
              {value.map((item, idx) => (
                <div key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  // Customizar parágrafos para melhor espaçamento
                  p: ({ children, ...props }) => (
                    <p className="mb-4 last:mb-0 leading-relaxed text-sm" {...props}>
                      {children}
                    </p>
                  ),

                  // Customizar strong para labels de seção
                  strong: ({ children, ...props }) => {
                    const text = String(children)
                    const isLabel = text.endsWith(':')

                    if (isLabel) {
                      return (
                        <strong
                          className="block text-sm font-semibold text-foreground mt-4 first:mt-0 mb-2"
                          {...props}
                        >
                          {children}
                        </strong>
                      )
                    }

                    return (
                      <strong className="font-semibold text-foreground" {...props}>
                        {children}
                      </strong>
                    )
                  },

                  // Processar texto para detectar hex codes
                  text: ({ children }) => {
                    const text = String(children)
                    const parts = parseTextWithHexCodes(text)

                    // Se não há hex codes, retorna texto normal
                    if (parts.length === 1 && typeof parts[0] === 'string') {
                      return <>{children}</>
                    }

                    // Retorna elementos com ColorSwatch inline
                    return <>{parts}</>
                  }
                }}
              >
                {value}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Used In Section */}
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <Sparkles className="w-3 h-3" />
            <span>Used in {usedIn.length} places</span>
            <span className="ml-auto">{isExpanded ? '▼' : '▶'}</span>
          </button>

          {isExpanded && (
            <div className="space-y-2 pl-5 border-l-2 border-primary/20">
              {usedIn.map((usage, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    {usage.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{usage.label}</div>
                    <div className="text-xs text-muted-foreground">{usage.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface BrandBibleTabProps {
  channelName: string
  brandBibleData?: BrandBibleData | null
}

// Helper to get icon for usedIn items
function getUsedInIcon(title: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    'Thumbnail Generation': <Layout className="w-3 h-3" />,
    'Video Editing': <Film className="w-3 h-3" />,
    'Brand Assets': <Image className="w-3 h-3" />,
    'Script Generation': <FileText className="w-3 h-3" />,
    'Avatar Generation': <User className="w-3 h-3" />,
    'Voice Synthesis': <Mic className="w-3 h-3" />,
    'Script Writing': <FileText className="w-3 h-3" />,
    'Title Generation': <BookOpen className="w-3 h-3" />,
    'Description Writing': <Settings className="w-3 h-3" />,
    'Content Strategy': <Target className="w-3 h-3" />,
    'Tone Calibration': <MessageSquare className="w-3 h-3" />,
    'Topic Selection': <Lightbulb className="w-3 h-3" />,
    'Video Planning': <Video className="w-3 h-3" />,
    'Topic Research': <BookOpen className="w-3 h-3" />,
    'Content Calendar': <Settings className="w-3 h-3" />,
    'Asset Selection': <Image className="w-3 h-3" />,
    'Video Finalization': <Film className="w-3 h-3" />,
    'Quality Control': <TestTube className="w-3 h-3" />
  }
  return iconMap[title] || <Sparkles className="w-3 h-3" />
}

export function BrandBibleTab({ channelName, brandBibleData }: BrandBibleTabProps) {
  const handleEdit = (field: string) => {
    console.log('Editing field:', field)
    // TODO: Open edit modal
  }

  // Use real data if available, otherwise use mockdata
  const getBrandBibleFields = () => {
    if (brandBibleData) {
      return [
        {
          icon: <Palette className="w-5 h-5" />,
          title: brandBibleData.visualStyle.title,
          description: brandBibleData.visualStyle.description,
          value: brandBibleData.visualStyle.value,
          usedIn: brandBibleData.visualStyle.usedIn.map(item => ({
            icon: getUsedInIcon(item.title),
            label: item.title,
            description: item.description
          }))
        },
        {
          icon: <User className="w-5 h-5" />,
          title: brandBibleData.hostProfile.title,
          description: brandBibleData.hostProfile.description,
          value: brandBibleData.hostProfile.value,
          usedIn: brandBibleData.hostProfile.usedIn.map(item => ({
            icon: getUsedInIcon(item.title),
            label: item.title,
            description: item.description
          }))
        },
        {
          icon: <MessageSquare className="w-5 h-5" />,
          title: brandBibleData.writingStyle.title,
          description: brandBibleData.writingStyle.description,
          value: brandBibleData.writingStyle.value,
          usedIn: brandBibleData.writingStyle.usedIn.map(item => ({
            icon: getUsedInIcon(item.title),
            label: item.title,
            description: item.description
          }))
        },
        {
          icon: <Target className="w-5 h-5" />,
          title: brandBibleData.targetAudience.title,
          description: brandBibleData.targetAudience.description,
          value: brandBibleData.targetAudience.value,
          usedIn: brandBibleData.targetAudience.usedIn.map(item => ({
            icon: getUsedInIcon(item.title),
            label: item.title,
            description: item.description
          }))
        },
        {
          icon: <Lightbulb className="w-5 h-5" />,
          title: brandBibleData.contentPillars.title,
          description: brandBibleData.contentPillars.description,
          value: brandBibleData.contentPillars.value,
          usedIn: brandBibleData.contentPillars.usedIn.map(item => ({
            icon: getUsedInIcon(item.title),
            label: item.title,
            description: item.description
          }))
        },
        {
          icon: <Settings className="w-5 h-5" />,
          title: brandBibleData.productionGuidelines.title,
          description: brandBibleData.productionGuidelines.description,
          value: brandBibleData.productionGuidelines.value,
          usedIn: brandBibleData.productionGuidelines.usedIn.map(item => ({
            icon: getUsedInIcon(item.title),
            label: item.title,
            description: item.description
          }))
        }
      ]
    }

    // Fallback to mockdata
    return getMockBrandBibleFields()
  }

  const brandBibleFields = getBrandBibleFields()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-foreground mb-1">Brand Bible</h2>
          <p className="text-sm text-muted-foreground">
            Define channel identity and production guidelines. Each field affects multiple parts of the automation pipeline.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <TestTube className="w-3 h-3" />
          {brandBibleData ? 'Live Data' : 'Mock Data'}
        </Badge>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">
                <strong>How it works:</strong> Each field below is stored as JSONB and automatically injected into the appropriate agents during video production.
                Click any "Used in" section to see exactly where each field is applied.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {brandBibleFields.map((field, idx) => (
          <BrandBibleField
            key={idx}
            icon={field.icon}
            title={field.title}
            description={field.description}
            value={field.value}
            usedIn={field.usedIn}
            onEdit={() => handleEdit(field.title)}
          />
        ))}
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
          <CardDescription>Test changes before saving or clone this brand bible to another channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <TestTube className="w-4 h-4" />
              Test Changes
            </Button>
            <Button className="gap-2">
              <Save className="w-4 h-4" />
              Save Brand Bible
            </Button>
            <Button variant="outline" className="gap-2">
              <Copy className="w-4 h-4" />
              Clone to New Channel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Raw JSONB Data
          </CardTitle>
          <CardDescription>For developers: View the raw database structure</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" size="sm" className="text-xs">
            View JSON Schema →
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Mockdata fallback function
function getMockBrandBibleFields() {
  return [
    {
      icon: <Palette className="w-5 h-5" />,
      title: 'Visual Style',
      description: 'Colors, imagery, and visual aesthetics',
      value: 'Warm, earthy tones with biblical imagery. Soft golden lighting, ancient textures. Color palette: #D4AF37 (gold), #8B4513 (saddle brown), #F5DEB3 (wheat).',
      usedIn: [
        {
          icon: <Image className="w-3 h-3" />,
          label: 'Covering Images',
          description: 'Color grading and filter selection'
        },
        {
          icon: <Layout className="w-3 h-3" />,
          label: 'Thumbnail Generation',
          description: 'Color palette and background style'
        },
        {
          icon: <Film className="w-3 h-3" />,
          label: 'Visual FX',
          description: 'Overlay colors and transitions'
        },
        {
          icon: <Video className="w-3 h-3" />,
          label: 'Video Segments',
          description: 'Visual consistency across scenes'
        }
      ]
    },
    {
      icon: <User className="w-5 h-5" />,
      title: 'Host Profile',
      description: 'Character, persona, and voice characteristics',
      value: 'Father Abraham - A wise, elderly biblical scholar with a deep, authoritative yet warm voice. Patient teacher, uses metaphors from scripture.',
      usedIn: [
        {
          icon: <FileText className="w-3 h-3" />,
          label: 'Script Writing',
          description: 'Character voice and perspective'
        },
        {
          icon: <Mic className="w-3 h-3" />,
          label: 'TTS Generation',
          description: 'Voice model selection and tone'
        },
        {
          icon: <Film className="w-3 h-3" />,
          label: 'Video Segments',
          description: 'Character consistency and mannerisms'
        },
        {
          icon: <Users className="w-3 h-3" />,
          label: 'Character Design',
          description: 'Visual representation if using avatars'
        }
      ]
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Writing Style',
      description: 'Tone, vocabulary, and narrative approach',
      value: [
        'Tone: Inspirational, reverent, accessible',
        'Vocabulary: Biblical terminology with modern explanations',
        'Structure: Story-driven, teaches through parables',
        'Length: 10-15 minute narratives'
      ],
      usedIn: [
        {
          icon: <BookOpen className="w-3 h-3" />,
          label: 'Title Generation',
          description: 'Phrasing and keyword selection'
        },
        {
          icon: <FileText className="w-3 h-3" />,
          label: 'Scriptwriter Agent',
          description: 'Narrative structure and language'
        },
        {
          icon: <Settings className="w-3 h-3" />,
          label: 'SEO Description',
          description: 'Meta descriptions and tags'
        },
        {
          icon: <Video className="w-3 h-3" />,
          label: 'Video Pacing',
          description: 'Segment timing and transitions'
        }
      ]
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Target Audience',
      description: 'Demographics and viewer expectations',
      value: [
        'Primary: Adults 35-65 years old',
        'Faith background: Christians seeking deeper understanding',
        'Education: High school to college educated',
        'Interests: Biblical history, theology, spiritual growth'
      ],
      usedIn: [
        {
          icon: <FileText className="w-3 h-3" />,
          label: 'Content Complexity',
          description: 'Language level and depth of topics'
        },
        {
          icon: <Settings className="w-3 h-3" />,
          label: 'SEO Keywords',
          description: 'Search terms and discovery'
        },
        {
          icon: <Layout className="w-3 h-3" />,
          label: 'Thumbnail Style',
          description: 'Visual appeal to target demographic'
        },
        {
          icon: <BookOpen className="w-3 h-3" />,
          label: 'Topic Selection',
          description: 'Content planning and series ideas'
        }
      ]
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: 'Content Pillars',
      description: 'Core themes and topic categories',
      value: [
        'Old Testament Stories (40%)',
        'New Testament Teachings (30%)',
        'Biblical Life Applications (20%)',
        'Church History & Context (10%)'
      ],
      usedIn: [
        {
          icon: <BookOpen className="w-3 h-3" />,
          label: 'Topic Generator',
          description: 'Idea generation and content calendar'
        },
        {
          icon: <FileText className="w-3 h-3" />,
          label: 'Script Planning',
          description: 'Series structure and continuity'
        },
        {
          icon: <Settings className="w-3 h-3" />,
          label: 'Content Balance',
          description: 'Distribution tracking across pillars'
        }
      ]
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'Production Guidelines',
      description: 'Technical specs and workflow preferences',
      value: [
        'Video Length: 12-18 minutes',
        'Publishing: Daily at 6:00 AM EST',
        'Format: Narrated documentary style',
        'Music: Ambient, reverent background tracks',
        'B-roll: Historical art, nature imagery'
      ],
      usedIn: [
        {
          icon: <Film className="w-3 h-3" />,
          label: 'Production Pipeline',
          description: 'Workflow automation settings'
        },
        {
          icon: <Video className="w-3 h-3" />,
          label: 'Video Assembly',
          description: 'Segment timing and structure'
        },
        {
          icon: <Settings className="w-3 h-3" />,
          label: 'Publishing Schedule',
          description: 'Auto-scheduling configuration'
        },
        {
          icon: <Image className="w-3 h-3" />,
          label: 'Asset Selection',
          description: 'B-roll and music choices'
        }
      ]
    }
  ]
}
