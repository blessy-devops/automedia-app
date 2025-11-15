import { Suspense } from "react"
import { Flame, TrendingUp, Radar as RadarIcon, Zap } from "lucide-react"
import { KPICard } from "@/components/ui/kpi-card"
import { CloneTheseNow } from "./_components/CloneTheseNow"
import { TrendingNiches } from "./_components/TrendingNiches"
import { RadarAlerts } from "./_components/RadarAlerts"
import { QuickActions } from "./_components/QuickActions"
import {
  getDashboardKPIs,
  getCloneWorthyVideos,
  getTrendingNiches,
  getRadarAlerts,
} from "@/lib/dashboard-queries"

export const metadata = {
  title: "Dashboard | AutoMedia",
  description: "Viral Discovery Hub - Find and clone viral videos",
}

async function DashboardContent() {
  // Fetch all data in parallel
  const [kpis, cloneWorthyVideos, trendingNiches, radarAlerts] = await Promise.all([
    getDashboardKPIs(),
    getCloneWorthyVideos(10),
    getTrendingNiches(10),
    getRadarAlerts(10),
  ])

  return (
    <>
      {/* KPIs Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="New Outliers This Week"
          value={kpis.newOutliersThisWeek}
          icon={Flame}
          description="Videos with 5x+ performance"
        />
        <KPICard
          title="Total 10x+ Videos"
          value={kpis.total10xVideos}
          icon={TrendingUp}
          description="Clone-worthy viral videos"
        />
        <KPICard
          title="Channels Monitored"
          value={kpis.activeRadarChannels}
          icon={RadarIcon}
          description="Active in Channel Radar"
        />
        <KPICard
          title="Videos Enriched Today"
          value={kpis.videosEnrichedToday}
          icon={Zap}
          description="New videos analyzed"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Left Column - Clone These Now */}
        <div className="col-span-full lg:col-span-4">
          <CloneTheseNow videos={cloneWorthyVideos} />
        </div>

        {/* Right Column - Quick Actions */}
        <div className="col-span-full lg:col-span-3">
          <QuickActions />
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <TrendingNiches niches={trendingNiches} />
        <RadarAlerts alerts={radarAlerts} />
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
      {/* KPIs Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <KPICard
            key={i}
            title="Loading..."
            value="--"
            loading
          />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full lg:col-span-4">
          <div className="h-[400px] rounded-lg border bg-card animate-pulse" />
        </div>
        <div className="col-span-full lg:col-span-3">
          <div className="h-[400px] rounded-lg border bg-card animate-pulse" />
        </div>
      </div>

      {/* Analytics Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-[400px] rounded-lg border bg-card animate-pulse" />
        <div className="h-[400px] rounded-lg border bg-card animate-pulse" />
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Viral Discovery Hub</h2>
          <p className="text-muted-foreground">
            Find and clone the best performing videos across all channels
          </p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
