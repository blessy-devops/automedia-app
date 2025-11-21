/**
 * Rate Limits Panel
 * Displays API rate limit usage and warnings
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { RateLimit } from '../types'
import {
  formatTimeUntil,
  getRateLimitColor,
  getRateLimitSeverity,
} from '../lib/utils'

interface RateLimitsPanelProps {
  rateLimits: RateLimit[]
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function RateLimitsPanel({
  rateLimits,
  onRefresh,
  isRefreshing = false,
}: RateLimitsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Rate Limits</h3>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        )}
      </div>

      {/* Rate Limit Cards */}
      <div className="space-y-4">
        {rateLimits.map((rateLimit) => {
          const severity = getRateLimitSeverity(rateLimit.quotaPercentage)
          const isCritical = severity === 'critical'
          const isDanger = severity === 'danger'

          return (
            <Card
              key={rateLimit.apiProvider}
              className={`${
                isCritical
                  ? 'border-red-500 dark:border-red-900'
                  : isDanger
                  ? 'border-orange-500 dark:border-orange-900'
                  : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {rateLimit.apiService}
                  </CardTitle>
                  {isCritical && (
                    <Badge variant="destructive" className="text-xs">
                      CRITICAL
                    </Badge>
                  )}
                  {isDanger && !isCritical && (
                    <Badge
                      variant="outline"
                      className="text-xs border-orange-500 text-orange-600 dark:text-orange-400"
                    >
                      WARNING
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Quota Usage */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Quota Used</span>
                    <span
                      className={`font-medium ${getRateLimitColor(
                        rateLimit.quotaPercentage
                      )}`}
                    >
                      {rateLimit.quotaPercentage}% (
                      {rateLimit.quotaUsed.toLocaleString()} /{' '}
                      {rateLimit.quotaLimit.toLocaleString()} {rateLimit.unit})
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCritical
                          ? 'bg-red-600'
                          : isDanger
                          ? 'bg-orange-600'
                          : rateLimit.quotaPercentage >= 50
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${rateLimit.quotaPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Resets in:</span>
                    <span className="font-medium">
                      {formatTimeUntil(rateLimit.resetsAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Rate:</span>
                    <span className="font-medium">
                      ~{rateLimit.currentRate.toLocaleString()} {rateLimit.unit}
                      /hour
                    </span>
                  </div>
                </div>

                {/* Operations Breakdown (if available) */}
                {rateLimit.operations && rateLimit.operations.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Top Operations
                    </div>
                    <div className="space-y-1">
                      {rateLimit.operations.slice(0, 3).map((operation) => (
                        <div
                          key={operation.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-foreground">
                            {operation.name}
                          </span>
                          <span className="text-muted-foreground">
                            {operation.cost} {rateLimit.unit} • Used:{' '}
                            {operation.usedToday} today
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning Alert */}
                {(isCritical || isDanger) && (
                  <Alert
                    variant={isCritical ? 'destructive' : 'default'}
                    className={
                      !isCritical
                        ? 'border-orange-500 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20'
                        : ''
                    }
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm">
                      {isCritical
                        ? 'Critical Limit Reached!'
                        : 'Approaching Limit'}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {isCritical
                        ? 'API quota is exhausted. New jobs will be queued until quota resets.'
                        : 'Consider queueing non-urgent jobs to avoid hitting the limit.'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {rateLimits.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No rate limit data available
          </CardContent>
        </Card>
      )}
    </div>
  )
}
