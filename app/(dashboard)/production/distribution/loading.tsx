import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export default function ProductionDistributionLoading() {
  return (
    <div className="container max-w-7xl py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-9 w-[100px]" />
        </div>

        {/* Video cards skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Badges skeleton */}
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>

                {/* Channel list skeleton */}
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[200px]" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="flex items-start space-x-3 rounded-lg border p-4"
                      >
                        <Skeleton className="h-5 w-5 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-10 w-[120px]" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
