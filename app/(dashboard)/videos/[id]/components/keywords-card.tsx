import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tag, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface KeywordsCardProps {
  keywords: string[] | null
  lastEnrichedAt: Date | null
}

export function KeywordsCard({ keywords, lastEnrichedAt }: KeywordsCardProps) {
  const hasKeywords = keywords && keywords.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Keywords</CardTitle>
          </div>
          {lastEnrichedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Enriched {formatDistanceToNow(new Date(lastEnrichedAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
        <CardDescription>
          {hasKeywords
            ? `${keywords.length} keyword${keywords.length === 1 ? '' : 's'} extracted from video metadata`
            : 'No keywords available. Click "Enrich Video" to fetch keywords from YouTube.'}
        </CardDescription>
      </CardHeader>
      {hasKeywords && (
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
