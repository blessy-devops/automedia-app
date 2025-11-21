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
  Target,
  Radar,
  Film,
  Tv,
  Sparkles,
  Bot,
  BarChart3,
  Settings,
  ChevronUp,
  ChevronDown,
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
        href: "/benchmark/channels-v2",
        icon: Target,
      },
      {
        title: "Radar",
        href: "/radar",
        icon: Radar,
      },
    ],
  },
  {
    id: "production",
    title: "Production",
    icon: Film,
    items: [], // Empty for now
  },
  {
    id: "visual-lab",
    title: "Visual Lab",
    icon: Sparkles,
    items: [], // Empty for now
  },
  {
    id: "ai-automation",
    title: "AI & Automation",
    icon: Bot,
    items: [], // Empty for now
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    items: [], // Will use existing settings routes if any
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
      <SidebarHeader className="border-b border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/"
                className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
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
        <nav className="flex flex-col gap-1 py-2">
          {/* Dashboard - Standalone Item */}
          <SidebarMenuButton
            asChild
            isActive={pathname === "/dashboard"}
            tooltip="Dashboard"
            className="px-4 py-2"
          >
            <Link href="/dashboard" className="flex items-center gap-3">
              <Home className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Dashboard</span>
            </Link>
          </SidebarMenuButton>

          {/* Benchmark Section - Collapsible */}
          <div className="mt-1">
            <button
              onClick={() => toggleSection("benchmark")}
              className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-muted transition-colors w-full text-left"
            >
              <Search className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Benchmark</span>
              {expandedSection === "benchmark" ? (
                <ChevronUp className="w-4 h-4 ml-auto flex-shrink-0 group-data-[collapsible=icon]:hidden" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto flex-shrink-0 group-data-[collapsible=icon]:hidden" />
              )}
            </button>

            {expandedSection === "benchmark" && (
              <div className="transition-all duration-200 ease-in-out">
                {collapsibleSections[0].items?.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <SidebarMenuButton
                      key={item.href}
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="pl-12 pr-4 py-2"
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

          {/* Production Section - Non-Collapsible (empty) */}
          <div className="mt-1">
            <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground cursor-default">
              <Film className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Production</span>
            </div>
          </div>

          {/* My Channels - Standalone Item with NEW badge */}
          <div className="mt-1">
            <SidebarMenuButton
              asChild
              isActive={pathname === "/channels"}
              tooltip="My Channels"
              className="px-4 py-2"
            >
              <Link href="/channels" className="flex items-center gap-3">
                <Tv className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">My Channels</span>
                <span className="ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-foreground text-background group-data-[collapsible=icon]:hidden">
                  NEW
                </span>
              </Link>
            </SidebarMenuButton>
          </div>

          {/* Visual Lab Section - Non-Collapsible (empty) */}
          <div className="mt-1">
            <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground cursor-default">
              <Sparkles className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Visual Lab</span>
            </div>
          </div>

          {/* AI & Automation Section - Non-Collapsible (empty) */}
          <div className="mt-1">
            <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground cursor-default">
              <Bot className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">AI & Automation</span>
            </div>
          </div>

          {/* Analytics - Standalone Item with NEW badge */}
          <div className="mt-1">
            <SidebarMenuButton
              asChild
              isActive={pathname === "/analytics"}
              tooltip="Analytics"
              className="px-4 py-2"
            >
              <Link href="/analytics" className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Analytics</span>
                <span className="ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-foreground text-background group-data-[collapsible=icon]:hidden">
                  NEW
                </span>
              </Link>
            </SidebarMenuButton>
          </div>

          {/* Settings Section - Non-Collapsible (empty) */}
          <div className="mt-1">
            <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground cursor-default">
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">Settings</span>
            </div>
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
