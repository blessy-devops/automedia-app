import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle } from 'lucide-react'

export type StepStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'

interface StatusStepProps {
  stepNumber: number
  title: string
  status: StepStatus
  description?: string
}

/**
 * StatusStep Component
 *
 * Displays a single step in the enrichment pipeline with:
 * - Step number and title
 * - Visual status indicator (icon + badge)
 * - Optional description
 */
export function StatusStep({ stepNumber, title, status, description }: StatusStepProps) {
  // Get badge variant based on status
  const getBadgeVariant = (status: StepStatus) => {
    switch (status) {
      case 'pending':
        return 'outline'
      case 'processing':
        return 'info'
      case 'completed':
        return 'success'
      case 'failed':
        return 'destructive'
      case 'skipped':
        return 'warning'
      default:
        return 'outline'
    }
  }

  // Get icon based on status
  const getIcon = (status: StepStatus) => {
    switch (status) {
      case 'pending':
        return <Circle className="h-5 w-5 text-muted-foreground" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  // Get status text
  const getStatusText = (status: StepStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'processing':
        return 'Processing'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'skipped':
        return 'Skipped'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="flex items-start space-x-4 p-4 border-b last:border-b-0">
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{getIcon(status)}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">
            {stepNumber}. {title}
          </h4>
          <Badge variant={getBadgeVariant(status)}>{getStatusText(status)}</Badge>
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  )
}
