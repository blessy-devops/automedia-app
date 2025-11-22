/**
 * Mock data for My Channels
 * 8 channels with different statuses and metrics
 */

import type { Channel } from '../types'

export const myChannels: Channel[] = [
  {
    id: 1,
    name: 'Canal Bíblico',
    handle: '@CanalBiblico',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CB&backgroundColor=10B981',
    subscribers: '247K',
    totalVideos: 342,
    totalViews: '12.4M',
    avgViews: '36.2K',
    publishingFrequency: 'Daily',
    lastPublished: '2 hours ago',
    status: 'active',
    color: '#10B981'
  },
  {
    id: 2,
    name: 'Canal Saúde',
    handle: '@CanaldaSaude',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CS&backgroundColor=3B82F6',
    subscribers: '189K',
    totalVideos: 256,
    totalViews: '8.7M',
    avgViews: '34.0K',
    publishingFrequency: '3x week',
    lastPublished: '1 day ago',
    status: 'active',
    color: '#3B82F6'
  },
  {
    id: 3,
    name: 'Canal Tech',
    handle: '@TechAutomidia',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CT&backgroundColor=8B5CF6',
    subscribers: '92K',
    totalVideos: 178,
    totalViews: '4.2M',
    avgViews: '23.6K',
    publishingFrequency: '2x week',
    lastPublished: '3 days ago',
    status: 'active',
    color: '#8B5CF6'
  },
  {
    id: 4,
    name: 'Canal Motivação',
    handle: '@MotivaDiaria',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CM&backgroundColor=F59E0B',
    subscribers: '156K',
    totalVideos: 289,
    totalViews: '6.8M',
    avgViews: '23.5K',
    publishingFrequency: 'Daily',
    lastPublished: '5 hours ago',
    status: 'active',
    color: '#F59E0B'
  },
  {
    id: 5,
    name: 'Canal Finanças',
    handle: '@FinancasInteligentes',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CF&backgroundColor=EF4444',
    subscribers: '67K',
    totalVideos: 134,
    totalViews: '2.9M',
    avgViews: '21.6K',
    publishingFrequency: 'Weekly',
    lastPublished: '2 days ago',
    status: 'active',
    color: '#EF4444'
  },
  {
    id: 6,
    name: 'Canal História',
    handle: '@HistoriasAntrigas',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CH&backgroundColor=EC4899',
    subscribers: '34K',
    totalVideos: 67,
    totalViews: '1.2M',
    avgViews: '17.9K',
    publishingFrequency: '2x week',
    lastPublished: '1 week ago',
    status: 'paused',
    color: '#EC4899'
  },
  {
    id: 7,
    name: 'Canal Viagens',
    handle: '@ViagemAutomática',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CV&backgroundColor=14B8A6',
    subscribers: '12K',
    totalVideos: 23,
    totalViews: '456K',
    avgViews: '19.8K',
    publishingFrequency: 'Monthly',
    lastPublished: '3 weeks ago',
    status: 'draft',
    color: '#14B8A6'
  },
  {
    id: 8,
    name: 'Canal Receitas',
    handle: '@ReceitasRapidas',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CR&backgroundColor=F97316',
    subscribers: '78K',
    totalVideos: 145,
    totalViews: '3.4M',
    avgViews: '23.4K',
    publishingFrequency: '3x week',
    lastPublished: '6 hours ago',
    status: 'active',
    color: '#F97316'
  }
]
