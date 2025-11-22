/**
 * Adapters to map database rows to Channel interface
 *
 * SECURITY NOTES:
 * - Currently no RLS (Row Level Security) implemented
 * - Future: Add user_id column to structure_accounts table
 * - Future: Implement RLS policies to restrict access to own channels only
 * - Future: Add authentication checks before queries
 *
 * Example RLS implementation:
 * 1. Add user_id column: ALTER TABLE structure_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id);
 * 2. Enable RLS: ALTER TABLE structure_accounts ENABLE ROW LEVEL SECURITY;
 * 3. Create policies:
 *    - SELECT: CREATE POLICY "Users view own channels" ON structure_accounts FOR SELECT USING (auth.uid() = user_id);
 *    - INSERT: CREATE POLICY "Users create own channels" ON structure_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
 *    - UPDATE: CREATE POLICY "Users update own channels" ON structure_accounts FOR UPDATE USING (auth.uid() = user_id);
 *    - DELETE: CREATE POLICY "Users delete own channels" ON structure_accounts FOR DELETE USING (auth.uid() = user_id);
 */

import type { Channel, ChannelStatus } from '../types'

/**
 * Database row from structure_accounts table
 */
export interface StructureAccountRow {
  id: number
  name: string
  channel_id: string
  handle?: string
  language?: string
  is_active?: boolean
  timezone?: string
  niche?: string
  subniche?: string
  brand_id?: number
  platform?: string
  created_at?: string
  updated_at?: string
}

/**
 * Generate Dicebear avatar URL from channel name
 */
function generateAvatar(name: string, color: string): string {
  const seed = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
  const bgColor = color.replace('#', '')
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=${bgColor}`
}

/**
 * Generate random color for channel avatar
 */
function getChannelColor(id: number): string {
  const colors = [
    '#10B981', // green
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#F59E0B', // amber
    '#EF4444', // red
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ]
  return colors[id % colors.length]
}

/**
 * Determine channel status based on is_active flag
 */
function getChannelStatus(isActive?: boolean): ChannelStatus {
  // TODO: Add logic to determine paused/draft status when we have more data
  // For now, active channels are 'active', inactive are 'paused'
  return isActive === false ? 'paused' : 'active'
}

/**
 * Format number to compact string (e.g., 247000 -> "247K")
 */
function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`
  }
  return num.toString()
}

/**
 * Maps database row from structure_accounts to Channel interface
 */
export function mapStructureAccountToChannel(row: StructureAccountRow): Channel {
  const color = getChannelColor(row.id)

  return {
    id: row.id,
    name: row.name,
    handle: row.handle || `@${row.name.replace(/\s+/g, '')}`,
    avatar: generateAvatar(row.name, color),
    // TODO: Fetch real metrics from YouTube API or structure_brand_bible
    subscribers: '0', // Placeholder - needs YouTube API integration
    totalVideos: 0, // Placeholder - needs production_videos count
    totalViews: '0', // Placeholder - needs YouTube API integration
    avgViews: '0', // Placeholder - needs calculation from videos
    publishingFrequency: 'Not set', // Placeholder - needs structure_posting_slots
    lastPublished: 'Never', // Placeholder - needs production_videos query
    status: getChannelStatus(row.is_active),
    color,
  }
}

/**
 * Maps array of database rows to Channel array
 */
export function mapStructureAccountsToChannels(rows: StructureAccountRow[]): Channel[] {
  if (!rows || rows.length === 0) return []
  return rows.map(mapStructureAccountToChannel)
}
