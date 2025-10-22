"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cn } from "@/lib/utils"

const ToggleGroupSimple = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-lg border border-border bg-transparent",
      className
    )}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Root>
))
ToggleGroupSimple.displayName = "ToggleGroupSimple"

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
      "hover:bg-muted hover:text-secondary-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
      "border-r border-border last:border-r-0",
      "first:rounded-l-lg last:rounded-r-lg",
      className
    )}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Item>
))
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroupSimple, ToggleGroupItem }
