// YouTube utility functions

/**
 * Generates YouTube thumbnail URL from video ID
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality (default: hqdefault)
 * @returns YouTube thumbnail URL
 */
export function getYouTubeThumbnail(
  videoId: string | undefined | null,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string {
  if (!videoId) {
    return 'https://placehold.co/400x225/1e293b/94a3b8?text=No+Thumbnail'
  }

  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Extracts video ID from YouTube URL
 * @param url - YouTube URL
 * @returns Video ID or null
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}
