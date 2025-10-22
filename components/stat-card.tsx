import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  variant?: "default" | "success" | "primary"
  className?: string
}

/**
 * Stat Card Component
 *
 * Reusable component for displaying metrics with an icon, label, and value.
 * Used in gallery cards and detail pages for consistent metric presentation.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0",
          variant === "success" && "text-green-600",
          variant === "primary" && "text-primary",
          variant === "default" && "text-muted-foreground"
        )}
      />
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-muted-foreground leading-none truncate">
          {label}
        </span>
        <span className="text-sm font-semibold leading-none mt-1 truncate">
          {value}
        </span>
      </div>
    </div>
  )
}
