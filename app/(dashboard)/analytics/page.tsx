'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Eye, Heart, Share2, MessageCircle, Video, Calendar, Download, Filter } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  // Mock data - replace with real data from API
  const performanceData = [
    { date: 'Jan 1', views: 2400, engagement: 1200, shares: 400 },
    { date: 'Jan 8', views: 3200, engagement: 1800, shares: 600 },
    { date: 'Jan 15', views: 2800, engagement: 1400, shares: 500 },
    { date: 'Jan 22', views: 4100, engagement: 2200, shares: 800 },
    { date: 'Jan 29', views: 3800, engagement: 2000, shares: 700 },
    { date: 'Feb 5', views: 5200, engagement: 2800, shares: 1000 },
    { date: 'Feb 12', views: 4800, engagement: 2600, shares: 900 },
  ]

  const platformData = [
    { name: 'TikTok', value: 45, color: '#000000' },
    { name: 'Instagram', value: 30, color: '#E4405F' },
    { name: 'YouTube', value: 15, color: '#FF0000' },
    { name: 'Facebook', value: 10, color: '#1877F2' },
  ]

  const topVideos = [
    { id: 1, title: 'Mom Life Hack: Organizing Toys', views: 125000, likes: 8500, engagement: 6.8 },
    { id: 2, title: 'Easy Meal Prep for Busy Moms', views: 98000, likes: 6200, engagement: 6.3 },
    { id: 3, title: 'Morning Routine with 3 Kids', views: 87000, likes: 5800, engagement: 6.7 },
    { id: 4, title: 'Budget-Friendly Family Dinner', views: 76000, likes: 4900, engagement: 6.4 },
  ]

  const metrics = [
    {
      title: 'Total Views',
      value: '1.2M',
      change: '+23.5%',
      isPositive: true,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Engagement',
      value: '89.4K',
      change: '+18.2%',
      isPositive: true,
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Shares',
      value: '24.8K',
      change: '+31.7%',
      isPositive: true,
      icon: Share2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg. Engagement Rate',
      value: '7.2%',
      change: '+2.1%',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your content performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
            {['7d', '30d', '90d', 'All'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    metric.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {metric.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {metric.change} vs last period
                  </div>
                </div>
                <div className={`rounded-xl ${metric.bgColor} p-3`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Views, engagement, and shares over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="#ec4899"
                strokeWidth={3}
                dot={{ fill: '#ec4899', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="shares"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Views by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {platformData.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                    <span className="text-sm font-medium text-gray-700">{platform.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{platform.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Videos</CardTitle>
            <CardDescription>Your best content this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVideos.map((video, index) => (
                <div key={video.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{video.title}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Eye className="h-3 w-3" />
                        {video.views.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Heart className="h-3 w-3" />
                        {video.likes.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        {video.engagement}% engagement
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-600 mt-2" />
            <div>
              <p className="font-semibold text-gray-900">Best posting time: 7-9 AM EST</p>
              <p className="text-sm text-gray-600">Your videos posted in the morning get 35% more engagement</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-pink-600 mt-2" />
            <div>
              <p className="font-semibold text-gray-900">Trending topic: Organization hacks</p>
              <p className="text-sm text-gray-600">Videos about organizing are performing 42% better than average</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-600 mt-2" />
            <div>
              <p className="font-semibold text-gray-900">Increase TikTok frequency</p>
              <p className="text-sm text-gray-600">TikTok shows the highest engagement rate - consider posting 2-3x daily</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
