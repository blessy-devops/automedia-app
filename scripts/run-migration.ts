import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const DATABASE_URL_DIRECT = process.env.DATABASE_URL_DIRECT!;

async function runMigration() {
  console.log('🔄 Connecting to remote Supabase database...');

  const sql = postgres(DATABASE_URL_DIRECT, {
    max: 1,
    ssl: 'require'
  });

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20251113131610_create_channel_radar.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Running migration: 20251113131610_create_channel_radar.sql');

    // Execute the migration
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify table was created
    console.log('\n🔍 Verifying channel_radar table...');
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'channel_radar'
      ) as table_exists;
    `;

    if (result[0].table_exists) {
      console.log('✅ Table channel_radar exists!');

      // Get table structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'channel_radar'
        ORDER BY ordinal_position;
      `;

      console.log('\n📋 Table structure:');
      columns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('❌ Table channel_radar does not exist!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
