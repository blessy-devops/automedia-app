/**
 * My Channel Details Page - Individual channel management
 */

import { MyChannelDetailsClient } from '@/features/my-channels/components/my-channel-details-client'
import { createGobbiClient } from '@/lib/supabase/gobbi'
import { mapStructureAccountToChannel } from '@/features/my-channels/lib/adapters'
import { mapBrandBibleToBrandBibleTab, type BrandBibleRow } from '@/features/my-channels/lib/brand-bible-adapter'
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
  let brandBibleData = null

  if (error || !accountData) {
    console.error('Error fetching channel:', error)
    // Fallback to mock data
    channelData = myChannels.find(c => c.id === channelId)
    if (!channelData) {
      notFound()
    }
  } else {
    channelData = mapStructureAccountToChannel(accountData)

    // Fetch brand bible data if brand_id exists
    if (accountData.brand_id) {
      const { data: brandBibleRow, error: brandBibleError } = await supabase
        .from('structure_brand_bible')
        .select('*')
        .eq('id', accountData.brand_id)
        .single()

      if (!brandBibleError && brandBibleRow) {
        brandBibleData = mapBrandBibleToBrandBibleTab(brandBibleRow as BrandBibleRow)
      } else {
        console.error('Error fetching brand bible:', {
          error: brandBibleError,
          brand_id: accountData.brand_id,
          placeholder: accountData.placeholder,
          message: brandBibleError?.message
        })
      }
    }
  }

  return <MyChannelDetailsClient channel={channelData} brandBibleData={brandBibleData} />
}
