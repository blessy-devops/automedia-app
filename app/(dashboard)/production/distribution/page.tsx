import { getVideosAwaitingDistribution, getDistributedVideos } from './actions'
import { DistributionList } from './DistributionList'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Production Distribution | AutoMedia',
  description: 'Select destination channels for benchmark videos',
}

export default async function ProductionDistributionPage() {
  // Fetch both pending and distributed videos in parallel
  const [pendingResult, distributedResult] = await Promise.all([
    getVideosAwaitingDistribution(),
    getDistributedVideos(),
  ])

  const { videos, error } = pendingResult
  const { videos: distributedVideos, error: distributedError } = distributedResult

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-8 py-5">
          <h1 className="text-foreground">Videos Awaiting Distribution</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select destination channels for benchmark videos
          </p>
        </div>
        <div className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading videos</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-8 py-5">
        <h1 className="text-foreground">Production Distribution</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage video distribution to production channels
        </p>
      </div>
      <div className="p-8">
        <DistributionList
          initialVideos={videos}
          initialDistributedVideos={distributedVideos}
        />
      </div>
    </div>
  )
}
