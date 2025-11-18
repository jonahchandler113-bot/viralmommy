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
      console.error('TikTok OAuth error:', error)
      return NextResponse.redirect(
        new URL('/settings?error=tiktok_denied', request.url)
      )
    }

    if (!code || !session?.user?.email) {
      return NextResponse.redirect(
        new URL('/settings?error=tiktok_invalid', request.url)
      )
    }

    // Verify state
    try {
      const stateData = JSON.parse(Buffer.from(state || '', 'base64').toString())
      if (stateData.email !== session.user.email) {
        return NextResponse.redirect(
          new URL('/settings?error=tiktok_state_mismatch', request.url)
        )
      }
    } catch {
      return NextResponse.redirect(
        new URL('/settings?error=tiktok_state_invalid', request.url)
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/platforms/tiktok/callback`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('TikTok token exchange error:', tokenData)
      return NextResponse.redirect(
        new URL('/settings?error=tiktok_token_failed', request.url)
      )
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresIn = tokenData.expires_in || 86400 // Default 24 hours
    const openId = tokenData.open_id

    // Get user info
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    const userData = await userResponse.json()
    const displayName = userData.data?.user?.display_name || 'TikTok User'

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
          platform: 'TIKTOK',
        },
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiresAt,
        accountId: openId,
        accountName: displayName,
        isActive: true,
        metadata: {
          openId,
          displayName,
        },
      },
      create: {
        userId: user.id,
        platform: 'TIKTOK',
        accessToken,
        refreshToken,
        tokenExpiresAt,
        accountId: openId,
        accountName: displayName,
        isActive: true,
        metadata: {
          openId,
          displayName,
        },
      },
    })

    console.log('TikTok connected successfully:', {
      userId: user.id,
      openId,
      displayName,
    })

    return NextResponse.redirect(
      new URL('/settings?success=tiktok_connected', request.url)
    )
  } catch (error) {
    console.error('TikTok callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=tiktok_callback_failed', request.url)
    )
  }
}
