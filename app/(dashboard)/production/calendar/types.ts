export type VideoStatus = 'Scheduled' | 'Posted';

export interface Channel {
  id: string;
  name: string;
  avatar: string; // URL to channel icon
  subscribers?: string;
  colorTheme: string; // Tailwind classes for styling
}

export interface BenchmarkVideo {
  id: string;
  title: string;
  thumbnail: string;
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
}
