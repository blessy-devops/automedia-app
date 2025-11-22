/**
 * My Channels Page - Manage YouTube channels
 */

import { MyChannelsClient } from '@/features/my-channels/components/my-channels-client'
import { myChannels } from '@/features/my-channels/lib/mock-data'

export const dynamic = 'force-dynamic'

export default async function ChannelsPage() {
  // TODO: Fetch real data from Gobbi's database
  // For now, using mock data
  const channels = myChannels

  return <MyChannelsClient channels={channels} />
}
