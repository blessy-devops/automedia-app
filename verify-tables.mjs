import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xlpkabexmwsugkmbngwm.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscGthYmV4bXdzdWdrbWJuZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4ODAyNSwiZXhwIjoyMDc1OTY0MDI1fQ.jdMI6Gxr7DC4XMyJ57Dax3TZ80wUiXThv0TjZdh3iOs';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔍 Verifying channel_radar table...\n');

const { data, error, count } = await supabase
  .from('channel_radar')
  .select('*', { count: 'exact' })
  .limit(5);

if (error) {
  console.error('❌ Error accessing table:', error);
  process.exit(1);
}

console.log('✅ Table channel_radar exists and is accessible!');
console.log(`📊 Current rows: ${count || 0}`);

if (data && data.length > 0) {
  console.log('\n📋 Sample data:');
  console.log(JSON.stringify(data, null, 2));
}

console.log('\n✅ All good! Table is ready to use.');
process.exit(0);
