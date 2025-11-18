import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { tiktokService } from '@/lib/services/tiktok'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { videoId, caption } = body

    if (!videoId || !caption) {
      return NextResponse.json(
        { error: 'Video ID and caption are required' },
        { status: 400 }
      )
    }

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

    // Get video
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })

    if (!video || video.userId !== user.id) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (!video.storageUrl) {
      return NextResponse.json(
        { error: 'Video URL not available' },
        { status: 400 }
      )
    }

    // Get TikTok connection
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'TIKTOK',
        },
      },
    })

    if (!connection || !connection.isActive) {
      return NextResponse.json(
        { error: 'TikTok not connected. Please connect your TikTok account first.' },
        { status: 400 }
      )
    }

    // Check if token is expired and refresh if needed
    let accessToken = connection.accessToken

    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      if (!connection.refreshToken) {
        return NextResponse.json(
          { error: 'TikTok token expired. Please reconnect your account.' },
          { status: 401 }
        )
      }

      // Refresh token
      try {
        const refreshed = await tiktokService.refreshToken(connection.refreshToken)
        accessToken = refreshed.accessToken

        // Update connection with new tokens
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
          },
        })
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to refresh TikTok token. Please reconnect your account.' },
          { status: 401 }
        )
      }
    }

    // Publish to TikTok
    const result = await tiktokService.publishVideo({
      videoUrl: video.storageUrl,
      caption,
      accessToken,
    })

    // Create published post record
    const publishedPost = await prisma.publishedPost.create({
      data: {
        userId: user.id,
        videoId: video.id,
        platform: 'TIKTOK',
        platformPostId: result.id,
        postUrl: result.shareUrl,
        caption,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      tiktokPostId: result.id,
      shareUrl: result.shareUrl,
      publishedPost,
    })
  } catch (error: any) {
    console.error('TikTok publish error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to publish to TikTok' },
      { status: 500 }
    )
  }
}
