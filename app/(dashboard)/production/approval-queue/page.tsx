import { getPendingTitleApprovals, getPendingThumbnailApprovals } from './actions'
import { TitleApprovalQueue } from './components/title-approval-queue'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ApprovalQueuePage() {
  // Buscar dados pendentes de aprovação em paralelo
  const [pendingTitles, pendingThumbnails] = await Promise.all([
    getPendingTitleApprovals(),
    getPendingThumbnailApprovals()
  ])

  console.log('🎯 [ApprovalQueuePage] Rendering with:')
  console.log('  - Titles:', pendingTitles.length)
  console.log('  - Thumbnails:', pendingThumbnails.length)

  return (
    <TitleApprovalQueue
      initialPendingTitles={pendingTitles}
      initialPendingThumbnails={pendingThumbnails}
    />
  )
}
