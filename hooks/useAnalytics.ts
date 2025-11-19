import { useQuery } from '@tanstack/react-query'

export interface AnalyticsOverview {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  totalEngagement: number
  avgEngagementRate: number
  totalPosts: number
  viewsGrowth: number
  engagementGrowth: number
}

export interface PlatformBreakdown {
  [platform: string]: {
    posts: number
    views: number
    likes: number
    comments: number
    shares: number
  }
}

export interface PerformanceDataPoint {
  date: string
  views: number
  engagement: number
  shares: number
  posts: number
}

export interface TopPost {
  id: string
  title: string
  platform: string
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
  publishedAt: string | null
  postUrl: string | null
}

export interface AnalyticsData {
  overview: AnalyticsOverview
  platformBreakdown: PlatformBreakdown
  performanceData: PerformanceDataPoint[]
  topPosts: TopPost[]
  timeRange: string
}

export function useAnalytics(timeRange: '7d' | '30d' | '90d' | 'all' = '30d') {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      return response.json()
    },
    staleTime: 60000, // 1 minute
  })
}
