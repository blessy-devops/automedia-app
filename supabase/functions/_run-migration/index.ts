// @ts-ignore: Deno-specific imports
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Temporary function to run migration
 * DELETE AFTER USE
 */
Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('[Migration] Adding missing columns to video_enrichment_queue...')

    // Add columns one by one with better error handling
    const alterQueries = [
      `ALTER TABLE video_enrichment_queue ADD COLUMN IF NOT EXISTS channel_id VARCHAR(30)`,
      `ALTER TABLE video_enrichment_queue ADD COLUMN IF NOT EXISTS channel_name TEXT`,
      `ALTER TABLE video_enrichment_queue ADD COLUMN IF NOT EXISTS video_title TEXT`,
      `ALTER TABLE video_enrichment_queue ADD COLUMN IF NOT EXISTS enrichment_task_id INTEGER REFERENCES channel_enrichment_tasks(id) ON DELETE SET NULL`,
      `ALTER TABLE video_enrichment_queue ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ`,
      `ALTER TABLE video_enrichment_queue ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ`,
    ]

    for (const query of alterQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: query })
      if (error) {
        console.error('[Migration] Error:', query, error)
        throw error
      }
      console.log('[Migration] ✓', query)
    }

    console.log('[Migration] Creating indexes...')

    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_enrichment_queue_task_id ON video_enrichment_queue(enrichment_task_id)`,
      `CREATE INDEX IF NOT EXISTS idx_enrichment_queue_channel_id ON video_enrichment_queue(channel_id)`,
      `CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status ON video_enrichment_queue(status, created_at)`,
    ]

    for (const query of indexQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: query })
      if (error) {
        console.error('[Migration] Error:', query, error)
        throw error
      }
      console.log('[Migration] ✓', query)
    }

    console.log('[Migration] Creating RPC function for queue locking...')

    const rpcFunction = `
CREATE OR REPLACE FUNCTION get_pending_queue_items(p_limit INTEGER DEFAULT 10)
RETURNS SETOF video_enrichment_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM video_enrichment_queue
  WHERE status = 'pending'
  ORDER BY created_at ASC
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED;
END;
$$;
    `

    const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: rpcFunction })
    if (rpcError) {
      console.error('[Migration] Error creating RPC:', rpcError)
      throw rpcError
    }

    console.log('[Migration] ✅ Migration completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration completed successfully',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Migration] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
