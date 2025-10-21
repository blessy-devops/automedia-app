"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { formatLargeNumber } from "@/lib/utils"
import { DataTableRowActions } from "./data-table-row-actions"
import { PerformanceBadge } from "./performance-badge"
import Image from "next/image"

/**
 * Video Type for the DataTable
 * Based on the BenchmarkVideo Drizzle schema with calculated fields
 */
export type Video = {
  id: number
  youtubeVideoId: string
  channelId: string
  title: string | null
  views: number | null
  likes: number | null
  comments: number | null
  uploadDate: Date | null
  thumbnailUrl: string | null
  performanceVsAvgHistorical: number | null
  performanceVsMedianHistorical: number | null
  performanceVsRecent14d: number | null
  performanceVsRecent30d: number | null
  performanceVsRecent90d: number | null
  isOutlier: boolean | null
  videoAgeDays: number | null
}

/**
 * Column Header Component with Sorting
 */
interface DataTableColumnHeaderProps {
  column: any
  title: string
}

function DataTableColumnHeader({ column, title }: DataTableColumnHeaderProps) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-4 h-8"
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDate(date: Date | null): string {
  if (!date) return "—"
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Column Definitions for the Videos DataTable
 */
export const columns: ColumnDef<Video>[] = [
  // Selection Column
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Video Title Column
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Video Title" />
    ),
    cell: ({ row }) => {
      const title = row.getValue("title") as string | null
      const thumbnailUrl = row.original.thumbnailUrl
      return (
        <div className="flex items-center gap-3 max-w-md">
          {thumbnailUrl && (
            <Image
              src={thumbnailUrl}
              alt={title || "Video"}
              width={120}
              height={68}
              className="rounded object-cover flex-shrink-0"
            />
          )}
          <div className="flex flex-col gap-1">
            <span className="font-medium line-clamp-2">
              {title || "Untitled Video"}
            </span>
            {row.original.isOutlier && (
              <Badge variant="destructive" className="w-fit text-xs">
                Outlier
              </Badge>
            )}
          </div>
        </div>
      )
    },
  },
  // Views Column
  {
    accessorKey: "views",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Views" />
    ),
    cell: ({ row }) => {
      const views = row.getValue("views") as number | null
      return (
        <div className="text-right font-medium">
          {formatLargeNumber(views)}
        </div>
      )
    },
  },
  // Video Age Column
  {
    accessorKey: "videoAgeDays",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Age (Days)" />
    ),
    cell: ({ row }) => {
      const age = row.getValue("videoAgeDays") as number | null
      return (
        <div className="text-right">
          {age !== null ? Math.floor(age) : "—"}
        </div>
      )
    },
  },
  // Performance vs Median Historical Column (Main Outlier Score)
  {
    accessorKey: "performanceVsMedianHistorical",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Perf. vs Median" />
    ),
    cell: ({ row }) => {
      const score = row.getValue("performanceVsMedianHistorical") as number | null
      return (
        <div className="flex justify-center">
          <PerformanceBadge score={score} />
        </div>
      )
    },
  },
  // Likes Column
  {
    accessorKey: "likes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Likes" />
    ),
    cell: ({ row }) => {
      const likes = row.getValue("likes") as number | null
      return (
        <div className="text-right">
          {formatLargeNumber(likes)}
        </div>
      )
    },
  },
  // Comments Column
  {
    accessorKey: "comments",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Comments" />
    ),
    cell: ({ row }) => {
      const comments = row.getValue("comments") as number | null
      return (
        <div className="text-right">
          {comments !== null ? comments.toLocaleString() : "—"}
        </div>
      )
    },
  },
  // Upload Date Column
  {
    accessorKey: "uploadDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Upload Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("uploadDate") as Date | null
      return (
        <div className="text-sm">
          {formatDate(date)}
        </div>
      )
    },
  },
  // Actions Column
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
