import { createClient } from '@/lib/supabase/server'
import { ChannelBenchmarkV2 } from './components/channel-benchmark-v2'

/**
 * Channel Benchmark V2 Page (Figma Redesign)
 *
 * New page with cloned Figma design, running in parallel with the existing
 * /benchmark/channels page without any impact.
 *
 * Features:
 * - 30/70 split layout (control center + main area)
 * - Real-time pipeline monitoring
 * - Recent benchmarks history
 * - Stats cards overview
 */
export default async function ChannelBenchmarkV2Page() {
  const supabase = await createClient()

  // Fetch recent benchmark tasks
  const { data: history, error } = await supabase
    .from('channel_enrichment_tasks')
    .select('id, channel_id, overall_status, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[BenchmarkV2] Error fetching history:', error)
  }

  return <ChannelBenchmarkV2 initialHistory={history || []} />
}
