import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30d'

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get all published posts in date range
    const publishedPosts = await prisma.publishedPost.findMany({
      where: {
        userId: user.id,
        publishedAt: {
          gte: startDate,
        },
      },
      include: {
        video: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })

    // Calculate total metrics
    const totalViews = publishedPosts.reduce((sum, post) => sum + (post.views || 0), 0)
    const totalLikes = publishedPosts.reduce((sum, post) => sum + (post.likes || 0), 0)
    const totalComments = publishedPosts.reduce((sum, post) => sum + (post.comments || 0), 0)
    const totalShares = publishedPosts.reduce((sum, post) => sum + (post.shares || 0), 0)
    const totalEngagement = totalLikes + totalComments + totalShares
    const avgEngagementRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100) : 0

    // Platform breakdown
    const platformBreakdown = publishedPosts.reduce((acc, post) => {
      const platform = post.platform
      if (!acc[platform]) {
        acc[platform] = {
          posts: 0,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        }
      }
      acc[platform].posts += 1
      acc[platform].views += post.views || 0
      acc[platform].likes += post.likes || 0
      acc[platform].comments += post.comments || 0
      acc[platform].shares += post.shares || 0
      return acc
    }, {} as Record<string, any>)

    // Performance over time (group by week)
    const performanceOverTime = publishedPosts.reduce((acc, post) => {
      if (!post.publishedAt) return acc
      const date = new Date(post.publishedAt)
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!acc[weekKey]) {
        acc[weekKey] = {
          date: weekKey,
          views: 0,
          engagement: 0,
          shares: 0,
          posts: 0,
        }
      }

      acc[weekKey].views += post.views || 0
      acc[weekKey].engagement += (post.likes || 0) + (post.comments || 0)
      acc[weekKey].shares += post.shares || 0
      acc[weekKey].posts += 1

      return acc
    }, {} as Record<string, any>)

    const performanceData = Object.values(performanceOverTime)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))

    // Top performing posts
    const topPosts = publishedPosts
      .sort((a, b) => {
        const engagementA = (a.views || 0) + (a.likes || 0) * 10 + (a.comments || 0) * 20
        const engagementB = (b.views || 0) + (b.likes || 0) * 10 + (b.comments || 0) * 20
        return engagementB - engagementA
      })
      .slice(0, 10)
      .map(post => ({
        id: post.id,
        title: post.caption?.substring(0, 60) + (post.caption && post.caption.length > 60 ? '...' : '') || 'Untitled',
        platform: post.platform,
        views: post.views || 0,
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        engagementRate: post.views ? (((post.likes || 0) + (post.comments || 0)) / post.views * 100) : 0,
        publishedAt: post.publishedAt,
        postUrl: post.postUrl,
      }))

    // Engagement rate over time
    const engagementRateOverTime = performanceData.map((item: any) => ({
      date: item.date,
      rate: item.views > 0 ? ((item.engagement / item.views) * 100) : 0,
    }))

    // Platform comparison
    const platformComparison = Object.entries(platformBreakdown).map(([platform, data]: [string, any]) => ({
      platform,
      posts: data.posts,
      views: data.views,
      avgViews: data.posts > 0 ? Math.round(data.views / data.posts) : 0,
      engagement: data.likes + data.comments + data.shares,
      avgEngagement: data.posts > 0 ? Math.round((data.likes + data.comments + data.shares) / data.posts) : 0,
      engagementRate: data.views > 0 ? ((data.likes + data.comments + data.shares) / data.views * 100) : 0,
    }))

    // Best posting times (hour of day analysis)
    const postingTimes = publishedPosts.reduce((acc, post) => {
      if (!post.publishedAt) return acc
      const hour = new Date(post.publishedAt).getHours()
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          posts: 0,
          avgViews: 0,
          totalViews: 0,
        }
      }
      acc[hour].posts += 1
      acc[hour].totalViews += post.views || 0
      return acc
    }, {} as Record<number, any>)

    const bestPostingTimes = Object.values(postingTimes).map((item: any) => ({
      hour: item.hour,
      label: `${item.hour % 12 || 12}${item.hour < 12 ? 'AM' : 'PM'}`,
      posts: item.posts,
      avgViews: item.posts > 0 ? Math.round(item.totalViews / item.posts) : 0,
    }))

    // Growth tracking (compare to previous period)
    const periodLength = now.getTime() - startDate.getTime()
    const previousPeriodStart = new Date(startDate.getTime() - periodLength)

    const previousPosts = await prisma.publishedPost.findMany({
      where: {
        userId: user.id,
        publishedAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
    })

    const previousViews = previousPosts.reduce((sum, post) => sum + (post.views || 0), 0)
    const previousEngagement = previousPosts.reduce((sum, post) =>
      sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0), 0
    )

    const viewsGrowth = previousViews > 0 ? ((totalViews - previousViews) / previousViews * 100) : 0
    const engagementGrowth = previousEngagement > 0 ? ((totalEngagement - previousEngagement) / previousEngagement * 100) : 0

    // Get user subscription info
    const subscriptionTier = user.subscriptionTier || 'FREE'
    const subscriptionStatus = user.subscriptionStatus

    // Revenue data (if applicable)
    // This would integrate with Stripe for actual revenue tracking
    // For now, we'll provide placeholder structure
    const revenueData = {
      totalRevenue: 0, // Would come from Stripe
      monthlyRecurring: 0,
      subscriptionActive: subscriptionStatus === 'active',
      tier: subscriptionTier,
    }

    return NextResponse.json({
      overview: {
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        totalEngagement,
        avgEngagementRate,
        totalPosts: publishedPosts.length,
        viewsGrowth,
        engagementGrowth,
      },
      platformBreakdown,
      platformComparison,
      performanceData,
      engagementRateOverTime,
      topPosts,
      bestPostingTimes,
      revenueData,
      timeRange,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
