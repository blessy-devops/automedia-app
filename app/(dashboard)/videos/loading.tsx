import { Loader2 } from "lucide-react";

/**
 * Videos Page Loading State
 */
export default function VideosLoading() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-48 bg-muted animate-pulse rounded" />
        <div className="h-5 w-96 bg-muted animate-pulse rounded" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-2">
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading videos...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
