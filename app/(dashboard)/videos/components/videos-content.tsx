"use client"

import { SimpleVideosTable } from './simple-videos-table'
import type { Video } from './simple-videos-table'

interface VideosContentProps {
  data: Video[]
}

export function VideosContent({ data }: VideosContentProps) {
  return <SimpleVideosTable data={data} />
}
