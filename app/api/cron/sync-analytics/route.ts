import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// This endpoint should be called by a cron job (e.g., hourly)
// On Railway, you can use Railway Cron or an external service like Cron-job.org
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting analytics sync...')

    // Get all published posts from the last 90 days that need syncing
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const postsToSync = await prisma.publishedPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: ninetyDaysAgo,
        },
        // Only sync posts that haven't been synced in the last hour
        OR: [
          { lastSyncedAt: null },
          {
            lastSyncedAt: {
              lt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            },
          },
        ],
      },
      include: {
        user: {
          include: {
            platformConnections: true,
          },
        },
      },
      take: 100, // Process 100 posts per run to avoid timeouts
    })

    console.log(`Found ${postsToSync.length} posts to sync`)

    let successCount = 0
    let errorCount = 0

    for (const post of postsToSync) {
      try {
        // Find the platform connection for this post
        const connection = post.user.platformConnections.find(
          (c) => c.platform === post.platform
        )

        if (!connection) {
          console.log(`No connection found for ${post.platform} - skipping post ${post.id}`)
          continue
        }

        // Sync analytics based on platform
        let analytics: any = null

        switch (post.platform) {
          case 'FACEBOOK':
            analytics = await syncFacebookAnalytics(post, connection)
            break
          case 'INSTAGRAM':
            analytics = await syncInstagramAnalytics(post, connection)
            break
          case 'TIKTOK':
            analytics = await syncTikTokAnalytics(post, connection)
            break
          case 'YOUTUBE':
            analytics = await syncYouTubeAnalytics(post, connection)
            break
          default:
            console.log(`Unknown platform: ${post.platform}`)
            continue
        }

        if (analytics) {
          // Update post with new analytics
          await prisma.publishedPost.update({
            where: { id: post.id },
            data: {
              views: analytics.views || 0,
              likes: analytics.likes || 0,
              comments: analytics.comments || 0,
              shares: analytics.shares || 0,
              saves: analytics.saves || 0,
              engagementRate: analytics.engagementRate || null,
              lastSyncedAt: new Date(),
            },
          })

          successCount++
          console.log(`Synced analytics for post ${post.id} (${post.platform})`)
        }
      } catch (error) {
        console.error(`Error syncing post ${post.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics sync completed',
      stats: {
        totalPosts: postsToSync.length,
        successCount,
        errorCount,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Analytics sync error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync analytics',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Sync Facebook analytics
 */
async function syncFacebookAnalytics(post: any, connection: any) {
  try {
    if (!post.platformPostId) return null

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${post.platformPostId}?fields=insights.metric(post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total)&access_token=${connection.accessToken}`
    )

    if (!response.ok) {
      // Try to refresh token if expired
      if (response.status === 401 || response.status === 190) {
        console.log('Facebook token expired, needs manual refresh')
        return null
      }
      throw new Error(`Facebook API error: ${response.status}`)
    }

    const data = await response.json()
    const insights = data.insights?.data || []

    let views = 0
    let engagedUsers = 0
    let clicks = 0
    let reactions = 0

    insights.forEach((insight: any) => {
      const metric = insight.name
      const value = insight.values?.[0]?.value || 0

      switch (metric) {
        case 'post_impressions':
          views = value
          break
        case 'post_engaged_users':
          engagedUsers = value
          break
        case 'post_clicks':
          clicks = value
          break
        case 'post_reactions_by_type_total':
          reactions = Object.values(value as any).reduce((sum: number, val: any) => sum + (val || 0), 0)
          break
      }
    })

    return {
      views,
      likes: reactions,
      comments: 0, // Facebook doesn't provide comment count in insights
      shares: clicks,
      saves: 0,
      engagementRate: views > 0 ? ((engagedUsers / views) * 100) : 0,
    }
  } catch (error) {
    console.error('Facebook analytics sync error:', error)
    return null
  }
}

/**
 * Sync Instagram analytics
 */
async function syncInstagramAnalytics(post: any, connection: any) {
  try {
    if (!post.platformPostId) return null

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${post.platformPostId}/insights?metric=impressions,reach,likes,comments,saves,shares&access_token=${connection.accessToken}`
    )

    if (!response.ok) {
      if (response.status === 401 || response.status === 190) {
        console.log('Instagram token expired, needs manual refresh')
        return null
      }
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data = await response.json()
    const insights = data.data || []

    let views = 0
    let likes = 0
    let comments = 0
    let shares = 0
    let saves = 0

    insights.forEach((insight: any) => {
      const metric = insight.name
      const value = insight.values?.[0]?.value || 0

      switch (metric) {
        case 'impressions':
          views = value
          break
        case 'likes':
          likes = value
          break
        case 'comments':
          comments = value
          break
        case 'shares':
          shares = value
          break
        case 'saves':
          saves = value
          break
      }
    })

    return {
      views,
      likes,
      comments,
      shares,
      saves,
      engagementRate: views > 0 ? (((likes + comments + shares + saves) / views) * 100) : 0,
    }
  } catch (error) {
    console.error('Instagram analytics sync error:', error)
    return null
  }
}

/**
 * Sync TikTok analytics
 */
async function syncTikTokAnalytics(post: any, connection: any) {
  try {
    if (!post.platformPostId) return null

    // Check if token needs refresh
    let accessToken = connection.accessToken
    if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
      // Token expired, try to refresh
      accessToken = await refreshTikTokToken(connection)
      if (!accessToken) return null
    }

    const response = await fetch(
      `https://open.tiktokapis.com/v2/video/query/?fields=id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            video_ids: [post.platformPostId],
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`TikTok API error: ${response.status}`)
    }

    const data = await response.json()
    const video = data.data?.videos?.[0]

    if (!video) return null

    return {
      views: video.view_count || 0,
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
      saves: 0, // TikTok doesn't provide saves count
      engagementRate: video.view_count > 0
        ? (((video.like_count + video.comment_count + video.share_count) / video.view_count) * 100)
        : 0,
    }
  } catch (error) {
    console.error('TikTok analytics sync error:', error)
    return null
  }
}

/**
 * Sync YouTube analytics
 */
async function syncYouTubeAnalytics(post: any, connection: any) {
  try {
    if (!post.platformPostId) return null

    // Check if token needs refresh
    let accessToken = connection.accessToken
    if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
      // Token expired, try to refresh
      accessToken = await refreshYouTubeToken(connection)
      if (!accessToken) return null
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${post.platformPostId}&access_token=${accessToken}`
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    const video = data.items?.[0]

    if (!video) return null

    const stats = video.statistics

    const views = parseInt(stats.viewCount || '0')
    const likes = parseInt(stats.likeCount || '0')
    const comments = parseInt(stats.commentCount || '0')

    return {
      views,
      likes,
      comments,
      shares: 0, // YouTube doesn't provide share count via API
      saves: 0,
      engagementRate: views > 0 ? (((likes + comments) / views) * 100) : 0,
    }
  } catch (error) {
    console.error('YouTube analytics sync error:', error)
    return null
  }
}

/**
 * Refresh TikTok access token
 */
async function refreshTikTokToken(connection: any): Promise<string | null> {
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()

    // Update connection with new tokens
    await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    })

    return data.access_token
  } catch (error) {
    console.error('TikTok token refresh error:', error)
    return null
  }
}

/**
 * Refresh YouTube access token
 */
async function refreshYouTubeToken(connection: any): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()

    // Update connection with new token
    await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: data.access_token,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    })

    return data.access_token
  } catch (error) {
    console.error('YouTube token refresh error:', error)
    return null
  }
}
