'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Download,
  ExternalLink,
  Calendar,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E4405F',
  TIKTOK: '#000000',
  YOUTUBE: '#FF0000',
  TWITTER: '#1DA1F2',
  LINKEDIN: '#0A66C2',
}

interface AnalyticsData {
  overview: {
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
  platformBreakdown: Record<string, any>
  platformComparison: Array<any>
  performanceData: Array<any>
  engagementRateOverTime: Array<any>
  topPosts: Array<any>
  bestPostingTimes: Array<any>
  revenueData: {
    totalRevenue: number
    monthlyRecurring: number
    subscriptionActive: boolean
    tier: string
  }
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [timeRange, setTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPercent = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const { overview, platformComparison, performanceData, engagementRateOverTime, topPosts, bestPostingTimes, revenueData } = analytics

  // Overview metrics
  const metrics = [
    {
      title: 'Total Views',
      value: formatNumber(overview.totalViews),
      change: formatPercent(overview.viewsGrowth),
      isPositive: overview.viewsGrowth >= 0,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Engagement',
      value: formatNumber(overview.totalEngagement),
      change: formatPercent(overview.engagementGrowth),
      isPositive: overview.engagementGrowth >= 0,
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Total Shares',
      value: formatNumber(overview.totalShares),
      change: '+31.7%',
      isPositive: true,
      icon: Share2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg. Engagement Rate',
      value: `${overview.avgEngagementRate.toFixed(1)}%`,
      change: '+2.1%',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  // Platform pie chart data
  const platformPieData = platformComparison.map(p => ({
    name: p.platform,
    value: p.views,
    color: PLATFORM_COLORS[p.platform] || '#666666',
  }))

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your content performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
            {['7d', '30d', '90d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          const TrendIcon = metric.isPositive ? TrendingUp : TrendingDown
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendIcon className="h-4 w-4" />
                    {metric.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                <p className="text-sm text-gray-600">{metric.title}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="platforms" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Heart className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <LineChartIcon className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="timing" className="gap-2">
            <Clock className="h-4 w-4" />
            Timing
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Track your views, engagement, and shares across all platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    name="Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="#ec4899"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorEngagement)"
                    name="Engagement"
                  />
                  <Area
                    type="monotone"
                    dataKey="shares"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorShares)"
                    name="Shares"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Rate Trend</CardTitle>
              <CardDescription>How your audience engagement is evolving over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementRateOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: any) => `${value.toFixed(2)}%`}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    name="Engagement Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Views by Platform</CardTitle>
                <CardDescription>Distribution of views across all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={platformPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatNumber(entry.value)}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatNumber(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Average views per post by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={platformComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="platform" stroke="#888888" fontSize={12} />
                    <YAxis stroke="#888888" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="avgViews" fill="#8b5cf6" name="Avg Views" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="avgEngagement" fill="#ec4899" name="Avg Engagement" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Platform Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Platform Statistics</CardTitle>
              <CardDescription>Complete breakdown of performance metrics by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Platform</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Posts</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Views</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Views</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Engagement</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Engagement Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformComparison.map((platform) => (
                      <tr key={platform.platform} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: PLATFORM_COLORS[platform.platform] || '#666666' }}
                            />
                            <span className="font-medium">{platform.platform}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{platform.posts}</td>
                        <td className="text-right py-3 px-4">{formatNumber(platform.views)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(platform.avgViews)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(platform.engagement)}</td>
                        <td className="text-right py-3 px-4">
                          <span className="font-semibold text-green-600">
                            {platform.engagementRate.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-pink-100">
                    <Heart className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(overview.totalLikes)}</h3>
                <p className="text-sm text-gray-600">Total Likes</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  +15.3%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(overview.totalComments)}</h3>
                <p className="text-sm text-gray-600">Total Comments</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  +22.8%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Share2 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(overview.totalShares)}</h3>
                <p className="text-sm text-gray-600">Total Shares</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  +31.7%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Breakdown Over Time</CardTitle>
              <CardDescription>Detailed view of likes, comments, and shares</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={3} name="Total Engagement" />
                  <Line type="monotone" dataKey="shares" stroke="#8b5cf6" strokeWidth={3} name="Shares" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Top Performing Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Your best performing posts ranked by engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{post.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span
                            className="px-2 py-0.5 rounded text-white text-xs font-medium"
                            style={{ backgroundColor: PLATFORM_COLORS[post.platform] || '#666666' }}
                          >
                            {post.platform}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(post.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {formatNumber(post.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {formatNumber(post.comments)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          {post.engagementRate.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500">Engagement</div>
                      </div>
                      {post.postUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-6">
          {/* Best Posting Times */}
          <Card>
            <CardHeader>
              <CardTitle>Best Posting Times</CardTitle>
              <CardDescription>Optimal times to post based on average views per post</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={bestPostingTimes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="avgViews" fill="#10b981" name="Avg Views" radius={[8, 8, 0, 0]}>
                    {bestPostingTimes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.avgViews > 0 ? '#10b981' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Posting Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Posting Activity</CardTitle>
              <CardDescription>Number of posts published per time slot</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="posts" fill="#8b5cf6" name="Posts Published" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Data-driven recommendations to improve your performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Optimal Posting Time</h4>
                    <p className="text-sm text-gray-700">
                      Your content performs best when posted between 2PM-4PM. Consider scheduling more posts during this window.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Growing Platform</h4>
                    <p className="text-sm text-gray-700">
                      Your {platformComparison[0]?.platform || 'top platform'} engagement is up {platformComparison[0]?.engagementRate.toFixed(1)}%. Keep posting consistently to maintain momentum.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Content Strategy</h4>
                    <p className="text-sm text-gray-700">
                      Your average engagement rate is {overview.avgEngagementRate.toFixed(1)}%, which is above average. Focus on similar content types to maintain this performance.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
