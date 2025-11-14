"use client"

import { Badge } from "@/components/ui/badge"

interface PerformanceBadgeProps {
  score: number | null
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
 */
export function PerformanceBadge({ score }: PerformanceBadgeProps) {
  if (score === null || score === undefined) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  const formattedScore = `${score.toFixed(1)}x`

  // Determine badge variant and label based on score
  if (score >= 20) {
    return (
      <Badge variant="destructive" className="font-semibold">
        {formattedScore} VIRAL
      </Badge>
    )
  }

  if (score >= 10) {
    return (
      <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
        {formattedScore} SUPER
      </Badge>
    )
  }

  if (score >= 5) {
    return (
      <Badge className="bg-green-600 hover:bg-green-700 text-white font-semibold">
        {formattedScore} HIGH
      </Badge>
    )
  }

  if (score >= 2) {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
        {formattedScore} GOOD
      </Badge>
    )
  }

  return (
    <Badge variant="secondary">
      {formattedScore}
    </Badge>
  )
}
