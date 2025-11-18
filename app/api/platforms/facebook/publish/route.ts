import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { facebookService } from '@/lib/services/facebook'

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
    const { videoId, caption, publishToInstagram = false } = body

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

    // Get Facebook connection
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'FACEBOOK',
        },
      },
    })

    if (!connection || !connection.isActive) {
      return NextResponse.json(
        { error: 'Facebook not connected. Please connect your Facebook account first.' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Facebook token expired. Please reconnect your account.' },
        { status: 401 }
      )
    }

    const pageId = connection.accountId
    const accessToken = connection.accessToken

    // Publish to Facebook
    const result = await facebookService.publishVideo({
      videoUrl: video.storageUrl,
      caption,
      accessToken,
      pageId,
    })

    // Create published post record
    const publishedPost = await prisma.publishedPost.create({
      data: {
        userId: user.id,
        videoId: video.id,
        platform: 'FACEBOOK',
        platformPostId: result.id,
        caption,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })

    // If Instagram is connected and user wants to publish there too
    if (publishToInstagram) {
      const instagramConnection = await prisma.platformConnection.findUnique({
        where: {
          userId_platform: {
            userId: user.id,
            platform: 'INSTAGRAM',
          },
        },
      })

      if (instagramConnection && instagramConnection.isActive) {
        const instagramAccountId = instagramConnection.accountId

        try {
          const instagramResult = await facebookService.publishToInstagram({
            videoUrl: video.storageUrl,
            caption,
            accessToken,
            instagramAccountId,
            pageId,
          })

          await prisma.publishedPost.create({
            data: {
              userId: user.id,
              videoId: video.id,
              platform: 'INSTAGRAM',
              platformPostId: instagramResult.id,
              caption,
              status: 'PUBLISHED',
              publishedAt: new Date(),
            },
          })
        } catch (error) {
          console.error('Instagram publish error:', error)
          // Don't fail the whole request if Instagram fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      facebookPostId: result.id,
      publishedPost,
    })
  } catch (error: any) {
    console.error('Facebook publish error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to publish to Facebook' },
      { status: 500 }
    )
  }
}
