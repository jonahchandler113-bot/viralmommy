'use client'

import { Video, Eye, Heart, TrendingUp } from 'lucide-react'
import { ProfessionalMetricCard } from './ProfessionalMetricCard'
import { PerformanceChart } from './PerformanceChart'
import { TopVideosGrid } from './TopVideosGrid'
import { QuickActionsBar } from './QuickActionsBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock data - this will be replaced with real API data
const mockPerformanceData = [
  { date: 'Mon', views: 1200, engagement: 8.2 },
  { date: 'Tue', views: 1800, engagement: 9.1 },
  { date: 'Wed', views: 1500, engagement: 7.8 },
  { date: 'Thu', views: 2300, engagement: 10.5 },
  { date: 'Fri', views: 2800, engagement: 11.2 },
  { date: 'Sat', views: 3200, engagement: 12.1 },
  { date: 'Sun', views: 2900, engagement: 10.8 },
]

const mockTopVideos = [
  {
    id: '1',
    title: 'Morning Routine as a Mom of 3',
    thumbnail: '/api/placeholder/400/700',
    views: 125000,
    likes: 12500,
    comments: 856,
    shares: 2340,
    engagementRate: 12.4,
    platform: 'tiktok' as const,
  },
  {
    id: '2',
    title: 'Quick 5-Minute Meal Prep Hack',
    thumbnail: '/api/placeholder/400/700',
    views: 98000,
    likes: 9200,
    comments: 643,
    shares: 1890,
    engagementRate: 11.9,
    platform: 'instagram' as const,
  },
  {
    id: '3',
    title: 'Day in the Life Vlog',
    thumbnail: '/api/placeholder/400/700',
    views: 76000,
    likes: 7100,
    comments: 421,
    shares: 980,
    engagementRate: 11.2,
    platform: 'youtube' as const,
  },
  {
    id: '4',
    title: 'Budget-Friendly Shopping Tips',
    thumbnail: '/api/placeholder/400/700',
    views: 54000,
    likes: 5400,
    comments: 312,
    shares: 890,
    engagementRate: 12.6,
    platform: 'facebook' as const,
  },
]

export function ActiveDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, Creator! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Here's how your content is performing today
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ProfessionalMetricCard
          title="Total Videos"
          value={24}
          icon={Video}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <ProfessionalMetricCard
          title="Total Views"
          value="125.4K"
          icon={Eye}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{
            value: 23,
            isPositive: true,
            comparison: 'from last week',
          }}
        />
        <ProfessionalMetricCard
          title="Engagement Rate"
          value="10.8%"
          icon={Heart}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-100"
          trend={{
            value: 1.2,
            isPositive: true,
            comparison: 'from last week',
          }}
        />
        <ProfessionalMetricCard
          title="Viral Score"
          value="8.5/10"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{
            value: 0.5,
            isPositive: true,
            comparison: 'from last week',
          }}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <QuickActionsBar />
      </div>

      {/* Performance Chart */}
      <PerformanceChart data={mockPerformanceData} />

      {/* Top Performing Videos */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Top Performing Videos</h2>
            <p className="text-sm text-gray-600 mt-1">Your best content from the last 30 days</p>
          </div>
        </div>
        <TopVideosGrid videos={mockTopVideos} />
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: 'New comment',
                video: 'Morning Routine as a Mom of 3',
                time: '2 hours ago',
                platform: 'TikTok',
                type: 'comment',
              },
              {
                action: 'Video published',
                video: 'Quick 5-Minute Meal Prep Hack',
                time: 'Yesterday',
                platform: 'Instagram',
                type: 'upload',
              },
              {
                action: 'Reached 1K views',
                video: 'Day in the Life Vlog',
                time: '2 days ago',
                platform: 'YouTube',
                type: 'milestone',
              },
              {
                action: 'New share',
                video: 'Budget-Friendly Shopping Tips',
                time: '3 days ago',
                platform: 'Facebook',
                type: 'share',
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className={`rounded-full p-2 ${
                  activity.type === 'comment' ? 'bg-blue-100' :
                  activity.type === 'upload' ? 'bg-green-100' :
                  activity.type === 'milestone' ? 'bg-yellow-100' :
                  'bg-purple-100'
                }`}>
                  {activity.type === 'comment' && '💬'}
                  {activity.type === 'upload' && '📹'}
                  {activity.type === 'milestone' && '🎉'}
                  {activity.type === 'share' && '🔄'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.video} · {activity.platform}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
