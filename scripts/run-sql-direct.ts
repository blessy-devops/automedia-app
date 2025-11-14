import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xlpkabexmwsugkmbngwm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigration() {
  console.log('🔄 Connecting to Supabase...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20251113131610_create_channel_radar.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Running migration: 20251113131610_create_channel_radar.sql');

    // Execute the migration using rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');

    // Verify table was created
    console.log('\n🔍 Verifying channel_radar table...');
    const { data: tableCheck, error: checkError } = await supabase
      .from('channel_radar')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Table verification failed:', checkError);
    } else {
      console.log('✅ Table channel_radar exists and is accessible!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runMigration();
