import { createClient } from '@/lib/supabase/server'
import { formatLargeNumber } from '@/lib/utils'
import { MetricCard } from '@/components/metric-card'
import { ChannelsClient } from './components/channels-client'

/**
 * Channels Listing Page - Figma Design
 *
 * Server Component that fetches benchmark channels from the database
 * with baseline statistics and displays them following the exact Figma design.
 */
export default async function ChannelsPage() {
  const supabase = await createClient()

  // Fetch channels data and metrics in parallel
  const [
    { data: channelsData, error },
    { data: metricsData }
  ] = await Promise.all([
    // Query 1: Get top 100 channels (ordered by benchmark date - most recent first)
    supabase
      .from('benchmark_channels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    // Query 2: Get ALL channels for metrics (parallel)
    supabase
      .from('benchmark_channels')
      .select('channel_id, subscriber_count, video_upload_count, total_views', { count: 'exact' })
  ])

  if (error) {
    console.error('Error fetching channels:', error)
  }

  const totalChannels = metricsData?.length || 0
  const totalSubscribers = metricsData?.reduce((sum: number, ch: any) => sum + (ch.subscriber_count || 0), 0) || 0

  // Get baseline stats for displayed channels AND all channels in parallel
  const channelIds = (channelsData || []).map((c: any) => c.channel_id)

  const [
    { data: baselineStatsData },
    { data: allBaselineStats }
  ] = await Promise.all([
    // Query 3: Baseline stats for displayed channels
    supabase
      .from('benchmark_channels_baseline_stats')
      .select('channel_id, avg_views_per_video_historical, median_views_per_video_historical')
      .in('channel_id', channelIds),
    // Query 4: All baseline stats for metrics
    supabase
      .from('benchmark_channels_baseline_stats')
      .select('channel_id, avg_views_per_video_historical')
  ])

  const baselineStatsMap = new Map(
    (baselineStatsData || []).map((stat: any) => [stat.channel_id, stat])
  )

  const allBaselineStatsMap = new Map(
    (allBaselineStats || []).map((stat: any) => [stat.channel_id, stat])
  )

  // Transform data to camelCase format
  const channels = (channelsData || []).map((channel: any) => {
    const baselineStats = baselineStatsMap.get(channel.channel_id) || {}
    return {
      id: channel.id,
      channelId: channel.channel_id,
      channelName: channel.channel_name,
      handle: channel.custom_url?.replace('@', '') || null, // Extract handle from custom_url
      subscriberCount: channel.subscriber_count,
      totalViews: channel.total_views,
      videoUploadCount: channel.video_upload_count,
      categorization: channel.categorization,
      thumbnailUrl: channel.thumbnail_url,
      isVerified: channel.is_verified,
      country: channel.country,
      createdAt: channel.created_at ? new Date(channel.created_at) : null,
      avgViewsPerVideoHistorical: baselineStats.avg_views_per_video_historical || null,
      medianViewsPerVideoHistorical: baselineStats.median_views_per_video_historical || null,
      engagementRate: null, // TODO: Calculate engagement rate if data available
    }
  })

  // Calculate overall average views per video
  const channelsWithAvg = (metricsData || [])
    .map((ch: any) => {
      const stats = allBaselineStatsMap.get(ch.channel_id)
      return stats?.avg_views_per_video_historical || null
    })
    .filter((avg): avg is number => avg !== null)

  const overallAvgViews = channelsWithAvg.length > 0
    ? Math.round(channelsWithAvg.reduce((sum, avg) => sum + avg, 0) / channelsWithAvg.length)
    : 0

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border px-8 py-6">
        <h1 className="text-2xl font-semibold text-foreground">YouTube Channels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore and analyze YouTube channels across different categories
        </p>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-8 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Channels"
              value={totalChannels.toLocaleString()}
              trend={{
                value: "12% from last month",
                direction: "up",
              }}
            />

            <MetricCard
              label="Total Subscribers"
              value={formatLargeNumber(totalSubscribers)}
              trend={{
                value: "8.3% from last month",
                direction: "up",
              }}
            />

            <MetricCard
              label="Avg. Views"
              value={formatLargeNumber(overallAvgViews)}
              subtitle="per video"
            />

            <MetricCard
              label="Engagement Rate"
              value="4.8%"
              trend={{
                value: "0.5% from last month",
                direction: "down",
              }}
            />
          </div>

          {/* Channels Client - with toolbar, filters, and table/gallery */}
          <ChannelsClient channels={channels} />
        </div>
      </div>
    </div>
  )
}
