/**
 * Retry Configuration Dialog
 * Modal for configuring retry policies for jobs
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RetryStrategy, JobType } from '../types'
import { toast } from 'sonner'

interface RetryConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobType?: JobType
  onSave?: (config: RetryConfig) => void
}

export interface RetryConfig {
  strategy: RetryStrategy
  maxAttempts: number
  retryInterval: string
  retryOnErrors: string[]
}

export function RetryConfigDialog({
  open,
  onOpenChange,
  jobType,
  onSave,
}: RetryConfigDialogProps) {
  const [strategy, setStrategy] = useState<RetryStrategy>('exponential')
  const [maxAttempts, setMaxAttempts] = useState('3')
  const [retryInterval, setRetryInterval] = useState('5min')
  const [retryOnErrors, setRetryOnErrors] = useState<string[]>([
    '429',
    '408',
    '5xx',
  ])

  const handleToggleError = (error: string) => {
    setRetryOnErrors((prev) =>
      prev.includes(error)
        ? prev.filter((e) => e !== error)
        : [...prev, error]
    )
  }

  const handleSave = () => {
    const config: RetryConfig = {
      strategy,
      maxAttempts: parseInt(maxAttempts),
      retryInterval,
      retryOnErrors,
    }

    if (onSave) {
      onSave(config)
    }

    toast.success('Retry configuration saved successfully')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Retry Configuration</DialogTitle>
          {jobType && (
            <p className="text-sm text-muted-foreground">
              Job Type: {jobType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Retry Strategy */}
          <div className="space-y-3">
            <Label>Retry Strategy</Label>
            <RadioGroup value={strategy} onValueChange={(value) => setStrategy(value as RetryStrategy)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="font-normal cursor-pointer">
                  No Retry
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Fixed Interval
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exponential" id="exponential" />
                <Label htmlFor="exponential" className="font-normal cursor-pointer">
                  Exponential Backoff
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  Custom
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Max Attempts */}
          <div className="space-y-2">
            <Label htmlFor="maxAttempts">Max Attempts</Label>
            <Select value={maxAttempts} onValueChange={setMaxAttempts}>
              <SelectTrigger id="maxAttempts">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Retry Interval */}
          {strategy !== 'none' && (
            <div className="space-y-2">
              <Label htmlFor="retryInterval">
                {strategy === 'exponential' ? 'Initial Retry Interval' : 'Retry Interval'}
              </Label>
              <Select value={retryInterval} onValueChange={setRetryInterval}>
                <SelectTrigger id="retryInterval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1min">1 minute</SelectItem>
                  <SelectItem value="5min">5 minutes</SelectItem>
                  <SelectItem value="10min">10 minutes</SelectItem>
                  <SelectItem value="30min">30 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Retry on Errors */}
          <div className="space-y-3">
            <Label>Retry on Errors</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="error-429"
                  checked={retryOnErrors.includes('429')}
                  onCheckedChange={() => handleToggleError('429')}
                />
                <Label htmlFor="error-429" className="font-normal cursor-pointer">
                  Rate Limit (429)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="error-408"
                  checked={retryOnErrors.includes('408')}
                  onCheckedChange={() => handleToggleError('408')}
                />
                <Label htmlFor="error-408" className="font-normal cursor-pointer">
                  Timeout (408)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="error-5xx"
                  checked={retryOnErrors.includes('5xx')}
                  onCheckedChange={() => handleToggleError('5xx')}
                />
                <Label htmlFor="error-5xx" className="font-normal cursor-pointer">
                  Server Error (5xx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="error-4xx"
                  checked={retryOnErrors.includes('4xx')}
                  onCheckedChange={() => handleToggleError('4xx')}
                />
                <Label htmlFor="error-4xx" className="font-normal cursor-pointer">
                  Client Error (4xx)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
