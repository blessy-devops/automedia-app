/**
 * API Queue Stats Cards
 * Displays 5 metric cards: Pending, Processing, Completed, Failed, Rate Limit
 */

import { Clock, Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { QueueStats, RateLimit } from '../types'
import { getRateLimitColor, getRateLimitSeverity } from '../lib/utils'

interface ApiQueueStatsProps {
  stats: QueueStats
  rateLimits: RateLimit[]
}

export function ApiQueueStats({ stats, rateLimits }: ApiQueueStatsProps) {
  // Calculate highest rate limit percentage
  const highestRateLimit = rateLimits.reduce(
    (max, rl) => (rl.quotaPercentage > max.percentage ? { percentage: rl.quotaPercentage, provider: rl.apiService } : max),
    { percentage: 0, provider: '' }
  )

  const statCards = [
    {
      label: 'Pending',
      value: stats.pending.toLocaleString(),
      subtitle: stats.pending > 0 ? `Waiting in queue` : 'No pending jobs',
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    },
    {
      label: 'Processing',
      value: stats.processing.toLocaleString(),
      subtitle: stats.processing > 0 ? 'Active jobs' : 'No active jobs',
      icon: Loader,
      color: 'text-blue-600 dark:text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      spinning: stats.processing > 0,
    },
    {
      label: 'Completed',
      value: stats.completed.toLocaleString(),
      subtitle: stats.successRate !== undefined ? `${stats.successRate}% success rate` : 'Today',
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      label: 'Failed',
      value: stats.failed.toLocaleString(),
      subtitle: stats.failed > 0 ? `Needs attention` : 'No failures',
      icon: XCircle,
      color: 'text-red-600 dark:text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
      label: 'Rate Limit',
      value: `${highestRateLimit.percentage}%`,
      subtitle: highestRateLimit.provider || 'All APIs healthy',
      icon: AlertCircle,
      color: getRateLimitColor(highestRateLimit.percentage),
      bgColor: getRateLimitSeverity(highestRateLimit.percentage) === 'critical'
        ? 'bg-red-50 dark:bg-red-950/20'
        : getRateLimitSeverity(highestRateLimit.percentage) === 'danger'
        ? 'bg-orange-50 dark:bg-orange-950/20'
        : 'bg-gray-50 dark:bg-gray-950/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.label}
            className="hover:border-primary/30 transition-colors cursor-default"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <Icon
                    className={`w-4 h-4 ${stat.color} ${stat.spinning ? 'animate-spin' : ''}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground uppercase font-medium">
                  {stat.label}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.subtitle}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
