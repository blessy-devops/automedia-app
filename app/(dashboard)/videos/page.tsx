import { db } from '@/lib/drizzle'
import { benchmarkVideosTable } from '@/lib/drizzle'
import { desc, sql } from 'drizzle-orm'
import { VideosDataTable } from './components/videos-data-table'
import { columns } from './components/columns'

/**
 * Videos Listing Page
 *
 * Server Component that fetches benchmark videos from the database
 * and displays them in an interactive data table with advanced filtering,
 * sorting by performance metrics, and outlier analysis.
 *
 * The page initially loads 100 most recent videos for performance,
 * with client-side pagination handling the rest.
 */
export default async function VideosPage() {
  // Fetch the 100 most recent videos with all relevant metrics
  const videos = await db
    .select({
      id: benchmarkVideosTable.id,
      youtubeVideoId: benchmarkVideosTable.youtubeVideoId,
      channelId: benchmarkVideosTable.channelId,
      title: benchmarkVideosTable.title,
      views: benchmarkVideosTable.views,
      likes: benchmarkVideosTable.likes,
      comments: benchmarkVideosTable.comments,
      uploadDate: benchmarkVideosTable.uploadDate,
      thumbnailUrl: benchmarkVideosTable.thumbnailUrl,
      // Outlier performance scores
      performanceVsAvgHistorical: benchmarkVideosTable.performanceVsAvgHistorical,
      performanceVsMedianHistorical: benchmarkVideosTable.performanceVsMedianHistorical,
      performanceVsRecent14d: benchmarkVideosTable.performanceVsRecent14d,
      performanceVsRecent30d: benchmarkVideosTable.performanceVsRecent30d,
      performanceVsRecent90d: benchmarkVideosTable.performanceVsRecent90d,
      isOutlier: benchmarkVideosTable.isOutlier,
      // Calculate video age in days
      videoAgeDays: sql<number>`EXTRACT(DAY FROM NOW() - ${benchmarkVideosTable.uploadDate})`.as('video_age_days'),
    })
    .from(benchmarkVideosTable)
    .orderBy(desc(benchmarkVideosTable.uploadDate))
    .limit(100)

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          YouTube Videos
        </h1>
        <p className="text-muted-foreground text-lg">
          Analyze video performance and discover outliers with advanced metrics
        </p>
      </div>

      <VideosDataTable columns={columns} data={videos} />
    </div>
  )
}
