"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Play,
  Moon,
  Sun,
  Home,
  Search,
  TrendingUp,
  Video,
  PlayCircle,
  Radio,
  Film,
  Tv,
  Sparkles,
  Bot,
  BarChart3,
  Settings,
  ChevronDown,
  FolderKanban,
  Loader,
  Calendar,
  Workflow,
  ClipboardList,
  Brush,
  Image,
  Music,
  Wand2,
  Clapperboard,
  Brain,
  Library,
  DollarSign,
  Key,
  Monitor,
  Layers,
  Webhook,
  CheckCircle2,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/custom-sidebar"
import { cn } from "@/lib/utils"

// Collapsible section type
type CollapsibleSection = {
  id: string
  title: string
  icon: any
  items?: {
    title: string
    href: string
    icon: any
    isPlaceholder?: boolean
  }[]
}

// Collapsible sections configuration
const collapsibleSections: CollapsibleSection[] = [
  {
    id: "benchmark",
    title: "Benchmark",
    icon: Search,
    items: [
      {
        title: "Channels",
        href: "/benchmark/channels",
        icon: TrendingUp,
      },
      {
        title: "Videos",
        href: "/videos",
        icon: Video,
      },
      {
        title: "New Benchmark",
        href: "/benchmark/new-channel-benchmark",
        icon: PlayCircle,
      },
      {
        title: "Radar",
        href: "/benchmark/radar",
        icon: Radio,
      },
    ],
  },
  {
    id: "production",
    title: "Production",
    icon: Film,
    items: [
      {
        title: "Videos",
        href: "/production/videos",
        icon: Video,
      },
      {
        title: "Queue",
        href: "/production-videos",
        icon: FolderKanban,
      },
      {
        title: "Approval Queue",
        href: "/production/approval-queue",
        icon: CheckCircle2,
      },
      {
        title: "API Queue",
        href: "/production/api-queue",
        icon: Loader,
      },
      {
        title: "Calendar",
        href: "/production/calendar",
        icon: Calendar,
        isPlaceholder: true,
      },
      {
        title: "Workflows",
        href: "/production/workflows",
        icon: Workflow,
        isPlaceholder: true,
      },
      {
        title: "Distribution",
        href: "/production/distribution",
        icon: ClipboardList,
      },
    ],
  },
  {
    id: "visual-lab",
    title: "Visual Lab",
    icon: Sparkles,
    items: [
      {
        title: "Thumbnail Creator",
        href: "/visual-lab/thumbnail-creator",
        icon: Brush,
        isPlaceholder: true,
      },
      {
        title: "Image Assets",
        href: "/visual-lab/image-assets",
        icon: Image,
      },
      {
        title: "Audio Assets",
        href: "/visual-lab/audio-assets",
        icon: Music,
      },
      {
        title: "Visual FX",
        href: "/visual-lab/visual-fx",
        icon: Wand2,
      },
      {
        title: "Video Inserts",
        href: "/visual-lab/video-inserts",
        icon: Clapperboard,
      },
    ],
  },
  {
    id: "ai-automation",
    title: "AI & Automation",
    icon: Bot,
    items: [
      {
        title: "AI Agents",
        href: "/ai-automation/agents",
        icon: Brain,
        isPlaceholder: true,
      },
      {
        title: "Narrative Library",
        href: "/ai-automation/narrative-library",
        icon: Library,
        isPlaceholder: true,
      },
      {
        title: "AI Cost Tracking",
        href: "/ai-automation/cost-tracking",
        icon: DollarSign,
        isPlaceholder: true,
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    items: [
      {
        title: "Platform Settings",
        href: "/settings/platform",
        icon: Settings,
      },
      {
        title: "API Keys Pool",
        href: "/settings/api-keys",
        icon: Key,
      },
      {
        title: "FFMPEG Config",
        href: "/settings/ffmpeg",
        icon: Monitor,
        isPlaceholder: true,
      },
      {
        title: "Categorization",
        href: "/settings/categorization",
        icon: Layers,
      },
      {
        title: "Webhooks",
        href: "/settings/webhooks",
        icon: Webhook,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { state } = useSidebar()

  // Track which section is expanded (only one at a time, starts all collapsed)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Reset expanded section when sidebar collapses
  useEffect(() => {
    if (state === "collapsed") {
      setExpandedSection(null)
    }
  }, [state])

  const toggleSection = (sectionId: string) => {
    setExpandedSection(prev => (prev === sectionId ? null : sectionId))
  }

  return (
    <>
      <SidebarHeader className="border-b border-border px-4 pb-4 mb-6 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/"
                className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              >
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-foreground whitespace-nowrap overflow-hidden hidden group-data-[collapsible=icon]:hidden md:inline">
                  Automídia
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <nav className="flex flex-col gap-1 px-2">
          {/* Dashboard - Standalone Item */}
          <SidebarMenuButton
            asChild
            isActive={pathname === "/dashboard"}
            tooltip="Dashboard"
            className="px-3 py-2.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
          >
            <Link href="/dashboard" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <Home className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Dashboard</span>
            </Link>
          </SidebarMenuButton>

          {/* Benchmark Section - Collapsible */}
          <div className="mt-1">
            <button
              onClick={() => toggleSection("benchmark")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors w-full text-left group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Search className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Benchmark</span>
              <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${expandedSection === "benchmark" ? 'rotate-180' : ''}`} />
            </button>

            {expandedSection === "benchmark" && (
              <div className="space-y-1 mt-1 ml-4 border-l border-border pl-2">
                {collapsibleSections[0].items?.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <SidebarMenuButton
                      key={item.href}
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="pr-4 py-2"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <ItemIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )
                })}
              </div>
            )}
          </div>

          {/* Production Section - Collapsible */}
          <div className="mt-1">
            <button
              onClick={() => toggleSection("production")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors w-full text-left group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Film className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Production</span>
              <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${expandedSection === "production" ? 'rotate-180' : ''}`} />
            </button>

            {expandedSection === "production" && (
              <div className="space-y-1 mt-1 ml-4 border-l border-border pl-2">
                {collapsibleSections[1].items?.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <SidebarMenuButton
                      key={item.href}
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="pr-4 py-2"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <ItemIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )
                })}
              </div>
            )}
          </div>

          {/* My Channels - Standalone Item */}
          <div className="mt-1">
            <SidebarMenuButton
              asChild
              isActive={pathname === "/channels"}
              tooltip="My Channels"
              className="px-3 py-2.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Link href="/channels" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                <Tv className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm group-data-[collapsible=icon]:hidden">My Channels</span>
              </Link>
            </SidebarMenuButton>
          </div>

          {/* Visual Lab Section - Collapsible */}
          <div className="mt-1">
            <button
              onClick={() => toggleSection("visual-lab")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors w-full text-left group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Visual Lab</span>
              <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${expandedSection === "visual-lab" ? 'rotate-180' : ''}`} />
            </button>

            {expandedSection === "visual-lab" && (
              <div className="space-y-1 mt-1 ml-4 border-l border-border pl-2">
                {collapsibleSections[2].items?.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <SidebarMenuButton
                      key={item.href}
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="pr-4 py-2"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <ItemIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )
                })}
              </div>
            )}
          </div>

          {/* AI & Automation Section - Collapsible */}
          <div className="mt-1">
            <button
              onClick={() => toggleSection("ai-automation")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors w-full text-left group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Bot className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">AI & Automation</span>
              <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${expandedSection === "ai-automation" ? 'rotate-180' : ''}`} />
            </button>

            {expandedSection === "ai-automation" && (
              <div className="space-y-1 mt-1 ml-4 border-l border-border pl-2">
                {collapsibleSections[3].items?.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <SidebarMenuButton
                      key={item.href}
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="pr-4 py-2"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <ItemIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )
                })}
              </div>
            )}
          </div>

          {/* Analytics - Standalone Item */}
          <div className="mt-1">
            <SidebarMenuButton
              asChild
              isActive={pathname === "/analytics"}
              tooltip="Analytics"
              className="px-3 py-2.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Link href="/analytics" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm group-data-[collapsible=icon]:hidden">Analytics</span>
              </Link>
            </SidebarMenuButton>
          </div>

          {/* Settings Section - Collapsible */}
          <div className="mt-1">
            <button
              onClick={() => toggleSection("settings")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors w-full text-left group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Settings</span>
              <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${expandedSection === "settings" ? 'rotate-180' : ''}`} />
            </button>

            {expandedSection === "settings" && (
              <div className="space-y-1 mt-1 ml-4 border-l border-border pl-2">
                {collapsibleSections[4].items?.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <SidebarMenuButton
                      key={item.href}
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="pr-4 py-2"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <ItemIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              tooltip={theme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
