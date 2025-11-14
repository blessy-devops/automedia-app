import { ChannelBenchmarkForm } from './components/channel-benchmark-form'

/**
 * Channel Benchmark Page
 *
 * Server Component that renders the main page for starting a channel benchmark.
 * Users can input a YouTube Channel ID and start the enrichment process.
 */
export default function ChannelBenchmarkPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Channel Benchmark</h1>
        <p className="text-muted-foreground mt-2">
          Start a comprehensive benchmark analysis of a YouTube channel
        </p>
      </div>

      <ChannelBenchmarkForm />
    </div>
  )
}
