import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

/**
 * Not Found Page for Channel Details
 *
 * Displayed when a channel ID doesn't exist in the database
 */
export default function ChannelNotFound() {
  return (
    <div className="container mx-auto py-20 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Channel Not Found</CardTitle>
            <CardDescription>
              The channel you&apos;re looking for doesn&apos;t exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/channels" className="w-full">
              <Button className="w-full" variant="default">
                Browse All Channels
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button className="w-full" variant="outline">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
