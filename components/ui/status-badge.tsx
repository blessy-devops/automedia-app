import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        active: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        processing: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        alert: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
        paused: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-0.5",
        lg: "text-base px-3 py-1",
      },
    },
    defaultVariants: {
      status: "active",
      size: "md",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string
}

function StatusBadge({ className, status, size, label, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status, size }), className)} {...props}>
      {label || children}
    </span>
  )
}

export { StatusBadge, statusBadgeVariants }
