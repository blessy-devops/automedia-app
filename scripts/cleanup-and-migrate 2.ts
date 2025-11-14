import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function cleanupAndMigrate() {
  // Use direct connection for migration
  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    prepare: false,
    max: 1,
  })

  try {
    console.log('🧹 Cleaning up partial migrations...')

    // Drop tables in correct order (considering dependencies)
    const tablesToDrop = [
      'channel_enrichment_tasks',
      'channel_enrichment_jobs',
      'benchmark_videos',
      'benchmark_channels_baseline_stats',
      'benchmark_channels',
    ]

    for (const table of tablesToDrop) {
      try {
        await sql.unsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`)
        console.log(`  ✅ Dropped table: ${table}`)
      } catch (error: any) {
        console.log(`  ⚠️  Could not drop ${table}:`, error.message)
      }
    }

    // Drop ENUMs
    const enumsToDrop = [
      'enrichment_job_status',
      'enrichment_task_status',
      'enrichment_sub_workflow_status',
    ]

    for (const enumType of enumsToDrop) {
      try {
        await sql.unsafe(`DROP TYPE IF EXISTS "${enumType}" CASCADE`)
        console.log(`  ✅ Dropped enum: ${enumType}`)
      } catch (error: any) {
        console.log(`  ⚠️  Could not drop ${enumType}:`, error.message)
      }
    }

    console.log('\n🔄 Reading migration file...')
    const migrationPath = join(__dirname, '../drizzle/migrations/0000_bizarre_maggott.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Applying fresh migration to Supabase database...\n')

    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    let successCount = 0
    for (const statement of statements) {
      try {
        await sql.unsafe(statement)
        successCount++
        console.log(`  ✅ Statement ${successCount} executed successfully`)
      } catch (error: any) {
        // Skip errors for existing legacy tables/objects
        if (error.code === '42P07' && statement.includes('profiles')) {
          console.log(`  ⚠️  Skipping legacy table 'profiles' (already exists)`)
          continue
        }
        if (error.code === '42P07' && statement.includes('unique_idx')) {
          console.log(`  ⚠️  Skipping legacy index 'unique_idx' (already exists)`)
          continue
        }
        console.error(`  ❌ Error executing statement:`, error.message)
        throw error
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log(`
📊 Database Schema Created:

  ✓ 3 ENUMs:
    • enrichment_job_status
    • enrichment_task_status
    • enrichment_sub_workflow_status

  ✓ 5 Tables for Channel Benchmark Module:
    • benchmark_channels (18 columns, 3 indexes)
    • benchmark_videos (22 columns, 5 indexes)
    • benchmark_channels_baseline_stats (25 columns, 2 indexes)
    • channel_enrichment_jobs (12 columns, 3 indexes)
    • channel_enrichment_tasks (35 columns, 8 indexes)

  ✓ Total: ${successCount} SQL statements executed

🎉 Ready to start using the Channel Benchmark module!
`)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

cleanupAndMigrate()
