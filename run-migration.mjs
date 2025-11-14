import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xlpkabexmwsugkmbngwm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const queries = [
  `ALTER TABLE benchmark_channels ADD COLUMN IF NOT EXISTS in_radar BOOLEAN DEFAULT FALSE NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_benchmark_channels_in_radar ON benchmark_channels(in_radar) WHERE in_radar = TRUE`,
  `CREATE TABLE IF NOT EXISTS channel_radar (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(255) NOT NULL UNIQUE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_update_at TIMESTAMP WITH TIME ZONE,
    next_update_at TIMESTAMP WITH TIME ZONE,
    update_frequency VARCHAR(20) DEFAULT 'daily' NOT NULL CHECK (update_frequency IN ('daily', 'weekly', 'manual')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    has_10x_outlier BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_channel_radar_channel FOREIGN KEY (channel_id) REFERENCES benchmark_channels(channel_id) ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_channel_radar_active ON channel_radar(is_active) WHERE is_active = TRUE`,
  `CREATE INDEX IF NOT EXISTS idx_channel_radar_next_update ON channel_radar(next_update_at) WHERE next_update_at IS NOT NULL AND is_active = TRUE`,
  `CREATE INDEX IF NOT EXISTS idx_channel_radar_last_update ON channel_radar(last_update_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_channel_radar_10x_outlier ON channel_radar(has_10x_outlier) WHERE has_10x_outlier = TRUE`,
  `GRANT ALL ON channel_radar TO service_role`,
  `GRANT ALL ON SEQUENCE channel_radar_id_seq TO service_role`,
  `GRANT SELECT ON channel_radar TO authenticated`,
  `GRANT UPDATE (is_active, notes, updated_at) ON channel_radar TO authenticated`
];

console.log('🔄 Running migrations on remote Supabase...\n');

for (const query of queries) {
  try {
    console.log(`Executing: ${query.substring(0, 60)}...`);
    const { data, error } = await supabase.rpc('exec_sql', { query });

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Success');
    }
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

console.log('\n🔍 Verifying table...');
const { data, error } = await supabase.from('channel_radar').select('*').limit(1);

if (error) {
  console.error('❌ Table not accessible:', error.message);
} else {
  console.log('✅ channel_radar table is ready!');
}

process.exit(0);
