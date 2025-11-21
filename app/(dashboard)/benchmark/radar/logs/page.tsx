import { getRadarExecutionLogs } from '../actions'
import { LogsClient } from './components/logs-client'

/**
 * Radar Logs Page
 *
 * Shows execution history of radar channel updates with approximate statistics
 * about videos discovered and viral content detected.
 */
export default async function RadarLogsPage() {
  const result = await getRadarExecutionLogs(50) // Get last 50 executions

  if (!result.success || !result.data) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="bg-card border-b border-border px-8 py-6">
          <h1 className="text-2xl font-semibold text-foreground">Radar Update Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execution history and statistics
          </p>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Failed to load logs</p>
            <p className="text-sm text-muted-foreground mt-2">{result.error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Radar Update Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Execution history and approximate statistics for channel updates
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {result.data.length} execution{result.data.length !== 1 ? 's' : ''} loaded
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <LogsClient logs={result.data} />
        </div>
      </div>
    </div>
  )
}
