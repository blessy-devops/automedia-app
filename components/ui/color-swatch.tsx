import * as React from 'react'
import { cn } from '@/lib/utils'

interface ColorSwatchProps {
  hex: string
  className?: string
}

export function ColorSwatch({ hex, className }: ColorSwatchProps) {
  // Validar se é um hex code válido
  const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)

  if (!isValidHex) return null

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="w-4 h-4 rounded border border-border inline-block flex-shrink-0"
        style={{ backgroundColor: hex }}
        aria-label={`Color ${hex}`}
      />
      <code className="text-xs font-mono text-muted-foreground">{hex}</code>
    </span>
  )
}
