import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY!
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/platforms/tiktok/callback`

    // TikTok OAuth scopes
    const scope = [
      'user.info.basic',
      'video.upload',
      'video.publish',
      'video.list',
    ].join(',')

    // Generate random state for CSRF protection
    const state = Buffer.from(JSON.stringify({
      email: session.user.email,
      timestamp: Date.now(),
    })).toString('base64')

    // Build TikTok OAuth URL
    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/')
    authUrl.searchParams.set('client_key', clientKey)
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('TikTok OAuth initiation error:', error)
    return NextResponse.redirect(new URL('/settings?error=tiktok_oauth_failed', request.url))
  }
}
