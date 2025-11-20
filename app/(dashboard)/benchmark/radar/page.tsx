import { getRadarChannels } from './actions'
import { RadarChannelsTable } from './components/radar-channels-table'
import { RadarChannelsGallery } from './components/radar-channels-gallery'
import { RadarPageClient } from './radar-page-client'

/**
 * Channel Radar Page
 *
 * Displays all channels being actively monitored with daily automated updates.
 * Features:
 * - Table and Gallery views
 * - Real-time updates via Supabase Realtime
 * - Manual update triggers
 * - Add/remove channels from radar
 * - Monitoring duration tracking
 * - 10x outlier indicators
 */
export default async function RadarPage() {
  // Fetch radar channels server-side
  const result = await getRadarChannels()

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Channel Radar</h1>
              <p className="text-muted-foreground mt-2">
                Monitor channels with daily automated updates
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/20">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Failed to load radar channels</p>
              <p className="text-sm text-destructive">{result.error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <RadarPageClient initialChannels={result.data} />
}
