import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
  }
  className?: string
  loading?: boolean
}

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  loading = false
}: KPICardProps) {
  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-slate-600"
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return "↗"
    if (value < 0) return "↘"
    return "→"
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
          {description && (
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn("text-xs font-medium mt-2", getTrendColor(trend.value))}>
            {getTrendIcon(trend.value)} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
