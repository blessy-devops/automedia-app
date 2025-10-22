"use client"

import { SimpleChannelsTable } from './simple-channels-table'
import type { Channel } from './simple-channels-table'

interface ChannelsContentProps {
  data: Channel[]
}

export function ChannelsContent({ data }: ChannelsContentProps) {
  return <SimpleChannelsTable data={data} />
}
