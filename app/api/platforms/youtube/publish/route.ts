import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { youtubeService } from '@/lib/services/youtube'

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
    const { videoId, title, description, isShort = false } = body

    if (!videoId || !title) {
      return NextResponse.json(
        { error: 'Video ID and title are required' },
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

    // Get YouTube connection
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'YOUTUBE',
        },
      },
    })

    if (!connection || !connection.isActive) {
      return NextResponse.json(
        { error: 'YouTube not connected. Please connect your YouTube account first.' },
        { status: 400 }
      )
    }

    // Check if token is expired and refresh if needed
    let accessToken = connection.accessToken

    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      if (!connection.refreshToken) {
        return NextResponse.json(
          { error: 'YouTube token expired. Please reconnect your account.' },
          { status: 401 }
        )
      }

      // Refresh token
      try {
        const refreshed = await youtubeService.refreshToken(connection.refreshToken)
        accessToken = refreshed.accessToken

        // Update connection with new token
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: refreshed.accessToken,
            tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
          },
        })
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to refresh YouTube token. Please reconnect your account.' },
          { status: 401 }
        )
      }
    }

    // Publish to YouTube
    const result = await youtubeService.publishVideo({
      videoUrl: video.storageUrl,
      title,
      description: description || '',
      accessToken,
      isShort,
    })

    // Create published post record
    const publishedPost = await prisma.publishedPost.create({
      data: {
        userId: user.id,
        videoId: video.id,
        platform: 'YOUTUBE',
        platformPostId: result.id,
        postUrl: result.url,
        caption: description || '',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      youtubeVideoId: result.id,
      url: result.url,
      publishedPost,
    })
  } catch (error: any) {
    console.error('YouTube publish error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to publish to YouTube' },
      { status: 500 }
    )
  }
}
