import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function runMigration() {
  // Use direct connection for migration
  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    prepare: false,
    max: 1, // Use only one connection for migration
  })

  try {
    console.log('🔄 Reading migration file...')
    const migrationPath = join(__dirname, '../drizzle/migrations/0000_bizarre_maggott.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Applying migration to Supabase database...')

    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      try {
        console.log(`  ⏳ Executing statement...`)
        await sql.unsafe(statement)
        console.log(`  ✅ Statement executed successfully`)
      } catch (error: any) {
        // Ignore errors for already existing objects
        if (
          error.code === '42710' || // duplicate object
          error.code === '42P07' || // relation already exists
          error.code === '42P16'    // invalid table definition
        ) {
          console.log(`  ⚠️  Object already exists, skipping...`)
        } else {
          throw error
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log(`
📊 Created:
  - 3 ENUMs (enrichment_job_status, enrichment_task_status, enrichment_sub_workflow_status)
  - 5 new tables:
    • benchmark_channels
    • benchmark_videos
    • benchmark_channels_baseline_stats
    • channel_enrichment_jobs
    • channel_enrichment_tasks
  - Multiple indexes for query optimization
`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runMigration()
