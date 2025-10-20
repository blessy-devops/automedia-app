import { ChannelBenchmarkForm } from './components/channel-benchmark-form'

/**
 * Channel Benchmark Page
 *
 * Server Component that renders the Channel Benchmark form.
 * This page allows users to start a comprehensive benchmark analysis
 * of a YouTube channel by entering its Channel ID.
 *
 * The analysis includes:
 * - Channel categorization (niche, subniche, microniche, category, format)
 * - Social Blade data enrichment
 * - Video fetching and analysis
 * - Baseline statistics calculation
 * - Outlier video detection
 *
 * All processing happens asynchronously via Supabase Edge Functions,
 * with real-time progress updates via Supabase Realtime.
 */
export default function ChannelBenchmarkPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Channel Benchmark
        </h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive YouTube channel analysis and performance benchmarking
        </p>
      </div>

      <ChannelBenchmarkForm />
    </div>
  )
}
