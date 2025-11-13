# Queue System Quick Start

Get the ViralMommy video processing queue up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database set up
- Anthropic API key (`ANTHROPIC_API_KEY` in `.env`)

## Option 1: Development Mode (No Redis Required)

Perfect for local development and testing.

### 1. Configure Environment

Add to your `.env` file:
```env
USE_IN_MEMORY_QUEUE=true
ANTHROPIC_API_KEY=your-key-here
DATABASE_URL=your-postgres-url
```

### 2. Start the Development Server

Terminal 1:
```bash
npm run dev
```

### 3. Start the Workers

Terminal 2:
```bash
npm run workers
```

You should see:
```
==================================================
ViralMommy Queue Workers Started
==================================================
Active workers:
  - Video Processing Worker (concurrency: 2)
  - AI Analysis Worker (concurrency: 1)
  - Strategy Generation Worker (concurrency: 3)
==================================================
```

### 4. Upload a Video

Use the upload API or UI to upload a video. The queue will automatically:
1. Extract frames and metadata
2. Analyze with Claude Vision
3. Generate viral strategies
4. Update video status to READY

### 5. Monitor Progress

Check queue stats:
```bash
npm run queue:stats
```

Or via browser:
```
http://localhost:3000/api/queue/stats
```

## Option 2: Production Mode (With Redis)

For production deployments with persistent queues.

### 1. Start Redis

Using Docker:
```bash
docker run -d -p 6379:6379 --name viralmommy-redis redis:alpine
```

Or install locally:
- macOS: `brew install redis && brew services start redis`
- Ubuntu: `sudo apt install redis-server && sudo systemctl start redis`

### 2. Configure Environment

Add to `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
USE_IN_MEMORY_QUEUE=false
ANTHROPIC_API_KEY=your-key-here
DATABASE_URL=your-postgres-url
```

### 3. Start Services

Terminal 1 - Next.js:
```bash
npm run dev
```

Terminal 2 - Workers:
```bash
npm run workers
```

## Testing the Queue

### Upload a Test Video

```bash
curl -X POST http://localhost:3000/api/videos/upload \
  -F "video=@/path/to/test-video.mp4" \
  -F "userId=test-user-id"
```

Response:
```json
{
  "success": true,
  "video": {
    "id": "abc123",
    "status": "UPLOADING"
  },
  "job": {
    "id": "process-abc123",
    "state": "waiting"
  }
}
```

### Check Job Status

```bash
curl "http://localhost:3000/api/queue/status?jobId=process-abc123&queue=video"
```

### View Queue Statistics

```bash
curl http://localhost:3000/api/queue/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "video": {
      "waiting": 0,
      "active": 1,
      "completed": 5,
      "failed": 0
    },
    "ai": { ... },
    "strategy": { ... }
  }
}
```

## Monitoring Workers

Workers log processing details to console:

```
[Video Worker] Processing video abc123...
[Video Worker] Extracting metadata for abc123...
[Video Worker] Metadata extracted: 30s, 1920x1080
[Video Worker] Extracting key frames for abc123...
[Video Worker] Extracted 5 frames
[Video Worker] AI analysis job queued for abc123
[Video Worker] Job process-abc123 completed successfully

[AI Worker] Analyzing video abc123 with Claude...
[AI Worker] Claude analysis complete. Viral Score: 8/10
[AI Worker] Cost: $0.0234
[AI Worker] Strategy generation job queued

[Strategy Worker] Generating strategy for video abc123...
[Strategy Worker] Strategy saved to database
[Strategy Worker] Video abc123 marked as READY
```

## Processing Pipeline

```
1. Video Upload (UPLOADING)
   └─> Queue: process-video

2. Video Processing (PROCESSING)
   ├─> Extract metadata
   ├─> Extract 5 key frames
   └─> Queue: analyze-video

3. AI Analysis (PROCESSING)
   ├─> Analyze frames with Claude
   ├─> Calculate viral score
   ├─> Extract insights
   └─> Queue: generate-strategy

4. Strategy Generation (PROCESSING)
   ├─> Generate hooks
   ├─> Create captions
   ├─> Generate hashtags
   └─> Update status: READY

5. Video Ready (READY)
   └─> Available for publishing
```

## Troubleshooting

### Workers Not Starting

**Error:** `Cannot connect to Redis`
- Solution: Start Redis or set `USE_IN_MEMORY_QUEUE=true`

**Error:** `ANTHROPIC_API_KEY is required`
- Solution: Add your API key to `.env`

### Jobs Not Processing

**Issue:** Jobs stuck in "waiting"
- Check workers are running: Look for startup logs
- Restart workers: `Ctrl+C` then `npm run workers`

**Issue:** Jobs failing
- Check worker logs for errors
- Verify video file exists at the path
- Check database connection

### High Costs

**Issue:** Claude API costs too high
- Reduce frames: Edit `extractKeyFrames()` to use fewer frames
- Implement cost caps per user tier
- Monitor `aiAnalysis.cost` in database

## Next Steps

1. Review full documentation: `docs/VIDEO_PROCESSING_QUEUE.md`
2. Configure rate limits for your usage
3. Set up monitoring/alerting for production
4. Implement cost tracking per user
5. Add webhook notifications for job completion

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Start queue workers
npm run workers

# Check queue statistics
npm run queue:stats

# View worker logs
# Workers output to console where `npm run workers` is running

# Stop workers
# Press Ctrl+C in the workers terminal
```

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-...
DATABASE_URL=postgresql://...

# Queue Configuration
USE_IN_MEMORY_QUEUE=true          # true for dev, false for production
REDIS_HOST=localhost               # Only needed if USE_IN_MEMORY_QUEUE=false
REDIS_PORT=6379
REDIS_PASSWORD=                    # Optional
```

## Support

If you encounter issues:
1. Check worker logs for errors
2. Verify all environment variables are set
3. Test Redis connection (if using)
4. Review `docs/VIDEO_PROCESSING_QUEUE.md` for details
5. Check database for error messages in videos table

---

Happy processing!
