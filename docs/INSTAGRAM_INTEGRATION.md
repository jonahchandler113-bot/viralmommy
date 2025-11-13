# Instagram Integration Guide

## Overview

This document provides comprehensive documentation for integrating Instagram's Graph API into ViralMommy. The integration allows users to authenticate via Facebook Login and publish Reels directly to their Instagram Business or Creator accounts.

## Table of Contents

1. [Prerequisites and Requirements](#prerequisites-and-requirements)
2. [Facebook App Setup](#facebook-app-setup)
3. [OAuth Flow via Facebook](#oauth-flow-via-facebook)
4. [Permission Scopes](#permission-scopes)
5. [Token Management](#token-management)
6. [Reels Upload API](#reels-upload-api)
7. [Media Container Workflow](#media-container-workflow)
8. [Rate Limits](#rate-limits)
9. [Code Examples](#code-examples)
10. [Error Handling](#error-handling)

---

## Prerequisites and Requirements

### Account Requirements

**CRITICAL**: The Instagram Graph API only works with:
- **Instagram Business Accounts**
- **Instagram Creator Accounts**
- Accounts **must be linked to a Facebook Page**

**Personal Instagram accounts are NOT eligible** for API-based publishing or analytics.

### How to Convert to Business/Creator Account

1. Go to Instagram app → Settings → Account
2. Select "Switch to Professional Account"
3. Choose "Business" or "Creator"
4. Link to a Facebook Page (create one if needed)

---

## Facebook App Setup

Since Instagram uses Facebook's authentication, you must create a Facebook App.

### Step 1: Create Facebook App

1. Visit [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" or "Business" app type
4. Fill in app details:
   - **App Name**: ViralMommy
   - **App Contact Email**: support@viralmommy.com
   - **Business Account**: (Optional) Link to business

### Step 2: Add Instagram Product

1. In app dashboard, go to "Add Products"
2. Click "Set Up" on **Instagram Basic Display** or **Instagram Graph API**
3. For content publishing, you need **Instagram Graph API** (not Basic Display)

### Step 3: Configure OAuth Settings

1. Go to Settings → Basic
2. Add **App Domains**: `viralmommy.com`
3. Go to Facebook Login → Settings
4. Add **Valid OAuth Redirect URIs**:
   ```
   https://viralmommy.com/api/auth/instagram/callback
   ```

### Step 4: Generate Access Token for Testing

1. Go to Tools → Graph API Explorer
2. Select your app
3. Add permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`
4. Click "Generate Access Token"
5. Use this for initial testing

### Step 5: App Review (For Production)

**IMPORTANT**: Your app needs Facebook approval for these permissions:
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`

**App Review Process:**
1. Build your app with test users
2. Record a screencast showing your app's use case
3. Submit for App Review in Facebook dashboard
4. Wait for approval (typically 2-4 weeks)

---

## OAuth Flow via Facebook

Instagram uses Facebook's OAuth 2.0 flow.

### Step 1: Authorization Request

Direct users to Facebook's authorization endpoint:

```
https://www.facebook.com/v18.0/dialog/oauth
```

**Required Query Parameters:**

- `client_id`: Your Facebook App ID
- `redirect_uri`: Must match registered URI
- `scope`: Comma-separated permissions
- `state`: Random CSRF token
- `response_type`: `code`

**Example Authorization URL:**

```
https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=https://viralmommy.com/api/auth/instagram/callback&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&state=RANDOM_STATE&response_type=code
```

### Step 2: Handle Callback

After user authorization, Facebook redirects to your `redirect_uri` with:

- `code`: Authorization code (valid for ~10 minutes)
- `state`: The state token you provided

### Step 3: Exchange Code for Access Token

```
GET https://graph.facebook.com/v18.0/oauth/access_token
```

**Parameters:**

- `client_id`: Your App ID
- `client_secret`: Your App Secret
- `redirect_uri`: Same as authorization request
- `code`: Authorization code from callback

**Response:**

```json
{
  "access_token": "short-lived-token",
  "token_type": "bearer",
  "expires_in": 5183999
}
```

This is a **short-lived token** (valid for ~60 days). You need to exchange it for a **long-lived token**.

### Step 4: Get Long-Lived User Access Token

```
GET https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN
```

**Response:**

```json
{
  "access_token": "long-lived-token",
  "token_type": "bearer",
  "expires_in": 5183999
}
```

Long-lived tokens are valid for **60 days**.

### Step 5: Get Instagram Business Account ID

You need the Instagram Business Account ID to post content.

```
GET https://graph.facebook.com/v18.0/me/accounts?access_token=LONG_LIVED_TOKEN
```

**Response:**

```json
{
  "data": [
    {
      "access_token": "page-access-token",
      "category": "Personal Blog",
      "name": "My Page Name",
      "id": "PAGE_ID"
    }
  ]
}
```

Then get the Instagram account:

```
GET https://graph.facebook.com/v18.0/PAGE_ID?fields=instagram_business_account&access_token=PAGE_ACCESS_TOKEN
```

**Response:**

```json
{
  "instagram_business_account": {
    "id": "INSTAGRAM_ACCOUNT_ID"
  },
  "id": "PAGE_ID"
}
```

**Store this `INSTAGRAM_ACCOUNT_ID`** - you'll use it for all API requests.

---

## Permission Scopes

### Required Permissions

| Permission | Purpose | Requires Review |
|------------|---------|----------------|
| `instagram_basic` | Access basic account info | Yes |
| `instagram_content_publish` | Create and publish media | Yes |
| `pages_show_list` | List Facebook Pages | Yes |
| `pages_read_engagement` | Read Page engagement data | Yes |

### Permission Flow

Users can **selectively grant permissions**. Handle cases where users deny `instagram_content_publish` (app won't work without it).

---

## Token Management

### Token Lifetimes

- **Short-Lived User Token**: ~2 hours
- **Long-Lived User Token**: 60 days
- **Page Access Token**: Never expires (if long-lived user token was used)

### Token Refresh Strategy

**Long-lived tokens must be refreshed before the 60-day expiration.**

#### Refresh Long-Lived Token

```
GET https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=CURRENT_LONG_LIVED_TOKEN
```

This returns a **new 60-day token**.

### Best Practices

1. **Refresh at 50 days**: Don't wait until expiration
2. **Automated Refresh**: Run cron job to refresh all tokens daily
3. **Handle Failures**: If refresh fails, prompt user to reconnect
4. **Store Page Tokens**: Page tokens don't expire (use them for API calls)

---

## Reels Upload API

Instagram uses a **two-step media container workflow** for publishing Reels.

### Important Requirements (2025 Update)

**CRITICAL**: As of early 2025, Meta tightened URL requirements:

- `video_url` must be a **direct, public link** to the raw media file
- **No redirects** allowed
- **No authentication** required to access the URL
- Google Drive links **no longer work**
- Recommended: Use **signed URLs from Cloudflare R2** (valid for 1 hour)

---

## Media Container Workflow

### Step 1: Create Media Container

```
POST https://graph.facebook.com/v18.0/{ig-user-id}/media
```

**Parameters:**

- `media_type`: `REELS`
- `video_url`: Direct public URL to video file (HTTPS required)
- `caption`: Text caption (optional, max 2,200 characters)
- `share_to_feed`: `true` to share to main feed (default: `false`)
- `thumb_offset`: Thumbnail timestamp in milliseconds (default: 0)
- `access_token`: Page access token

**Example Request:**

```bash
curl -X POST "https://graph.facebook.com/v18.0/INSTAGRAM_ACCOUNT_ID/media" \
  -d "media_type=REELS" \
  -d "video_url=https://r2.viralmommy.com/videos/example.mp4?signature=..." \
  -d "caption=Check out my latest parenting hack! #MomLife #ParentingTips" \
  -d "share_to_feed=true" \
  -d "access_token=PAGE_ACCESS_TOKEN"
```

**Response:**

```json
{
  "id": "CONTAINER_ID"
}
```

This creates a **media container**. The video is not yet published.

### Step 2: Check Container Status

Instagram needs time to process the video. Poll the status:

```
GET https://graph.facebook.com/v18.0/{container-id}?fields=status_code&access_token=PAGE_ACCESS_TOKEN
```

**Response:**

```json
{
  "status_code": "FINISHED",
  "id": "CONTAINER_ID"
}
```

**Status Codes:**

- `IN_PROGRESS`: Still processing
- `FINISHED`: Ready to publish
- `ERROR`: Processing failed

**Poll every 5-10 seconds** until status is `FINISHED` or `ERROR`.

### Step 3: Publish Container

Once status is `FINISHED`, publish the Reel:

```
POST https://graph.facebook.com/v18.0/{ig-user-id}/media_publish
```

**Parameters:**

- `creation_id`: The container ID from step 1
- `access_token`: Page access token

**Example Request:**

```bash
curl -X POST "https://graph.facebook.com/v18.0/INSTAGRAM_ACCOUNT_ID/media_publish" \
  -d "creation_id=CONTAINER_ID" \
  -d "access_token=PAGE_ACCESS_TOKEN"
```

**Response:**

```json
{
  "id": "MEDIA_ID"
}
```

This is the **published media ID**. The Reel is now live on Instagram!

---

## Rate Limits

Instagram uses **Facebook's Graph API rate limits**.

### Rate Limit Structure

- **200 calls per hour per user** (rolling window)
- **200 calls per hour per app** (for app-level tokens)
- Limits reset on a sliding window (not fixed hourly)

### When You Hit Rate Limits

**Response:**

```json
{
  "error": {
    "message": "(#4) Application request limit reached",
    "type": "OAuthException",
    "code": 4,
    "fbtrace_id": "..."
  }
}
```

**Mitigation:**

1. **Queue system**: Throttle requests to stay under 200/hour
2. **Retry with backoff**: Wait before retrying
3. **User notification**: Tell users if they need to wait
4. **Batch requests**: Use Facebook's batch API for multiple operations

### Content Publishing Limits

- **Maximum Reels duration**: 90 seconds (as of 2025)
- **Maximum file size**: 1 GB
- **No explicit daily post limit**, but Instagram may flag spam

---

## Code Examples

### TypeScript OAuth Flow

```typescript
// /app/api/auth/instagram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(32).toString('hex');

  const response = NextResponse.redirect(getInstagramAuthUrl(state));
  response.cookies.set('instagram_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
  });

  return response;
}

function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
    state: state,
    response_type: 'code',
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}
```

### TypeScript Token Exchange

```typescript
// /app/api/auth/instagram/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Validate state
  const storedState = request.cookies.get('instagram_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  // Exchange code for short-lived token
  const shortLivedToken = await exchangeCodeForToken(code!);

  // Exchange for long-lived token
  const longLivedToken = await getLongLivedToken(shortLivedToken);

  // Get Instagram account ID
  const instagramAccountId = await getInstagramAccountId(longLivedToken);

  // Store in database
  await db.platformConnection.create({
    data: {
      userId: request.user.id,
      platform: 'INSTAGRAM',
      accessToken: longLivedToken, // TODO: Encrypt
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      platformUserId: instagramAccountId,
      status: 'ACTIVE',
    },
  });

  return NextResponse.redirect('/dashboard?connected=instagram');
}

async function exchangeCodeForToken(code: string): Promise<string> {
  const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  url.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!);
  url.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!);
  url.searchParams.set('redirect_uri', process.env.INSTAGRAM_REDIRECT_URI!);
  url.searchParams.set('code', code);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data.access_token;
}

async function getLongLivedToken(shortLivedToken: string): Promise<string> {
  const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!);
  url.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!);
  url.searchParams.set('fb_exchange_token', shortLivedToken);

  const response = await fetch(url.toString());
  const data = await response.json();
  return data.access_token;
}

async function getInstagramAccountId(accessToken: string): Promise<string> {
  // Get Facebook Pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  );
  const pagesData = await pagesResponse.json();
  const page = pagesData.data[0]; // Assume first page

  // Get Instagram account linked to page
  const igResponse = await fetch(
    `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
  );
  const igData = await igResponse.json();
  return igData.instagram_business_account.id;
}
```

### TypeScript Reels Upload

```typescript
// /lib/instagram/upload-reel.ts
interface UploadReelParams {
  instagramAccountId: string;
  accessToken: string;
  videoUrl: string; // Direct public URL
  caption?: string;
  shareToFeed?: boolean;
}

export async function uploadReelToInstagram({
  instagramAccountId,
  accessToken,
  videoUrl,
  caption = '',
  shareToFeed = true,
}: UploadReelParams): Promise<string> {
  // Step 1: Create media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        share_to_feed: shareToFeed,
        access_token: accessToken,
      }),
    }
  );

  const containerData = await containerResponse.json();

  if (containerData.error) {
    throw new Error(`Container creation failed: ${containerData.error.message}`);
  }

  const containerId = containerData.id;

  // Step 2: Poll for processing completion
  const isReady = await pollContainerStatus(containerId, accessToken);

  if (!isReady) {
    throw new Error('Video processing failed or timed out');
  }

  // Step 3: Publish the container
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishResponse.json();

  if (publishData.error) {
    throw new Error(`Publishing failed: ${publishData.error.message}`);
  }

  return publishData.id; // Published media ID
}

async function pollContainerStatus(
  containerId: string,
  accessToken: string,
  maxAttempts: number = 30
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.status_code === 'FINISHED') {
      return true;
    }

    if (data.status_code === 'ERROR') {
      return false;
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  return false; // Timeout
}
```

### TypeScript Token Refresh

```typescript
// /lib/instagram/refresh-token.ts
export async function refreshInstagramToken(currentToken: string): Promise<string> {
  const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!);
  url.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!);
  url.searchParams.set('fb_exchange_token', currentToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error.message}`);
  }

  return data.access_token;
}
```

---

## Error Handling

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `190` | Access token expired or invalid | Refresh token or re-authenticate |
| `4` | Rate limit exceeded | Implement queue and retry later |
| `100` | Invalid parameter | Check video URL format |
| `368` | User not authorized | User revoked permissions |
| `9004` | Video processing failed | Check video format/size |

### Error Response Format

```json
{
  "error": {
    "message": "Error description",
    "type": "OAuthException",
    "code": 190,
    "error_subcode": 463,
    "fbtrace_id": "..."
  }
}
```

### Retry Strategy

```typescript
async function retryInstagramRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code;

      // Don't retry on non-retriable errors
      if (errorCode === 190 || errorCode === 368) {
        throw error;
      }

      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## Video Format Requirements

- **Format**: MP4, MOV
- **Codec**: H.264 (video), AAC (audio)
- **Max Size**: 1 GB
- **Max Duration**: 90 seconds (as of 2025)
- **Aspect Ratio**: 9:16 (vertical) required
- **Resolution**: 1080x1920 recommended
- **Frame Rate**: 23-60fps

---

## Testing Checklist

- [ ] Facebook app created and configured
- [ ] Instagram Business/Creator account linked to Facebook Page
- [ ] OAuth flow works end-to-end
- [ ] Long-lived token generation works
- [ ] Instagram account ID retrieved correctly
- [ ] Media container creation works
- [ ] Video processing status polling works
- [ ] Container publishing works
- [ ] Token refresh works
- [ ] Rate limit handling works
- [ ] Error messages displayed to users

---

## Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Access Token Management](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)

---

## Next Steps (Week 3)

1. Create Facebook app and request permissions
2. Convert test Instagram account to Business/Creator
3. Link Instagram account to Facebook Page
4. Implement OAuth routes (`/api/auth/instagram/*`)
5. Build media container upload service
6. Implement token refresh cron job
7. Test with real Instagram account
8. Submit app for Facebook review (production)
