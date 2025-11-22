"use client"

import { Badge } from "@/components/ui/badge"

interface PerformanceBadgeProps {
  score: number | null
  label?: string
  isFallback?: boolean
}

/**
 * Performance Badge Component
 *
 * Displays video performance scores with color-coded badges:
 * - >= 20x: Red (VIRAL)
 * - >= 10x: Orange (SUPER)
 * - >= 5x: Green (HIGH)
 * - >= 2x: Blue (GOOD)
 * - < 2x: Gray (NORMAL)
 *
 * @param score - Performance score (ratio)
 * @param label - Optional label prefix (e.g., "MED:", "AVG:")
 * @param isFallback - If true, shows dashed border and muted styling
 */
export function PerformanceBadge({ score, label, isFallback = false }: PerformanceBadgeProps) {
  if (score === null || score === undefined) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  const formattedScore = `${score.toFixed(1)}x`
  const displayText = label ? `${label} ${formattedScore}` : formattedScore

  // Fallback styling: dashed border, more subtle colors
  const fallbackClass = isFallback ? "border-dashed opacity-70" : ""

  // Determine badge variant and label based on score
  if (score >= 20) {
    return (
      <Badge variant="destructive" className={`font-semibold ${fallbackClass}`}>
        {displayText} {!label && "VIRAL"}
      </Badge>
    )
  }

  if (score >= 10) {
    return (
      <Badge className={`bg-orange-500 hover:bg-orange-600 text-white font-semibold ${fallbackClass}`}>
        {displayText} {!label && "SUPER"}
      </Badge>
    )
  }

  if (score >= 5) {
    return (
      <Badge className={`bg-green-600 hover:bg-green-700 text-white font-semibold ${fallbackClass}`}>
        {displayText} {!label && "HIGH"}
      </Badge>
    )
  }

  if (score >= 2) {
    return (
      <Badge className={`bg-blue-500 hover:bg-blue-600 text-white ${fallbackClass}`}>
        {displayText} {!label && "GOOD"}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={fallbackClass}>
      {displayText}
    </Badge>
  )
}
