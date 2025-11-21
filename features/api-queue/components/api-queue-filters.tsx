/**
 * API Queue Filters Bar
 * Search input + Status/API/Date filters + Refresh button
 */

'use client'

import { Search, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { JobStatus, ApiProvider, QueueFilters } from '../types'
import { getApiProviderLabel } from '../lib/utils'

interface ApiQueueFiltersProps {
  filters: QueueFilters
  onFiltersChange: (filters: QueueFilters) => void
  isAutoRefresh: boolean
  onAutoRefreshToggle: () => void
  onManualRefresh: () => void
  isRefreshing?: boolean
  activeFiltersCount?: number
}

export function ApiQueueFilters({
  filters,
  onFiltersChange,
  isAutoRefresh,
  onAutoRefreshToggle,
  onManualRefresh,
  isRefreshing = false,
  activeFiltersCount = 0,
}: ApiQueueFiltersProps) {
  const statusOptions: { value: JobStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'retrying', label: 'Retrying' },
  ]

  const apiOptions: { value: ApiProvider | 'all'; label: string }[] = [
    { value: 'all', label: 'All APIs' },
    { value: 'youtube', label: 'YouTube Data API' },
    { value: 'youtube_analytics', label: 'YouTube Analytics' },
    { value: 'openai', label: 'OpenAI API' },
    { value: 'elevenlabs', label: 'ElevenLabs API' },
    { value: 'replicate', label: 'Replicate API' },
    { value: 'aws_s3', label: 'AWS S3' },
    { value: 'custom', label: 'Custom APIs' },
  ]

  const dateOptions = [
    { value: 'hour', label: 'Last hour' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'custom', label: 'Custom range' },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full sm:w-auto min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by job ID, type, or channel..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9 h-9"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as JobStatus | 'all' })
          }
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.status !== 'all' && (
          <Badge variant="secondary" className="h-5">
            1
          </Badge>
        )}
      </div>

      {/* API Filter */}
      <div className="flex items-center gap-2">
        <Select
          value={filters.apiProvider}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              apiProvider: value as ApiProvider | 'all',
            })
          }
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="API" />
          </SelectTrigger>
          <SelectContent>
            {apiOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.apiProvider !== 'all' && (
          <Badge variant="secondary" className="h-5">
            1
          </Badge>
        )}
      </div>

      {/* Date Filter */}
      <Select
        value={filters.dateRange}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            dateRange: value as QueueFilters['dateRange'],
          })
        }
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Date" />
        </SelectTrigger>
        <SelectContent>
          {dateOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Refresh Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant={isAutoRefresh ? 'default' : 'outline'}
          size="sm"
          onClick={onAutoRefreshToggle}
          className="h-9"
        >
          <RefreshCw
            className={`h-4 w-4 ${isAutoRefresh ? 'animate-spin' : ''}`}
          />
          <span className="ml-2 hidden sm:inline">
            {isAutoRefresh ? 'Auto' : 'Manual'}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="h-9"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Active Filters Count */}
      {activeFiltersCount > 0 && (
        <Badge variant="outline" className="ml-auto">
          {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
        </Badge>
      )}
    </div>
  )
}
