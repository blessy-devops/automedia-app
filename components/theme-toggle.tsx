'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toggle } from '@/components/ui/toggle'

/**
 * Theme Toggle Component
 *
 * A beautiful toggle button that switches between light and dark themes.
 *
 * Features:
 * - Animated transition between Sun and Moon icons
 * - Smooth scale and opacity animations
 * - Outline variant with hover effects
 * - Compact size that fits perfectly in sidebar
 * - Theme preference is automatically saved to localStorage
 *
 * Usage:
 * Place this component in your sidebar:
 * ```tsx
 * import { ThemeToggle } from '@/components/theme-toggle'
 *
 * <sidebar>
 *   <ThemeToggle />
 * </sidebar>
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === 'dark'

  return (
    <Toggle
      variant="outline"
      className="group flex size-9 items-center justify-center p-2 data-[state=on]:bg-transparent data-[state=on]:hover:bg-muted"
      pressed={isDark}
      onPressedChange={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Moon
        size={16}
        strokeWidth={2}
        className="shrink-0 scale-0 opacity-0 transition-all group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
        aria-hidden="true"
      />
      <Sun
        size={16}
        strokeWidth={2}
        className="absolute shrink-0 scale-100 opacity-100 transition-all group-data-[state=on]:scale-0 group-data-[state=on]:opacity-0"
        aria-hidden="true"
      />
    </Toggle>
  )
}
