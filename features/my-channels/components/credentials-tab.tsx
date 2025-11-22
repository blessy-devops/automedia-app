'use client'

/**
 * Credentials Tab Component
 * Manages OAuth tokens and Keep-Alive CRON automation
 */

import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  Key,
  Shield,
  Clock,
  Play,
  Edit,
  RefreshCw,
  Cable,
  Activity,
  FileText,
  Pause,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CredentialsTabProps {
  channelId: number
}

export function CredentialsTab({ channelId }: CredentialsTabProps) {
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [showRefreshToken, setShowRefreshToken] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [keepAliveEnabled, setKeepAliveEnabled] = useState(true)
  const [frequency, setFrequency] = useState('30')

  // Mock data - em produção viria do Supabase
  const credentials = {
    status: 'active' as 'active' | 'expired' | 'error',
    accessToken: 'ya29.a0AfH6SMBxQf8zKj3L9mN2pO7R4sT6uV8wX1yZ...',
    accessTokenExpiry: new Date(Date.now() + 45 * 60 * 1000),
    refreshToken: '1//0gHd8sF9jK3lMCgYIARAAGBASNwF-L9Ir...',
    lastUsed: new Date(Date.now() - 3 * 60 * 1000),
    createdAt: new Date('2025-01-15'),
    scopes: ['youtube.readonly', 'youtube.upload', 'youtube.force-ssl'],
    keepAlive: {
      status: 'running' as 'running' | 'paused' | 'error',
      frequency: 30,
      lastPing: new Date(Date.now() - 15 * 60 * 1000),
      nextPing: new Date(Date.now() + 15 * 60 * 1000),
      successRate: 99.8,
      totalPings: 1247,
      failedPings: 2,
      lastError: null,
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          badge: 'Active',
          icon: <CheckCircle2 className="w-4 h-4" />,
          className: 'bg-green-500/10 text-green-500 border-green-500/20'
        }
      case 'expired':
        return {
          badge: 'Expired',
          icon: <AlertCircle className="w-4 h-4" />,
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        }
      case 'error':
        return {
          badge: 'Error',
          icon: <XCircle className="w-4 h-4" />,
          className: 'bg-red-500/10 text-red-500 border-red-500/20'
        }
      default:
        return {
          badge: 'Unknown',
          icon: <AlertCircle className="w-4 h-4" />,
          className: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }
  }

  const statusConfig = getStatusConfig(credentials.status)
  const keepAliveStatusConfig = getStatusConfig(credentials.keepAlive.status)

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const formatCountdown = (date: Date) => {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'expires now'
    if (diffMins < 60) return `${diffMins}m`
    return `${diffHours}h ${diffMins % 60}m`
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-1">OAuth Credentials</h2>
          <p className="text-sm text-muted-foreground">
            Manage YouTube API access tokens and keep-alive automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="w-4 h-4" />
            Test
          </Button>
          <Sheet open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Edit Credentials</SheetTitle>
                <SheetDescription>
                  Update OAuth tokens and keep-alive settings
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Re-authenticate Section */}
                <div className="space-y-3">
                  <Label>OAuth Authentication</Label>
                  <Button variant="outline" className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Re-authenticate with Google
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Opens Google OAuth flow to generate new tokens
                  </p>
                </div>

                {/* Manual Token Entry */}
                <div className="space-y-3">
                  <Label htmlFor="access-token">Access Token</Label>
                  <Input
                    id="access-token"
                    type="password"
                    defaultValue={credentials.accessToken}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste manually if needed
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="refresh-token">Refresh Token</Label>
                  <Input
                    id="refresh-token"
                    type="password"
                    defaultValue={credentials.refreshToken}
                  />
                </div>

                {/* Keep-Alive Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <Label>Keep-Alive Settings</Label>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="keep-alive-toggle" className="text-sm font-normal">
                        Enable Keep-Alive
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Auto-refresh token every interval
                      </p>
                    </div>
                    <Switch
                      id="keep-alive-toggle"
                      checked={keepAliveEnabled}
                      onCheckedChange={setKeepAliveEnabled}
                    />
                  </div>

                  {keepAliveEnabled && (
                    <div className="space-y-3">
                      <Label htmlFor="frequency">Ping Frequency</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger id="frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every 1 hour</SelectItem>
                          <SelectItem value="120">Every 2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="space-y-3 pt-4 border-t border-destructive/20">
                  <Label className="text-destructive">Danger Zone</Label>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="w-4 h-4" />
                    Revoke Credentials
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Credentials */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Credential Status
                </CardTitle>
                <Badge className={`gap-1.5 ${statusConfig.className}`}>
                  {statusConfig.icon}
                  {statusConfig.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{credentials.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Used</span>
                <span>{formatRelativeTime(credentials.lastUsed)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scopes</span>
                <span className="text-xs text-muted-foreground">{credentials.scopes.length} granted</span>
              </div>
            </CardContent>
          </Card>

          {/* Tokens */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Access Token */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Access Token</Label>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="w-3 h-3" />
                      {formatCountdown(credentials.accessTokenExpiry)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                    >
                      {showAccessToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(credentials.accessToken)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                  {showAccessToken ? credentials.accessToken : '••••••••••••••••••••••••••••••••'}
                </code>
              </div>

              {/* Refresh Token */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Refresh Token</Label>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      Valid
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowRefreshToken(!showRefreshToken)}
                    >
                      {showRefreshToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(credentials.refreshToken)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <code className="block text-xs bg-muted p-2 rounded font-mono break-all">
                  {showRefreshToken ? credentials.refreshToken : '••••••••••••••••••••••••••••••••'}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Keep-Alive */}
        <div className="space-y-6">
          {/* Keep-Alive Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cable className="w-4 h-4 text-primary" />
                  Keep-Alive CRON
                </CardTitle>
                <Badge className={`gap-1.5 ${keepAliveStatusConfig.className}`}>
                  {keepAliveStatusConfig.icon}
                  {keepAliveStatusConfig.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">Frequency</div>
                  <div className="text-sm font-medium">{credentials.keepAlive.frequency}min</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                  <div className="text-sm font-medium text-green-500">
                    {credentials.keepAlive.successRate}%
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Ping</span>
                  <span>{formatRelativeTime(credentials.keepAlive.lastPing)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next Ping</span>
                  <span className="text-green-500">{formatRelativeTime(credentials.keepAlive.nextPing)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Pings</span>
                  <span>
                    {credentials.keepAlive.totalPings.toLocaleString()}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({credentials.keepAlive.failedPings} failed)
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Force Ping
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activity
                </CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 h-8">
                  <FileText className="w-3.5 h-3.5" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { time: '15m ago', action: 'Keep-alive ping', status: 'success' },
                  { time: '45m ago', action: 'Keep-alive ping', status: 'success' },
                  { time: '1h ago', action: 'Token refresh', status: 'success' },
                  { time: '3h ago', action: 'Keep-alive ping', status: 'success' },
                  { time: '5h ago', action: 'API call', status: 'success' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-muted-foreground">{log.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Implementation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-0.5">Supabase Edge Function</div>
                  <code className="text-muted-foreground">supabase/functions/credential-keep-alive/</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-0.5">API Endpoint</div>
                  <code className="text-muted-foreground">GET youtube.com/api/v3/channels?mine=true</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-0.5">Database</div>
                  <code className="text-muted-foreground">credential_keep_alive_logs</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
