"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PerformanceBadge } from "../../components/performance-badge"
import { TrendingUp, Info } from "lucide-react"

interface PerformanceMetricsCardProps {
  video: {
    performanceVsAvgHistorical: number | null
    performanceVsMedianHistorical: number | null
    performanceVsRecent14d: number | null
    performanceVsRecent30d: number | null
    performanceVsRecent90d: number | null
  }
  socialBladeAvailable?: boolean
}

/**
 * Performance Metrics Card Component
 *
 * Displays all 5 performance scores with color-coded badges
 */
export function PerformanceMetricsCard({
  video,
  socialBladeAvailable = true
}: PerformanceMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <CardDescription>
          Video performance vs. channel baseline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Median Historical - Primary Score */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            vs. Median Historical
          </Label>
          <PerformanceBadge score={video.performanceVsMedianHistorical} />
        </div>

        {/* Average Historical */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            vs. Avg Historical
          </Label>
          <PerformanceBadge score={video.performanceVsAvgHistorical} />
        </div>

        {/* Recent 14 Days */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">
              vs. Recent 14d
            </Label>
            {!socialBladeAvailable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Recent performance metrics unavailable. Channel may be too new for Social Blade indexing.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <PerformanceBadge score={video.performanceVsRecent14d} />
        </div>

        {/* Recent 30 Days */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            vs. Recent 30d
          </Label>
          <PerformanceBadge score={video.performanceVsRecent30d} />
        </div>

        {/* Recent 90 Days */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            vs. Recent 90d
          </Label>
          <PerformanceBadge score={video.performanceVsRecent90d} />
        </div>
      </CardContent>
    </Card>
  )
}
