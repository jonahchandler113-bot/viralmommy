import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const facebookAppId = process.env.FACEBOOK_APP_ID!
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/platforms/facebook/callback`

    // Facebook OAuth permissions for Pages and Instagram
    const permissions = [
      'pages_show_list',           // List user's pages
      'pages_read_engagement',     // Read page engagement
      'pages_manage_posts',        // Publish to page
      'instagram_basic',           // Instagram basic access
      'instagram_content_publish', // Publish to Instagram
      'business_management',       // Manage business assets
    ].join(',')

    // Build Facebook OAuth URL
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    authUrl.searchParams.set('client_id', facebookAppId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', permissions)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', session.user.email) // Use email as state for verification

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Facebook OAuth initiation error:', error)
    return NextResponse.redirect(new URL('/settings?error=facebook_oauth_failed', request.url))
  }
}
