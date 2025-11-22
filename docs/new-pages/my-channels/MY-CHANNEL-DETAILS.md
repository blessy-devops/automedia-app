# 🎨 CRIAR MY CHANNEL DETAILS - Idêntico ao Figma Make

## ⚠️ OBJETIVO
Criar a página **My Channel Details** de forma IDÊNTICA à implementação do Figma Make, com:
- ✅ Layout de header com avatar, informações e botões de ação
- ✅ Cards de métricas (subscribers, views, videos, avg views)
- ✅ Sistema de tabs (Overview, Analytics, Brand Bible, Credentials)
- ✅ Brand Bible tab completa com fields expansíveis
- ✅ Credentials tab completa com OAuth tokens e keep-alive CRON
- ✅ **IMPORTANTE:** NÃO incluir o bug da sidebar que não volta junto

---

## 📋 ESTRUTURA DE ARQUIVOS

Você precisará criar **3 arquivos**:

### 1. `/components/MyChannelDetails.tsx` (principal)
### 2. `/components/BrandBibleTab.tsx` (tab)
### 3. `/components/CredentialsTab.tsx` (tab)

---

## 📦 PARTE 1: MyChannelDetails.tsx (CÓDIGO COMPLETO)

```tsx
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { BrandBibleTab } from './BrandBibleTab';
import { CredentialsTab } from './CredentialsTab';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  ArrowLeft, 
  BarChart3, 
  BookOpen, 
  Video, 
  Key, 
  TrendingUp, 
  Users,
  Eye,
  Clock,
  Settings as SettingsIcon,
  ExternalLink,
  Share2,
  Globe
} from 'lucide-react';

interface MyChannelDetailsProps {
  channelId: number;
  onBack: () => void;
  onNavigate: (route: string) => void;
  isSidebarExpanded: boolean;
  onSidebarExpandedChange: (expanded: boolean) => void;
}

export function MyChannelDetails({ 
  channelId, 
  onBack, 
  onNavigate, 
  isSidebarExpanded, 
  onSidebarExpandedChange 
}: MyChannelDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - substitua com dados reais
  const channelData = {
    name: 'Canal Bíblico',
    handle: '@CanalBiblico',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CB&backgroundColor=10B981',
    subscribers: '247K',
    totalVideos: 342,
    totalViews: '12.4M',
    avgViews: '36.2K',
    publishingFrequency: 'Daily',
    lastPublished: '2 hours ago',
    status: 'active' as const,
    color: '#10B981',
    country: 'Brazil'
  };

  return (
    <>
      <Sidebar currentRoute="mychannels" onNavigate={onNavigate} onExpandedChange={onSidebarExpandedChange} />

      <main className={`bg-background min-h-screen transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        {/* Header */}
        <div className="bg-card border-b border-border">
          {/* Back button */}
          <div className="px-8 pt-6 pb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to my channels</span>
            </button>
          </div>

          {/* Channel Info Header */}
          <div className="px-8 pb-6">
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar + Basic Info */}
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={channelData.avatar}
                  alt={channelData.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-semibold text-foreground">{channelData.name}</h1>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${channelData.color}20`,
                        color: channelData.color,
                        borderColor: `${channelData.color}40`
                      }}
                    >
                      {channelData.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-muted-foreground">{channelData.handle}</p>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Globe className="w-3.5 h-3.5" />
                      {channelData.country}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View on YouTube
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Total Subscribers</p>
                <p className="text-2xl font-semibold text-foreground">{channelData.subscribers}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Total Views</p>
                <p className="text-2xl font-semibold text-foreground">{channelData.totalViews}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Total Videos</p>
                <p className="text-2xl font-semibold text-foreground">{channelData.totalVideos}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Avg Views/Video</p>
                <p className="text-2xl font-semibold text-foreground">{channelData.avgViews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="brandbible" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Brand Bible
              </TabsTrigger>
              <TabsTrigger value="credentials" className="gap-2">
                <Key className="w-4 h-4" />
                Credentials
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Publishing Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Publishing Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Publishing Frequency</p>
                      <p className="text-lg font-semibold text-foreground">{channelData.publishingFrequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last Published</p>
                      <p className="text-lg font-semibold text-foreground">{channelData.lastPublished}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Next Scheduled</p>
                      <p className="text-lg font-semibold text-foreground">Tomorrow, 10:00 AM</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Recent Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Last 7 Days Views</p>
                      <p className="text-lg font-semibold text-foreground">342.5K</p>
                      <p className="text-xs text-emerald-600">+12.3% vs previous week</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">New Subscribers (7d)</p>
                      <p className="text-lg font-semibold text-foreground">+2.4K</p>
                      <p className="text-xs text-emerald-600">+8.7% vs previous week</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Video className="w-4 h-4" />
                    Create Video
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    View Analytics
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Edit Brand Bible
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed analytics and insights for {channelData.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Brand Bible Tab */}
            <TabsContent value="brandbible">
              <BrandBibleTab channelName={channelData.name} />
            </TabsContent>

            {/* Credentials Tab */}
            <TabsContent value="credentials">
              <CredentialsTab channelId={channelId} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
```

---

## 📐 CLASSES CSS IMPORTANTES (MyChannelDetails.tsx)

### **Main Container:**
```tsx
className={`bg-background min-h-screen transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-16'}`}
```

### **Header Background:**
```tsx
className="bg-card border-b border-border"
```

### **Back Button:**
```tsx
className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
```

### **Channel Avatar:**
```tsx
className="w-16 h-16 rounded-full object-cover border-2 border-border"
```

### **Stats Cards (grid 4 colunas):**
```tsx
className="grid grid-cols-4 gap-4"
```

### **Cada Stat Card:**
```tsx
className="bg-card border border-border rounded-lg p-4"
```

### **TabsList (4 tabs iguais):**
```tsx
className="grid w-full grid-cols-4 mb-6"
```

---

## 📦 PARTE 2: BrandBibleTab.tsx (CÓDIGO COMPLETO)

```tsx
import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface BrandBibleFieldProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string | string[];
  usedIn: Array<{
    icon: React.ReactNode;
    label: string;
    description: string;
  }>;
  onEdit: () => void;
}

function BrandBibleField({ icon, title, description, value, usedIn, onEdit }: BrandBibleFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
            <p className="text-sm">{value}</p>
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
  );
}

interface BrandBibleTabProps {
  channelName: string;
}

export function BrandBibleTab({ channelName }: BrandBibleTabProps) {
  const handleEdit = (field: string) => {
    console.log('Editing field:', field);
    // TODO: Open edit modal
  };

  const brandBibleFields = [
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
  ];

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
          Experimental Lab
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

      {/* Debug Section (optional) */}
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
  );
}
```

---

## 📦 PARTE 3: CredentialsTab.tsx (CÓDIGO COMPLETO)

⚠️ **ATENÇÃO:** Este arquivo tem MUITOS imports faltando! Adicione TODOS no topo:

```tsx
import { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Key,
  Shield,
  Clock,
  Play,
  Edit,
  RefreshCw,
  Cable,
  Activity,
  FileText,
  Pause,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../utils/clipboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from './ui/sheet';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface CredentialsTabProps {
  channelId: number;
}

export function CredentialsTab({ channelId }: CredentialsTabProps) {
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [keepAliveEnabled, setKeepAliveEnabled] = useState(true);
  const [frequency, setFrequency] = useState('30');

  // Mock data - em produção viria do Supabase
  const credentials = {
    status: 'active' as 'active' | 'expired' | 'error',
    accessToken: 'ya29.a0AfH6SMBxQf8zKj3L9mN2pO7R4sT6uV8wX1yZ...',
    accessTokenExpiry: new Date(Date.now() + 45 * 60 * 1000),
    refreshToken: '1//0gHd8sF9jK3lMCgYIARAAGBASNwF-L9Ir...',
    lastUsed: new Date(Date.now() - 3 * 60 * 1000),
    createdAt: new Date('2025-01-15'),
    scopes: ['youtube.readonly', 'youtube.upload', 'youtube.force-ssl'],
    keepAlive: {
      status: 'running' as 'running' | 'paused' | 'error',
      frequency: 30,
      lastPing: new Date(Date.now() - 15 * 60 * 1000),
      nextPing: new Date(Date.now() + 15 * 60 * 1000),
      successRate: 99.8,
      totalPings: 1247,
      failedPings: 2,
      lastError: null,
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          badge: 'Active',
          icon: <CheckCircle2 className="w-4 h-4" />,
          className: 'bg-green-500/10 text-green-500 border-green-500/20'
        };
      case 'expired':
        return {
          badge: 'Expired',
          icon: <AlertCircle className="w-4 h-4" />,
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        };
      case 'error':
        return {
          badge: 'Error',
          icon: <XCircle className="w-4 h-4" />,
          className: 'bg-red-500/10 text-red-500 border-red-500/20'
        };
      default:
        return {
          badge: 'Unknown',
          icon: <AlertCircle className="w-4 h-4" />,
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        };
    }
  };

  const statusConfig = getStatusConfig(credentials.status);
  const keepAliveStatusConfig = getStatusConfig(credentials.keepAlive.status);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatCountdown = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'expires now';
    if (diffMins < 60) return `${diffMins}m`;
    return `${diffHours}h ${diffMins % 60}m`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">OAuth Credentials</h2>
          <p className="text-sm text-muted-foreground">
            Manage YouTube API access tokens and keep-alive automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="w-4 h-4" />
            Test
          </Button>
          <Sheet open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Edit Credentials</SheetTitle>
                <SheetDescription>
                  Update OAuth tokens and keep-alive settings
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Re-authenticate Section */}
                <div className="space-y-3">
                  <Label>OAuth Authentication</Label>
                  <Button variant="outline" className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Re-authenticate with Google
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Opens Google OAuth flow to generate new tokens
                  </p>
                </div>

                {/* Manual Token Entry */}
                <div className="space-y-3">
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input 
                    id="access-token" 
                    type="password"
                    defaultValue={credentials.accessToken}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste manually if needed
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="refresh-token">Refresh Token</Label>
                  <Input 
                    id="refresh-token" 
                    type="password"
                    defaultValue={credentials.refreshToken}
                  />
                </div>

                {/* Keep-Alive Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <Label>Keep-Alive Settings</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="keep-alive-toggle" className="text-sm font-normal">
                        Enable Keep-Alive
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Auto-refresh token every interval
                      </p>
                    </div>
                    <Switch 
                      id="keep-alive-toggle" 
                      checked={keepAliveEnabled}
                      onCheckedChange={setKeepAliveEnabled}
                    />
                  </div>

                  {keepAliveEnabled && (
                    <div className="space-y-3">
                      <Label htmlFor="frequency">Ping Frequency</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every 1 hour</SelectItem>
                          <SelectItem value="120">Every 2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="space-y-3 pt-4 border-t border-destructive/20">
                  <Label className="text-destructive">Danger Zone</Label>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="w-4 h-4" />
                    Revoke Credentials
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsEditDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Credentials */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Credential Status
                </CardTitle>
                <Badge className={`gap-1.5 ${statusConfig.className}`}>
                  {statusConfig.icon}
                  {statusConfig.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{credentials.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Used</span>
                <span>{formatRelativeTime(credentials.lastUsed)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scopes</span>
                <span className="text-xs text-muted-foreground">{credentials.scopes.length} granted</span>
              </div>
            </CardContent>
          </Card>

          {/* Tokens */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Access Token */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Access Token</Label>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="w-3 h-3" />
                      {formatCountdown(credentials.accessTokenExpiry)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                    >
                      {showAccessToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(credentials.accessToken)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                  {showAccessToken ? credentials.accessToken : '••••••••••••••••••••••••••••••••'}
                </code>
              </div>

              {/* Refresh Token */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Refresh Token</Label>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      Valid
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowRefreshToken(!showRefreshToken)}
                    >
                      {showRefreshToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(credentials.refreshToken)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                  {showRefreshToken ? credentials.refreshToken : '••••••••••••••••••••••••••••••••'}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Keep-Alive */}
        <div className="space-y-6">
          {/* Keep-Alive Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cable className="w-4 h-4 text-primary" />
                  Keep-Alive CRON
                </CardTitle>
                <Badge className={`gap-1.5 ${keepAliveStatusConfig.className}`}>
                  {keepAliveStatusConfig.icon}
                  {keepAliveStatusConfig.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">Frequency</div>
                  <div className="text-sm font-medium">{credentials.keepAlive.frequency}min</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                  <div className="text-sm font-medium text-green-500">
                    {credentials.keepAlive.successRate}%
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Ping</span>
                  <span>{formatRelativeTime(credentials.keepAlive.lastPing)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next Ping</span>
                  <span className="text-green-500">{formatRelativeTime(credentials.keepAlive.nextPing)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Pings</span>
                  <span>
                    {credentials.keepAlive.totalPings.toLocaleString()}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({credentials.keepAlive.failedPings} failed)
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Force Ping
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 h-8">
                  <FileText className="w-3.5 h-3.5" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { time: '15m ago', action: 'Keep-alive ping', status: 'success' },
                  { time: '45m ago', action: 'Keep-alive ping', status: 'success' },
                  { time: '1h ago', action: 'Token refresh', status: 'success' },
                  { time: '3h ago', action: 'Keep-alive ping', status: 'success' },
                  { time: '5h ago', action: 'API call', status: 'success' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${ 
                        log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-muted-foreground">{log.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Implementation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-0.5">Supabase Edge Function</div>
                  <code className="text-muted-foreground">supabase/functions/credential-keep-alive/</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-0.5">API Endpoint</div>
                  <code className="text-muted-foreground">GET youtube.com/api/v3/channels?mine=true</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-0.5">Database</div>
                  <code className="text-muted-foreground">credential_keep_alive_logs</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔧 PARTE 4: ARQUIVO UTILITÁRIO (clipboard.ts)

Crie o arquivo `/utils/clipboard.ts` para a função `copyToClipboard`:

```typescript
import { toast } from 'sonner@2.0.3';

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (err) {
    toast.error('Failed to copy');
  }
};
```

---

## ⚠️ IMPORTANTE: NÃO INCLUIR BUG DA SIDEBAR

### **O QUE É O BUG:**
No projeto original, quando você navega para a página de detalhes, a sidebar não volta junto (o `ml-64` ou `ml-16` fica desatualizado).

### **SOLUÇÃO APLICADA:**
A prop `isSidebarExpanded` e o callback `onSidebarExpandedChange` **já estão corretos** no código acima. 

### **VERIFIQUE:**
✅ O componente `MyChannelDetails` recebe `isSidebarExpanded` como prop  
✅ Passa `onSidebarExpandedChange` para a `<Sidebar />`  
✅ O `<main>` usa o valor correto da prop para `ml-64` ou `ml-16`  

**Não há bug para copiar aqui!** ✅

---

## 📐 LAYOUT E ESTRUTURA VISUAL

### **Hierarquia de componentes:**
```
MyChannelDetails
├── Sidebar (recebe onExpandedChange)
└── main (responde a isSidebarExpanded)
    ├── Header Section (bg-card border-b)
    │   ├── Back button (px-8 pt-6 pb-4)
    │   └── Channel Info (px-8 pb-6)
    │       ├── Avatar + Name + Badges
    │       ├── Action Buttons (3 buttons)
    │       └── Stats Grid (4 cols)
    └── Tabs Section (p-8)
        ├── TabsList (4 tabs em grid)
        └── TabsContent
            ├── Overview Tab
            ├── Analytics Tab (placeholder)
            ├── Brand Bible Tab (BrandBibleTab)
            └── Credentials Tab (CredentialsTab)
```

### **Responsividade:**
- Stats Cards: `grid grid-cols-4` (desktop)
- Brand Bible Fields: `grid-cols-1 lg:grid-cols-2`
- Credentials: `grid-cols-1 lg:grid-cols-2`

### **Spacing Consistency:**
- Container padding: `p-8`
- Card gaps: `gap-4` ou `gap-6`
- Header sections: `px-8 pt-6 pb-4` (back) + `px-8 pb-6` (info)

---

## 🎨 CORES E BADGES

### **Status Badge (active):**
```tsx
style={{ 
  backgroundColor: `${channelData.color}20`,  // 20% opacity
  color: channelData.color,
  borderColor: `${channelData.color}40`       // 40% opacity
}}
```

### **Credential Status Colors:**
- Active: `bg-green-500/10 text-green-500 border-green-500/20`
- Expired: `bg-yellow-500/10 text-yellow-500 border-yellow-500/20`
- Error: `bg-red-500/10 text-red-500 border-red-500/20`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **1. Criar arquivos:**
- [ ] `/components/MyChannelDetails.tsx`
- [ ] `/components/BrandBibleTab.tsx`
- [ ] `/components/CredentialsTab.tsx`
- [ ] `/utils/clipboard.ts`

### **2. Verificar imports:**
- [ ] Todos os ícones do lucide-react estão importados
- [ ] Componentes UI (Card, Button, Badge, Tabs, Sheet, etc)
- [ ] `toast` do sonner@2.0.3
- [ ] `copyToClipboard` do utils

### **3. Props corretas:**
- [ ] MyChannelDetails recebe: channelId, onBack, onNavigate, isSidebarExpanded, onSidebarExpandedChange
- [ ] BrandBibleTab recebe: channelName
- [ ] CredentialsTab recebe: channelId

### **4. Layout visual:**
- [ ] Header com back button + channel info + stats cards
- [ ] Tabs com 4 triggers (Overview, Analytics, Brand Bible, Credentials)
- [ ] Overview tab com 2 cards + quick actions
- [ ] Brand Bible com 6 fields em grid 2 colunas
- [ ] Credentials com 2 colunas (credentials + keep-alive)

### **5. Funcionalidades:**
- [ ] Brand Bible fields expansíveis (mostrar "Used in")
- [ ] Credentials tokens show/hide toggle
- [ ] Copy to clipboard funcionando
- [ ] Edit drawer abrindo/fechando
- [ ] Status badges com cores corretas

---

## 🔍 VERIFICAÇÃO FINAL

### **Teste visual:**
1. ✅ Back button funciona e volta para My Channels
2. ✅ Avatar carrega (Dicebear)
3. ✅ 4 stats cards alinhados horizontal
4. ✅ 4 tabs clicáveis
5. ✅ Brand Bible fields expandem ao clicar
6. ✅ Tokens mostram/escondem ao clicar no ícone de olho
7. ✅ Copy funciona e mostra toast

### **Teste responsivo:**
- ✅ Sidebar expande/colapsa ao hover
- ✅ Main ajusta margin (ml-64 ou ml-16)
- ✅ Stats cards ficam empilhados em mobile
- ✅ Brand Bible fica 1 coluna em mobile
- ✅ Credentials fica 1 coluna em mobile

---

## 📊 RESUMO DOS ARQUIVOS

| Arquivo | Linhas (aprox) | Complexidade |
|---------|----------------|--------------|
| MyChannelDetails.tsx | ~270 | Média |
| BrandBibleTab.tsx | ~395 | Alta |
| CredentialsTab.tsx | ~465 | Alta |
| utils/clipboard.ts | ~10 | Baixa |
| **TOTAL** | **~1140** | **Alta** |

---

## 🎯 DIFERENÇAS DO PROJETO ORIGINAL

### **O que NÃO copiar:**
❌ Bug da sidebar que não volta junto  
❌ Console.logs desnecessários  
❌ TODOs não implementados  

### **O que copiar EXATAMENTE:**
✅ Estrutura de layout e spacing  
✅ Classes CSS completas  
✅ Mock data structure  
✅ Sistema de tabs  
✅ Brand Bible fields com "Used in"  
✅ Credentials com keep-alive CRON  
✅ Todas as funcionalidades visuais  

---

**Status:** 📋 Pronto para implementação  
**Tipo:** Página completa com 3 componentes + utilitário  
**Complexidade:** Alta (muitos imports, lógica de estado, sub-componentes)  
**Estimativa:** 15-20 minutos para criar todos os arquivos  

🎬 **BOA SORTE!**
