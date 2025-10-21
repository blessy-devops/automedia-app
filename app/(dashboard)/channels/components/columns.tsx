"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { formatLargeNumber } from "@/lib/utils"
import { DataTableRowActions } from "./data-table-row-actions"
import Image from "next/image"

/**
 * Channel Type for the DataTable
 * Based on the BenchmarkChannel Drizzle schema
 */
export type Channel = {
  id: number
  channelId: string
  channelName: string | null
  subscriberCount: number | null
  totalViews: number | null
  videoUploadCount: number | null
  categorization: {
    niche?: string
    subniche?: string
    microniche?: string
    category?: string
    format?: string
  } | null
  thumbnailUrl: string | null
  isVerified: boolean | null
  country: string | null
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
 * Column Definitions for the Channels DataTable
 */
export const columns: ColumnDef<Channel>[] = [
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
  // Channel Name Column
  {
    accessorKey: "channelName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Channel Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("channelName") as string | null
      return (
        <div className="flex items-center gap-2">
          {row.original.thumbnailUrl && (
            <Image
              src={row.original.thumbnailUrl}
              alt={name || "Channel"}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <div className="flex flex-col">
            <span className="font-medium">{name || "Unknown Channel"}</span>
            {row.original.isVerified && (
              <Badge variant="secondary" className="w-fit text-xs">
                Verified
              </Badge>
            )}
          </div>
        </div>
      )
    },
  },
  // Subscribers Column
  {
    accessorKey: "subscriberCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subscribers" />
    ),
    cell: ({ row }) => {
      const count = row.getValue("subscriberCount") as number | null
      return (
        <div className="text-right font-medium">
          {formatLargeNumber(count)}
        </div>
      )
    },
  },
  // Total Views Column
  {
    accessorKey: "totalViews",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Views" />
    ),
    cell: ({ row }) => {
      const views = row.getValue("totalViews") as number | null
      return (
        <div className="text-right font-medium">
          {formatLargeNumber(views)}
        </div>
      )
    },
  },
  // Total Videos Column
  {
    accessorKey: "videoUploadCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Videos" />
    ),
    cell: ({ row }) => {
      const count = row.getValue("videoUploadCount") as number | null
      return (
        <div className="text-right font-medium">
          {count !== null ? count.toLocaleString() : "0"}
        </div>
      )
    },
  },
  // Niche Column
  {
    id: "niche",
    accessorFn: (row) => row.categorization?.niche,
    header: "Niche",
    cell: ({ row }) => {
      const niche = row.original.categorization?.niche
      return niche ? (
        <Badge variant="outline" className="font-normal">
          {niche}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">Not categorized</span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Country Column
  {
    accessorKey: "country",
    header: "Country",
    cell: ({ row }) => {
      const country = row.getValue("country") as string | null
      return country ? (
        <span className="text-sm">{country}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      )
    },
  },
  // Actions Column
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
