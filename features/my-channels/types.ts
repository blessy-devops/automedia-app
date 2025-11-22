/**
 * Types for My Channels feature
 */

export type ChannelStatus = 'active' | 'paused' | 'draft'

export interface Channel {
  id: number
  name: string
  handle: string
  avatar: string
  subscribers: string
  totalVideos: number
  totalViews: string
  avgViews: string
  publishingFrequency: string
  lastPublished: string
  status: ChannelStatus
  color: string
}
