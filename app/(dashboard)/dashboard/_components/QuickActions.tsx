import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Radar, Video } from "lucide-react"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>⚡ Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="default" className="h-auto flex-col gap-2 py-4">
            <Link href="/benchmark/channels">
              <Plus className="h-5 w-5" />
              <span className="text-sm">Enrich Channel</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/outliers">
              <Search className="h-5 w-5" />
              <span className="text-sm">Browse Outliers</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/benchmark/radar">
              <Radar className="h-5 w-5" />
              <span className="text-sm">Radar Monitor</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/videos">
              <Video className="h-5 w-5" />
              <span className="text-sm">All Videos</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
