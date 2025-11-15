'use client'

import { type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CredentialCardProps {
  icon: LucideIcon
  title: string
  description?: string
  isConfigured: boolean
  onConfigure: () => void
  className?: string
}

export function CredentialCard({
  icon: Icon,
  title,
  description,
  isConfigured,
  onConfigure,
  className,
}: CredentialCardProps) {
  if (isConfigured) {
    return (
      <Card className={className}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground">
                  ••••••••••••••••••••••••••••••••
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Configured
              </Badge>
              <Button variant="outline" size="sm" onClick={onConfigure}>
                Update
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          No API Key Configured
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {description || `Configure your ${title} to enable this feature`}
        </p>
        <Button onClick={onConfigure}>Configure</Button>
      </div>
    </div>
  )
}
