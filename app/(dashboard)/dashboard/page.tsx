'use client'

import { Video, Eye, TrendingUp, Heart, Upload, Sparkles } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'

export default function DashboardPage() {
  // Mock data - replace with actual data from API
  const stats = {
    totalVideos: 24,
    videosThisMonth: 8,
    totalViews: 125400,
    engagementRate: 8.5,
  }

  const recentVideos = [] // Empty for demo

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, Mom Creator!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your content today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Videos"
            value={stats.totalVideos}
            icon={Video}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title="Videos This Month"
            value={stats.videosThisMonth}
            change={{ value: 12, label: 'from last month' }}
            icon={TrendingUp}
            iconColor="text-success-600"
            iconBgColor="bg-success-100"
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews.toLocaleString()}
            change={{ value: 23, label: 'from last month' }}
            icon={Eye}
            iconColor="text-pink-600"
            iconBgColor="bg-pink-100"
          />
          <StatCard
            title="Engagement Rate"
            value={`${stats.engagementRate}%`}
            change={{ value: 1.2, label: 'from last month' }}
            icon={Heart}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* Upload CTA */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-2xl">
                  Ready to create your next viral hit?
                </CardTitle>
                <CardDescription className="text-white/90 mt-2">
                  Upload a video and let our AI transform it into engaging content that resonates with your audience
                </CardDescription>
              </div>
              <Sparkles className="h-12 w-12 text-white/90" />
            </div>
          </CardHeader>
          <CardContent>
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90">
              <Upload className="mr-2 h-5 w-5" />
              Upload New Video
            </Button>
          </CardContent>
        </Card>

        {/* Recent Videos Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Videos</h2>
            <Button variant="outline">View All</Button>
          </div>

          {recentVideos.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Video}
                  title="No videos yet"
                  description="Upload your first video to get started with AI-powered content creation"
                  action={{
                    label: 'Upload Video',
                    onClick: () => console.log('Upload clicked')
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Video cards will go here */}
            </div>
          )}
        </div>

        {/* Quick Tips Card */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Pro Tips for Viral Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-purple-600 p-1 mt-0.5">
                  <div className="h-1 w-1 bg-white rounded-full" />
                </div>
                <span>Upload videos during peak hours (6-9 PM) for maximum visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-purple-600 p-1 mt-0.5">
                  <div className="h-1 w-1 bg-white rounded-full" />
                </div>
                <span>Use trending audio and hashtags to boost discoverability</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-purple-600 p-1 mt-0.5">
                  <div className="h-1 w-1 bg-white rounded-full" />
                </div>
                <span>Hook viewers in the first 3 seconds with eye-catching visuals</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-purple-600 p-1 mt-0.5">
                  <div className="h-1 w-1 bg-white rounded-full" />
                </div>
                <span>Post consistently - aim for 3-5 videos per week</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
