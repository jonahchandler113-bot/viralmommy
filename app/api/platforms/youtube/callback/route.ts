import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for OAuth errors
    if (error) {
      console.error('YouTube OAuth error:', error)
      return NextResponse.redirect(
        new URL('/settings?error=youtube_denied', request.url)
      )
    }

    if (!code || !session?.user?.email) {
      return NextResponse.redirect(
        new URL('/settings?error=youtube_invalid', request.url)
      )
    }

    // Verify state matches user email
    if (state !== session.user.email) {
      return NextResponse.redirect(
        new URL('/settings?error=youtube_state_mismatch', request.url)
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/platforms/youtube/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('YouTube token exchange error:', tokenData)
      return NextResponse.redirect(
        new URL('/settings?error=youtube_token_failed', request.url)
      )
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in || 3600 // Default 1 hour

    // Get YouTube channel info
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    const channelData = await channelResponse.json()

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.redirect(
        new URL('/settings?error=no_youtube_channel', request.url)
      )
    }

    const channel = channelData.items[0]
    const channelId = channel.id
    const channelTitle = channel.snippet.title

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/settings?error=user_not_found', request.url)
      )
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

    // Store platform connection
    await prisma.platformConnection.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'YOUTUBE',
        },
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiresAt,
        accountId: channelId,
        accountName: channelTitle,
        accountHandle: channel.snippet.customUrl || undefined,
        isActive: true,
        metadata: {
          channelId,
          channelTitle,
          thumbnailUrl: channel.snippet.thumbnails?.default?.url,
        },
      },
      create: {
        userId: user.id,
        platform: 'YOUTUBE',
        accessToken,
        refreshToken,
        tokenExpiresAt,
        accountId: channelId,
        accountName: channelTitle,
        accountHandle: channel.snippet.customUrl || undefined,
        isActive: true,
        metadata: {
          channelId,
          channelTitle,
          thumbnailUrl: channel.snippet.thumbnails?.default?.url,
        },
      },
    })

    console.log('YouTube connected successfully:', {
      userId: user.id,
      channelId,
      channelTitle,
    })

    return NextResponse.redirect(
      new URL('/settings?success=youtube_connected', request.url)
    )
  } catch (error) {
    console.error('YouTube callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=youtube_callback_failed', request.url)
    )
  }
}
