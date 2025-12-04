"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { triggerManualUpdate } from "@/app/(dashboard)/benchmark/radar/actions"

interface UpdateMetricsButtonProps {
  channelId: string
  channelName?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
}

/**
 * Button to manually trigger metrics update for a channel.
 * Uses the radar updater pipeline to refresh channel metrics (SocialBlade + outlier calc).
 */
export function UpdateMetricsButton({
  channelId,
  channelName,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: UpdateMetricsButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    const displayName = channelName || channelId

    try {
      toast.loading(`Updating metrics for ${displayName}...`, { id: `update-${channelId}` })

      const result = await triggerManualUpdate(channelId)

      if (result.success) {
        if (result.warning) {
          toast.warning(`${displayName}: ${result.warning}`, { id: `update-${channelId}` })
        } else {
          toast.success(`Metrics updated for ${displayName}`, { id: `update-${channelId}` })
        }
      } else {
        toast.error(`Failed to update ${displayName}: ${result.error}`, { id: `update-${channelId}` })
      }
    } catch (error) {
      toast.error(`Error updating ${displayName}`, { id: `update-${channelId}` })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUpdate}
      disabled={isUpdating}
      title="Update channel metrics"
    >
      <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''} ${showLabel ? 'mr-2' : ''}`} />
      {showLabel && (isUpdating ? "Updating..." : "Update Metrics")}
    </Button>
  )
}
