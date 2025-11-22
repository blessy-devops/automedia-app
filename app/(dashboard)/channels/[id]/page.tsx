/**
 * My Channel Details Page - Individual channel management
 */

import { MyChannelDetailsClient } from '@/features/my-channels/components/my-channel-details-client'
import { createGobbiClient } from '@/lib/supabase/gobbi'
import { mapStructureAccountToChannel } from '@/features/my-channels/lib/adapters'
import { myChannels } from '@/features/my-channels/lib/mock-data'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChannelDetailsPage({ params }: PageProps) {
  const { id } = await params
  const channelId = parseInt(id, 10)

  if (isNaN(channelId)) {
    notFound()
  }

  const supabase = createGobbiClient()

  // Fetch channel from database
  const { data: accountData, error } = await supabase
    .from('structure_accounts')
    .select('*')
    .eq('id', channelId)
    .single()

  let channelData

  if (error || !accountData) {
    console.error('Error fetching channel:', error)
    // Fallback to mock data
    channelData = myChannels.find(c => c.id === channelId)
    if (!channelData) {
      notFound()
    }
  } else {
    channelData = mapStructureAccountToChannel(accountData)
  }

  return <MyChannelDetailsClient channel={channelData} />
}
