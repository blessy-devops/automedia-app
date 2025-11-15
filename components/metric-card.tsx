import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type LucideIcon, ArrowUp, ArrowDown, Minus } from 'lucide-react'

export interface MetricCardProps {
  /**
   * The label/title of the metric
   */
  label: string

  /**
   * The main value to display (will always be shown in text-2xl for readability)
   */
  value: string | number

  /**
   * Optional description text shown below the label
   */
  description?: string

  /**
   * Optional icon to display (from lucide-react)
   */
  icon?: LucideIcon

  /**
   * Layout variant:
   * - "inline": Horizontal compact layout (replaces StatCard)
   * - "card": Full card container with border (replaces SimpleMetricCard)
   */
  layout?: 'inline' | 'card'

  /**
   * Color variant for inline layout
   */
  variant?: 'default' | 'success' | 'primary'

  /**
   * Optional trend indicator (only for card layout)
   */
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }

  /**
   * Optional subtitle (mutually exclusive with trend, only for card layout)
   */
  subtitle?: string

  /**
   * Additional CSS classes
   */
  className?: string
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  layout = 'card',
  variant = 'default',
  trend,
  subtitle,
  className,
}: MetricCardProps) {
  // INLINE LAYOUT (replaces StatCard)
  if (layout === 'inline') {
    const variantClasses = {
      default: 'text-muted-foreground',
      success: 'text-green-600',
      primary: 'text-primary',
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        {Icon && <Icon className={cn('h-4 w-4', variantClasses[variant])} />}
        <span className="text-sm text-muted-foreground">{label}:</span>
        <span className={cn('text-sm font-medium', variantClasses[variant])}>
          {value}
        </span>
      </div>
    )
  }

  // CARD LAYOUT (replaces SimpleMetricCard)
  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend.direction) {
      case 'up':
        return <ArrowUp className="h-3 w-3" />
      case 'down':
        return <ArrowDown className="h-3 w-3" />
      case 'neutral':
        return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    switch (trend.direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-1">
          {/* Label */}
          <p className="text-sm text-muted-foreground">{label}</p>

          {/* Value - ALWAYS text-2xl for readability */}
          <p className="text-2xl font-semibold">{value}</p>

          {/* Description (if provided) */}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}

          {/* Trend or Subtitle */}
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs mt-1', getTrendColor())}>
              {getTrendIcon()}
              <span>{trend.value}</span>
            </div>
          )}

          {!trend && subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
