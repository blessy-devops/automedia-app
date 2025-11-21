/**
 * API Queue Page - Pixel-perfect Figma replication
 */

import { ApiQueueClient } from './client'
import { mockImageJobs, mockAudioJobs, mockVideoJobs, getMockStats } from '@/features/api-queue/lib/mock-data'

export default function ApiQueuePage() {
  const stats = getMockStats()
  const failedJobs = [...mockImageJobs, ...mockAudioJobs, ...mockVideoJobs].filter(
    job => job.status === 'failed'
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-[1600px]">
        <ApiQueueClient
          stats={stats}
          imageJobs={mockImageJobs}
          audioJobs={mockAudioJobs}
          videoJobs={mockVideoJobs}
          failedJobs={failedJobs}
        />
      </div>
    </div>
  )
}
