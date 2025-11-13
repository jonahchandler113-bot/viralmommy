# Video Processing Queue Architecture

## Overview

The ViralMommy video processing queue system handles asynchronous video processing using BullMQ and Redis. The system processes uploaded videos through three main stages: video processing, AI analysis, and strategy generation.

## Architecture

### Queue Flow

```
Video Upload
    |
    v
[Video Processing Queue] --> Extract frames & metadata
    |
    v
[AI Analysis Queue] --> Analyze with Claude Vision
    |
    v
[Strategy Generation Queue] --> Generate viral strategies
    |
    v
Video Status: READY
```

### Components

#### 1. Queue Setup (`lib/queue/video-queue.ts`)
- **Three queues**: video-processing, ai-analysis, strategy-generation
- **Job types**: process-video, analyze-video, generate-strategy
- **Redis connection** with in-memory fallback for development
- **Retry logic**: Exponential backoff with configurable attempts
- **Job cleanup**: Auto-removes completed/failed jobs after retention period

#### 2. Video Processing Worker (`lib/queue/video-worker.ts`)
- **Concurrency**: 2 videos simultaneously
- **Rate limit**: 5 jobs per minute
- **Tasks**:
  - Extract video metadata (duration, resolution, codec)
  - Extract 5 key frames evenly distributed
  - Update database with metadata
  - Queue AI analysis job

#### 3. AI Analysis Worker (`lib/queue/ai-worker.ts`)
- **Concurrency**: 1 (to respect Claude API rate limits)
- **Rate limit**: 10 Claude API calls per minute
- **Tasks**:
  - Extract frames for Claude Vision
  - Analyze video content with Claude
  - Calculate viral score (1-10)
  - Extract insights (strengths, weaknesses, hooks)
  - Save to database
  - Queue strategy generation

#### 4. Strategy Generation Worker (`lib/queue/ai-worker.ts`)
- **Concurrency**: 3 jobs simultaneously
- **Tasks**:
  - Generate hook variations
  - Create caption templates
  - Generate hashtag sets (3 variations)
  - Recommend posting times
  - Save to AiStrategy table
  - Update video status to READY

## API Routes

### POST /api/queue/add-video
Add a video to the processing queue.

**Request:**
```json
{
  "videoId": "abc123",
  "userId": "user-id",
  "filePath": "/path/to/video.mp4",
  "filename": "video.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "process-abc123",
  "videoId": "abc123",
  "queuePosition": "waiting"
}
```

### GET /api/queue/status?jobId=xxx&queue=video
Get job status.

**Query Parameters:**
- `jobId`: Job ID
- `queue`: Queue name (video, ai, or strategy)

**Response:**
```json
{
  "success": true,
  "job": {
    "exists": true,
    "id": "process-abc123",
    "state": "completed",
    "progress": 100,
    "data": { ... },
    "returnvalue": { ... }
  }
}
```

### GET /api/queue/stats
Get all queue statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "video": {
      "name": "video-processing",
      "waiting": 2,
      "active": 1,
      "completed": 150,
      "failed": 3,
      "delayed": 0,
      "total": 156
    },
    "ai": { ... },
    "strategy": { ... }
  },
  "timestamp": "2025-11-12T10:00:00.000Z"
}
```

## Database Schema

### Video Table
```prisma
model Video {
  id            String       @id @default(uuid())
  userId        String
  status        VideoStatus  @default(UPLOADING)
  aiAnalysis    Json?        // AI-generated insights
  metadata      Json?        // Video metadata
  // ... other fields
}
```

**Status Flow:**
1. `UPLOADING` - File being uploaded
2. `PROCESSING` - Extracting frames/metadata
3. `READY` - All processing complete
4. `FAILED` - Error during processing

### AiStrategy Table
```prisma
model AiStrategy {
  id               String   @id @default(uuid())
  videoId          String
  hooks            Json     // Array of hook ideas
  captions         Json     // Caption variations
  hashtags         Json     // Hashtag sets
  bestPostingTimes Json     // Posting times per platform
  viralScore       Float?
  // ... other fields
}
```

## Setup Instructions

### 1. Install Dependencies
Already included in package.json:
- `bullmq` - Queue management
- `ioredis` - Redis client

### 2. Configure Environment
Add to `.env`:
```env
# For production (with Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# For development (without Redis)
USE_IN_MEMORY_QUEUE=true
```

### 3. Start Redis (Production)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install Redis locally
# macOS: brew install redis && brew services start redis
# Windows: Use WSL or Redis for Windows
# Linux: sudo apt-get install redis-server
```

### 4. Start Workers
```bash
# Start all workers
npm run workers

# Or manually
node --loader tsx lib/queue/start-workers.ts
```

### 5. Upload a Video
The upload API automatically queues videos for processing:
```javascript
const formData = new FormData();
formData.append('video', videoFile);
formData.append('userId', 'user-id');

const response = await fetch('/api/videos/upload', {
  method: 'POST',
  body: formData,
});

const { video, job } = await response.json();
console.log('Video queued:', job.id);
```

## Development Mode (No Redis)

For local development without Redis:

1. Set `USE_IN_MEMORY_QUEUE=true` in `.env`
2. Start Next.js dev server: `npm run dev`
3. Start workers: `npm run workers`
4. Upload videos - they'll be processed automatically

**Note:** In-memory mode doesn't persist jobs across restarts. For production, use Redis.

## Monitoring

### Check Queue Stats
```bash
curl http://localhost:3000/api/queue/stats
```

### Check Job Status
```bash
curl "http://localhost:3000/api/queue/status?jobId=process-abc123&queue=video"
```

### Worker Logs
Workers log to console:
- Job start/completion
- Processing progress
- Errors and retries
- Cost tracking for Claude API

## Error Handling

### Retry Logic
- **Video Processing**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **AI Analysis**: 2 attempts with 5s backoff
- **Strategy Generation**: 2 attempts with 3s backoff

### Failed Jobs
- Jobs that fail after all retries are marked as FAILED
- Video status updated with error message
- Failed jobs retained for 500 jobs (for debugging)

### Manual Retry
```javascript
import { videoQueue } from '@/lib/queue/video-queue';

const job = await videoQueue.getJob('process-abc123');
await job.retry();
```

## Performance Optimization

### Concurrency Settings
- **Video Processing**: 2 concurrent (CPU-bound, ffmpeg operations)
- **AI Analysis**: 1 concurrent (rate-limited by Claude API)
- **Strategy Generation**: 3 concurrent (fast, no external API)

### Rate Limiting
- **Claude API**: 10 requests/minute (conservative)
- **Video Processing**: 5 videos/minute (ffmpeg overhead)

### Memory Management
- Frames are extracted to temp directory and cleaned up
- Base64 encoding only for frames sent to Claude
- Completed jobs auto-removed after 24 hours

## Cost Tracking

AI analysis costs are tracked and saved:
```json
{
  "aiAnalysis": {
    "viralScore": 8.5,
    "cost": 0.0234,
    "tokensUsed": {
      "input": 1250,
      "output": 450
    }
  }
}
```

## Integration with Upload Flow

The upload API (`app/api/videos/upload/route.ts`) automatically:
1. Saves video to database with status `UPLOADING`
2. Adds video to processing queue
3. Returns job ID to client
4. Client can poll job status for progress

## Troubleshooting

### Workers Not Processing
1. Check Redis connection: `redis-cli ping`
2. Verify workers are running: Check console for startup logs
3. Check queue stats: `GET /api/queue/stats`

### Jobs Stuck in Waiting
1. Restart workers
2. Check rate limits
3. Verify no failed jobs blocking the queue

### AI Analysis Failing
1. Check `ANTHROPIC_API_KEY` is set
2. Verify Claude API quota
3. Check frame extraction is working
4. Review worker logs for errors

### High Costs
1. Review `aiAnalysis.cost` in database
2. Reduce frame count in `extractKeyFrames()`
3. Implement cost caps per user/tier

## Future Enhancements

- [ ] Add job priority based on user subscription tier
- [ ] Implement job scheduling for off-peak processing
- [ ] Add webhook notifications for job completion
- [ ] Create admin dashboard for queue monitoring
- [ ] Add metrics and analytics (Prometheus/Grafana)
- [ ] Implement graceful job cancellation
- [ ] Add support for batch processing
- [ ] Optimize frame selection using scene detection

## Related Files

- `lib/queue/video-queue.ts` - Queue setup and helpers
- `lib/queue/video-worker.ts` - Video processing worker
- `lib/queue/ai-worker.ts` - AI analysis and strategy workers
- `lib/queue/types.ts` - TypeScript type definitions
- `lib/queue/start-workers.ts` - Worker startup script
- `lib/video/frame-extraction.ts` - Frame extraction utilities
- `lib/video/metadata.ts` - Video metadata extraction
- `lib/ai/claude-client.ts` - Claude API integration
- `app/api/queue/*` - Queue API routes
- `app/api/videos/upload/route.ts` - Upload with queue integration

## Support

For issues or questions:
1. Check worker logs for errors
2. Verify environment variables
3. Test Redis connection
4. Review queue stats
5. Check database for error messages

---

Last updated: 2025-11-12
