# Publishing Queue Design

## Overview

This document outlines the architecture for ViralMommy's publishing queue system, which handles asynchronous video uploads to TikTok, Instagram, and YouTube. The queue system ensures reliable, scalable, and fault-tolerant content publishing.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Queue Technology](#queue-technology)
3. [Queue Workflow](#queue-workflow)
4. [Job Structure](#job-structure)
5. [Worker Implementation](#worker-implementation)
6. [Error Handling & Retries](#error-handling--retries)
7. [Scheduling](#scheduling)
8. [Monitoring](#monitoring)
9. [Code Examples](#code-examples)

---

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   User UI   │────────▶│  Next.js    │────────▶│   Redis     │
│  Dashboard  │         │   API       │         │   Queue     │
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │   Worker    │
                                                 │  Process(es)│
                                                 └─────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        ▼                               ▼                               ▼
                 ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
                 │   TikTok    │             │  Instagram  │             │   YouTube   │
                 │     API     │             │     API     │             │     API     │
                 └─────────────┘             └─────────────┘             └─────────────┘
```

---

## Queue Technology

### Recommended: BullMQ + Redis

**BullMQ** is a Node.js queue library built on Redis, offering:

- ✅ Job prioritization
- ✅ Delayed/scheduled jobs
- ✅ Job retries with exponential backoff
- ✅ Job progress tracking
- ✅ Concurrency control
- ✅ Event-driven architecture
- ✅ Redis Cluster support (scalable)

**Redis** is required for BullMQ and serves as:
- Job queue storage
- Job state management
- Distributed locking
- Rate limiting

### Installation

```bash
npm install bullmq ioredis
```

### Alternative Options

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **BullMQ** | Feature-rich, reliable, Redis-based | Requires Redis | Production |
| **Vercel Cron** | Simple, no Redis needed | Limited to scheduled jobs | Simple scheduled posts |
| **AWS SQS** | Fully managed, scalable | AWS dependency, more complex | Enterprise scale |
| **Inngest** | Serverless, TypeScript-native | Newer, less mature | Modern serverless apps |

**Recommendation**: Use **BullMQ + Upstash Redis** (serverless Redis) for ViralMommy.

---

## Queue Workflow

### Publishing Flow Diagram

```
User Action: "Publish to TikTok"
          │
          ▼
    Add Job to Queue
    ┌────────────────┐
    │  Job Created   │
    │  Status: WAIT  │
    └────────────────┘
          │
          ▼
    Worker Picks Up Job
    ┌────────────────┐
    │ Status: ACTIVE │
    └────────────────┘
          │
          ▼
    1. Get Valid Access Token
       ├─▶ Token expired? → Refresh token
       └─▶ Refresh failed? → Retry/Fail job
          │
          ▼
    2. Download Video from R2
       ├─▶ Video not found? → Fail job
       └─▶ Success
          │
          ▼
    3. Optimize Video (if needed)
       ├─▶ File too large? → Compress
       ├─▶ Wrong format? → Convert
       └─▶ Success
          │
          ▼
    4. Upload to Platform API
       ├─▶ Rate limit? → Delay + Retry
       ├─▶ Token error? → Refresh + Retry
       ├─▶ Network error? → Retry with backoff
       └─▶ Success
          │
          ▼
    5. Store Platform Post ID
       └─▶ Save to database
          │
          ▼
    6. Mark Job Complete
    ┌────────────────┐
    │Status: COMPLETED│
    └────────────────┘
          │
          ▼
    7. Notify User
       └─▶ "Your video is live on TikTok!"
```

---

## Job Structure

### Job Data Schema

```typescript
interface PublishJobData {
  // Job metadata
  jobId: string;
  userId: string;
  videoId: string;

  // Platform details
  platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE';

  // Video metadata
  videoUrl: string; // R2 signed URL
  caption: string;
  hashtags: string[];

  // Optional settings
  privacyLevel?: 'public' | 'private' | 'unlisted';
  scheduledTime?: Date; // For scheduled posts
  shareToFeed?: boolean; // Instagram only

  // Retry tracking
  attemptNumber?: number;
  lastError?: string;
}
```

### Job Options

```typescript
interface PublishJobOptions {
  // Delay before processing (for scheduled posts)
  delay?: number; // milliseconds

  // Retry configuration
  attempts?: number; // Max retry attempts (default: 3)
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number; // Initial delay (ms)
  };

  // Priority (higher = processed first)
  priority?: number; // 1-10

  // Remove job after completion
  removeOnComplete?: boolean | number; // true or keep N jobs

  // Remove job after failure
  removeOnFail?: boolean | number;
}
```

---

## Worker Implementation

### Worker Architecture

**Single Worker Process** (recommended for MVP):
- One worker process handles all platforms
- Uses platform-specific handlers
- Runs as separate Node.js process or serverless function

**Multi-Worker Architecture** (for scale):
- Separate workers per platform (TikTok, Instagram, YouTube)
- Allows independent scaling
- Better fault isolation

### Concurrency

Control how many jobs run simultaneously:

```typescript
// Process 5 jobs at a time
worker.concurrency = 5;

// Or per platform:
const tiktokWorker = new Worker('tiktok-queue', processTikTokJob, {
  concurrency: 3,
});

const instagramWorker = new Worker('instagram-queue', processInstagramJob, {
  concurrency: 2,
});
```

**Considerations:**
- TikTok: 2 videos per minute → Use lower concurrency (2-3)
- Instagram: 200 requests/hour → Moderate concurrency (3-5)
- YouTube: 10,000 quota/day → Higher concurrency (5-10)

---

## Error Handling & Retries

### Error Categories

#### 1. Retriable Errors (Retry with backoff)

- Network timeouts
- Rate limit exceeded (429)
- Platform API temporary errors (5xx)
- Video still processing (Instagram)

#### 2. Non-Retriable Errors (Fail immediately)

- Invalid access token (user needs to reconnect)
- Video file not found
- Invalid video format
- Platform API permanent errors (400 Bad Request)
- User permissions revoked

#### 3. Token Refresh Errors (Retry once after refresh)

- Access token expired
- Token invalid (try refresh, then fail if refresh fails)

### Retry Strategy

```typescript
const jobOptions: JobOptions = {
  attempts: 3, // Max 3 attempts

  backoff: {
    type: 'exponential',
    delay: 5000, // Start with 5 seconds
  },
  // Retry delays: 5s, 10s, 20s
};
```

### Error Handling Flow

```
Job Fails
    │
    ▼
Check Error Type
    │
    ├─▶ Token Error?
    │   └─▶ Refresh token → Retry immediately
    │
    ├─▶ Rate Limit?
    │   └─▶ Delay until rate limit resets → Retry
    │
    ├─▶ Network Error?
    │   └─▶ Exponential backoff → Retry
    │
    ├─▶ Invalid Video?
    │   └─▶ Fail permanently → Notify user
    │
    └─▶ Max Retries Reached?
        └─▶ Fail permanently → Notify user with error
```

---

## Scheduling

### Immediate Publishing

User clicks "Publish Now":

```typescript
await publishQueue.add('publish', jobData, {
  priority: 5, // Normal priority
});
```

### Scheduled Publishing

User schedules post for future date:

```typescript
const scheduledTime = new Date('2025-11-15T10:00:00Z');
const delayMs = scheduledTime.getTime() - Date.now();

await publishQueue.add('publish', jobData, {
  delay: delayMs, // Delay until scheduled time
  priority: 3, // Lower priority than immediate posts
});
```

### Recurring/Batch Publishing

Publish multiple videos at staggered times:

```typescript
const videos = [video1, video2, video3];
const intervalMinutes = 30;

for (let i = 0; i < videos.length; i++) {
  await publishQueue.add('publish', {
    videoId: videos[i].id,
    platform: 'TIKTOK',
    // ...
  }, {
    delay: i * intervalMinutes * 60 * 1000, // Stagger by 30 min
  });
}
```

---

## Monitoring

### Job States

- `WAITING`: Job added to queue
- `ACTIVE`: Worker processing job
- `COMPLETED`: Job finished successfully
- `FAILED`: Job failed after all retries
- `DELAYED`: Job scheduled for later

### Metrics to Track

1. **Job Throughput**
   - Jobs completed per hour
   - Jobs failed per hour

2. **Success Rate**
   - % of jobs that succeed on first attempt
   - % of jobs that eventually succeed

3. **Retry Rate**
   - Average retries per job
   - Most common errors

4. **Queue Depth**
   - Number of waiting jobs
   - Queue processing time

5. **Platform-Specific**
   - TikTok uploads per day (track 15/day limit)
   - Instagram uploads per hour (track 200/hour limit)
   - YouTube quota usage (track 10,000/day limit)

### Monitoring Dashboard

Use **BullMQ Board** for visual monitoring:

```bash
npm install @bull-board/express @bull-board/api
```

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [
    new BullMQAdapter(publishQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Access at: `https://viralmommy.com/admin/queues`

---

## Code Examples

### 1. Queue Setup

```typescript
// /lib/queue/publish-queue.ts
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Create queue
export const publishQueue = new Queue('publish', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 1000, // Keep last 1000 failed jobs for debugging
    },
  },
});

// Export for use in API routes
export async function addPublishJob(data: PublishJobData, options?: JobOptions) {
  return await publishQueue.add('publish', data, options);
}
```

### 2. Worker Implementation

```typescript
// /lib/queue/publish-worker.ts
import { Worker, Job } from 'bullmq';
import { publishQueue } from './publish-queue';
import { uploadVideoToTikTok } from '../tiktok/upload-video';
import { uploadReelToInstagram } from '../instagram/upload-reel';
import { uploadVideoToYouTube } from '../youtube/upload-video';
import { getValidAccessToken } from '../oauth/token-manager';
import { db } from '../db';

const worker = new Worker(
  'publish',
  async (job: Job<PublishJobData>) => {
    const { userId, videoId, platform, caption, hashtags } = job.data;

    // Update progress
    await job.updateProgress(10);

    // 1. Get valid access token (auto-refresh if needed)
    const accessToken = await getValidAccessToken(userId, platform);
    await job.updateProgress(20);

    // 2. Get video URL from database
    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) throw new Error('Video not found');
    await job.updateProgress(30);

    // 3. Download video from R2 (or use signed URL)
    const videoUrl = await getSignedVideoUrl(video.r2Key);
    await job.updateProgress(40);

    // 4. Upload to platform
    let platformPostId: string;

    switch (platform) {
      case 'TIKTOK':
        platformPostId = await uploadVideoToTikTok({
          accessToken,
          videoBuffer: await downloadVideo(videoUrl),
          title: caption,
        });
        break;

      case 'INSTAGRAM':
        platformPostId = await uploadReelToInstagram({
          instagramAccountId: video.platformUserId,
          accessToken,
          videoUrl,
          caption: `${caption}\n\n${hashtags.join(' ')}`,
        });
        break;

      case 'YOUTUBE':
        platformPostId = await uploadVideoToYouTube({
          accessToken,
          refreshToken: video.refreshToken,
          videoPath: await downloadVideo(videoUrl),
          title: caption,
          description: `${caption}\n\n${hashtags.join(' ')}`,
        });
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    await job.updateProgress(80);

    // 5. Store platform post ID in database
    await db.publishedPost.create({
      data: {
        videoId,
        userId,
        platform,
        platformPostId,
        caption,
        publishedAt: new Date(),
      },
    });

    await job.updateProgress(100);

    return { platformPostId, platform };
  },
  {
    connection,
    concurrency: 5, // Process 5 jobs at once
  }
);

// Event listeners
worker.on('completed', async (job) => {
  console.log(`Job ${job.id} completed:`, job.returnvalue);

  // Notify user
  await notifyUser(job.data.userId, {
    title: 'Video Published!',
    message: `Your video is now live on ${job.data.platform}`,
  });
});

worker.on('failed', async (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);

  // Notify user on final failure
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    await notifyUser(job.data.userId, {
      title: 'Publishing Failed',
      message: `Failed to publish to ${job.data.platform}: ${err.message}`,
    });
  }
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

export default worker;
```

### 3. API Route to Add Job

```typescript
// /app/api/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addPublishJob } from '@/lib/queue/publish-queue';
import { z } from 'zod';

const publishSchema = z.object({
  videoId: z.string(),
  platform: z.enum(['TIKTOK', 'INSTAGRAM', 'YOUTUBE']),
  caption: z.string().max(2200),
  hashtags: z.array(z.string()).max(10),
  scheduledTime: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const data = publishSchema.parse(body);

  const userId = request.user.id; // Get from auth session

  // Calculate delay for scheduled posts
  let delay = 0;
  if (data.scheduledTime) {
    delay = new Date(data.scheduledTime).getTime() - Date.now();
    if (delay < 0) {
      return NextResponse.json({ error: 'Scheduled time is in the past' }, { status: 400 });
    }
  }

  // Add job to queue
  const job = await addPublishJob(
    {
      jobId: crypto.randomUUID(),
      userId,
      videoId: data.videoId,
      platform: data.platform,
      videoUrl: '', // Will be fetched in worker
      caption: data.caption,
      hashtags: data.hashtags,
    },
    {
      delay,
      priority: delay > 0 ? 3 : 5, // Lower priority for scheduled posts
    }
  );

  return NextResponse.json({
    jobId: job.id,
    message: delay > 0 ? 'Post scheduled' : 'Publishing in progress',
  });
}
```

### 4. Job Status Check

```typescript
// /app/api/publish/[jobId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { publishQueue } from '@/lib/queue/publish-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const job = await publishQueue.getJob(params.jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const state = await job.getState();
  const progress = job.progress;

  return NextResponse.json({
    jobId: job.id,
    state, // 'waiting', 'active', 'completed', 'failed'
    progress, // 0-100
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
  });
}
```

---

## Database Schema Additions

```prisma
// /prisma/schema.prisma

model PublishedPost {
  id              String   @id @default(cuid())
  userId          String
  videoId         String
  platform        Platform
  platformPostId  String   // TikTok video ID, Instagram media ID, YouTube video ID
  caption         String   @db.Text
  publishedAt     DateTime @default(now())
  views           Int      @default(0)
  likes           Int      @default(0)
  comments        Int      @default(0)
  shares          Int      @default(0)

  user            User     @relation(fields: [userId], references: [id])
  video           Video    @relation(fields: [videoId], references: [id])

  @@index([userId, platform])
  @@index([videoId])
}

model Video {
  id              String   @id @default(cuid())
  userId          String
  r2Key           String   // Cloudflare R2 object key
  r2Url           String   // Public or signed URL
  title           String
  duration        Int      // seconds
  fileSize        Int      // bytes
  format          String   // mp4, mov
  resolution      String   // 1080x1920
  createdAt       DateTime @default(now())

  publishedPosts  PublishedPost[]
}
```

---

## Deployment Considerations

### Development

```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:alpine

# Start worker process
node lib/queue/publish-worker.js
```

### Production

**Option 1: Upstash Redis (Recommended)**
- Serverless Redis (pay-per-request)
- No server management
- Global replication
- Works with Vercel

**Option 2: Railway Redis**
- Managed Redis instance
- Fixed pricing
- Simple deployment

**Worker Deployment:**
- **Vercel**: Deploy worker as separate project with `vercel dev` for long-running processes
- **Railway**: Deploy worker as standalone service
- **Render**: Deploy worker as background worker

---

## Summary

**Publishing Queue Architecture:**

1. **Queue**: BullMQ + Redis (Upstash)
2. **Worker**: Separate Node.js process
3. **Retries**: 3 attempts with exponential backoff
4. **Monitoring**: BullMQ Board dashboard
5. **Scheduling**: Built-in delayed jobs
6. **Error Handling**: Platform-specific retry logic

**Week 3 Implementation Tasks:**
- Set up Redis (Upstash)
- Install BullMQ
- Create queue and worker
- Add API routes for job management
- Deploy worker process
- Set up monitoring dashboard
