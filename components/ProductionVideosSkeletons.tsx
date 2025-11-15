// components/ProductionVideosSkeletons.tsx
// Loading skeletons for Production Videos pages

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white p-4 rounded shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-12"></div>
        </div>
      ))}
    </div>
  )
}

export function VideoTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </td>
              <td className="px-6 py-4">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function VideoDetailHeroSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6 animate-pulse">
      <div className="flex gap-6">
        <div className="w-80 h-45 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-6 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-96 mb-2"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
    </div>
  )
}

export function SourceVideoSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
      <div className="flex gap-4">
        <div className="w-60 h-34 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-80 mb-2"></div>
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
            <div className="h-3 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-28"></div>
            <div className="h-8 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NarrativeAnalysisSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
          <div className="h-5 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-5 bg-gray-200 rounded w-36"></div>
        </div>
        <div className="col-span-2 bg-muted/50 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
          <div className="h-5 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-40 mb-3"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted/50 rounded p-3">
            <div className="flex items-start justify-between mb-1">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ContentTabsSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="flex gap-2 mb-4 border-b border-border">
        <div className="h-10 bg-gray-200 rounded w-20"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-28"></div>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 mb-3 h-96">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AudioSegmentsSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 bg-muted/50 rounded-lg p-3">
            <div className="h-4 bg-gray-200 rounded w-8"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VideoSegmentsSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-64 mb-4"></div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-muted/50 rounded-lg overflow-hidden">
            <div className="w-full h-32 bg-gray-200"></div>
            <div className="p-3">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="flex items-center justify-between mb-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <aside className="w-80 bg-card border-r border-border p-6 min-h-screen animate-pulse">
      {/* Progresso */}
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-36"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-36"></div>
            <div className="h-4 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
      </div>

      {/* Links Rápidos */}
      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-3 w-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div className="h-4 bg-gray-200 rounded w-36 mb-3"></div>
        <div className="space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

// Full page skeleton for details page
export function ProductionVideoDetailsSkeleton() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border px-8 py-5">
          <div className="flex items-center gap-4 mb-2 animate-pulse">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-72"></div>
            </div>
          </div>
        </div>

        <div className="flex">
          <SidebarSkeleton />

          <div className="flex-1 p-8">
            <VideoDetailHeroSkeleton />
            <SourceVideoSkeleton />
            <NarrativeAnalysisSkeleton />
            <ContentTabsSkeleton />
            <AudioSegmentsSkeleton />
            <VideoSegmentsSkeleton />
          </div>
        </div>
      </main>
    </div>
  )
}
