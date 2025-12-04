import { Suspense } from 'react'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { VideosMetrics, VideosMetricsSkeleton } from './components/videos-metrics'
import { VideosTableWrapper } from './components/videos-table-wrapper'

// Force dynamic rendering to prevent stale cache after folder mutations
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Videos Listing Page (New Design)
 *
 * Server Component with Suspense streaming for instant page load.
 * - Header renders immediately
 * - Metrics and table stream in as they load
 */
export default async function VideosPageNew({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Renders immediately */}
      <div className="bg-card border-b border-border px-8 py-5">
        <h1 className="text-foreground">YouTube Videos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and organize enriched YouTube video data across channels
        </p>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Stats Cards - Stream in with skeleton */}
        <Suspense fallback={<VideosMetricsSkeleton />}>
          <VideosMetrics />
        </Suspense>

        {/* Videos Table - Stream in with skeleton */}
        <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
          <VideosTableWrapper searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}
