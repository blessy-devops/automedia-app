'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { bulkDeleteVideos } from '../actions'

interface BulkDeleteVideosDialogProps {
  videoIds: number[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BulkDeleteVideosDialog({
  videoIds,
  open,
  onOpenChange,
  onSuccess,
}: BulkDeleteVideosDialogProps) {
  const handleDelete = async () => {
    if (videoIds.length === 0) {
      toast.error('No videos selected')
      return
    }

    const videoCount = videoIds.length

    // Close dialog immediately
    onOpenChange(false)

    // Show loading toast
    toast.loading(`Deleting ${videoCount} video${videoCount > 1 ? 's' : ''}...`, { id: 'bulk-delete-videos' })

    // Delete in background
    try {
      const result = await bulkDeleteVideos(videoIds)

      if (result.success && result.data) {
        const { deleted, failed, errors } = result.data

        if (deleted > 0 && failed === 0) {
          toast.success(`Successfully deleted ${deleted} video${deleted > 1 ? 's' : ''}`, { id: 'bulk-delete-videos' })
        } else if (deleted > 0 && failed > 0) {
          toast.warning(
            `Deleted ${deleted} video${deleted > 1 ? 's' : ''}, but ${failed} failed. Check console for details.`,
            { id: 'bulk-delete-videos' }
          )
          console.error('Bulk delete errors:', errors)
        } else {
          toast.error(`Failed to delete videos: ${errors[0] || 'Unknown error'}`, { id: 'bulk-delete-videos' })
        }

        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to delete videos', { id: 'bulk-delete-videos' })
      }
    } catch (error) {
      console.error('Error deleting videos:', error)
      toast.error('Failed to delete videos', { id: 'bulk-delete-videos' })
    }
  }

  const videoCount = videoIds.length

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete {videoCount} Video{videoCount > 1 ? 's' : ''}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {videoCount} selected video{videoCount > 1 ? 's' : ''}
              </span>
              ?
            </p>

            <p className="text-sm text-muted-foreground">
              This will also remove these videos from any folders they're in.
            </p>

            <p className="text-sm text-destructive font-medium">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete {videoCount} Video{videoCount > 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
