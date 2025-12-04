import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch all rows from a Supabase table using pagination.
 * Supabase has a hard limit of 1000 rows per request.
 *
 * @param supabase - Supabase client
 * @param table - Table name
 * @param select - Select query (e.g., '*' or 'id, name')
 * @param options - Optional query modifiers
 * @returns All rows from the table
 */
export async function fetchAllRows<T = any>(
  supabase: SupabaseClient,
  table: string,
  select: string = '*',
  options?: {
    filters?: (query: any) => any
    orderBy?: { column: string; ascending?: boolean }
  }
): Promise<{ data: T[]; error: any }> {
  const PAGE_SIZE = 1000
  let allData: T[] = []
  let page = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from(table)
      .select(select)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Apply custom filters if provided
    if (options?.filters) {
      query = options.filters(query)
    }

    // Apply ordering if provided
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false
      })
    }

    const { data, error } = await query

    if (error) {
      return { data: allData, error }
    }

    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allData = allData.concat(data as T[])
      hasMore = data.length === PAGE_SIZE
      page++
    }
  }

  return { data: allData, error: null }
}
