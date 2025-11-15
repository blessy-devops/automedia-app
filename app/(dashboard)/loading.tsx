import { Loader2 } from "lucide-react";

/**
 * Dashboard Global Loading State
 *
 * Shows while navigating between dashboard pages
 */
export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
