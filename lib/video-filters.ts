/**
 * Video Filters Helper Functions
 *
 * Shared utility functions for applying video filters to Supabase queries.
 * Used by both /videos page and /channels/[id] page.
 */

export interface VideoFilters {
  // Views range
  minViews?: number
  maxViews?: number

  // Outlier score range
  minOutlierScore?: number
  maxOutlierScore?: number

  // Video age range (in days)
  minVideoAgeDays?: number
  maxVideoAgeDays?: number

  // Custom date range
  uploadDateFrom?: string // ISO date string
  uploadDateTo?: string   // ISO date string

  // Legacy preset date range (kept for backward compatibility)
  dateRange?: '7d' | '30d' | '90d' | 'all'

  sortBy?: 'upload_date' | 'views' | 'outlier_score'
}

/**
 * Parse URL search params into VideoFilters object
 */
export function parseVideoFilters(searchParams: { [key: string]: string | string[] | undefined }): VideoFilters {
  // Parse numeric filters with validation
  const parseNumber = (value: string | string[] | undefined): number | undefined => {
    if (!value || Array.isArray(value)) return undefined
    const num = Number(value)
    return !isNaN(num) ? num : undefined
  }

  // Parse date string
  const parseDate = (value: string | string[] | undefined): string | undefined => {
    if (!value || Array.isArray(value)) return undefined
    return value
  }

  return {
    // Views range
    minViews: parseNumber(searchParams.minViews),
    maxViews: parseNumber(searchParams.maxViews),

    // Outlier score range
    minOutlierScore: parseNumber(searchParams.minOutlierScore),
    maxOutlierScore: parseNumber(searchParams.maxOutlierScore),

    // Video age range (in days)
    minVideoAgeDays: parseNumber(searchParams.minVideoAgeDays),
    maxVideoAgeDays: parseNumber(searchParams.maxVideoAgeDays),

    // Custom date range
    uploadDateFrom: parseDate(searchParams.uploadDateFrom),
    uploadDateTo: parseDate(searchParams.uploadDateTo),

    // Legacy preset date range (kept for backward compatibility)
    dateRange: searchParams.dateRange as '7d' | '30d' | '90d' | 'all' | undefined,

    // Sorting
    sortBy: (searchParams.sortBy as 'upload_date' | 'views' | 'outlier_score') || 'upload_date',
  }
}

/**
 * Apply filters to a Supabase query
 * Modifies the query with conditional filters and returns it
 */
export function applyVideoFiltersToQuery(query: any, filters: VideoFilters) {
  // Apply views range filters
  if (filters.minViews !== undefined && !isNaN(filters.minViews)) {
    query = query.gte('views', filters.minViews)
  }
  if (filters.maxViews !== undefined && !isNaN(filters.maxViews)) {
    query = query.lte('views', filters.maxViews)
  }

  // Apply outlier score range filters
  if (filters.minOutlierScore !== undefined && !isNaN(filters.minOutlierScore)) {
    query = query.gte('performance_vs_median_historical', filters.minOutlierScore)
  }
  if (filters.maxOutlierScore !== undefined && !isNaN(filters.maxOutlierScore)) {
    query = query.lte('performance_vs_median_historical', filters.maxOutlierScore)
  }

  // Apply video age range filters (using video_age_days column)
  if (filters.minVideoAgeDays !== undefined && !isNaN(filters.minVideoAgeDays)) {
    query = query.gte('video_age_days', filters.minVideoAgeDays)
  }
  if (filters.maxVideoAgeDays !== undefined && !isNaN(filters.maxVideoAgeDays)) {
    query = query.lte('video_age_days', filters.maxVideoAgeDays)
  }

  // Apply custom date range filters (using upload_date column)
  // Note: Custom date range takes precedence over preset dateRange
  if (filters.uploadDateFrom) {
    query = query.gte('upload_date', filters.uploadDateFrom)
  }
  if (filters.uploadDateTo) {
    query = query.lte('upload_date', filters.uploadDateTo)
  }

  // Apply legacy preset date range filter (backward compatibility)
  // Only apply if custom date range is not set
  if (!filters.uploadDateFrom && !filters.uploadDateTo && filters.dateRange && filters.dateRange !== 'all') {
    // Parse date range preset (e.g., "7d", "30d", "90d")
    if (filters.dateRange.endsWith('d')) {
      const days = parseInt(filters.dateRange)
      if (!isNaN(days)) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        query = query.gte('upload_date', cutoffDate.toISOString())
      }
    }
  }

  // Apply sorting
  if (filters.sortBy === 'views') {
    query = query.order('views', { ascending: false })
  } else if (filters.sortBy === 'outlier_score') {
    query = query.order('performance_vs_median_historical', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('upload_date', { ascending: false })
  }

  return query
}

/**
 * Count the number of active filters
 */
export function countActiveFilters(filters: VideoFilters): number {
  const activeFilters = [
    // Views range
    filters.minViews !== undefined && filters.minViews > 0,
    filters.maxViews !== undefined && filters.maxViews > 0,

    // Outlier score range
    filters.minOutlierScore !== undefined && filters.minOutlierScore > 0,
    filters.maxOutlierScore !== undefined && filters.maxOutlierScore > 0,

    // Video age range
    filters.minVideoAgeDays !== undefined && filters.minVideoAgeDays >= 0,
    filters.maxVideoAgeDays !== undefined && filters.maxVideoAgeDays >= 0,

    // Custom date range
    !!filters.uploadDateFrom,
    !!filters.uploadDateTo,

    // Legacy preset date range
    filters.dateRange && filters.dateRange !== 'all',
  ].filter(Boolean)

  return activeFilters.length
}
