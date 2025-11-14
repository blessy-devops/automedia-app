import { cn } from "@/lib/utils"

interface SimpleMetricCardProps {
  label: string
  value: string | number
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
  }
  subtitle?: string
  className?: string
}

export function SimpleMetricCard({
  label,
  value,
  trend,
  subtitle,
  className,
}: SimpleMetricCardProps) {
  const trendColorClass = trend
    ? trend.direction === "up"
      ? "text-green-600 dark:text-green-400"
      : trend.direction === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground"
    : ""

  return (
    <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl text-foreground font-semibold">{value}</div>
      {trend && (
        <div className={cn("text-xs mt-1", trendColorClass)}>
          {trend.direction === "up" && "↑ "}
          {trend.direction === "down" && "↓ "}
          {trend.value}
        </div>
      )}
      {subtitle && !trend && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
    </div>
  )
}
