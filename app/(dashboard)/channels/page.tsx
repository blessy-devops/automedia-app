/**
 * My Channels Page - Manage YouTube channels
 * Connected to Gobbi's production database (structure_accounts table)
 */

import { MyChannelsClient } from '@/features/my-channels/components/my-channels-client'
import { myChannels } from '@/features/my-channels/lib/mock-data'
import { createGobbiClient } from '@/lib/supabase/gobbi'
import { mapStructureAccountsToChannels } from '@/features/my-channels/lib/adapters'

export const dynamic = 'force-dynamic'

export default async function ChannelsPage() {
  const supabase = createGobbiClient()

  // TODO: Add RLS (Row Level Security) policies
  // SECURITY NOTE: Currently no authentication/RLS on structure_accounts
  // Future: Add user_id column and RLS policies to restrict access to own channels only
  // Example RLS policy:
  //   CREATE POLICY "Users can only view their own channels"
  //   ON structure_accounts FOR SELECT
  //   USING (auth.uid() = user_id);

  // Fetch channels from Gobbi's database
  const { data: accountsData, error } = await supabase
    .from('structure_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  let channels

  if (error) {
    console.error('Error fetching channels from database:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    console.log('Using mock data as fallback')

    // Fallback to mock data if query fails
    channels = myChannels
  } else {
    console.log(`Loaded ${accountsData?.length || 0} channels from database`)

    // Map database rows to Channel interface
    channels = mapStructureAccountsToChannels(accountsData || [])

    // If no channels in database, use mock data
    if (channels.length === 0) {
      console.log('No channels in database, using mock data')
      channels = myChannels
    }
  }

  return <MyChannelsClient channels={channels} />
}
