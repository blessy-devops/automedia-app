/**
 * Channel Type for the DataTable
 * Based on the BenchmarkChannel Drizzle schema + Baseline Stats
 */
export type Channel = {
  id: number
  channelId: string
  channelName: string | null
  subscriberCount: number | null
  totalViews: number | null
  videoUploadCount: number | null
  categorization: {
    niche?: string
    subniche?: string
    microniche?: string
    category?: string
    format?: string
  } | null
  thumbnailUrl: string | null
  isVerified: boolean | null
  country: string | null
  // Baseline stats from LEFT JOIN
  avgViewsPerVideoHistorical: number | null
  medianViewsPerVideoHistorical: number | null
}
