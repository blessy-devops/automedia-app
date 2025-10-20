import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - AutoMedia Platform',
  description: 'Channel Benchmark and Analytics Dashboard',
}

/**
 * Dashboard Layout
 *
 * Wrapper layout for all dashboard pages.
 * Can be extended with navigation, sidebar, etc.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* TODO: Add navigation/sidebar here */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
