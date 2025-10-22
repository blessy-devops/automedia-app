"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tag, Layers, Grid3x3, Package, Film } from "lucide-react"

interface CategorizationCardProps {
  video: {
    categorization: {
      // New structure
      niche?: string
      subniche?: string
      microniche?: string
      category?: string
      format?: string
      // Legacy structure
      primary_category?: string
      secondary_categories?: string[]
      content_type?: string
    } | null
  }
}

/**
 * Categorization Card Component
 *
 * Displays AI-generated video categorization
 * Supports both new structure (niche, subniche, microniche, category, format)
 * and legacy structure (primary_category, secondary_categories, content_type)
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

  // Helper function to format microniche
  const formatMicroniche = (microniche: string) => {
    return microniche.replace(/_/g, ' ')
  }

  // Check if using new structure
  const isNewStructure = categorization.niche || categorization.subniche || categorization.microniche

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
        {isNewStructure ? (
          <>
            {/* New Structure */}
            {categorization.niche && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Niche
                </p>
                <Badge variant="default">
                  {categorization.niche}
                </Badge>
              </div>
            )}

            {categorization.subniche && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Grid3x3 className="h-3.5 w-3.5" />
                  Subniche
                </p>
                <Badge variant="secondary">
                  {categorization.subniche}
                </Badge>
              </div>
            )}

            {categorization.microniche && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Microniche
                </p>
                <Badge variant="secondary" className="text-xs">
                  {formatMicroniche(categorization.microniche)}
                </Badge>
              </div>
            )}

            {categorization.category && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Category
                </p>
                <Badge variant="outline">
                  {categorization.category}
                </Badge>
              </div>
            )}

            {categorization.format && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5" />
                  Format
                </p>
                <Badge variant="outline">
                  {categorization.format}
                </Badge>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Legacy Structure */}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
