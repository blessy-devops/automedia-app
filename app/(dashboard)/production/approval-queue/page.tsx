import { getPendingTitleApprovals } from './actions'
import { TitleApprovalQueue } from './components/title-approval-queue'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ApprovalQueuePage() {
  // Buscar títulos pendentes de aprovação
  const pendingTitles = await getPendingTitleApprovals()

  console.log('🎯 [ApprovalQueuePage] Rendering with titles:', pendingTitles.length)

  return <TitleApprovalQueue initialPendingTitles={pendingTitles} />
}
