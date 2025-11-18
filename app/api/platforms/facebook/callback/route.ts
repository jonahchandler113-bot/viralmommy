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
      console.error('Facebook OAuth error:', error)
      return NextResponse.redirect(
        new URL('/settings?error=facebook_denied', request.url)
      )
    }

    if (!code || !session?.user?.email) {
      return NextResponse.redirect(
        new URL('/settings?error=facebook_invalid', request.url)
      )
    }

    // Verify state matches user email (simple CSRF protection)
    if (state !== session.user.email) {
      return NextResponse.redirect(
        new URL('/settings?error=facebook_state_mismatch', request.url)
      )
    }

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!)
    tokenUrl.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!)
    tokenUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/platforms/facebook/callback`)
    tokenUrl.searchParams.set('code', code)

    const tokenResponse = await fetch(tokenUrl.toString())
    const tokenData = await tokenResponse.json()

    if (tokenData.error || !tokenData.access_token) {
      console.error('Facebook token exchange error:', tokenData.error)
      return NextResponse.redirect(
        new URL('/settings?error=facebook_token_failed', request.url)
      )
    }

    const shortLivedToken = tokenData.access_token

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longLivedUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!)
    longLivedUrl.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!)
    longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken)

    const longLivedResponse = await fetch(longLivedUrl.toString())
    const longLivedData = await longLivedResponse.json()

    const accessToken = longLivedData.access_token || shortLivedToken
    const expiresIn = longLivedData.expires_in || 5184000 // Default 60 days

    // Get user's Facebook Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    )
    const pagesData = await pagesResponse.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        new URL('/settings?error=no_facebook_pages', request.url)
      )
    }

    // Get first page (or you could let user choose)
    const page = pagesData.data[0]
    const pageAccessToken = page.access_token // This is a page token, not user token
    const pageId = page.id
    const pageName = page.name

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/settings?error=user_not_found', request.url)
      )
    }

    // Calculate token expiration date
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

    // Store platform connection in database
    const connection = await prisma.platformConnection.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'FACEBOOK',
        },
      },
      update: {
        accessToken: pageAccessToken,
        tokenExpiresAt,
        accountId: pageId,
        accountName: pageName,
        isActive: true,
        metadata: {
          pageId,
          pageName,
          userId: user.id,
        },
      },
      create: {
        userId: user.id,
        platform: 'FACEBOOK',
        accessToken: pageAccessToken,
        tokenExpiresAt,
        accountId: pageId,
        accountName: pageName,
        isActive: true,
        metadata: {
          pageId,
          pageName,
        },
      },
    })

    console.log('Facebook connected successfully:', {
      userId: user.id,
      pageId,
      pageName,
    })

    return NextResponse.redirect(
      new URL('/settings?success=facebook_connected', request.url)
    )
  } catch (error) {
    console.error('Facebook callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=facebook_callback_failed', request.url)
    )
  }
}
