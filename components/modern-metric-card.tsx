'use client'

import { Users, Eye, Video, TrendingUp, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModernMetricCardProps {
  title: string
  value: string | number
  description?: string
  iconName: 'users' | 'eye' | 'video' | 'trending-up'
  trend?: {
    value: number
    isPositive: boolean
  }
  gradient?: string
  className?: string
}

const iconMap: Record<string, LucideIcon> = {
  'users': Users,
  'eye': Eye,
  'video': Video,
  'trending-up': TrendingUp,
}

export function ModernMetricCard({
  title,
  value,
  description,
  iconName,
  trend,
  gradient = 'from-blue-500/10 to-purple-500/10',
  className,
}: ModernMetricCardProps) {
  const Icon = iconMap[iconName]
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br',
        gradient,
        'backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5',
        'hover:border-primary/30 hover:-translate-y-1',
        className
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'rounded-lg p-2.5 bg-primary/10 transition-colors duration-300',
              'group-hover:bg-primary/20'
            )}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
          </div>

          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Animated border gradient */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  )
}
