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
      <div className="container max-w-7xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading videos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-8">
      <DistributionList initialVideos={videos} />
    </div>
  )
}
