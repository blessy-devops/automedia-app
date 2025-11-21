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

  // Fetch benchmark_channels IDs for navigation (manual join without foreign key)
  let enrichedHistory = history || []
  if (history && history.length > 0) {
    const channelIds = history.map(item => item.channel_id)

    const { data: channels } = await supabase
      .from('benchmark_channels')
      .select('id, channel_id')
      .in('channel_id', channelIds)

    // Merge benchmark_channels.id into history items
    enrichedHistory = history.map(item => ({
      ...item,
      benchmark_channels: channels?.find(ch => ch.channel_id === item.channel_id)
        ? { id: channels.find(ch => ch.channel_id === item.channel_id)!.id }
        : null
    }))
  }

  return <ChannelBenchmarkV2 initialHistory={enrichedHistory} />
}
