# AutoMedia Platform - Sidebar Navigation Structure

**Document Version:** 1.0
**Created:** 2025-11-15
**Author:** Claude Code + Davi Luis
**Status:** Implementation Specification

---

## Table of Contents

1. [Current vs Proposed Structure](#current-vs-proposed-structure)
2. [Proposed Sidebar Structure](#proposed-sidebar-structure)
3. [Implementation Specifications](#implementation-specifications)
4. [Route Mapping](#route-mapping)
5. [Icon Reference](#icon-reference)
6. [Component Architecture](#component-architecture)

---

## Current vs Proposed Structure

### Current Sidebar (Flat Structure - 7 Items)

```
🏠 Dashboard
👥 Channels               ← CONFUSING: Benchmark or Owned?
⚡ Channel Radar
🎥 Videos                  ← CONFUSING: Benchmark or Production?
▶️ Production
🔍 New Benchmark
⚙️  Settings
```

**Problems:**
1. **Ambiguity:** "Channels" could mean benchmark channels OR owned channels
2. **Flat structure:** No grouping makes it hard to understand relationships
3. **Scalability:** Adding more features will create clutter
4. **Mental model mismatch:** Doesn't reflect user's workflow (research → create → distribute)

---

### Proposed Sidebar (Hierarchical Structure - 4 Sections + Dashboard)

```
┌─────────────────────────────────────┐
│  🔴 Automídia                       │  ← Logo + Brand
├─────────────────────────────────────┤
│                                     │
│  🏠 Dashboard                       │  ← Top-level, always visible
│                                     │
│  🔍 Benchmark              ▼        │  ← Collapsible section
│     • Channels                      │
│     • Videos                        │
│     • New Benchmark                 │
│     • Radar                         │
│                                     │
│  🎬 Production             ▼        │  ← Collapsible section
│     • Videos                        │
│     • Queue                         │
│                                     │
│  📺 Channels               ▼        │  ← Collapsible section (RENAMED: "Our Channels" or "My Channels")
│     • Channels                      │
│     • Brand Bibles                  │
│     • Published Videos              │
│                                     │
│  ⚙️  Settings              ▼        │  ← Collapsible section
│     • Platform                      │
│     • API Keys                      │
│     • Workflows                     │
│     • Assets                        │
│     • Categorization                │
│     • Posting Schedule              │
│     • Webhooks                      │
│                                     │
├─────────────────────────────────────┤
│  🌙 Dark Mode                       │  ← Footer (theme toggle)
└─────────────────────────────────────┘
```

**Benefits:**
1. ✅ **Clear grouping** by functional domain
2. ✅ **Scalable** (can collapse sections to reduce visual clutter)
3. ✅ **Intuitive workflow** (matches user mental model)
4. ✅ **No ambiguity** (Benchmark Channels vs Our Channels is clear)
5. ✅ **Future-proof** (easy to add new sub-items without refactoring)

---

## Proposed Sidebar Structure

### Full Specification

```javascript
const sidebarStructure = {
  header: {
    logo: "🔴",
    brandName: "Automídia",
    route: "/" // Click logo to go home
  },

  sections: [
    // TOP-LEVEL ITEM (Not a section)
    {
      type: "single",
      id: "dashboard",
      title: "Dashboard",
      icon: "LayoutDashboard", // Lucide icon
      route: "/dashboard",
      badge: null // Could show notification count
    },

    // SECTION 1: BENCHMARK
    {
      type: "section",
      id: "benchmark",
      title: "Benchmark",
      icon: "Search", // Search icon (magnifying glass)
      defaultExpanded: true, // Open by default
      items: [
        {
          id: "benchmark-channels",
          title: "Channels",
          icon: "Users", // Group of people
          route: "/benchmark/channels",
          badge: null // Could show count of tracked channels
        },
        {
          id: "benchmark-videos",
          title: "Videos",
          icon: "Video", // Video camera
          route: "/benchmark/videos",
          badge: null // Could show outlier count
        },
        {
          id: "benchmark-new",
          title: "New Benchmark",
          icon: "PlusCircle", // Plus icon
          route: "/benchmark/new",
          badge: null
        },
        {
          id: "benchmark-radar",
          title: "Radar",
          icon: "Radar", // Radar icon
          route: "/benchmark/radar",
          badge: null // Could show "has 10x outlier" count
        }
      ]
    },

    // SECTION 2: PRODUCTION
    {
      type: "section",
      id: "production",
      title: "Production",
      icon: "Clapperboard", // Movie clapperboard
      defaultExpanded: true,
      items: [
        {
          id: "production-videos",
          title: "Videos",
          icon: "Film", // Film strip
          route: "/production/videos",
          badge: null // Could show count in progress
        },
        {
          id: "production-queue",
          title: "Queue",
          icon: "ListOrdered", // Ordered list
          route: "/production/queue",
          badge: null // Could show bottleneck count
        }
      ]
    },

    // SECTION 3: CHANNELS (OWNED)
    {
      type: "section",
      id: "channels",
      title: "Channels", // Or "My Channels" or "Our Channels"
      icon: "Tv", // TV icon (represents YouTube channels)
      defaultExpanded: false, // Collapsed by default
      items: [
        {
          id: "channels-list",
          title: "Channels",
          icon: "Radio", // Broadcast icon
          route: "/channels",
          badge: null // Could show active channel count
        },
        {
          id: "channels-brand-bibles",
          title: "Brand Bibles",
          icon: "BookOpen", // Open book
          route: "/channels/brand-bibles",
          badge: null
        },
        {
          id: "channels-published",
          title: "Published Videos",
          icon: "Upload", // Upload icon (published)
          route: "/channels/published-videos",
          badge: null // Could show last 30 days count
        }
      ]
    },

    // SECTION 4: SETTINGS
    {
      type: "section",
      id: "settings",
      title: "Settings",
      icon: "Settings", // Gear icon
      defaultExpanded: false, // Collapsed by default
      items: [
        {
          id: "settings-platform",
          title: "Platform",
          icon: "Globe", // Globe icon
          route: "/settings",
          badge: null
        },
        {
          id: "settings-api-keys",
          title: "API Keys",
          icon: "Key", // Key icon
          route: "/settings/api-keys",
          badge: null // Could show "needs attention" if keys expired
        },
        {
          id: "settings-workflows",
          title: "Workflows",
          icon: "Workflow", // Workflow diagram icon
          route: "/settings/workflows",
          badge: null
        },
        {
          id: "settings-assets",
          title: "Assets",
          icon: "FolderOpen", // Folder icon
          route: "/settings/assets",
          badge: null
        },
        {
          id: "settings-categorization",
          title: "Categorization",
          icon: "Tags", // Tags icon
          route: "/settings/categorization",
          badge: null
        },
        {
          id: "settings-posting-schedule",
          title: "Posting Schedule",
          icon: "Calendar", // Calendar icon
          route: "/settings/posting-schedule",
          badge: null
        },
        {
          id: "settings-webhooks",
          title: "Webhooks",
          icon: "Webhook", // Webhook icon
          route: "/settings/webhooks",
          badge: null
        }
      ]
    }
  ],

  footer: {
    type: "theme-toggle",
    lightIcon: "Sun",
    darkIcon: "Moon"
  }
}
```

---

## Implementation Specifications

### Using shadcn/ui Sidebar Component

The current codebase already uses `@/components/ui/sidebar`. We need to extend it to support **collapsible sections**.

#### Required Components

```typescript
// Already exists (from current implementation)
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,  // ← Need to add this for section headers
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Need to add for collapsible sections
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
```

### Component Architecture

```tsx
// components/app-sidebar.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// Import all necessary icons
import {
  LayoutDashboard,
  Search,
  Users,
  Video,
  PlusCircle,
  Radar,
  Clapperboard,
  Film,
  ListOrdered,
  Tv,
  Radio,
  BookOpen,
  Upload,
  Settings,
  Globe,
  Key,
  Workflow,
  FolderOpen,
  Tags,
  Calendar,
  Webhook,
  Moon,
  Sun,
  Play,
} from "lucide-react"

type SidebarSection = {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  defaultExpanded: boolean
  items: {
    id: string
    title: string
    icon: React.ComponentType<{ className?: string }>
    route: string
    badge?: string | number
  }[]
}

const sidebarSections: SidebarSection[] = [
  {
    id: "benchmark",
    title: "Benchmark",
    icon: Search,
    defaultExpanded: true,
    items: [
      {
        id: "benchmark-channels",
        title: "Channels",
        icon: Users,
        route: "/benchmark/channels",
      },
      {
        id: "benchmark-videos",
        title: "Videos",
        icon: Video,
        route: "/benchmark/videos",
      },
      {
        id: "benchmark-new",
        title: "New Benchmark",
        icon: PlusCircle,
        route: "/benchmark/new",
      },
      {
        id: "benchmark-radar",
        title: "Radar",
        icon: Radar,
        route: "/benchmark/radar",
      },
    ],
  },
  // ... other sections
]

export function AppSidebar() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    benchmark: true,
    production: true,
    channels: false,
    settings: false,
  })

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const isActive = (route: string) => pathname === route

  return (
    <>
      <SidebarHeader>
        {/* Logo and brand */}
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard (top-level item) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible sections */}
        {sidebarSections.map((section) => {
          const SectionIcon = section.icon
          const isExpanded = expandedSections[section.id]

          return (
            <Collapsible
              key={section.id}
              open={isExpanded}
              onOpenChange={() => toggleSection(section.id)}
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <SectionIcon className="w-5 h-5" />
                      <span>{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </CollapsibleTrigger>
                </SidebarGroupLabel>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      {section.items.map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <SidebarMenuSubItem key={item.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(item.route)}
                            >
                              <Link href={item.route}>
                                <ItemIcon className="w-4 h-4" />
                                <span>{item.title}</span>
                                {item.badge && (
                                  <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        {/* Theme toggle */}
      </SidebarFooter>
    </>
  )
}
```

---

## Route Mapping

### Complete Route Map (New vs Old)

| Section | Item | New Route | Old Route | Status | Notes |
|---------|------|-----------|-----------|--------|-------|
| - | Dashboard | `/dashboard` | `/dashboard` | ✅ Exists | No change |
| **Benchmark** | Channels | `/benchmark/channels` | `/benchmark/channels` | ✅ Exists | No change |
| **Benchmark** | Videos | `/benchmark/videos` | `/videos` | ⚠️ RENAME | Move `/videos` → `/benchmark/videos` |
| **Benchmark** | New Benchmark | `/benchmark/new` | `/benchmark/channels-v2` | ⚠️ RENAME | Rename `/benchmark/channels-v2` → `/benchmark/new` |
| **Benchmark** | Radar | `/benchmark/radar` | `/radar` | ⚠️ MOVE | Move `/radar` → `/benchmark/radar` |
| **Production** | Videos | `/production/videos` | `/production-videos` | ⚠️ RENAME | Rename `/production-videos` → `/production/videos` |
| **Production** | Queue | `/production/queue` | - | ❌ NEW | Create new page |
| **Channels** | Channels | `/channels` | `/channels` | ✅ Exists | No change (but context is now clear) |
| **Channels** | Brand Bibles | `/channels/brand-bibles` | - | ❌ NEW | Create new page |
| **Channels** | Published Videos | `/channels/published-videos` | - | ❌ NEW | Create new page (or reuse production-videos filtered) |
| **Settings** | Platform | `/settings` | `/settings` | ✅ Exists | No change |
| **Settings** | API Keys | `/settings/api-keys` | - | ❌ NEW | Create new page |
| **Settings** | Workflows | `/settings/workflows` | - | ❌ NEW | Create new page |
| **Settings** | Assets | `/settings/assets` | - | ❌ NEW | Create new page |
| **Settings** | Categorization | `/settings/categorization` | - | ❌ NEW | Create new page |
| **Settings** | Posting Schedule | `/settings/posting-schedule` | - | ❌ NEW | Create new page |
| **Settings** | Webhooks | `/settings/webhooks` | `/settings/webhooks` | ✅ Exists | No change |

### Migration Strategy

#### Phase 1: Immediate Changes (Low Risk)
1. ✅ Update sidebar component to use collapsible sections
2. ✅ Keep all existing routes working (backward compatibility)
3. ✅ Add redirects for renamed routes

#### Phase 2: Route Refactoring (Medium Risk)
1. Create new folder structure:
   ```
   app/(dashboard)/
   ├── dashboard/
   ├── benchmark/
   │   ├── channels/
   │   ├── videos/          ← Move from /videos
   │   ├── new/             ← Rename from /channels-v2
   │   └── radar/           ← Move from /radar
   ├── production/
   │   ├── videos/          ← Rename from /production-videos
   │   └── queue/           ← New
   ├── channels/
   │   ├── (existing)
   │   ├── brand-bibles/    ← New
   │   └── published-videos/ ← New
   └── settings/
       ├── (existing)
       ├── api-keys/        ← New
       ├── workflows/       ← New
       ├── assets/          ← New
       ├── categorization/  ← New
       └── posting-schedule/ ← New
   ```

2. Add redirect middleware:
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl

     // Redirects for renamed routes
     if (pathname === '/videos') {
       return NextResponse.redirect(new URL('/benchmark/videos', request.url))
     }
     if (pathname === '/radar') {
       return NextResponse.redirect(new URL('/benchmark/radar', request.url))
     }
     if (pathname === '/production-videos') {
       return NextResponse.redirect(new URL('/production/videos', request.url))
     }
     if (pathname === '/benchmark/channels-v2') {
       return NextResponse.redirect(new URL('/benchmark/new', request.url))
     }

     // ... rest of middleware
   }
   ```

#### Phase 3: Create New Pages (Low Priority)
- Create placeholder pages for new routes (can be "Coming Soon" initially)
- Implement incrementally based on priority

---

## Icon Reference

### Lucide React Icons Used

```typescript
import {
  // Top-level
  LayoutDashboard,  // Dashboard
  Play,             // Logo

  // Benchmark section
  Search,           // Section icon
  Users,            // Channels
  Video,            // Videos
  PlusCircle,       // New Benchmark
  Radar,            // Radar

  // Production section
  Clapperboard,     // Section icon
  Film,             // Videos
  ListOrdered,      // Queue

  // Channels section
  Tv,               // Section icon
  Radio,            // Channels
  BookOpen,         // Brand Bibles
  Upload,           // Published Videos

  // Settings section
  Settings,         // Section icon
  Globe,            // Platform
  Key,              // API Keys
  Workflow,         // Workflows
  FolderOpen,       // Assets
  Tags,             // Categorization
  Calendar,         // Posting Schedule
  Webhook,          // Webhooks

  // UI
  ChevronDown,      // Expanded section
  ChevronRight,     // Collapsed section
  Moon,             // Dark mode
  Sun,              // Light mode
} from "lucide-react"
```

### Icon Size Conventions

```css
/* Section icons (collapsible headers) */
.section-icon {
  width: 1.25rem;  /* 20px */
  height: 1.25rem;
}

/* Menu item icons (sub-items) */
.menu-item-icon {
  width: 1rem;     /* 16px */
  height: 1rem;
}

/* Logo icon */
.logo-icon {
  width: 2rem;     /* 32px */
  height: 2rem;
}
```

---

## Component Architecture

### File Structure

```
components/
├── ui/
│   ├── sidebar.tsx         (shadcn/ui base component)
│   └── collapsible.tsx     (shadcn/ui collapsible)
├── app-sidebar.tsx         (main sidebar component - UPDATE THIS)
└── custom-sidebar.tsx      (wrapper - no changes needed)

app/(dashboard)/
├── layout.tsx              (uses CustomSidebar - no changes)
└── [all routes]/           (pages use existing layout)
```

### State Management

**Use URL-based state for section expansion (optional enhancement):**

```typescript
// Store expanded sections in URL params
// Example: /dashboard?sidebar=benchmark,production

const searchParams = useSearchParams()
const router = useRouter()

const expandedSections = useMemo(() => {
  const param = searchParams.get('sidebar')
  if (!param) return { benchmark: true, production: true }

  const sections = param.split(',')
  return {
    benchmark: sections.includes('benchmark'),
    production: sections.includes('production'),
    channels: sections.includes('channels'),
    settings: sections.includes('settings'),
  }
}, [searchParams])

const toggleSection = (sectionId: string) => {
  const newExpanded = { ...expandedSections, [sectionId]: !expandedSections[sectionId] }
  const expanded = Object.entries(newExpanded)
    .filter(([_, value]) => value)
    .map(([key]) => key)
    .join(',')

  router.push(`${pathname}?sidebar=${expanded}`)
}
```

**Or use localStorage (simpler):**

```typescript
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
  if (typeof window === 'undefined') return { benchmark: true, production: true }

  const stored = localStorage.getItem('sidebar-expanded')
  return stored ? JSON.parse(stored) : { benchmark: true, production: true }
})

useEffect(() => {
  localStorage.setItem('sidebar-expanded', JSON.stringify(expandedSections))
}, [expandedSections])
```

---

## Accessibility Considerations

### ARIA Labels

```tsx
<CollapsibleTrigger
  className="..."
  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.title} section`}
>
  {/* ... */}
</CollapsibleTrigger>
```

### Keyboard Navigation

- ✅ All links should be focusable with Tab
- ✅ Collapsible sections should toggle with Enter/Space
- ✅ Arrow keys should navigate between menu items (optional enhancement)

### Screen Reader Support

```tsx
<SidebarMenuButton
  asChild
  isActive={isActive(item.route)}
  aria-current={isActive(item.route) ? 'page' : undefined}
>
  {/* ... */}
</SidebarMenuButton>
```

---

## Responsive Behavior

### Mobile
- Sidebar should collapse to hamburger menu
- Sections auto-expand when tapped
- Full-screen overlay when open

### Tablet
- Sidebar can be toggled (icon-only vs full)
- Sections remain collapsible

### Desktop
- Sidebar always visible
- Sections collapsible for focus
- Width: 240px - 280px (current: using shadcn default)

---

## Summary

### What Changes

| Component | Change | Complexity | Priority |
|-----------|--------|------------|----------|
| `app-sidebar.tsx` | Add collapsible sections | Medium | 🔴 High |
| Routes (Phase 1) | Keep existing, add redirects | Low | 🔴 High |
| Routes (Phase 2) | Rename/move routes | Medium | 🟡 Medium |
| New pages | Create placeholder pages | Low | 🟢 Low |

### What Stays the Same

- ✅ Sidebar component architecture (shadcn/ui)
- ✅ Dashboard layout structure
- ✅ Theme toggle functionality
- ✅ Logo and branding
- ✅ All existing pages (just reorganized in sidebar)

---

**Document End**

**Next Steps:**
1. ✅ Review and approve this navigation structure
2. Install `@/components/ui/collapsible` (if not already installed)
3. Update `app-sidebar.tsx` with collapsible sections
4. Test navigation flow
5. Create redirects for renamed routes
6. Create new pages incrementally
