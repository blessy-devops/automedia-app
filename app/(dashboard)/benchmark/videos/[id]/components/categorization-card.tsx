"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"

interface CategorizationCardProps {
  video: {
    categorization: {
      primary_category?: string
      secondary_categories?: string[]
      content_type?: string
      format?: string
    } | null
  }
}

/**
 * Categorization Card Component
 *
 * Displays AI-generated video categorization
 */
export function CategorizationCard({ video }: CategorizationCardProps) {
  const categorization = video.categorization

  if (!categorization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No categorization data available
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5" />
          AI Categorization
        </CardTitle>
        <CardDescription>Content classification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categorization.primary_category && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Primary Category
            </p>
            <Badge variant="default">
              {categorization.primary_category}
            </Badge>
          </div>
        )}

        {categorization.secondary_categories && categorization.secondary_categories.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Secondary Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categorization.secondary_categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {categorization.content_type && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Content Type
            </p>
            <Badge variant="outline">
              {categorization.content_type}
            </Badge>
          </div>
        )}

        {categorization.format && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              Format
            </p>
            <Badge variant="outline">
              {categorization.format}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
