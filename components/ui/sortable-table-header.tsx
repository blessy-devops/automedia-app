"use client"

import * as React from "react"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableHead } from "@/components/ui/table"

interface SortableTableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  label: string
  sortKey: string
  currentSortKey?: string
  sortDirection?: "asc" | "desc"
  onSort: (key: string) => void
  align?: "left" | "center" | "right"
}

export function SortableTableHeader({
  label,
  sortKey,
  currentSortKey,
  sortDirection = "asc",
  onSort,
  align = "left",
  className,
  ...props
}: SortableTableHeaderProps) {
  const isActive = currentSortKey === sortKey

  const handleClick = () => {
    onSort(sortKey)
  }

  const getSortIcon = () => {
    if (!isActive) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }

    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }

    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  const alignmentClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  }

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none",
        className
      )}
      {...props}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center font-medium transition-colors hover:text-foreground",
          alignmentClasses[align],
          isActive ? "text-foreground" : "text-muted-foreground",
          align === "right" && "w-full"
        )}
      >
        {align === "right" && getSortIcon()}
        <span className={align === "right" ? "order-2" : ""}>{label}</span>
        {align !== "right" && getSortIcon()}
      </button>
    </TableHead>
  )
}
