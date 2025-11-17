import { getVideosAwaitingDistribution } from './actions'
import { DistributionList } from './DistributionList'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Production Distribution | AutoMedia',
  description: 'Select destination channels for benchmark videos',
}

export default async function ProductionDistributionPage() {
  const { videos, error } = await getVideosAwaitingDistribution()

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
        <h1 className="text-foreground">Videos Awaiting Distribution</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select destination channels for {videos.length} video{videos.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="p-8">
        <DistributionList initialVideos={videos} />
      </div>
    </div>
  )
}
