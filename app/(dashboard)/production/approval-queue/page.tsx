import {
  getPendingTitleApprovals,
  getPendingThumbnailApprovals,
  getPendingContentApprovals,
  getTitleApprovalHistory,
  getThumbnailApprovalHistory,
  getContentApprovalHistory
} from './actions'
import { TitleApprovalQueue } from './components/title-approval-queue'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ApprovalQueuePage() {
  // Buscar dados pendentes e histórico em paralelo
  const [pendingTitles, pendingThumbnails, pendingContent, titleHistory, thumbnailHistory, contentHistory] = await Promise.all([
    getPendingTitleApprovals(),
    getPendingThumbnailApprovals(),
    getPendingContentApprovals(),
    getTitleApprovalHistory(),
    getThumbnailApprovalHistory(),
    getContentApprovalHistory()
  ])

  console.log('🎯 [ApprovalQueuePage] Rendering with:')
  console.log('  - Pending Titles:', pendingTitles.length)
  console.log('  - Pending Thumbnails:', pendingThumbnails.length)
  console.log('  - Pending Content:', pendingContent.length)
  console.log('  - Title History:', titleHistory.length)
  console.log('  - Thumbnail History:', thumbnailHistory.length)
  console.log('  - Content History:', contentHistory.length)

  return (
    <TitleApprovalQueue
      initialPendingTitles={pendingTitles}
      initialPendingThumbnails={pendingThumbnails}
      initialPendingContent={pendingContent}
      initialTitleHistory={titleHistory}
      initialThumbnailHistory={thumbnailHistory}
      initialContentHistory={contentHistory}
    />
  )
}
