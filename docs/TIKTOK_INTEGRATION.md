# TikTok Integration Guide

## Overview

This document provides comprehensive documentation for integrating TikTok's Content Posting API into ViralMommy. The integration allows users to authenticate with their TikTok accounts and publish video content directly to their TikTok profiles.

## Table of Contents

1. [Developer Account Setup](#developer-account-setup)
2. [OAuth 2.0 Flow](#oauth-20-flow)
3. [Scope Requirements](#scope-requirements)
4. [Token Management](#token-management)
5. [Video Upload API](#video-upload-api)
6. [Rate Limits](#rate-limits)
7. [Code Examples](#code-examples)
8. [Error Handling](#error-handling)

---

## Developer Account Setup

### Prerequisites

1. **TikTok Developer Account**
   - Visit [TikTok for Developers](https://developers.tiktok.com/)
   - Sign in with your TikTok account
   - Navigate to "Manage Apps" > "Create an App"

2. **App Configuration**
   - **App Name**: ViralMommy
   - **App Type**: Web Application
   - **Redirect URI**: `https://viralmommy.com/api/auth/tiktok/callback` (HTTPS required, max 512 characters)
   - **Products**: Enable "Login Kit" and "Content Posting API"

3. **Scope Approval**
   - Request the `video.publish` scope (requires approval from TikTok)
   - Fill out use case documentation explaining your app's purpose
   - Wait for approval (typically 1-2 weeks)

4. **Important Notes**
   - All content posted by unaudited clients will be **restricted to private viewing mode**
   - For public posting, you must complete TikTok's formal audit compliance verification
   - Keep your `client_key` and `client_secret` secure (store in environment variables)

---

## OAuth 2.0 Flow

TikTok uses the standard OAuth 2.0 authorization code flow.

### Step 1: Authorization Request

Direct users to TikTok's authorization endpoint:

```
https://www.tiktok.com/v2/auth/authorize/
```

**Required Query Parameters:**

- `client_key`: Your app's client key
- `response_type`: `code`
- `scope`: `user.info.basic,video.publish`
- `redirect_uri`: Must match registered URI exactly
- `state`: Random CSRF token (alphanumeric string)

**Example Authorization URL:**

```
https://www.tiktok.com/v2/auth/authorize/?client_key=YOUR_CLIENT_KEY&response_type=code&scope=user.info.basic,video.publish&redirect_uri=https://viralmommy.com/api/auth/tiktok/callback&state=RANDOM_STATE_TOKEN
```

### Step 2: Handle Callback

After user authorization, TikTok redirects to your `redirect_uri` with:

- `code`: Authorization code (valid for ~5 minutes)
- `state`: The state token you provided (validate this matches!)
- `scopes`: Granted scopes (user can deny toggleable scopes)

### Step 3: Exchange Code for Access Token

Make a POST request to TikTok's token endpoint:

```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded

client_key=YOUR_CLIENT_KEY
&client_secret=YOUR_CLIENT_SECRET
&code=AUTHORIZATION_CODE
&grant_type=authorization_code
&redirect_uri=https://viralmommy.com/api/auth/tiktok/callback
```

**Response:**

```json
{
  "access_token": "act.example...",
  "expires_in": 86400,
  "refresh_token": "rft.example...",
  "refresh_expires_in": 31536000,
  "open_id": "user-open-id-example",
  "scope": "user.info.basic,video.publish",
  "token_type": "Bearer"
}
```

---

## Scope Requirements

### Required Scopes

| Scope | Purpose | Toggleable |
|-------|---------|-----------|
| `user.info.basic` | Access basic user information (username, profile picture) | No |
| `video.publish` | Upload and publish videos to user's TikTok account | No |
| `video.list` | (Optional) Retrieve list of user's published videos | Yes |

### Scope Approval Process

- `user.info.basic`: Available by default
- `video.publish`: **Requires TikTok approval**
  - Submit use case documentation
  - Explain why your app needs to post videos
  - Provide screenshots of your app
  - Response time: 1-2 weeks

---

## Token Management

### Token Lifetimes

- **Access Token**: Valid for **24 hours** (86,400 seconds)
- **Refresh Token**: Valid for **1 year** (31,536,000 seconds)

### Token Refresh Strategy

**IMPORTANT**: Refresh tokens **before** they expire to avoid user re-authentication.

#### Refresh Access Token

```
POST https://open.tiktokapis.com/v2/oauth/token/
Content-Type: application/x-www-form-urlencoded

client_key=YOUR_CLIENT_KEY
&client_secret=YOUR_CLIENT_SECRET
&grant_type=refresh_token
&refresh_token=CURRENT_REFRESH_TOKEN
```

**Response:**

```json
{
  "access_token": "new_access_token",
  "expires_in": 86400,
  "refresh_token": "new_refresh_token",
  "refresh_expires_in": 31536000,
  "open_id": "user-open-id",
  "scope": "user.info.basic,video.publish",
  "token_type": "Bearer"
}
```

### Best Practices

1. **Scheduled Refresh**: Refresh tokens when they have < 10% lifetime remaining (~2.4 hours for access tokens)
2. **Store Tokens Securely**: Encrypt tokens in database
3. **Handle Refresh Failures**: If refresh fails, prompt user to reconnect
4. **Background Jobs**: Schedule cron jobs to auto-refresh tokens for all users

---

## Video Upload API

TikTok offers two upload methods: **FILE_UPLOAD** (recommended) and **PULL_FROM_URL**.

### Method 1: FILE_UPLOAD (Recommended)

#### Step 1: Initialize Upload

```
POST https://open.tiktokapis.com/v2/post/publish/video/init/
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "post_info": {
    "title": "My Amazing Mom Life Hack!",
    "privacy_level": "SELF_ONLY",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false,
    "video_cover_timestamp_ms": 1000
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_size": 12345678,
    "chunk_size": 10485760,
    "total_chunk_count": 2
  }
}
```

**Privacy Levels:**
- `SELF_ONLY`: Only visible to the user (default for unaudited apps)
- `PUBLIC_TO_EVERYONE`: Public (requires audit approval)

**Response:**

```json
{
  "data": {
    "publish_id": "publish-id-example",
    "upload_url": "https://open-upload.tiktokapis.com/video/?upload_id=..."
  },
  "error": {
    "code": "ok",
    "message": ""
  }
}
```

#### Step 2: Upload Video

```
PUT {upload_url}
Content-Type: video/mp4
Content-Range: bytes 0-10485759/12345678
Content-Length: 10485760

[Binary video data chunk 1]
```

**Important:**
- Use chunked upload for videos > 10MB
- Each chunk should be ≤ 64MB
- Upload chunks sequentially
- Include proper `Content-Range` headers

#### Step 3: Verify Upload Status (Optional)

```
POST https://open.tiktokapis.com/v2/post/publish/status/fetch/
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "publish_id": "publish-id-example"
}
```

**Response:**

```json
{
  "data": {
    "status": "PUBLISH_COMPLETE",
    "publicily_available_post_id": ["post-id-example"]
  }
}
```

**Status Values:**
- `PROCESSING_UPLOAD`: Video is being processed
- `PUBLISH_COMPLETE`: Video successfully published
- `FAILED`: Upload failed

### Method 2: PULL_FROM_URL

Requires domain verification. For simplicity, **use FILE_UPLOAD**.

---

## Rate Limits

### Daily Limits (Per User)

- **Video Uploads**: 15 videos per 24 hours (shared across all API clients)
- **Pending Approvals**: Maximum 5 pending shares within 24 hours

### Per-Minute Limits (Per Access Token)

- **API Requests**: 6 requests per minute (sliding window)
- **Video Initialization**: 2 videos per minute

### Handling Rate Limits

When you exceed rate limits, TikTok returns:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Please try again later."
  }
}
```

**Mitigation Strategies:**

1. **Queue System**: Implement Redis queue to throttle requests
2. **Retry Logic**: Exponential backoff with jitter
3. **User Notifications**: Inform users if they hit daily limits
4. **Higher Limits**: Contact TikTok Support for quota increase (if justified)

---

## Code Examples

### TypeScript OAuth Flow

```typescript
// /app/api/auth/tiktok/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString('hex');

  // Store state in session/cookie for validation
  const response = NextResponse.redirect(getTikTokAuthUrl(state));
  response.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  return response;
}

function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: 'code',
    scope: 'user.info.basic,video.publish',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state: state,
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}
```

### TypeScript Token Exchange

```typescript
// /app/api/auth/tiktok/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Validate state token
  const storedState = request.cookies.get('tiktok_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Store tokens in database
  await db.platformConnection.create({
    data: {
      userId: request.user.id, // Get from session
      platform: 'TIKTOK',
      accessToken: tokens.access_token, // TODO: Encrypt
      refreshToken: tokens.refresh_token, // TODO: Encrypt
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      platformUserId: tokens.open_id,
      platformUsername: '', // Fetch separately via user.info API
      status: 'ACTIVE',
    },
  });

  return NextResponse.redirect('/dashboard?connected=tiktok');
}

async function exchangeCodeForTokens(code: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}
```

### TypeScript Video Upload

```typescript
// /lib/tiktok/upload-video.ts
interface UploadVideoParams {
  accessToken: string;
  videoBuffer: Buffer;
  title: string;
  privacyLevel?: 'SELF_ONLY' | 'PUBLIC_TO_EVERYONE';
}

export async function uploadVideoToTikTok({
  accessToken,
  videoBuffer,
  title,
  privacyLevel = 'SELF_ONLY',
}: UploadVideoParams): Promise<string> {
  // Step 1: Initialize upload
  const initResponse = await fetch(
    'https://open.tiktokapis.com/v2/post/publish/video/init/',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: title,
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoBuffer.length,
          chunk_size: videoBuffer.length, // Single chunk for simplicity
          total_chunk_count: 1,
        },
      }),
    }
  );

  const initData = await initResponse.json();

  if (initData.error.code !== 'ok') {
    throw new Error(`TikTok upload init failed: ${initData.error.message}`);
  }

  const { publish_id, upload_url } = initData.data;

  // Step 2: Upload video
  const uploadResponse = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': videoBuffer.length.toString(),
    },
    body: videoBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error('TikTok video upload failed');
  }

  return publish_id;
}
```

### TypeScript Token Refresh

```typescript
// /lib/tiktok/refresh-token.ts
export async function refreshTikTokToken(refreshToken: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh TikTok token');
  }

  return response.json();
}
```

---

## Error Handling

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `invalid_client` | Invalid client_key or client_secret | Check environment variables |
| `invalid_grant` | Authorization code expired or invalid | Prompt user to re-authenticate |
| `access_token_invalid` | Access token expired or revoked | Refresh token |
| `rate_limit_exceeded` | Too many requests | Implement retry with backoff |
| `scope_not_authorized` | User denied scope or app not approved | Request scope approval from TikTok |
| `upload_size_too_large` | Video exceeds size limit (287.6 MB) | Compress video |

### Error Response Format

```json
{
  "error": {
    "code": "error_code_here",
    "message": "Human-readable error message",
    "log_id": "20231204abcd1234"
  }
}
```

### Retry Strategy

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;

      // Don't retry on non-retriable errors
      if (error.code === 'invalid_client' || error.code === 'scope_not_authorized') {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, i) + Math.random() * 1000;
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
- **Max Size**: 287.6 MB
- **Max Duration**: 10 minutes
- **Aspect Ratio**: 9:16 (vertical) recommended
- **Resolution**: 1080x1920 recommended
- **Frame Rate**: 30fps recommended

---

## Testing Checklist

- [ ] OAuth flow works end-to-end
- [ ] State token validation prevents CSRF
- [ ] Tokens stored encrypted in database
- [ ] Token refresh works automatically
- [ ] Video upload succeeds for videos < 100MB
- [ ] Rate limiting handled gracefully
- [ ] Error messages displayed to users
- [ ] Expired token triggers re-authentication
- [ ] User can disconnect TikTok account

---

## Resources

- [TikTok for Developers](https://developers.tiktok.com/)
- [Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-web)
- [Content Posting API Documentation](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [Rate Limits](https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit)
- [TikTok Support](https://developers.tiktok.com/support)

---

## Next Steps (Week 3)

1. Set up TikTok Developer app
2. Request `video.publish` scope approval
3. Implement OAuth routes (`/api/auth/tiktok/*`)
4. Add token encryption in database
5. Build video upload service
6. Implement token refresh cron job
7. Test with real TikTok account
