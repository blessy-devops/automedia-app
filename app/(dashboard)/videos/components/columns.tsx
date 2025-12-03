/**
 * Video Type for the DataTable
 * Based on the BenchmarkVideo Drizzle schema + Channel Name
 */
export type Video = {
  id: number
  youtubeVideoId: string
  channelId: string
  channelName: string | null
  channelDbId: number | null
  title: string | null
  views: number | null
  likes: number | null
  comments: number | null
  uploadDate: Date | null
  thumbnailUrl: string | null
  // Outlier performance scores
  performanceVsAvgHistorical: number | null
  performanceVsMedianHistorical: number | null
  performanceVsRecent14d: number | null
  performanceVsRecent30d: number | null
  performanceVsRecent90d: number | null
  performanceVsMedian14d: number | null
  performanceVsAvg14d: number | null
  isOutlier: boolean | null
  // Video age in days
  videoAgeDays: number | null
  // Whether this video has been used in production
  isProduced: boolean
}
