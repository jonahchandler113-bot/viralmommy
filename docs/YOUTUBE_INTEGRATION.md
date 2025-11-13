# YouTube Integration Guide

## Overview

This document provides comprehensive documentation for integrating YouTube Data API v3 into ViralMommy. The integration allows users to authenticate with their Google accounts and upload videos (including YouTube Shorts) directly to their YouTube channels.

## Table of Contents

1. [Google Cloud Console Setup](#google-cloud-console-setup)
2. [OAuth 2.0 Flow](#oauth-20-flow)
3. [API Key vs OAuth](#api-key-vs-oauth)
4. [Permission Scopes](#permission-scopes)
5. [Token Management](#token-management)
6. [Video Upload API](#video-upload-api)
7. [YouTube Shorts Optimization](#youtube-shorts-optimization)
8. [Quota Management](#quota-management)
9. [Code Examples](#code-examples)
10. [Error Handling](#error-handling)

---

## Google Cloud Console Setup

### Step 1: Create Google Account

If you don't have one, create a Google Account at [accounts.google.com](https://accounts.google.com).

### Step 2: Create a Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project details:
   - **Project Name**: ViralMommy
   - **Organization**: (Optional) Your organization
   - **Location**: (Optional) Parent organization
4. Click "Create"

### Step 3: Enable YouTube Data API v3

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click on it and press **Enable**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - **User Type**: External (for public apps)
   - **App Name**: ViralMommy
   - **User Support Email**: support@viralmommy.com
   - **Developer Contact Email**: dev@viralmommy.com
   - **Scopes**: Add `youtube.upload`, `youtube.readonly`
   - **Test Users**: Add your Google account for testing
4. Create OAuth client ID:
   - **Application Type**: Web application
   - **Name**: ViralMommy Web Client
   - **Authorized JavaScript origins**: `https://viralmommy.com`
   - **Authorized redirect URIs**: `https://viralmommy.com/api/auth/youtube/callback`
5. Click **Create**
6. Save your **Client ID** and **Client Secret**

### Step 5: (Optional) Create API Key

For read-only operations (like searching public videos), you can use an API key:

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API key**
3. Restrict the key:
   - **Application restrictions**: HTTP referrers
   - **API restrictions**: YouTube Data API v3
4. Save the API key

### Step 6: OAuth Consent Screen (Production)

For production, you must submit for **Google Verification**:

1. Go to **OAuth consent screen**
2. Fill out all required information
3. Add app logo, privacy policy, and terms of service URLs
4. Submit for verification
5. Wait for approval (can take weeks)

**Note**: Unverified apps are limited to 100 users and show a warning screen.

---

## OAuth 2.0 Flow

YouTube uses Google's OAuth 2.0 authentication.

### Step 1: Authorization Request

Direct users to Google's authorization endpoint:

```
https://accounts.google.com/o/oauth2/v2/auth
```

**Required Query Parameters:**

- `client_id`: Your OAuth Client ID
- `redirect_uri`: Must match registered URI
- `response_type`: `code`
- `scope`: Space-separated scopes
- `access_type`: `offline` (to get refresh token)
- `state`: Random CSRF token
- `prompt`: `consent` (force consent screen to get refresh token)

**Example Authorization URL:**

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=https://viralmommy.com/api/auth/youtube/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload%20https://www.googleapis.com/auth/youtube.readonly&access_type=offline&prompt=consent&state=RANDOM_STATE
```

**Important**: Set `access_type=offline` and `prompt=consent` to receive a refresh token.

### Step 2: Handle Callback

After user authorization, Google redirects to your `redirect_uri` with:

- `code`: Authorization code (valid for ~10 minutes)
- `state`: The state token you provided
- `scope`: Granted scopes

### Step 3: Exchange Code for Tokens

```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code=AUTHORIZATION_CODE
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=https://viralmommy.com/api/auth/youtube/callback
&grant_type=authorization_code
```

**Response:**

```json
{
  "access_token": "ya29.a0AfH6SMBx...",
  "expires_in": 3599,
  "refresh_token": "1//0gLo4...",
  "scope": "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
  "token_type": "Bearer"
}
```

**Note**: The `refresh_token` is only provided on the **first authorization** (or if you force consent with `prompt=consent`).

---

## API Key vs OAuth

### When to Use API Key

**API keys** are for **read-only** operations on **public data**:

- Search for public videos
- Get video details
- Get channel information
- Get public playlists

**Example:**

```
GET https://www.googleapis.com/youtube/v3/search?part=snippet&q=parenting+tips&key=YOUR_API_KEY
```

### When to Use OAuth

**OAuth tokens** are for operations that:

- Access **user-specific** data
- **Modify** data (upload, update, delete)
- Access **private** information

**Examples:**

- Upload videos
- Update video metadata
- Manage playlists
- Access analytics

**For ViralMommy, you need OAuth** because you're uploading videos on behalf of users.

---

## Permission Scopes

### Required Scopes

| Scope | Purpose | Quota Cost |
|-------|---------|-----------|
| `https://www.googleapis.com/auth/youtube.upload` | Upload videos | 1,600 units per upload |
| `https://www.googleapis.com/auth/youtube.readonly` | View channel info, analytics | 1 unit per request |
| `https://www.googleapis.com/auth/youtube` | Full access (not recommended) | Varies |

### Recommended Scopes for ViralMommy

Request **only** what you need:

```
https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly
```

### Incremental Authorization

You can request additional scopes later:

1. User initially grants `youtube.readonly`
2. Later, when they want to upload, request `youtube.upload`
3. Google shows consent screen for new scopes only

---

## Token Management

### Token Lifetimes

- **Access Token**: Valid for **1 hour** (3,600 seconds)
- **Refresh Token**: Valid **indefinitely** (until revoked by user)

### Token Refresh Strategy

Google access tokens expire quickly, so you must refresh them.

#### Refresh Access Token

```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&refresh_token=REFRESH_TOKEN
&grant_type=refresh_token
```

**Response:**

```json
{
  "access_token": "ya29.a0AfH6SMBx...",
  "expires_in": 3599,
  "scope": "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
  "token_type": "Bearer"
}
```

**Note**: The refresh token is **not** returned. Use the original refresh token.

### Best Practices

1. **Refresh Proactively**: Refresh access token when it has < 5 minutes remaining
2. **Store Refresh Token Securely**: Encrypt it in the database
3. **Handle Revocation**: If refresh fails with `invalid_grant`, prompt user to reconnect
4. **Use Google Auth Libraries**: They handle refresh automatically

### Token Revocation

Users can revoke access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

When revoked, your refresh token becomes invalid. Handle this gracefully:

```json
{
  "error": "invalid_grant",
  "error_description": "Token has been expired or revoked."
}
```

---

## Video Upload API

YouTube provides a resumable upload protocol for large video files.

### Upload Process

1. **Create video resource** (metadata)
2. **Upload video file** (binary data)
3. **Set thumbnail** (optional)

### Step 1: Create Video Resource

```
POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "snippet": {
    "title": "My Parenting Tip: How to Get Kids to Sleep",
    "description": "Check out this amazing sleep routine that works every time! #Shorts #ParentingTips",
    "tags": ["parenting", "mom life", "sleep tips", "kids"],
    "categoryId": "22"
  },
  "status": {
    "privacyStatus": "public",
    "selfDeclaredMadeForKids": false
  }
}
```

**Response Headers:**

```
Location: https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&upload_id=AE...
```

The `Location` header contains the **upload URL** for step 2.

### Step 2: Upload Video File

```
PUT {upload_url_from_step_1}
Content-Type: video/*
Content-Length: 12345678

[Binary video data]
```

**For Resumable Upload (Recommended):**

Upload in chunks for large files:

```
PUT {upload_url}
Content-Type: video/*
Content-Range: bytes 0-524287/12345678
Content-Length: 524288

[First 512KB of video data]
```

Continue uploading chunks until complete.

**Response (Success):**

```json
{
  "kind": "youtube#video",
  "id": "VIDEO_ID",
  "snippet": {
    "title": "My Parenting Tip: How to Get Kids to Sleep",
    ...
  },
  "status": {
    "uploadStatus": "uploaded",
    "privacyStatus": "public"
  }
}
```

### Video Categories

Common category IDs:

- `22`: People & Blogs
- `26`: Howto & Style
- `24`: Entertainment
- `17`: Sports
- `10`: Music

Use `22` (People & Blogs) for ViralMommy content.

---

## YouTube Shorts Optimization

### What Are YouTube Shorts?

YouTube Shorts are vertical videos (9:16 aspect ratio) up to **60 seconds** long. They appear in the Shorts feed.

### How to Upload Shorts via API

**There is no separate "Shorts" API endpoint.** Shorts are regular videos that meet these criteria:

1. **Duration**: ≤ 60 seconds
2. **Aspect Ratio**: 9:16 (vertical) or 1:1 (square)
3. **Title/Description**: Include `#Shorts` hashtag (recommended)

### Shorts Best Practices

#### 1. Video Specifications

- **Resolution**: 1080x1920 (recommended)
- **Aspect Ratio**: 9:16 (vertical)
- **Duration**: ≤ 60 seconds
- **Format**: MP4, MOV
- **Codec**: H.264, AAC audio
- **Frame Rate**: 24-60fps

#### 2. Metadata Optimization

**Title:**

```
"Quick Parenting Hack: Make Kids Eat Veggies #Shorts"
```

**Description:**

```
Try this easy trick to get your kids to eat their vegetables! 🥦

#Shorts #ParentingTips #MomLife #ParentingHacks
```

**Tags:**

```
["shorts", "parenting", "mom life", "parenting tips", "kids"]
```

#### 3. Upload Parameters

```json
{
  "snippet": {
    "title": "Quick Parenting Hack #Shorts",
    "description": "Try this easy trick! #Shorts #ParentingTips",
    "tags": ["shorts", "parenting", "mom life"],
    "categoryId": "22"
  },
  "status": {
    "privacyStatus": "public",
    "selfDeclaredMadeForKids": false
  }
}
```

**Important**: Set `selfDeclaredMadeForKids` appropriately per COPPA requirements.

### How YouTube Detects Shorts

YouTube automatically detects Shorts based on:

1. Video duration (≤ 60 seconds)
2. Aspect ratio (9:16 or 1:1)
3. Presence of `#Shorts` in title/description (not required but helps)

No special API parameter is needed.

---

## Quota Management

YouTube Data API uses a **quota system** to limit usage.

### Quota Allocation

- **Default Quota**: 10,000 units per day per project
- **Resets**: Daily at midnight Pacific Time (PT)

### Quota Costs

| Operation | Quota Cost |
|-----------|-----------|
| Video upload | 1,600 units |
| Video update | 50 units |
| Video delete | 50 units |
| Video list | 1 unit |
| Search | 100 units |
| Channel list | 1 unit |

### Daily Upload Limit

With 10,000 units/day:

- **6 video uploads per day** (6 × 1,600 = 9,600 units)

### Request Quota Increase

If you need more quota:

1. Go to **APIs & Services** → **Quotas**
2. Find "YouTube Data API v3"
3. Click **Edit Quotas**
4. Fill out the request form (justify your use case)
5. Wait for approval (can take days/weeks)

### Quota Best Practices

1. **Queue Uploads**: Don't upload all videos at once
2. **Spread Throughout Day**: Distribute uploads evenly
3. **Monitor Usage**: Track quota consumption in Google Cloud Console
4. **Error Handling**: Handle `quotaExceeded` errors gracefully

### Check Quota Usage

View quota usage in Google Cloud Console:

**APIs & Services** → **Dashboard** → **YouTube Data API v3** → **Quotas**

---

## Code Examples

### TypeScript OAuth Flow

```typescript
// /app/api/auth/youtube/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(32).toString('hex');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ],
    state: state,
    prompt: 'consent', // Force consent to get refresh token
  });

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('youtube_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
  });

  return response;
}
```

### TypeScript Token Exchange

```typescript
// /app/api/auth/youtube/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { db } from '@/lib/db';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Validate state
  const storedState = request.cookies.get('youtube_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code!);

  // Get user's YouTube channel ID
  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const channelResponse = await youtube.channels.list({
    part: ['snippet'],
    mine: true,
  });

  const channel = channelResponse.data.items?.[0];

  // Store in database
  await db.platformConnection.create({
    data: {
      userId: request.user.id,
      platform: 'YOUTUBE',
      accessToken: tokens.access_token!, // TODO: Encrypt
      refreshToken: tokens.refresh_token!, // TODO: Encrypt
      expiresAt: new Date(tokens.expiry_date!),
      platformUserId: channel?.id || '',
      platformUsername: channel?.snippet?.title || '',
      status: 'ACTIVE',
    },
  });

  return NextResponse.redirect('/dashboard?connected=youtube');
}
```

### TypeScript Video Upload (with googleapis library)

```typescript
// /lib/youtube/upload-video.ts
import { google } from 'googleapis';
import fs from 'fs';

interface UploadVideoParams {
  accessToken: string;
  refreshToken: string;
  videoPath: string; // Local file path
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: 'public' | 'private' | 'unlisted';
}

export async function uploadVideoToYouTube({
  accessToken,
  refreshToken,
  videoPath,
  title,
  description,
  tags = [],
  privacyStatus = 'public',
}: UploadVideoParams): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title,
        description: description,
        tags: tags,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  return response.data.id!; // Video ID
}
```

### TypeScript Token Refresh

```typescript
// /lib/youtube/refresh-token.ts
import { google } from 'googleapis';

export async function refreshYouTubeToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // This automatically refreshes the access token
  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    expiresAt: new Date(credentials.expiry_date!),
  };
}
```

---

## Error Handling

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `401` | Invalid credentials | Refresh access token |
| `403` | Forbidden (quota exceeded) | Wait for quota reset or request increase |
| `403` | Upload quota exceeded | Retry tomorrow or request quota increase |
| `400` | Invalid request | Check video metadata/format |
| `404` | Video not found | Verify video ID |
| `500` | Internal server error | Retry with exponential backoff |

### Error Response Format

```json
{
  "error": {
    "code": 403,
    "message": "The request cannot be completed because you have exceeded your quota.",
    "errors": [
      {
        "message": "The request cannot be completed because you have exceeded your quota.",
        "domain": "youtube.quota",
        "reason": "quotaExceeded"
      }
    ]
  }
}
```

### Quota Exceeded Handling

```typescript
try {
  await uploadVideoToYouTube({ ... });
} catch (error: any) {
  if (error.code === 403 && error.errors?.[0]?.reason === 'quotaExceeded') {
    // Queue for tomorrow
    await scheduleUploadForTomorrow(videoId);

    // Notify user
    await notifyUser({
      message: 'YouTube daily quota exceeded. Your video will be published tomorrow.',
    });
  } else {
    throw error;
  }
}
```

### Retry Strategy

```typescript
async function retryYouTubeRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry on quota exceeded or invalid credentials
      if (error.code === 403 || error.code === 401) {
        throw error;
      }

      if (i === maxRetries - 1) throw error;

      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## Video Format Requirements

### General Requirements

- **Format**: MP4, MOV, AVI, FLV, 3GPP, WebM, MPEG-PS
- **Codec**: H.264 (recommended), H.265, VP8, VP9
- **Audio**: AAC, MP3
- **Max Size**: 256 GB (or 12 hours)
- **Resolution**: Up to 8K

### YouTube Shorts Requirements

- **Format**: MP4, MOV
- **Codec**: H.264 (video), AAC (audio)
- **Max Duration**: 60 seconds
- **Aspect Ratio**: 9:16 (vertical) or 1:1 (square)
- **Resolution**: 1080x1920 recommended
- **Frame Rate**: 24-60fps

---

## Testing Checklist

- [ ] Google Cloud project created
- [ ] YouTube Data API v3 enabled
- [ ] OAuth credentials created
- [ ] OAuth consent screen configured
- [ ] Test users added (for unverified apps)
- [ ] OAuth flow works end-to-end
- [ ] Access token and refresh token received
- [ ] Token refresh works automatically
- [ ] Video upload succeeds
- [ ] Shorts automatically detected (≤60s, 9:16)
- [ ] Quota monitoring set up
- [ ] Error handling works
- [ ] User can disconnect YouTube account

---

## Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Video Upload Guide](https://developers.google.com/youtube/v3/guides/uploading_a_video)
- [OAuth 2.0 Guide](https://developers.google.com/youtube/v3/guides/authentication)
- [Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [API Explorer](https://developers.google.com/youtube/v3/docs)
- [Google Auth Library (Node.js)](https://github.com/googleapis/google-auth-library-nodejs)

---

## Next Steps (Week 3)

1. Create Google Cloud project
2. Enable YouTube Data API v3
3. Create OAuth credentials
4. Configure OAuth consent screen
5. Add test users
6. Implement OAuth routes (`/api/auth/youtube/*`)
7. Build video upload service
8. Implement token refresh cron job
9. Test with real YouTube account
10. Monitor quota usage
11. Submit app for Google verification (production)
