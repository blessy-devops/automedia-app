'use client'

import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { bulkDeleteChannels } from '../actions'

interface BulkDeleteChannelsDialogProps {
  channelIds: number[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BulkDeleteChannelsDialog({
  channelIds,
  open,
  onOpenChange,
  onSuccess,
}: BulkDeleteChannelsDialogProps) {
  const [cascade, setCascade] = useState(false)

  const handleDelete = async () => {
    if (channelIds.length === 0) {
      toast.error('No channels selected')
      return
    }

    const channelCount = channelIds.length

    // Close dialog immediately
    onOpenChange(false)

    // Show loading toast
    toast.loading(`Deleting ${channelCount} channel${channelCount > 1 ? 's' : ''}...`, { id: 'bulk-delete-channels' })

    // Delete in background
    try {
      const result = await bulkDeleteChannels(channelIds, cascade)

      if (result.success && result.data) {
        const { deleted, failed, errors } = result.data

        if (deleted > 0 && failed === 0) {
          toast.success(`Successfully deleted ${deleted} channel${deleted > 1 ? 's' : ''}`, { id: 'bulk-delete-channels' })
        } else if (deleted > 0 && failed > 0) {
          toast.warning(
            `Deleted ${deleted} channel${deleted > 1 ? 's' : ''}, but ${failed} failed. Check console for details.`,
            { id: 'bulk-delete-channels' }
          )
          console.error('Bulk delete errors:', errors)
        } else {
          toast.error(`Failed to delete channels: ${errors[0] || 'Unknown error'}`, { id: 'bulk-delete-channels' })
        }

        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to delete channels', { id: 'bulk-delete-channels' })
      }
    } catch (error) {
      console.error('Error deleting channels:', error)
      toast.error('Failed to delete channels', { id: 'bulk-delete-channels' })
    }
  }

  const channelCount = channelIds.length

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete {channelCount} Channel{channelCount > 1 ? 's' : ''}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {channelCount} selected channel{channelCount > 1 ? 's' : ''}
              </span>
              ?
            </p>

            <div className="rounded-md bg-destructive/10 p-3 space-y-2">
              <p className="text-sm font-medium text-destructive">
                Warning: Some channels may have related data
              </p>
              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="cascade-delete"
                  checked={cascade}
                  onCheckedChange={(checked) => setCascade(checked as boolean)}
                />
                <Label
                  htmlFor="cascade-delete"
                  className="text-sm font-normal cursor-pointer leading-tight"
                >
                  Delete all related data (videos, baseline stats, radar entries) for each channel
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                If unchecked, channels with related data will not be deleted and will be reported as failed.
              </p>
            </div>

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
            Delete {channelCount} Channel{channelCount > 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
