import { createClient } from '@/lib/supabase/server'
import { formatLargeNumber } from '@/lib/utils'
import { MetricCard } from '@/components/metric-card'
import { fetchAllRows } from '@/lib/supabase/fetch-all'

/**
 * Async Server Component that fetches and displays video metrics.
 * Wrapped in Suspense by parent to enable streaming.
 */
export async function VideosMetrics() {
  const supabase = await createClient()

  // Use pagination to fetch all videos (Supabase has 1000 row limit per request)
  const { data: metricsData } = await fetchAllRows(
    supabase,
    'benchmark_videos',
    'views, performance_vs_median_historical'
  )

  const totalVideos = metricsData?.length || 0
  const totalViews = metricsData?.reduce((sum, v) => sum + (v.views || 0), 0) || 0
  const averageViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0
  const outliersCount = metricsData?.filter(v => (v.performance_vs_median_historical || 0) >= 5).length || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        label="Total Videos"
        value={totalVideos.toLocaleString()}
        subtitle="Videos in database"
      />

      <MetricCard
        label="Average Views"
        value={formatLargeNumber(averageViews)}
        subtitle="Per video average"
      />

      <MetricCard
        label="Total Views"
        value={formatLargeNumber(totalViews)}
        subtitle="Across all videos"
      />

      <MetricCard
        label="Outliers (5x+)"
        value={outliersCount.toLocaleString()}
        subtitle={totalVideos > 0 ? `${((outliersCount / totalVideos) * 100).toFixed(1)}% of total` : '0% of total'}
      />
    </div>
  )
}

/**
 * Skeleton for metrics cards while loading
 */
export function VideosMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-2" />
          <div className="h-8 bg-muted rounded w-16 mb-1" />
          <div className="h-3 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  )
}
