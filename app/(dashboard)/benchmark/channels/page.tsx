import { ChannelBenchmarkForm } from './components/channel-benchmark-form'

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
