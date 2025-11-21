'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatLargeNumber } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { MonitoringSinceText } from './monitoring-since-badge'
import { Outlier10xBadge } from './outlier-10x-badge'
import { RemoveFromRadarButton } from './remove-from-radar-button'
import { ManualUpdateButton } from './manual-update-button'

export type RadarChannel = {
  id: number
  channel_id: string
  channel_database_id: number
  channel_name: string
  thumbnail_url: string | null
  subscriber_count: number | null
  total_views: number | null
  video_upload_count: number | null
  added_at: string
  last_update_at: string | null
  next_update_at: string | null
  update_frequency: string
  is_active: boolean
  has_10x_outlier: boolean
  notes: string | null
}

interface RadarChannelsTableProps {
  data: RadarChannel[]
  onChannelRemoved?: () => void
}

type SortField =
  | 'channel_name'
  | 'subscriber_count'
  | 'added_at'
  | 'last_update_at'
  | 'has_10x_outlier'
type SortOrder = 'asc' | 'desc'

export function RadarChannelsTable({ data, onChannelRemoved }: RadarChannelsTableProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('added_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return data
    const searchLower = search.toLowerCase()
    return data.filter((channel) => channel.channel_name?.toLowerCase().includes(searchLower))
  }, [data, search])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        comparison = aVal === bVal ? 0 : aVal ? -1 : 1
      } else {
        comparison = (aVal as number) - (bVal as number)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filtered, sortField, sortOrder])

  // Paginate
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  const totalPages = Math.ceil(sorted.length / pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="-ml-4 h-8 hover:bg-transparent"
    >
      {children}
      <ArrowUpDown
        className={`ml-2 h-4 w-4 ${sortField === field ? 'opacity-100' : 'opacity-50'}`}
      />
    </Button>
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search channels by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1) // Reset to first page on search
          }}
          className="h-9 pl-8"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Thumb</TableHead>
              <TableHead>
                <SortButton field="channel_name">Channel</SortButton>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortButton field="subscriber_count">Subscribers</SortButton>
              </TableHead>
              <TableHead className="w-[140px]">
                <SortButton field="added_at">Monitoring Since</SortButton>
              </TableHead>
              <TableHead className="w-[140px]">
                <SortButton field="last_update_at">Last Update</SortButton>
              </TableHead>
              <TableHead className="w-[140px]">Next Update</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length > 0 ? (
              paginated.map((channel) => (
                <TableRow key={channel.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    {channel.thumbnail_url && (
                      <Image
                        src={channel.thumbnail_url}
                        alt={channel.channel_name || 'Channel thumbnail'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/benchmark/channels/${channel.channel_database_id}`} className="hover:underline">
                      <div className="flex flex-col gap-1">
                        <span>{channel.channel_name || 'Unnamed Channel'}</span>
                        {channel.has_10x_outlier && <Outlier10xBadge has10xOutlier={true} />}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>{formatLargeNumber(channel.subscriber_count)}</TableCell>
                  <TableCell>
                    <MonitoringSinceText addedAt={channel.added_at} />
                  </TableCell>
                  <TableCell>
                    {channel.last_update_at ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(channel.last_update_at))} ago
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {channel.next_update_at ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(channel.next_update_at))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {channel.is_active ? (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Paused
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ManualUpdateButton
                        channelId={channel.channel_id}
                        channelName={channel.channel_name}
                        lastUpdateAt={channel.last_update_at}
                        onSuccess={() => {
                          // Refresh data after manual update
                        }}
                      />
                      <RemoveFromRadarButton
                        channelId={channel.channel_id}
                        channelName={channel.channel_name}
                        onSuccess={onChannelRemoved}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No channels in radar yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {sorted.length} channel(s) monitored
          {search && ` (filtered from ${data.length})`}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {page} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
