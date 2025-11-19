'use client'

import { Video, Eye, Heart, TrendingUp } from 'lucide-react'
import { ProfessionalMetricCard } from './ProfessionalMetricCard'
import { PerformanceChart } from './PerformanceChart'
import { TopVideosGrid } from './TopVideosGrid'
import { QuickActionsBar } from './QuickActionsBar'
import { PlatformStatusPanel } from './PlatformStatusPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useVideos } from '@/hooks/useVideos'
import { usePlatformStatus } from '@/hooks/usePlatformStatus'

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export function ActiveDashboard() {
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics('30d')
  const { data: videosData, isLoading: videosLoading } = useVideos({ page: 1, pageSize: 6 })
  const { data: platformData } = usePlatformStatus()

  const isLoading = analyticsLoading || videosLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const totalVideos = videosData?.total || 0
  const totalViews = analyticsData?.overview?.totalViews || 0
  const avgEngagementRate = analyticsData?.overview?.avgEngagementRate || 0
  const viewsGrowth = analyticsData?.overview?.viewsGrowth || 0
  const engagementGrowth = analyticsData?.overview?.engagementGrowth || 0

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, Creator!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's how your content is performing today
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <ProfessionalMetricCard
          title="Total Videos"
          value={totalVideos}
          icon={Video}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <ProfessionalMetricCard
          title="Total Views"
          value={formatNumber(totalViews)}
          icon={Eye}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={viewsGrowth !== 0 ? {
            value: Math.abs(viewsGrowth),
            isPositive: viewsGrowth > 0,
            comparison: 'from last period',
          } : undefined}
        />
        <ProfessionalMetricCard
          title="Total Engagement"
          value={formatNumber(analyticsData?.overview?.totalEngagement || 0)}
          icon={Heart}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-100"
          trend={engagementGrowth !== 0 ? {
            value: Math.abs(engagementGrowth),
            isPositive: engagementGrowth > 0,
            comparison: 'from last period',
          } : undefined}
        />
        <ProfessionalMetricCard
          title="Engagement Rate"
          value={avgEngagementRate.toFixed(1) + '%'}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <QuickActionsBar />
      </div>

      {/* Performance Chart */}
      {analyticsData?.performanceData && analyticsData.performanceData.length > 0 && (
        <PerformanceChart data={analyticsData.performanceData} />
      )}

      {/* Recent Videos */}
      {videosData && videosData.videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Videos</h2>
              <p className="text-sm text-gray-600 mt-1">Your latest uploaded videos</p>
            </div>
            <a
              href="/videos"
              className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              View All Videos →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videosData.videos.slice(0, 6).map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                      <Video className="h-12 w-12 text-purple-400" />
                    </div>
                  )}
                  {video.status === 'READY' && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center group">
                      <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all">
                        <Eye className="h-6 w-6 text-transparent group-hover:text-purple-600 transition-all" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate mb-2">{video.originalName}</h3>
                  {video.analytics && video.analytics.totalViews > 0 && (
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(video.analytics.totalViews)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(video.analytics.totalLikes)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Status Panel */}
      <PlatformStatusPanel
        connections={platformData?.connections.map(conn => ({
          platform: conn.platform,
          isConnected: conn.isActive,
          accountName: conn.accountName || undefined,
          accountHandle: conn.accountHandle || undefined,
        }))}
      />
    </div>
  )
}
