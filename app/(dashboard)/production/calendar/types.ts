export type VideoStatus = 'Scheduled' | 'Posted';

export interface Channel {
  id: string;
  name: string;
  avatar: string; // URL to channel icon
  subscribers?: string;
  colorTheme: string; // Tailwind classes for styling
  solidColor: string; // Solid color for legend dot (e.g. "bg-blue-500")
  timezone?: string; // e.g. "America/Sao_Paulo" - from structure_accounts.timezone
  placeholder?: string; // The placeholder key used in production_videos
}

export interface BenchmarkVideo {
  id: string;
  title: string;
  thumbnail: string;
  youtubeVideoId?: string; // YouTube video ID for external link
}

export interface CalendarEvent {
  id: string;
  date: Date; // Full Date object for easier calendar math
  title: string;
  channel: Channel;
  status: VideoStatus;
  thumbnail?: string; // URL for video thumbnail
  scheduledTime?: string; // e.g. "14:00"
  description?: string;
  benchmarkVideo?: BenchmarkVideo;
  youtubeUrl?: string; // URL to view on YouTube (final_link)
}
