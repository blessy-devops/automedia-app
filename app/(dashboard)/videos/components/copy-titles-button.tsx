'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Video } from './columns'

interface CopyTitlesButtonProps {
  videoIds: number[]
  videos: Video[]
  onSuccess?: () => void
}

export function CopyTitlesButton({
  videoIds,
  videos,
  onSuccess
}: CopyTitlesButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    // Filter selected videos and extract titles
    const selectedVideos = videos.filter(v => videoIds.includes(v.id))
    const titles = selectedVideos.map(v => v.title || "Untitled").join('\n')

    try {
      await navigator.clipboard.writeText(titles)
      setCopied(true)

      toast.success("Copied!", {
        description: `${videoIds.length} video title${videoIds.length !== 1 ? 's' : ''} copied to clipboard`
      })

      // Reset check icon after 2 seconds
      setTimeout(() => setCopied(false), 2000)

      onSuccess?.()
    } catch (error) {
      console.error('Failed to copy titles:', error)
      toast.error("Failed to copy", {
        description: "Could not copy titles to clipboard"
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-8"
      disabled={videoIds.length === 0}
    >
      {copied ? (
        <Check className="w-4 h-4 mr-1.5 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 mr-1.5" />
      )}
      Copy Titles
    </Button>
  )
}
