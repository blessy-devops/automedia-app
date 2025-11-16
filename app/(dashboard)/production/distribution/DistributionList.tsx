'use client'

import { useState } from 'react'
import { VideoDistributionCard } from '@/components/production/VideoDistributionCard'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DistributionListProps {
  initialVideos: Array<{
    id: number
    title: string
    description?: string | null
    categorization: {
      niche: string
      subniche: string
      microniche?: string
      category?: string
      format?: string
    }
    video_transcript?: string | null
    youtube_video_id: string
    youtube_url: string
    benchmark_channels?: {
      channel_title: string
      channel_handle: string
    }
    eligibleChannels: Array<{
      unique_profile_id: string
      placeholder: string
      niche: string
      subniche: string
      language?: string
      structure_brand_bible?: Array<{
        brand_identity?: Record<string, any>
        production_workflow_id?: string
      }>
    }>
  }>
}

export function DistributionList({ initialVideos }: DistributionListProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleDistributeSuccess = () => {
    // Refresh the page to update the list
    router.refresh()
  }

  if (initialVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed">
        <div className="text-center space-y-4 p-8">
          <div className="text-4xl">✅</div>
          <h3 className="text-lg font-medium">All videos distributed!</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No videos are currently awaiting channel selection. All benchmark videos have been
            distributed to production channels.
          </p>
          <Button variant="outline" onClick={() => router.push('/production/videos')}>
            Go to Production Queue →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Videos Awaiting Distribution</h2>
          <p className="text-sm text-muted-foreground">
            Select destination channels for {initialVideos.length} video
            {initialVideos.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Video cards */}
      <div className="space-y-4">
        {initialVideos.map((video) => (
          <VideoDistributionCard
            key={video.id}
            video={video}
            onDistributeSuccess={handleDistributeSuccess}
          />
        ))}
      </div>
    </div>
  )
}
