# Week 3 Integration Plan

## Overview

This document provides a day-by-day implementation plan for integrating TikTok, Instagram, and YouTube APIs during Week 3 (Days 15-21) of the ViralMommy 30-day sprint.

---

## Pre-Week 3 Requirements

Before starting Week 3, ensure the following are complete:

### Week 1 Deliverables (Research)
- [x] TikTok integration research (TIKTOK_INTEGRATION.md)
- [x] Instagram integration research (INSTAGRAM_INTEGRATION.md)
- [x] YouTube integration research (YOUTUBE_INTEGRATION.md)
- [x] Token management strategy (token-manager.ts skeleton)
- [x] Platform video specs (PLATFORM_VIDEO_SPECS.md)
- [x] Publishing queue design (PUBLISHING_QUEUE.md)

### Week 2 Deliverables (Database & Video Processing)
- [ ] Prisma schema updated with PlatformConnection, PublishedPost, Video models
- [ ] Database migrations run
- [ ] Video upload to Cloudflare R2 working
- [ ] FFmpeg installed on development machine
- [ ] Basic video processing service created

### Developer Accounts Setup
- [ ] TikTok Developer account created
- [ ] TikTok app created, `video.publish` scope requested
- [ ] Facebook Developer account created
- [ ] Facebook app created, Instagram Graph API added
- [ ] Google Cloud Console project created
- [ ] YouTube Data API v3 enabled
- [ ] OAuth credentials generated for all platforms

---

## Week 3 Timeline

| Day | Focus Area | Key Deliverables |
|-----|-----------|------------------|
| **Day 15** | OAuth Setup | All OAuth routes functional |
| **Day 16** | Token Management | Auto-refresh system working |
| **Day 17** | TikTok Integration | TikTok upload working |
| **Day 18** | Instagram Integration | Instagram Reels upload working |
| **Day 19** | YouTube Integration | YouTube Shorts upload working |
| **Day 20** | Publishing Queue | Queue + worker deployed |
| **Day 21** | Testing & Polish | End-to-end flow tested |

---

## Day 15: OAuth Routes Setup

### Goal
Implement OAuth 2.0 flows for all three platforms.

### Morning (3 hours)

#### 1. Environment Variables Setup

Add to `.env.local`:

```bash
# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://localhost:3000/api/auth/tiktok/callback

# Facebook/Instagram
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=https://localhost:3000/api/auth/instagram/callback

# Google/YouTube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_REDIRECT_URI=https://localhost:3000/api/auth/youtube/callback

# Token Encryption
TOKEN_ENCRYPTION_KEY=generate_32_byte_random_key
```

#### 2. Install Dependencies

```bash
npm install googleapis ioredis crypto-js
npm install -D @types/crypto-js
```

#### 3. Create OAuth Route Structure

```
/app/api/auth/
├── tiktok/
│   ├── route.ts (initiate OAuth)
│   └── callback/
│       └── route.ts (handle callback)
├── instagram/
│   ├── route.ts
│   └── callback/
│       └── route.ts
└── youtube/
    ├── route.ts
    └── callback/
        └── route.ts
```

### Afternoon (4 hours)

#### 4. Implement TikTok OAuth

Use code examples from `TIKTOK_INTEGRATION.md`:
- `/app/api/auth/tiktok/route.ts` (authorization URL)
- `/app/api/auth/tiktok/callback/route.ts` (token exchange)

**Testing:**
```bash
# Visit in browser
http://localhost:3000/api/auth/tiktok

# Should redirect to TikTok authorization
# After approval, should redirect back and store tokens
```

#### 5. Implement Instagram OAuth

Use code examples from `INSTAGRAM_INTEGRATION.md`:
- `/app/api/auth/instagram/route.ts`
- `/app/api/auth/instagram/callback/route.ts`

**Note:** You'll need to exchange short-lived token for long-lived token.

#### 6. Implement YouTube OAuth

Use code examples from `YOUTUBE_INTEGRATION.md`:
- `/app/api/auth/youtube/route.ts`
- `/app/api/auth/youtube/callback/route.ts`

**Important:** Set `access_type=offline` and `prompt=consent` to get refresh token.

### End of Day Checklist

- [ ] All OAuth routes created
- [ ] CSRF state token validation implemented
- [ ] Tokens stored encrypted in database
- [ ] User redirected to dashboard after successful auth
- [ ] Error handling for failed OAuth flows
- [ ] Tested with real accounts (at least one platform)

---

## Day 16: Token Refresh System

### Goal
Implement automatic token refresh and background refresh cron job.

### Morning (3 hours)

#### 1. Implement Token Encryption

Update `/lib/oauth/token-manager.ts`:

```bash
npm install crypto
```

Replace placeholder encryption with AES-256-GCM:

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex');

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

#### 2. Complete Token Refresh Functions

Finish implementing:
- `refreshTikTokToken()`
- `refreshInstagramToken()`
- `refreshYouTubeToken()`

Use code examples from integration docs.

#### 3. Test Token Refresh

Create test script:

```typescript
// /scripts/test-token-refresh.ts
import { getValidAccessToken } from '@/lib/oauth/token-manager';

async function testRefresh() {
  const userId = 'test-user-id';

  // TikTok
  const tiktokToken = await getValidAccessToken(userId, 'TIKTOK');
  console.log('TikTok token:', tiktokToken.substring(0, 20) + '...');

  // Instagram
  const instagramToken = await getValidAccessToken(userId, 'INSTAGRAM');
  console.log('Instagram token:', instagramToken.substring(0, 20) + '...');

  // YouTube
  const youtubeToken = await getValidAccessToken(userId, 'YOUTUBE');
  console.log('YouTube token:', youtubeToken.substring(0, 20) + '...');
}

testRefresh();
```

### Afternoon (4 hours)

#### 4. Create Cron Job for Token Refresh

Option A: Vercel Cron (if using Vercel)

Create `/app/api/cron/refresh-tokens/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { refreshAllUsersTokens } from '@/lib/oauth/token-manager';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await refreshAllUsersTokens();

  return NextResponse.json({ success: true });
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-tokens",
      "schedule": "0 * * * *"
    }
  ]
}
```

Option B: Node-Cron (if self-hosting)

```bash
npm install node-cron
```

Create `/lib/cron/refresh-tokens-cron.ts`:

```typescript
import cron from 'node-cron';
import { refreshAllUsersTokens } from '../oauth/token-manager';

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running token refresh cron...');
  await refreshAllUsersTokens();
});
```

#### 5. Add Disconnect Platform Functionality

Create `/app/api/disconnect/[platform]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { disconnectPlatform } from '@/lib/oauth/token-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const userId = request.user.id;
  const platform = params.platform.toUpperCase();

  await disconnectPlatform(userId, platform as Platform);

  return NextResponse.json({ success: true });
}
```

### End of Day Checklist

- [ ] Token encryption implemented (AES-256-GCM)
- [ ] All three platform token refresh functions working
- [ ] `getValidAccessToken()` auto-refreshes expired tokens
- [ ] Cron job set up (runs every hour)
- [ ] Disconnect platform API route created
- [ ] Token refresh tested with actual tokens

---

## Day 17: TikTok Upload Implementation

### Goal
Complete TikTok video upload integration.

### Morning (3 hours)

#### 1. Create TikTok Upload Service

Create `/lib/tiktok/upload-video.ts`:

Use the code example from `TIKTOK_INTEGRATION.md`.

#### 2. Create TikTok API Route

Create `/app/api/publish/tiktok/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { uploadVideoToTikTok } from '@/lib/tiktok/upload-video';
import { getValidAccessToken } from '@/lib/oauth/token-manager';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { videoId, caption } = await request.json();
  const userId = request.user.id;

  // Get valid access token
  const accessToken = await getValidAccessToken(userId, 'TIKTOK');

  // Get video from database
  const video = await db.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  // Download video from R2
  const videoBuffer = await downloadVideoFromR2(video.r2Key);

  // Upload to TikTok
  const publishId = await uploadVideoToTikTok({
    accessToken,
    videoBuffer,
    title: caption,
  });

  // Save to database
  await db.publishedPost.create({
    data: {
      userId,
      videoId,
      platform: 'TIKTOK',
      platformPostId: publishId,
      caption,
    },
  });

  return NextResponse.json({ success: true, publishId });
}
```

### Afternoon (4 hours)

#### 3. Implement Chunked Upload

For videos > 10MB, implement chunked upload:

```typescript
async function uploadVideoInChunks(
  uploadUrl: string,
  videoBuffer: Buffer,
  chunkSize: number = 10 * 1024 * 1024 // 10MB
) {
  const totalSize = videoBuffer.length;
  let offset = 0;

  while (offset < totalSize) {
    const end = Math.min(offset + chunkSize, totalSize);
    const chunk = videoBuffer.slice(offset, end);

    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${offset}-${end - 1}/${totalSize}`,
        'Content-Length': chunk.length.toString(),
      },
      body: chunk,
    });

    offset = end;
  }
}
```

#### 4. Add Rate Limit Handling

Wrap TikTok API calls with rate limit retry:

```typescript
async function callTikTokAPIWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.code === 'rate_limit_exceeded') {
        const delay = 60000; // Wait 1 minute
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### 5. Test with Real TikTok Account

1. Upload a test video to R2
2. Call the TikTok publish API
3. Verify video appears in TikTok app (as private)
4. Check database for published post record

### End of Day Checklist

- [ ] TikTok upload service implemented
- [ ] Single-chunk upload working
- [ ] Multi-chunk upload working (for large files)
- [ ] Rate limit handling implemented
- [ ] Error handling for common TikTok errors
- [ ] Successfully uploaded test video to TikTok
- [ ] Published post saved in database

---

## Day 18: Instagram Upload Implementation

### Goal
Complete Instagram Reels upload integration.

### Morning (3 hours)

#### 1. Create Instagram Upload Service

Create `/lib/instagram/upload-reel.ts`:

Use the code example from `INSTAGRAM_INTEGRATION.md`.

**Key steps:**
1. Create media container
2. Poll for status (`FINISHED`)
3. Publish container

#### 2. Implement Status Polling

```typescript
async function pollContainerStatus(
  containerId: string,
  accessToken: string,
  maxAttempts: number = 30,
  pollInterval: number = 5000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR') return false;

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  return false; // Timeout
}
```

### Afternoon (4 hours)

#### 3. Create Instagram API Route

Create `/app/api/publish/instagram/route.ts`:

Similar structure to TikTok route, but:
- Use `video_url` (signed R2 URL)
- Poll for container status
- Publish container

#### 4. Generate Signed R2 URLs

Create `/lib/r2/generate-signed-url.ts`:

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generateSignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}
```

#### 5. Test with Real Instagram Account

1. Ensure Instagram account is Business/Creator
2. Generate signed URL for test video
3. Upload via API
4. Verify Reel appears in Instagram app

### End of Day Checklist

- [ ] Instagram Reels upload service implemented
- [ ] Media container creation working
- [ ] Status polling working (waits for `FINISHED`)
- [ ] Container publishing working
- [ ] Signed R2 URLs generated correctly
- [ ] Successfully uploaded test Reel to Instagram
- [ ] Published post saved in database

---

## Day 19: YouTube Upload Implementation

### Goal
Complete YouTube Shorts upload integration.

### Morning (3 hours)

#### 1. Install Google APIs Library

```bash
npm install googleapis
```

#### 2. Create YouTube Upload Service

Create `/lib/youtube/upload-video.ts`:

Use the code example from `YOUTUBE_INTEGRATION.md`.

Use the `googleapis` library for easier OAuth handling:

```typescript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function uploadVideoToYouTube({ ... }) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: { ... },
    media: { body: fs.createReadStream(videoPath) },
  });

  return response.data.id!;
}
```

### Afternoon (4 hours)

#### 3. Create YouTube API Route

Create `/app/api/publish/youtube/route.ts`:

Similar to TikTok/Instagram, but:
- Download video to temp file (YouTube API needs file path)
- Include `#Shorts` in title/description
- Set `selfDeclaredMadeForKids` flag

#### 4. Implement Quota Tracking

Create `/lib/youtube/quota-tracker.ts`:

```typescript
import { db } from '@/lib/db';

export async function trackQuotaUsage(
  operation: 'upload' | 'update' | 'list',
  cost: number
) {
  const today = new Date().toISOString().split('T')[0];

  await db.youtubeQuota.upsert({
    where: { date: today },
    update: { used: { increment: cost } },
    create: { date: today, used: cost, limit: 10000 },
  });
}

export async function checkQuotaAvailable(cost: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const quota = await db.youtubeQuota.findUnique({ where: { date: today } });

  return !quota || quota.used + cost <= quota.limit;
}
```

#### 5. Test with Real YouTube Account

1. Upload test Shorts (≤60s, 9:16)
2. Verify video appears in YouTube app
3. Check if auto-detected as Short (appears in Shorts shelf)

### End of Day Checklist

- [ ] YouTube upload service implemented
- [ ] googleapis library configured
- [ ] Shorts metadata properly set (#Shorts hashtag)
- [ ] Quota tracking implemented
- [ ] Quota exceeded error handled gracefully
- [ ] Successfully uploaded test Short to YouTube
- [ ] Published post saved in database

---

## Day 20: Publishing Queue Implementation

### Goal
Implement BullMQ queue and worker for async publishing.

### Morning (3 hours)

#### 1. Set Up Redis

**Option A: Upstash (Recommended)**

1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database (choose closest region)
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

Add to `.env`:

```bash
REDIS_URL=your_upstash_redis_url
REDIS_TOKEN=your_upstash_redis_token
```

**Option B: Local Redis**

```bash
docker run -d -p 6379:6379 redis:alpine
```

#### 2. Install BullMQ

```bash
npm install bullmq ioredis
```

#### 3. Create Queue

Create `/lib/queue/publish-queue.ts`:

Use code example from `PUBLISHING_QUEUE.md`.

### Afternoon (4 hours)

#### 4. Create Worker

Create `/lib/queue/publish-worker.ts`:

Use code example from `PUBLISHING_QUEUE.md`.

**Key features:**
- Get valid access token (auto-refresh)
- Download video from R2
- Call platform-specific upload function
- Update progress (0-100%)
- Handle errors with retry logic

#### 5. Update API Routes to Use Queue

Replace direct upload calls with queue jobs:

```typescript
// /app/api/publish/route.ts
import { addPublishJob } from '@/lib/queue/publish-queue';

export async function POST(request: NextRequest) {
  const { videoId, platform, caption, hashtags } = await request.json();

  const job = await addPublishJob({
    userId: request.user.id,
    videoId,
    platform,
    caption,
    hashtags,
  });

  return NextResponse.json({ jobId: job.id });
}
```

#### 6. Create Job Status Endpoint

Create `/app/api/publish/[jobId]/status/route.ts`:

```typescript
export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  const job = await publishQueue.getJob(params.jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    state: await job.getState(),
    progress: job.progress,
    result: job.returnvalue,
  });
}
```

### End of Day Checklist

- [ ] Redis set up (Upstash or local)
- [ ] BullMQ queue created
- [ ] Worker process implemented
- [ ] All three platforms integrated in worker
- [ ] Job progress tracking working
- [ ] Job status API route working
- [ ] Worker deployed (separate from Next.js)
- [ ] Successfully published video via queue

---

## Day 21: Testing & Polish

### Goal
End-to-end testing and bug fixes.

### Morning (3 hours)

#### 1. End-to-End Testing

Test the complete flow:

1. **Upload Video**
   - Upload test video to app
   - Verify stored in R2
   - Check database record

2. **Connect Platforms**
   - Connect TikTok account
   - Connect Instagram account
   - Connect YouTube account
   - Verify tokens stored encrypted

3. **Publish to TikTok**
   - Click "Publish to TikTok"
   - Job added to queue
   - Worker processes job
   - Video appears on TikTok
   - Database updated with platform post ID

4. **Publish to Instagram**
   - Same flow as TikTok
   - Verify container workflow completes
   - Reel appears on Instagram

5. **Publish to YouTube**
   - Same flow as TikTok/Instagram
   - Verify Short auto-detected
   - Video appears in Shorts shelf

6. **Multi-Platform Publish**
   - Publish same video to all three platforms
   - All jobs succeed
   - Video appears on all platforms

### Afternoon (3 hours)

#### 2. Error Handling Tests

Test failure scenarios:

- [ ] Invalid access token → Auto-refresh works
- [ ] Refresh token expired → User prompted to reconnect
- [ ] Rate limit exceeded → Job retries after delay
- [ ] Video file not found → Job fails gracefully
- [ ] Network timeout → Job retries with backoff
- [ ] Max retries exceeded → User notified

#### 3. UI Polish

- [ ] Show real-time job progress in dashboard
- [ ] Display published posts with platform icons
- [ ] Show error messages clearly
- [ ] Add loading states for all actions

#### 4. Documentation Updates

- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Add troubleshooting guide
- [ ] Create developer setup guide

### Evening (2 hours)

#### 5. Performance Optimization

- [ ] Add database indexes for common queries
- [ ] Optimize video download/upload speed
- [ ] Implement request caching where appropriate
- [ ] Monitor memory usage in worker

#### 6. Security Audit

- [ ] All tokens encrypted in database
- [ ] CSRF tokens validated in OAuth flows
- [ ] API routes protected with authentication
- [ ] Environment variables not committed to Git
- [ ] Signed URLs expire appropriately

### End of Day Checklist

- [ ] All three platforms fully integrated
- [ ] Publishing queue working reliably
- [ ] Token refresh automated
- [ ] Error handling comprehensive
- [ ] UI shows job progress
- [ ] Documentation complete
- [ ] Security best practices followed
- [ ] Ready for Week 4 (AI integration)

---

## Monitoring & Maintenance

### Daily Checks

- Monitor queue depth (should stay < 100)
- Check failed job count (investigate if > 5%)
- Review error logs for patterns
- Track API quota usage (especially YouTube)

### Weekly Tasks

- Review token refresh success rate
- Analyze publishing success rate per platform
- Optimize worker concurrency if needed
- Update platform API versions if changed

---

## Rollback Plan

If major issues occur:

1. **Queue Issues**: Pause worker, fix bug, restart
2. **OAuth Issues**: Revert to manual token entry (temp)
3. **Platform API Changes**: Add platform-specific feature flags
4. **Database Issues**: Rollback migration, restore from backup

---

## Success Metrics

By end of Week 3, you should achieve:

- **OAuth Success Rate**: > 95% (users can connect accounts)
- **Token Refresh Success Rate**: > 99% (auto-refresh works)
- **Publishing Success Rate**: > 90% (videos successfully upload)
- **Queue Processing Time**: < 2 minutes per video (average)
- **Platform Coverage**: 3/3 platforms working (TikTok, Instagram, YouTube)

---

## Next Steps (Week 4)

With platform integrations complete, Week 4 will focus on:

- OpenAI integration for script generation
- Claude Sonnet for idea generation
- ElevenLabs for voice-over
- Automated video editing workflows
- Content calendar and scheduling UI

---

## Resources

### Documentation
- [TikTok Integration](./TIKTOK_INTEGRATION.md)
- [Instagram Integration](./INSTAGRAM_INTEGRATION.md)
- [YouTube Integration](./YOUTUBE_INTEGRATION.md)
- [Platform Video Specs](./PLATFORM_VIDEO_SPECS.md)
- [Publishing Queue](./PUBLISHING_QUEUE.md)

### Code Examples
- [Token Manager](../lib/oauth/token-manager.ts)

### External Docs
- [TikTok API Docs](https://developers.tiktok.com/)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [BullMQ Docs](https://docs.bullmq.io/)

---

## Support & Troubleshooting

### Common Issues

**Issue**: OAuth callback not working
- **Solution**: Check redirect URI matches exactly (including http vs https)

**Issue**: Token refresh fails
- **Solution**: Verify client secret is correct, check token hasn't been revoked

**Issue**: TikTok video stuck in processing
- **Solution**: Check video format (must be MP4/H.264), try smaller file

**Issue**: Instagram container status never reaches `FINISHED`
- **Solution**: Verify video URL is direct (no redirects), check video format

**Issue**: YouTube quota exceeded
- **Solution**: Implement quota tracking, spread uploads throughout day

**Issue**: Worker process crashes
- **Solution**: Add error handling, implement graceful shutdown, monitor memory

---

## Conclusion

By the end of Day 21, ViralMommy will have a fully functional multi-platform publishing system, capable of uploading videos to TikTok, Instagram, and YouTube with automatic token management, error handling, and retry logic.

This foundation enables Week 4's AI integration, where content will be automatically generated and published at scale.

**Week 3 Status**: Ready to implement! 🚀
