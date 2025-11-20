"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Play,
  Moon,
  Sun,
  Home,
  LayoutGrid,
  Users,
  TrendingUp,
  Radar,
  Video,
  Clapperboard,
  Sparkles,
  Zap,
  Share2,
  Calendar,
  Upload,
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// Collapsible section type
type CollapsibleSection = {
  id: string
  title: string
  icon: any
  items: {
    title: string
    href: string
    icon: any
    isPlaceholder?: boolean
  }[]
}

// Menu structure
const collapsibleSections: CollapsibleSection[] = [
  {
    id: "content",
    title: "Content",
    icon: LayoutGrid,
    items: [
      {
        title: "My Channels",
        href: "/channels",
        icon: Users,
        isPlaceholder: true, // Will be created later
      },
      {
        title: "Benchmark Channels",
        href: "/benchmark/channels",
        icon: TrendingUp,
      },
      {
        title: "Channel Radar",
        href: "/benchmark/radar",
        icon: Radar,
      },
      {
        title: "Videos",
        href: "/videos",
        icon: Video,
      },
    ],
  },
  {
    id: "production",
    title: "Production",
    icon: Clapperboard,
    items: [
      {
        title: "Visual Lab",
        href: "/visual-lab",
        icon: Sparkles,
        isPlaceholder: true,
      },
      {
        title: "Automations",
        href: "/automations",
        icon: Zap,
        isPlaceholder: true,
      },
    ],
  },
  {
    id: "distribution",
    title: "Distribution",
    icon: Share2,
    items: [
      {
        title: "Schedule",
        href: "/schedule",
        icon: Calendar,
        isPlaceholder: true,
      },
      {
        title: "Publishing",
        href: "/publishing",
        icon: Upload,
        isPlaceholder: true,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Track which sections are expanded (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "content",
    "production",
    "distribution",
  ])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  return (
    <>
      <SidebarHeader>
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
        {/* Analytics Section (always expanded) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible Sections */}
        {collapsibleSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id)
          const SectionIcon = section.icon

          return (
            <SidebarGroup key={section.id}>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Section Header (Collapsible) */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => toggleSection(section.id)}
                      tooltip={section.title}
                      className="font-medium"
                    >
                      <SectionIcon className="w-5 h-5" />
                      <span>{section.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="ml-auto w-4 h-4" />
                      ) : (
                        <ChevronRight className="ml-auto w-4 h-4" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Section Items (shown when expanded) */}
                  {isExpanded && (
                    <SidebarMenuSub>
                      {section.items.map((item) => {
                        const ItemIcon = item.icon
                        const isActive = pathname === item.href

                        return (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              tooltip={item.title}
                              className={cn(
                                "pl-8",
                                item.isPlaceholder && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {item.isPlaceholder ? (
                                <span className="flex items-center gap-2">
                                  <ItemIcon className="w-4 h-4" />
                                  <span>{item.title}</span>
                                </span>
                              ) : (
                                <Link href={item.href}>
                                  <ItemIcon className="w-4 h-4" />
                                  <span>{item.title}</span>
                                </Link>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}

        {/* Actions Section (always expanded) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/benchmark/new-channel-benchmark"}
                  tooltip="New Benchmark"
                >
                  <Link href="/benchmark/new-channel-benchmark">
                    <Search className="w-5 h-5" />
                    <span>New Benchmark</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/settings")}
                  tooltip="Settings"
                >
                  <Link href="/settings">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
