import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/platforms/youtube/callback`

    // YouTube (Google) OAuth scopes
    const scope = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ')

    // Build Google OAuth URL for YouTube
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('access_type', 'offline') // Get refresh token
    authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token
    authUrl.searchParams.set('state', session.user.email) // CSRF protection

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('YouTube OAuth initiation error:', error)
    return NextResponse.redirect(new URL('/settings?error=youtube_oauth_failed', request.url))
  }
}
