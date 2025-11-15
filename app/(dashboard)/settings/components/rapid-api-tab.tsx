'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, Save, ExternalLink, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CredentialCard } from './credential-card'
import { saveRapidApiKey } from '../actions'

interface RapidApiTabProps {
  isConfigured: boolean
}

export function RapidApiTab({ isConfigured: initialConfigured }: RapidApiTabProps) {
  const [open, setOpen] = useState(false)
  const [isConfigured, setIsConfigured] = useState(initialConfigured)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key')
      return
    }

    setIsSubmitting(true)

    const result = await saveRapidApiKey(apiKey)

    if (result.success) {
      toast.success('Rapid API key saved successfully!')
      setIsConfigured(true)
      setOpen(false)
      setApiKey('')
      setShowApiKey(false)
    } else {
      toast.error(`Error saving API key: ${result.error}`)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Rapid API</h3>
        <p className="text-sm text-muted-foreground">
          Configure your Rapid API credentials to access YouTube data and Social Blade
          metrics
        </p>
      </div>

      {/* Credential Card */}
      <CredentialCard
        icon={Key}
        title="Rapid API Key"
        description="Configure your Rapid API key to access YouTube data via RapidAPI"
        isConfigured={isConfigured}
        onConfigure={() => setOpen(true)}
      />

      {/* Info Box */}
      <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              Get your Rapid API Key
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              You need a Rapid API key to access YouTube data and Social Blade metrics. Sign
              up at RapidAPI.com and subscribe to the required APIs.
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-primary"
              onClick={() => window.open('https://rapidapi.com', '_blank')}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Visit RapidAPI.com
            </Button>
          </div>
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isConfigured ? 'Update' : 'Configure'} Rapid API Key
            </DialogTitle>
            <DialogDescription>
              Enter your Rapid API key to access YouTube data and Social Blade metrics
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rapid-api-key">
                API Key <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="rapid-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Enter your Rapid API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={isSubmitting}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showApiKey ? 'Hide' : 'Show'} API key
                  </span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                🔒 Your API key is encrypted and stored securely in Supabase Vault
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!apiKey.trim() || isSubmitting}>
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Credentials
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
