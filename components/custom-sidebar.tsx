"use client"

import { useState, useMemo, createContext, useContext } from "react"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a CustomSidebar.")
  }
  return context
}

export function CustomSidebar({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      state: isExpanded ? "expanded" : "collapsed",
      open: isExpanded,
      setOpen: setIsExpanded,
      openMobile: false,
      setOpenMobile: () => {},
      isMobile: false,
      toggleSidebar: () => setIsExpanded((prev) => !prev),
    }),
    [isExpanded]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <>
          {/* Spacer div - ocupa o espaço da sidebar no layout */}
          <div
            className={cn(
              "transition-all duration-300 ease-in-out flex-shrink-0",
              isExpanded ? "w-56" : "w-16"
            )}
          />

          {/* Sidebar fixa */}
          <aside
            data-collapsible={isExpanded ? "" : "icon"}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={cn(
              "group fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
              isExpanded ? "w-56" : "w-16"
            )}
          >
            {children}
          </aside>
        </>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}
