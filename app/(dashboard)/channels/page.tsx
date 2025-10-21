import { db } from '@/lib/drizzle'
import { benchmarkChannelsTable } from '@/lib/drizzle'
import { ChannelsDataTable } from './components/channels-data-table'
import { columns } from './components/columns'

/**
 * Channels Listing Page
 *
 * Server Component that fetches all benchmark channels from the database
 * and displays them in an interactive data table with sorting, filtering,
 * and pagination capabilities.
 */
export default async function ChannelsPage() {
  // Fetch all channels from the database
  const channels = await db
    .select({
      id: benchmarkChannelsTable.id,
      channelId: benchmarkChannelsTable.channelId,
      channelName: benchmarkChannelsTable.channelName,
      subscriberCount: benchmarkChannelsTable.subscriberCount,
      totalViews: benchmarkChannelsTable.totalViews,
      videoUploadCount: benchmarkChannelsTable.videoUploadCount,
      categorization: benchmarkChannelsTable.categorization,
      thumbnailUrl: benchmarkChannelsTable.thumbnailUrl,
      isVerified: benchmarkChannelsTable.isVerified,
      country: benchmarkChannelsTable.country,
    })
    .from(benchmarkChannelsTable)
    .orderBy(benchmarkChannelsTable.subscriberCount)

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          YouTube Channels
        </h1>
        <p className="text-muted-foreground text-lg">
          Browse and analyze enriched YouTube channel data
        </p>
      </div>

      <ChannelsDataTable columns={columns} data={channels} />
    </div>
  )
}
