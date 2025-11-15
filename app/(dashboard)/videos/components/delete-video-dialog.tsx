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
import { deleteVideo } from '../actions'

interface DeleteVideoDialogProps {
  video: {
    id: number
    title: string | null
    youtubeVideoId: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteVideoDialog({
  video,
  open,
  onOpenChange,
  onSuccess,
}: DeleteVideoDialogProps) {
  const handleDelete = async () => {
    if (!video) return

    // Close dialog immediately
    onOpenChange(false)

    // Show loading toast
    toast.loading(`Deleting "${video.title || 'video'}"...`, { id: 'delete-video' })

    // Delete in background
    try {
      const result = await deleteVideo(video.id)

      if (result.success) {
        toast.success(`Video "${video.title || 'Unknown'}" deleted successfully`, { id: 'delete-video' })
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to delete video', { id: 'delete-video' })
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      toast.error('Failed to delete video', { id: 'delete-video' })
    }
  }

  if (!video) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {video.title || 'this video'}
              </span>
              ?
            </p>

            <p className="text-sm text-muted-foreground">
              This will also remove the video from any folders it's in.
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
            Delete Video
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
