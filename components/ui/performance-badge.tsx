import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PerformanceBadgeProps {
  performanceRatio: number | null
  className?: string
  showLabel?: boolean
}

export function PerformanceBadge({
  performanceRatio,
  className,
  showLabel = true
}: PerformanceBadgeProps) {
  if (performanceRatio === null || performanceRatio === undefined) {
    return (
      <Badge variant="outline" className={cn("font-mono", className)}>
        N/A
      </Badge>
    )
  }

  // Determine color based on performance ratio
  const getVariantClass = (ratio: number) => {
    if (ratio >= 10) {
      return "bg-red-500 hover:bg-red-600 text-white"
    } else if (ratio >= 5) {
      return "bg-orange-500 hover:bg-orange-600 text-white"
    } else if (ratio >= 3) {
      return "bg-yellow-500 hover:bg-yellow-600 text-white"
    } else if (ratio >= 1) {
      return "bg-green-500 hover:bg-green-600 text-white"
    } else {
      return "bg-slate-200 hover:bg-slate-300 text-slate-700"
    }
  }

  const getLabel = (ratio: number) => {
    if (ratio >= 10) return "🔥 CLONE THIS"
    if (ratio >= 5) return "⭐ Amazing"
    if (ratio >= 3) return "✨ Great"
    if (ratio >= 1) return "✓ Good"
    return "Below Avg"
  }

  const formatRatio = (ratio: number) => {
    if (ratio >= 10) return `${Math.round(ratio)}x`
    return `${ratio.toFixed(1)}x`
  }

  return (
    <Badge
      className={cn(
        getVariantClass(performanceRatio),
        "font-mono font-semibold",
        className
      )}
    >
      {formatRatio(performanceRatio)}
      {showLabel && ` • ${getLabel(performanceRatio)}`}
    </Badge>
  )
}
