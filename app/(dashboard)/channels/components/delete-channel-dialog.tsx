'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { deleteChannel, getChannelDependencies } from '../actions'

interface DeleteChannelDialogProps {
  channel: {
    id: number
    channelName: string | null
    channelId: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteChannelDialog({
  channel,
  open,
  onOpenChange,
  onSuccess,
}: DeleteChannelDialogProps) {
  const [forceDelete, setForceDelete] = useState(false)
  const [isLoadingDeps, setIsLoadingDeps] = useState(false)
  const [dependencies, setDependencies] = useState<{
    videosCount: number
    baselineStatsCount: number
    radarEntriesCount: number
    hasAnyDependencies: boolean
  } | null>(null)

  // Load dependencies when dialog opens
  useEffect(() => {
    if (open && channel) {
      loadDependencies()
    } else {
      // Reset state when dialog closes
      setDependencies(null)
      setForceDelete(false)
    }
  }, [open, channel])

  const loadDependencies = async () => {
    if (!channel) return

    setIsLoadingDeps(true)
    try {
      const result = await getChannelDependencies(channel.channelId)
      if (result.success && result.data) {
        setDependencies(result.data)
      } else {
        toast.error('Failed to load channel dependencies')
      }
    } catch (error) {
      console.error('Error loading dependencies:', error)
      toast.error('Failed to load channel dependencies')
    } finally {
      setIsLoadingDeps(false)
    }
  }

  const handleDelete = async () => {
    if (!channel) return

    // If has dependencies and force delete is not checked, show error
    if (dependencies?.hasAnyDependencies && !forceDelete) {
      toast.error('Please confirm cascade delete by checking the checkbox')
      return
    }

    // Close dialog immediately
    onOpenChange(false)

    // Show loading toast
    toast.loading(`Deleting "${channel.channelName || 'channel'}"...`, { id: 'delete-channel' })

    // Delete in background
    try {
      const result = await deleteChannel(channel.id, forceDelete)

      if (result.success) {
        toast.success(`Channel "${channel.channelName || 'Unknown'}" deleted successfully`, { id: 'delete-channel' })
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to delete channel', { id: 'delete-channel' })
      }
    } catch (error) {
      console.error('Error deleting channel:', error)
      toast.error('Failed to delete channel', { id: 'delete-channel' })
    }
  }

  if (!channel) return null

  const hasDependencies = dependencies?.hasAnyDependencies
  const canDelete = !hasDependencies || forceDelete

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {channel.channelName || 'this channel'}
              </span>
              ?
            </p>

            {isLoadingDeps && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking dependencies...</span>
              </div>
            )}

            {!isLoadingDeps && hasDependencies && (
              <div className="rounded-md bg-destructive/10 p-3 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Warning: This channel has related data
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {dependencies.videosCount > 0 && (
                    <li>• {dependencies.videosCount} video{dependencies.videosCount > 1 ? 's' : ''}</li>
                  )}
                  {dependencies.baselineStatsCount > 0 && (
                    <li>
                      • {dependencies.baselineStatsCount} baseline stat
                      {dependencies.baselineStatsCount > 1 ? 's' : ''}
                    </li>
                  )}
                  {dependencies.radarEntriesCount > 0 && (
                    <li>
                      • {dependencies.radarEntriesCount} radar entr
                      {dependencies.radarEntriesCount > 1 ? 'ies' : 'y'}
                    </li>
                  )}
                </ul>
                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="force-delete"
                    checked={forceDelete}
                    onCheckedChange={(checked) => setForceDelete(checked as boolean)}
                  />
                  <Label
                    htmlFor="force-delete"
                    className="text-sm font-normal cursor-pointer leading-tight"
                  >
                    Delete channel and all related data (videos, baseline stats, radar entries)
                  </Label>
                </div>
              </div>
            )}

            {!isLoadingDeps && !hasDependencies && (
              <p className="text-sm text-muted-foreground">
                This channel has no related data and can be safely deleted.
              </p>
            )}

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
            disabled={isLoadingDeps || !canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Channel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
