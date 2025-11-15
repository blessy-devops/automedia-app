"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingNiche } from "@/lib/dashboard-queries"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface TrendingNichesProps {
  niches: TrendingNiche[]
}

const COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#eab308", // yellow-500
  "#84cc16", // lime-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
  "#0ea5e9", // sky-500
]

export function TrendingNiches({ niches }: TrendingNichesProps) {
  if (niches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📈 Trending Niches</CardTitle>
          <CardDescription>
            Niches with most outlier videos this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No trending data available yet. Enrich more channels to see trends!
          </p>
        </CardContent>
      </Card>
    )
  }

  // Format data for Recharts
  const chartData = niches.map((niche) => ({
    name: niche.niche.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    outliers: niche.outlier_count,
    avgPerformance: niche.avg_performance,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Trending Niches</CardTitle>
        <CardDescription>
          Niches with most outlier videos (5x+ performance)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number, name: string) => {
                if (name === "outliers") return [value, "Outlier Videos"]
                if (name === "avgPerformance") return [`${value.toFixed(1)}x`, "Avg Performance"]
                return [value, name]
              }}
            />
            <Bar
              dataKey="outliers"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span>Higher outlier count</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-sky-500" />
            <span>Lower outlier count</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
