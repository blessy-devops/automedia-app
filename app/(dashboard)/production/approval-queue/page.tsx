import {
  getPendingTitleApprovals,
  getPendingThumbnailApprovals,
  getTitleApprovalHistory,
  getThumbnailApprovalHistory
} from './actions'
import { TitleApprovalQueue } from './components/title-approval-queue'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ApprovalQueuePage() {
  // Buscar dados pendentes e histórico em paralelo
  const [pendingTitles, pendingThumbnails, titleHistory, thumbnailHistory] = await Promise.all([
    getPendingTitleApprovals(),
    getPendingThumbnailApprovals(),
    getTitleApprovalHistory(),
    getThumbnailApprovalHistory()
  ])

  console.log('🎯 [ApprovalQueuePage] Rendering with:')
  console.log('  - Pending Titles:', pendingTitles.length)
  console.log('  - Pending Thumbnails:', pendingThumbnails.length)
  console.log('  - Title History:', titleHistory.length)
  console.log('  - Thumbnail History:', thumbnailHistory.length)

  return (
    <TitleApprovalQueue
      initialPendingTitles={pendingTitles}
      initialPendingThumbnails={pendingThumbnails}
      initialTitleHistory={titleHistory}
      initialThumbnailHistory={thumbnailHistory}
    />
  )
}
