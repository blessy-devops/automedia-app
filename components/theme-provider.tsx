'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from 'next-themes'

/**
 * Theme Provider Component
 *
 * Wraps the application with next-themes provider to enable theme switching.
 * This component should be placed in the root layout to make theme context
 * available throughout the entire application.
 *
 * Features:
 * - Automatic system theme detection
 * - Persistent theme preference in localStorage
 * - Prevents flash of unstyled content (FOUC)
 * - Supports light, dark, and system themes
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
