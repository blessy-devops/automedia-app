import { CalendarEvent, Channel } from './types';

export const CHANNELS: Record<string, Channel> = {
  main: {
    id: 'c1',
    name: 'Automedia Official',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    colorTheme: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900',
    solidColor: 'bg-blue-500',
  },
  gaming: {
    id: 'c2',
    name: 'Retro Gaming Hub',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=ffdfbf',
    colorTheme: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900',
    solidColor: 'bg-purple-500',
  },
  tech: {
    id: 'c3',
    name: 'Tech Breakdown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
    colorTheme: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900',
    solidColor: 'bg-emerald-500',
  },
  vlog: {
    id: 'c4',
    name: 'Daily Life',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffdfbf',
    colorTheme: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900',
    solidColor: 'bg-orange-500',
  },
};

// Helper to create dates relative to today for the demo
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

const getDate = (day: number) => new Date(currentYear, currentMonth, day);

const baseEvents: CalendarEvent[] = [
  {
    id: '142',
    date: getDate(2),
    title: 'The Future of AI in 2025',
    channel: CHANNELS.tech,
    status: 'Posted',
    scheduledTime: '10:00',
    thumbnail: 'https://picsum.photos/id/1/400/225',
    description: 'Exploring how generative AI models like Gemini 2.5 are reshaping content creation workflows.',
    benchmarkVideo: {
      id: '8829',
      title: 'AI Revolution Explained',
      thumbnail: 'https://picsum.photos/id/2/200/112'
    }
  },
  {
    id: '285',
    date: getDate(5),
    title: 'Super Mario World Speedrun',
    channel: CHANNELS.gaming,
    status: 'Posted',
    scheduledTime: '16:00',
    thumbnail: 'https://picsum.photos/id/96/400/225',
    benchmarkVideo: {
      id: '1102',
      title: 'World Record Speedrun Any%',
      thumbnail: 'https://picsum.photos/id/98/200/112'
    }
  },
  {
    id: '391',
    date: getDate(10),
    title: 'My Morning Routine 2024',
    channel: CHANNELS.vlog,
    status: 'Posted',
    scheduledTime: '09:00',
    thumbnail: 'https://picsum.photos/id/338/400/225',
    description: 'A chill look at how I start my day for maximum productivity and mental clarity.',
    benchmarkVideo: {
      id: '4451',
      title: 'Productive 5AM Morning Routine',
      thumbnail: 'https://picsum.photos/id/340/200/112'
    }
  },
  {
    id: '402',
    date: getDate(12),
    title: 'Automedia Platform Launch',
    channel: CHANNELS.main,
    status: 'Scheduled',
    scheduledTime: '12:00',
    thumbnail: 'https://picsum.photos/id/445/400/225',
    benchmarkVideo: {
      id: '9900',
      title: 'SaaS Product Launch Strategy',
      thumbnail: 'https://picsum.photos/id/450/200/112'
    }
  },
  {
    id: '515',
    date: getDate(15),
    title: 'Reviewing the iPhone 16',
    channel: CHANNELS.tech,
    status: 'Scheduled',
    scheduledTime: '10:00',
    thumbnail: 'https://picsum.photos/id/0/400/225'
  },
  {
    id: '678',
    date: getDate(18),
    title: 'Best RPGs of the Decade',
    channel: CHANNELS.gaming,
    status: 'Scheduled',
    scheduledTime: '14:00',
    thumbnail: 'https://picsum.photos/id/155/400/225',
    benchmarkVideo: {
      id: '7721',
      title: 'Top 10 RPGs You Must Play',
      thumbnail: 'https://picsum.photos/id/160/200/112'
    }
  },
  {
    id: '723',
    date: getDate(20),
    title: 'Q&A: Answering Your Questions',
    channel: CHANNELS.vlog,
    status: 'Scheduled',
    scheduledTime: '18:00',
    thumbnail: 'https://picsum.photos/id/342/400/225'
  },
  {
    id: '891',
    date: getDate(25),
    title: 'How to use Gemini API',
    channel: CHANNELS.tech,
    status: 'Scheduled',
    scheduledTime: '11:00',
    thumbnail: 'https://picsum.photos/id/60/400/225'
  },
  {
    id: '944',
    date: getDate(28),
    title: 'Setup Tour 2025',
    channel: CHANNELS.gaming,
    status: 'Scheduled',
    scheduledTime: '18:30',
    thumbnail: 'https://picsum.photos/id/48/400/225'
  }
];

// Generate a "Content Sprint" day with many videos to test scrolling
const sprintDay = 22;
const sprintEvents: CalendarEvent[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `${800 + i}`,
    date: getDate(sprintDay),
    title: `Sprint Video Content #${i + 1}`,
    channel: i % 2 === 0 ? CHANNELS.main : CHANNELS.gaming,
    status: i < 5 ? 'Posted' : 'Scheduled',
    scheduledTime: `${8 + i}:00`,
    thumbnail: `https://picsum.photos/id/${100 + i}/400/225`,
    benchmarkVideo: {
      id: `99${i}`,
      title: `Viral Reference #${i + 1}`,
      thumbnail: `https://picsum.photos/id/${120 + i}/200/112`
    }
}));

export const MOCK_EVENTS: CalendarEvent[] = [...baseEvents, ...sprintEvents];
