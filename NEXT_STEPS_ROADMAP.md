# ViralMommy - Next Steps Roadmap

**Current Status:** ~75% Complete - Core platform integrations done
**Last Updated:** 2025-11-19
**Priority:** Build video upload/storage → AI features → Polish UI

---

## Phase 1: CRITICAL - Make Platform Functional (1-2 weeks)

### 1. Video Upload & Storage System ⚠️ BLOCKING
**Priority:** 🔴 CRITICAL - Nothing works without this

**What's Needed:**
- Cloud storage integration (Cloudflare R2 recommended)
- File upload endpoint with validation
- Drag-and-drop upload UI
- Progress tracking
- Thumbnail extraction
- Video metadata extraction (duration, resolution, format)

**Technical Implementation:**

#### A. Cloudflare R2 Setup
```bash
# 1. Sign up at cloudflare.com
# 2. Create R2 bucket: "viralmommy-videos"
# 3. Get credentials:
#    - Account ID
#    - Access Key ID
#    - Secret Access Key
```

**Environment Variables Needed:**
```env
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-key"
CLOUDFLARE_R2_BUCKET_NAME="viralmommy-videos"
CLOUDFLARE_R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"
```

#### B. Create Upload API
**File:** `app/api/videos/upload/route.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize R2 client (compatible with S3 API)
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  // 1. Get file info from request
  // 2. Validate file (type, size, duration)
  // 3. Generate unique storage key
  // 4. Upload to R2
  // 5. Extract metadata (duration, resolution)
  // 6. Generate thumbnail
  // 7. Create Video record in database
  // 8. Return video ID + URLs
}
```

**Features to Include:**
- Max file size: 500MB (configurable by tier)
- Allowed formats: MP4, MOV, AVI, WebM
- Validation: Check MIME type, duration < 10 minutes
- Chunked upload for large files (optional but recommended)

#### C. Update Upload Page
**File:** `app/(dashboard)/upload/page.tsx`

**Current State:** Placeholder UI
**Needed Changes:**
- Replace placeholder with real upload component
- Add drag-and-drop zone (use `react-dropzone`)
- Show upload progress bar
- Display video preview after upload
- Form for title, description
- Multi-platform selection (checkboxes for FB, TikTok, YouTube)
- Schedule later option (date/time picker)
- Caption/hashtag suggestions (AI-powered)

**UI Flow:**
```
1. Drag video or click to browse
2. Show upload progress (0-100%)
3. Once uploaded, show preview + form
4. Add title, description, hashtags
5. Select platforms (FB, IG, TikTok, YouTube)
6. Choose: "Publish Now" or "Schedule for Later"
7. Submit → Queue job → Redirect to Videos page
```

#### D. Videos Library Page
**File:** `app/(dashboard)/videos/page.tsx`

**Current State:** Placeholder
**Needed Features:**
- Grid/List view toggle
- Video cards showing:
  - Thumbnail
  - Title
  - Upload date
  - Status (Processing, Ready, Published, Failed)
  - Platforms published to (with icons)
  - Analytics preview (views, likes)
- Actions per video:
  - Publish to platforms
  - Edit metadata
  - Delete
  - View analytics
- Filter by status, date, platform
- Search by title

**Mock Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [Upload New Video]    🔍 Search   Filter: [All ▾]     │
├─────────────────────────────────────────────────────────┤
│  ┌──────┐  Video Title 1                    [⋮]        │
│  │ THUMB│  Uploaded 2 hours ago                        │
│  │      │  Status: Ready                                │
│  └──────┘  📱 TikTok  📘 Facebook                       │
│                                                         │
│  ┌──────┐  Video Title 2                    [⋮]        │
│  │ THUMB│  Uploaded yesterday                          │
│  │      │  Status: Published                            │
│  └──────┘  📱 TikTok  📘 Facebook  ▶️ YouTube          │
└─────────────────────────────────────────────────────────┘
```

---

### 2. Publishing Queue System
**Priority:** 🔴 CRITICAL - Needed for async publishing

**Why:** Publishing to platforms takes time. Need background jobs.

**What's Already There:**
- BullMQ setup in `lib/queue/`
- Redis connection
- Worker files (incomplete)

**What's Needed:**
- Complete the worker implementations
- Add job creation in publish endpoints
- Handle retries on failure
- Update video status in real-time

**Implementation:**

#### A. Video Publishing Worker
**File:** `lib/queue/video-worker.ts`

```typescript
import { Worker } from 'bullmq'
import { facebookService } from '@/lib/services/facebook'
import { tiktokService } from '@/lib/services/tiktok'
import { youtubeService } from '@/lib/services/youtube'

const worker = new Worker('video-publishing', async (job) => {
  const { videoId, platforms, caption, isShort } = job.data

  // Get video from DB
  const video = await prisma.video.findUnique({ where: { id: videoId } })

  // Get user's platform connections
  const connections = await prisma.platformConnection.findMany({
    where: { userId: video.userId, platform: { in: platforms } }
  })

  // Publish to each platform
  const results = await Promise.allSettled(
    connections.map(async (conn) => {
      switch (conn.platform) {
        case 'FACEBOOK':
          return facebookService.publishVideo({ ... })
        case 'TIKTOK':
          return tiktokService.publishVideo({ ... })
        case 'YOUTUBE':
          return youtubeService.publishVideo({ ... })
      }
    })
  )

  // Update database with results
  // ...
}, { connection: redis })
```

#### B. Update Publish Flow
Instead of publishing immediately in API routes, queue jobs:

```typescript
// app/api/videos/publish/route.ts
import { videoQueue } from '@/lib/queue/video-queue'

export async function POST(request: Request) {
  const { videoId, platforms, caption, scheduleFor } = await request.json()

  if (scheduleFor) {
    // Schedule for later
    await videoQueue.add('publish', { videoId, platforms, caption }, {
      delay: new Date(scheduleFor).getTime() - Date.now()
    })
  } else {
    // Publish now
    await videoQueue.add('publish', { videoId, platforms, caption })
  }

  return NextResponse.json({ message: 'Publishing queued' })
}
```

---

### 3. Main Dashboard Overhaul
**Priority:** 🟡 HIGH - First thing users see

**Current State:** Empty placeholder
**Needed:** Real dashboard with useful content

**Dashboard Sections:**

#### A. Quick Stats (Top Row)
```
┌────────────┬────────────┬────────────┬────────────┐
│ 📹 Videos  │ 👀 Views   │ ❤️ Likes   │ 📊 Eng Rate│
│    24      │   1.2M     │   89K      │   7.2%     │
│ +3 today   │ +15% week  │ +12% week  │ +0.8%      │
└────────────┴────────────┴────────────┴────────────┘
```

#### B. Recent Activity Feed
- "Video X published to TikTok - 2 hours ago"
- "Video Y reached 10K views on Instagram - yesterday"
- "New follower milestone: 5K on Facebook - 3 days ago"

#### C. Recent Videos (Grid)
Last 6 uploaded videos with thumbnails, status, quick actions

#### D. Quick Actions
- [+ Upload New Video] - Big prominent button
- [View Analytics] - Link to analytics page
- [Schedule Post] - Link to calendar (future feature)

#### E. Platform Status
Show connected platforms with health indicators:
```
✅ Facebook Connected (expires in 45 days)
✅ TikTok Connected
✅ YouTube Connected
⚠️ Instagram - Reconnect needed
```

#### F. AI Insights Panel
```
💡 Best Time to Post: 2-4 PM
📈 Your engagement is up 23% this week
🎯 Try posting more Reels - they get 2x engagement
```

---

## Phase 2: AI-Powered Features (1 week)

### 4. AI Caption & Hashtag Generator
**Priority:** 🟡 HIGH - Major value-add

**What's Needed:**
- Anthropic Claude API integration
- Caption generation endpoint
- Hashtag suggestion endpoint
- UI components in upload flow

**Implementation:**

#### A. AI Service
**File:** `lib/services/ai.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export class AIService {
  async generateCaption(videoDescription: string, platform: string) {
    const prompt = `Generate an engaging ${platform} caption for this video: ${videoDescription}

    Requirements:
    - Engaging and conversational
    - Include relevant emojis
    - ${platform === 'TIKTOK' ? 'Keep under 150 chars' : 'Keep under 300 chars'}
    - Match ${platform} audience tone

    Return only the caption, no explanations.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    return message.content[0].text
  }

  async generateHashtags(videoDescription: string, platform: string) {
    const prompt = `Generate trending hashtags for this ${platform} video: ${videoDescription}

    Requirements:
    - 5-10 relevant hashtags
    - Mix of popular and niche tags
    - Platform-appropriate
    - No banned or controversial tags

    Return only hashtags separated by spaces.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    return message.content[0].text.split(' ')
  }

  async analyzeVideo(videoUrl: string) {
    // Future: Use Claude's vision capabilities to analyze video content
    // For now, just return placeholder
    return {
      mood: 'upbeat',
      topics: ['lifestyle', 'tips', 'tutorial'],
      suggestedTitle: 'Generated Title',
    }
  }
}

export const aiService = new AIService()
```

#### B. API Endpoints
**File:** `app/api/ai/caption/route.ts`
```typescript
export async function POST(request: Request) {
  const { description, platform } = await request.json()
  const caption = await aiService.generateCaption(description, platform)
  return NextResponse.json({ caption })
}
```

**File:** `app/api/ai/hashtags/route.ts`
```typescript
export async function POST(request: Request) {
  const { description, platform } = await request.json()
  const hashtags = await aiService.generateHashtags(description, platform)
  return NextResponse.json({ hashtags })
}
```

#### C. UI Integration
In Upload Page, add:
```tsx
<Button onClick={async () => {
  const response = await fetch('/api/ai/caption', {
    method: 'POST',
    body: JSON.stringify({ description: videoTitle, platform: 'TIKTOK' })
  })
  const { caption } = await response.json()
  setCaption(caption)
}}>
  ✨ Generate AI Caption
</Button>
```

---

### 5. Analytics Auto-Sync
**Priority:** 🟡 HIGH - Make analytics actually useful

**Current State:** Metrics stored but not updated
**Needed:** Background job to fetch real metrics from platforms

**Implementation:**

#### A. Analytics Sync Worker
**File:** `lib/workers/analytics-sync-worker.ts`

```typescript
import { Worker } from 'bullmq'

const worker = new Worker('analytics-sync', async (job) => {
  const { postId } = job.data

  const post = await prisma.publishedPost.findUnique({
    where: { id: postId },
    include: { user: true }
  })

  // Get platform connection
  const connection = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId: post.userId,
        platform: post.platform
      }
    }
  })

  let stats
  switch (post.platform) {
    case 'FACEBOOK':
      stats = await facebookService.getVideoAnalytics(post.platformPostId, connection.accessToken)
      break
    case 'TIKTOK':
      stats = await tiktokService.getVideoInfo(post.platformPostId, connection.accessToken)
      break
    case 'YOUTUBE':
      stats = await youtubeService.getVideoStats(post.platformPostId, connection.accessToken)
      break
  }

  // Update database
  await prisma.publishedPost.update({
    where: { id: postId },
    data: {
      views: stats.views,
      likes: stats.likes,
      comments: stats.comments,
      shares: stats.shares,
      lastSyncedAt: new Date(),
    }
  })
}, { connection: redis })
```

#### B. Scheduled Sync Job
**File:** `app/api/cron/sync-analytics/route.ts`

```typescript
// This gets called by Railway Cron every hour
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all published posts from last 30 days
  const posts = await prisma.publishedPost.findMany({
    where: {
      publishedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  })

  // Queue analytics sync for each
  for (const post of posts) {
    await analyticsQueue.add('sync', { postId: post.id })
  }

  return NextResponse.json({ synced: posts.length })
}
```

**Railway Cron Setup:**
1. Go to Railway dashboard
2. Add Cron Job
3. Schedule: `0 * * * *` (every hour)
4. Command: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.railway.app/api/cron/sync-analytics`

---

## Phase 3: Polish & Enhancement (1-2 weeks)

### 6. Content Scheduling
**Priority:** 🟢 MEDIUM - Nice to have

**Features:**
- Calendar view of scheduled posts
- Drag-and-drop to reschedule
- Best time suggestions (AI-powered)
- Queue management

**Database Schema Addition:**
```prisma
model ScheduledPost {
  id           String   @id @default(uuid())
  userId       String
  videoId      String
  platforms    Platform[]
  caption      String?
  scheduledFor DateTime
  status       ScheduledPostStatus @default(PENDING)

  user         User     @relation(fields: [userId], references: [id])
  video        Video    @relation(fields: [videoId], references: [id])

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum ScheduledPostStatus {
  PENDING
  PROCESSING
  PUBLISHED
  FAILED
  CANCELLED
}
```

**UI:** `app/(dashboard)/calendar/page.tsx`
- Use `react-big-calendar` or similar
- Show scheduled posts on calendar
- Click date to schedule new post
- Click post to edit/cancel

---

### 7. Email Notifications
**Priority:** 🟢 MEDIUM - User engagement

**Use Resend (resend.com):**
- Free tier: 3,000 emails/month
- Great DX, easy setup

**Email Types:**
- Welcome email on signup
- Video published successfully
- Publishing failed (with error details)
- Weekly analytics digest
- Subscription renewal reminder

**Implementation:**
```typescript
// lib/services/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  await resend.emails.send({
    from: 'ViralMommy <noreply@viralmommy.com>',
    to: userEmail,
    subject: 'Welcome to ViralMommy!',
    html: `<h1>Welcome ${userName}!</h1><p>Start by connecting your platforms...</p>`
  })
}
```

---

### 8. Platform Disconnect Feature
**Priority:** 🟢 MEDIUM - Security/privacy

**Current State:** UI exists but no backend
**Needed:**
- Disconnect endpoint
- Token revocation
- Update UI to show disconnected state

```typescript
// app/api/platforms/[platform]/disconnect/route.ts
export async function POST(request: Request) {
  const session = await getServerSession()
  const { platform } = await request.json()

  // Find connection
  const connection = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: {
        userId: user.id,
        platform: platform
      }
    }
  })

  // Revoke token on platform side (if possible)
  // For now, just delete from DB

  await prisma.platformConnection.delete({
    where: { id: connection.id }
  })

  return NextResponse.json({ success: true })
}
```

---

### 9. Profile Picture Upload
**Priority:** 🟢 LOW - Nice polish

**Current State:** UI exists but not wired up
**Needed:**
- Upload endpoint
- Store in R2 (same as videos)
- Update User model
- Display in sidebar/settings

---

### 10. Video Editing Tools
**Priority:** 🟢 LOW - Future enhancement

**Ideas:**
- Trim video (start/end time)
- Add text overlays
- Add music from library
- Apply filters
- Crop/resize for different platforms

**Consider:** This is complex - might want to use a third-party service like Cloudflare Stream or Mux

---

## Phase 4: Advanced Features (Future)

### 11. Team Collaboration (Enterprise Feature)
- Multi-user accounts
- Role-based permissions (Admin, Editor, Viewer)
- Comment/approval workflows
- Brand kit sharing

### 12. Additional Platforms
- Twitter/X video publishing
- LinkedIn video posts
- Pinterest video pins

### 13. Analytics Export
- CSV/PDF export
- Custom date ranges
- Scheduled reports via email

### 14. Mobile App
- React Native
- Push notifications
- Record videos in-app

---

## Technical Debt & Improvements

### A. Testing
**Current Coverage:** 0%
**Priority:** 🟡 HIGH (before scaling)

**Add:**
- Unit tests for services (Jest)
- Integration tests for API routes
- E2E tests for critical flows (Playwright)

**Start with:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### B. Error Monitoring
**Priority:** 🟡 HIGH (for production)

**Use Sentry:**
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### C. Database Optimization
**Priority:** 🟢 MEDIUM

**Add indexes:**
```prisma
@@index([userId, createdAt])
@@index([status, publishedAt])
@@index([platform, publishedAt])
```

**Connection pooling:**
- Use Prisma Accelerate or PgBouncer

### D. Security Improvements
**Priority:** 🟡 HIGH

**Add:**
- Rate limiting (use `@upstash/ratelimit`)
- File upload virus scanning
- Email verification
- 2FA for enterprise users
- CAPTCHA on signup

### E. Performance
**Priority:** 🟢 MEDIUM

**Optimizations:**
- Lazy load analytics charts
- Implement Redis caching for API responses
- CDN for static assets (Cloudflare)
- Image optimization (Next.js Image component)
- Database query optimization

---

## Cost Estimates (Monthly)

### Current (Minimal Usage)
- Railway: $20-50
- **Total: ~$20-50/month**

### With Full Features (Moderate Usage)
- Railway: $50-100
- Cloudflare R2: $5-15 (storage + bandwidth)
- Anthropic API: $10-50 (depends on usage)
- Resend Email: Free tier (or $20 if >3k emails)
- Sentry: Free tier
- **Total: ~$65-185/month**

### At Scale (1000+ users)
- Railway: $150-300
- Cloudflare R2: $50-100
- Anthropic API: $100-500
- Resend: $40-80
- Sentry: $26/month
- **Total: ~$366-1006/month**

---

## Immediate Action Plan (Next 48 Hours)

### Day 1 (Today):
1. ✅ You: Link Facebook, TikTok, YouTube platforms
2. ⏳ Me: Create this roadmap
3. 🔴 Set up Cloudflare R2 bucket
4. 🔴 Build video upload API endpoint
5. 🔴 Update upload page UI with drag-drop

### Day 2 (Tomorrow):
6. 🔴 Complete videos library page
7. 🔴 Implement publishing queue worker
8. 🟡 Build AI caption generator
9. 🟡 Overhaul main dashboard
10. 🟡 Set up analytics sync worker

### End of Week:
- ✅ Video upload fully working
- ✅ Can publish to all 3 platforms
- ✅ AI generates captions/hashtags
- ✅ Dashboard shows real data
- ✅ Analytics auto-update

---

## Success Metrics

### Week 1:
- [ ] Upload first video successfully
- [ ] Publish to at least 1 platform
- [ ] View analytics for published content

### Week 2:
- [ ] AI caption generation working
- [ ] 10+ videos uploaded and published
- [ ] All platforms connected and publishing

### Month 1:
- [ ] Onboard first 10 beta users
- [ ] 100+ videos published across platforms
- [ ] Analytics showing growth trends

### Month 3:
- [ ] 100+ active users
- [ ] $500+ MRR (Monthly Recurring Revenue)
- [ ] 1000+ videos published
- [ ] Average user publishes 2x/week

---

## Resources & Documentation

### Essential Reading:
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#handling-other-http-methods)

### Community & Support:
- Railway Discord for hosting issues
- Cloudflare Discord for R2 help
- Anthropic Discord for AI questions

---

## Notes & Decisions

### Why Cloudflare R2?
- Cheaper than S3 (no egress fees)
- Fast global CDN
- S3-compatible API (easy migration if needed)
- $0.015/GB storage vs S3's $0.023/GB

### Why Anthropic Claude?
- Best-in-class text generation
- Fast response times
- Good pricing ($3 per 1M input tokens)
- Great for creative content like captions

### Why BullMQ?
- Robust job queue with Redis
- Retries and failure handling
- Progress tracking
- Scheduled jobs

### Why Not Build Feature X?
Some features are intentionally delayed:
- **Video editing:** Complex, use third-party later
- **Live streaming:** Not core use case yet
- **Mobile app:** Web-first approach
- **White label:** Add after PMF (Product-Market Fit)

---

## Questions to Answer

1. **Business Model:** Freemium working? Should we add pay-per-publish?
2. **Target Market:** Moms only or broader creator market?
3. **Pricing:** Current tiers right or need adjustment?
4. **Features:** What do users request most?
5. **Platforms:** Add Twitter/LinkedIn or focus on current 3?

---

## Contact & Collaboration

**GitHub Repo:** Your repo URL
**Railway Project:** Your Railway dashboard
**Documentation:**
- `FACEBOOK_SETUP.md`
- `TIKTOK_SETUP.md`
- `YOUTUBE_SETUP.md`
- `PROJECT_COMPREHENSIVE_BREAKDOWN.md`
- `NEXT_STEPS_ROADMAP.md` (this file)

---

**LET'S BUILD! 🚀**

The foundation is solid. Now we make it shine.
