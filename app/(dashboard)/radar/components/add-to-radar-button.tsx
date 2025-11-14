'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Radar, Check } from 'lucide-react'
import { addChannelToRadar } from '../actions'
import { toast } from 'sonner'

interface AddToRadarButtonProps {
  channelId: string
  channelName?: string
  isInRadar?: boolean
  onSuccess?: () => void
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function AddToRadarButton({
  channelId,
  channelName,
  isInRadar = false,
  onSuccess,
  variant = 'default',
  size = 'default',
  showLabel = true,
}: AddToRadarButtonProps) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(isInRadar)

  const handleAdd = async () => {
    if (added) {
      // Already in radar, just show a message
      toast.info('Channel is already in radar')
      return
    }

    setLoading(true)

    try {
      const result = await addChannelToRadar(channelId)

      if (result.success) {
        setAdded(true)
        toast.success('Channel added to radar!', {
          description: `${channelName || 'Channel'} will be updated daily at 6 AM`,
        })
        onSuccess?.()
      } else {
        // Check if already exists error
        if (result.error?.includes('already in radar')) {
          setAdded(true)
          toast.info('Channel is already in radar')
        } else {
          toast.error(result.error || 'Failed to add channel to radar')
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (added) {
    return (
      <Button variant="outline" size={size} disabled>
        <Check className="h-4 w-4" />
        {showLabel && <span className="ml-2">In Radar</span>}
      </Button>
    )
  }

  return (
    <Button variant={variant} size={size} onClick={handleAdd} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Radar className="h-4 w-4" />
      )}
      {showLabel && <span className="ml-2">{loading ? 'Adding...' : 'Add to Radar'}</span>}
    </Button>
  )
}
