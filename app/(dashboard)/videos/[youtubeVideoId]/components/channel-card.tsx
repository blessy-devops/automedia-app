"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Youtube, ExternalLink } from "lucide-react"
import Link from "next/link"

interface ChannelCardProps {
  channelName: string | null
  channelId: string | null
}

/**
 * Channel Card Component
 *
 * Displays channel information with link to channel details
 */
export function ChannelCard({ channelName, channelId }: ChannelCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Youtube className="h-5 w-5" />
          Channel
        </CardTitle>
        <CardDescription>Creator of this video</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Channel Name</p>
          <p className="font-medium">
            {channelName || "Unknown Channel"}
          </p>
        </div>

        {channelId && (
          <Link href={`/channels/${channelId}`} className="block">
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Channel Details
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
