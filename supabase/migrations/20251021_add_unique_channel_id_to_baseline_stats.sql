-- Add unique constraint to channel_id in benchmark_channels_baseline_stats
-- This allows using upsert with onConflict in Supabase

ALTER TABLE benchmark_channels_baseline_stats
ADD CONSTRAINT benchmark_channels_baseline_stats_channel_id_key UNIQUE (channel_id);
