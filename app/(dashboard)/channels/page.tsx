import { createClient } from '@/lib/supabase/server'
import { formatLargeNumber } from '@/lib/utils'
import { SimpleMetricCard } from './components/simple-metric-card'
import { ChannelsClient } from './components/channels-client'

/**
 * Channels Listing Page - Figma Design
 *
 * Server Component that fetches benchmark channels from the database
 * with baseline statistics and displays them following the exact Figma design.
 */
export default async function ChannelsPage() {
  const supabase = await createClient()

  // Fetch channels data
  let query = supabase
    .from('benchmark_channels')
    .select('*')
    .order('subscriber_count', { ascending: false })
    .limit(100)

  const { data: channelsData, error } = await query

  if (error) {
    console.error('Error fetching channels:', error)
  }

  // Get baseline stats separately
  const channelIds = (channelsData || []).map((c: any) => c.channel_id)
  const { data: baselineStatsData } = await supabase
    .from('benchmark_channels_baseline_stats')
    .select('channel_id, avg_views_per_video_historical, median_views_per_video_historical')
    .in('channel_id', channelIds)

  const baselineStatsMap = new Map(
    (baselineStatsData || []).map((stat: any) => [stat.channel_id, stat])
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

  // Calculate metrics from ALL channels in database
  const { data: metricsData } = await supabase
    .from('benchmark_channels')
    .select('channel_id, subscriber_count, video_upload_count, total_views', { count: 'exact' })

  const totalChannels = metricsData?.length || 0
  const totalSubscribers = metricsData?.reduce((sum: number, ch: any) => sum + (ch.subscriber_count || 0), 0) || 0

  // Get all baseline stats for metrics calculation
  const { data: allBaselineStats } = await supabase
    .from('benchmark_channels_baseline_stats')
    .select('channel_id, avg_views_per_video_historical')

  const allBaselineStatsMap = new Map(
    (allBaselineStats || []).map((stat: any) => [stat.channel_id, stat])
  )

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
            <SimpleMetricCard
              label="Total Channels"
              value={totalChannels.toLocaleString()}
              trend={{
                value: "12% from last month",
                direction: "up",
              }}
            />

            <SimpleMetricCard
              label="Total Subscribers"
              value={formatLargeNumber(totalSubscribers)}
              trend={{
                value: "8.3% from last month",
                direction: "up",
              }}
            />

            <SimpleMetricCard
              label="Avg. Views"
              value={formatLargeNumber(overallAvgViews)}
              subtitle="per video"
            />

            <SimpleMetricCard
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
