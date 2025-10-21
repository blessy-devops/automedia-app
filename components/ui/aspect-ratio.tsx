"use client"

import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> & {
    ratio?: number
    children?: React.ReactNode
  }
>(({ ratio, children, ...props }, ref) => (
  <AspectRatioPrimitive.Root
    ref={ref}
    {...({ ratio, ...props } as any)}
  >
    {children}
  </AspectRatioPrimitive.Root>
))
AspectRatio.displayName = "AspectRatio"

export { AspectRatio }
