'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { triggerManualUpdate } from '../actions'
import { toast } from 'sonner'

interface ManualUpdateButtonProps {
  channelId: string
  channelName?: string
  lastUpdateAt?: string | null
  onSuccess?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

const COOLDOWN_MINUTES = 5

export function ManualUpdateButton({
  channelId,
  channelName,
  lastUpdateAt,
  onSuccess,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: ManualUpdateButtonProps) {
  const [loading, setLoading] = useState(false)

  // Calculate if button should be disabled due to cooldown
  const { canUpdate, timeRemaining } = useMemo(() => {
    if (!lastUpdateAt) {
      return { canUpdate: true, timeRemaining: 0 }
    }

    const lastUpdate = new Date(lastUpdateAt)
    const now = new Date()
    const cooldownMs = COOLDOWN_MINUTES * 60 * 1000
    const timeSinceUpdate = now.getTime() - lastUpdate.getTime()
    const remaining = Math.max(0, cooldownMs - timeSinceUpdate)

    return {
      canUpdate: remaining === 0,
      timeRemaining: Math.ceil(remaining / 60000), // Convert to minutes
    }
  }, [lastUpdateAt])

  const handleUpdate = async () => {
    if (!canUpdate) {
      toast.warning(`Please wait ${timeRemaining} minute(s) before updating again`)
      return
    }

    setLoading(true)

    try {
      toast.info(`Starting update for ${channelName || 'channel'}...`)

      const result = await triggerManualUpdate(channelId)

      if (result.success) {
        if (result.warning) {
          toast.warning(result.warning, {
            description: result.details ? JSON.stringify(result.details) : undefined,
          })
        } else {
          toast.success(`Update started successfully!`, {
            description: 'This may take a few minutes. Check back soon.',
          })
        }
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to trigger update')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = loading || !canUpdate

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUpdate}
      disabled={isDisabled}
      title={
        !canUpdate
          ? `Wait ${timeRemaining} minute(s) before updating again`
          : loading
          ? 'Updating...'
          : 'Update channel data now'
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {loading ? 'Updating...' : !canUpdate ? `Wait ${timeRemaining}m` : 'Update Now'}
        </span>
      )}
    </Button>
  )
}
