/**
 * useQueueFilters Hook
 * Manages queue filtering logic with debounced search
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { QueueJob, QueueFilters } from '../types'

interface UseQueueFiltersOptions {
  jobs: QueueJob[]
  initialFilters?: Partial<QueueFilters>
}

export function useQueueFilters({ jobs, initialFilters }: UseQueueFiltersOptions) {
  const [filters, setFilters] = useState<QueueFilters>({
    search: '',
    status: 'all',
    apiProvider: 'all',
    dateRange: '24h',
    ...initialFilters,
  })

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)

    return () => clearTimeout(timer)
  }, [filters.search])

  // Filter jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs]

    // Filter by search
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (job) =>
          job.id.toLowerCase().includes(searchLower) ||
          job.type.toLowerCase().includes(searchLower) ||
          job.metadata.channelName?.toLowerCase().includes(searchLower) ||
          job.metadata.videoTitle?.toLowerCase().includes(searchLower) ||
          job.workflowName?.toLowerCase().includes(searchLower)
      )
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((job) => job.status === filters.status)
    }

    // Filter by API provider
    if (filters.apiProvider !== 'all') {
      filtered = filtered.filter((job) => job.apiService === filters.apiProvider)
    }

    // Filter by date range
    const now = new Date()
    let startDate: Date

    switch (filters.dateRange) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (filters.customDateFrom) {
          startDate = new Date(filters.customDateFrom)
        } else {
          startDate = new Date(0)
        }
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    filtered = filtered.filter((job) => {
      const jobDate = new Date(job.createdAt)
      return jobDate >= startDate
    })

    return filtered
  }, [jobs, debouncedSearch, filters])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status !== 'all') count++
    if (filters.apiProvider !== 'all') count++
    return count
  }, [filters])

  return {
    filters,
    setFilters,
    filteredJobs,
    activeFiltersCount,
  }
}
