# ViralMommy Video Processing Pipeline

## Overview

This document outlines the complete video processing pipeline for ViralMommy, an AI-powered platform that helps mom creators analyze and optimize their content for maximum viral potential.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                    (Next.js Frontend)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VIDEO UPLOAD API                             │
│                  (Next.js API Route)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 CLOUDFLARE R2 STORAGE                            │
│              (S3-compatible video storage)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REDIS JOB QUEUE                               │
│              (Background job management)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  VIDEO PROCESSING WORKER                         │
│                   (Background Service)                           │
│                                                                  │
│  1. Extract Metadata (FFmpeg)                                   │
│  2. Extract Frames (FFmpeg)                                     │
│  3. Extract Audio (FFmpeg)                                      │
│  4. Transcribe Audio (Whisper API)                              │
│  5. Analyze Video (Claude Vision API)                           │
│  6. Calculate Viral Score (ML Model)                            │
│  7. Store Results (Database)                                    │
│  8. Notify User (WebSocket/Email)                               │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Processing Steps

### 1. Video Upload → R2 Storage

**Flow:**
- User uploads video via web interface
- Frontend validates file (size, format, duration)
- Video uploaded directly to Cloudflare R2 via presigned URL
- Upload complete → trigger processing job

**Requirements:**
- Max file size: 500MB
- Supported formats: MP4, MOV, AVI, MKV
- Max duration: 10 minutes
- Min resolution: 720p

**Time:** ~10-60 seconds (depends on file size & internet speed)

**Code Location:** `/app/api/upload/route.ts`

---

### 2. Job Added to Redis Queue

**Flow:**
- Server creates processing job with video metadata
- Job added to Redis queue with priority
- Job status: `pending`

**Job Data:**
```json
{
  "jobId": "uuid-v4",
  "videoId": "video-id",
  "userId": "user-id",
  "videoUrl": "r2://bucket/path/to/video.mp4",
  "priority": "normal",
  "status": "pending",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Time:** <1 second

**Code Location:** `/lib/queue/job-manager.ts`

---

### 3. Worker Picks Up Job

**Flow:**
- Worker polls Redis queue for new jobs
- Worker claims job (sets status to `processing`)
- Worker downloads video from R2 to temporary directory
- Begin processing pipeline

**Time:** ~2-5 seconds (download + setup)

**Code Location:** `/workers/video-processor.ts`

---

### 4. Extract Metadata (FFmpeg)

**Flow:**
- Use FFmpeg to probe video file
- Extract: duration, resolution, FPS, codec, bitrate, audio presence
- Validate video meets requirements
- Store metadata in database

**Extracted Data:**
```typescript
{
  duration: 120,        // seconds
  width: 1920,          // pixels
  height: 1080,         // pixels
  fps: 30,              // frames per second
  size: 52428800,       // bytes (50MB)
  codec: "h264",
  audioCodec: "aac",
  bitrate: 3500,        // kbps
  hasAudio: true
}
```

**Time:** ~0.5-1 second

**Code Location:** `/lib/video/metadata.ts`

---

### 5. Extract Frames (FFmpeg)

**Flow:**
- Extract frames at 2-second intervals
- Maximum 30 frames per video
- Convert frames to PNG format
- Encode as base64 for Claude API
- Optimize for fast extraction (<10 seconds)

**Configuration:**
```typescript
{
  interval: 2,          // seconds between frames
  maxFrames: 30,        // limit frames for cost/speed
  outputFormat: 'png',  // best quality for vision API
  quality: 2            // high quality
}
```

**Frame Data:**
```typescript
{
  buffer: Buffer,       // raw image data
  timestamp: 4.0,       // timestamp in video (seconds)
  frameNumber: 3,       // sequence number
  base64: "iVBORw0KGgo..."  // base64 for API
}
```

**Time:** ~3-8 seconds (for 30 frames)

**Code Location:** `/lib/video/frame-extraction.ts`

---

### 6. Extract Audio (FFmpeg)

**Flow:**
- Extract audio track from video
- Convert to MP3 (16kHz mono, 64kbps)
- Optimized for Whisper API (16kHz sample rate)
- Save to temporary file

**FFmpeg Command:**
```bash
ffmpeg -i input.mp4 \
  -vn \                    # no video
  -acodec libmp3lame \     # mp3 codec
  -ar 16000 \              # 16kHz (Whisper optimized)
  -ac 1 \                  # mono
  -b:a 64k \               # 64kbps bitrate
  output.mp3
```

**Time:** ~1-3 seconds

**Code Location:** `/lib/ai/whisper-client.ts`

---

### 7. Transcribe Audio (Whisper API)

**Flow:**
- Upload audio file to OpenAI Whisper API
- Request `verbose_json` format for timestamps
- Receive transcript with word-level timing
- Parse segments and full text
- Calculate speaking rate and extract key phrases

**API Request:**
```typescript
{
  file: audioFile,
  model: "whisper-1",
  language: "en",
  response_format: "verbose_json",
  temperature: 0
}
```

**Response:**
```typescript
{
  text: "Full transcript of the video...",
  segments: [
    {
      id: 0,
      start: 0.0,
      end: 3.5,
      text: "Hey everyone, welcome back to my channel!"
    },
    // ... more segments
  ],
  language: "en",
  duration: 120.5,
  wordCount: 245,
  estimatedCost: 0.012  // $0.012 for 2-minute video
}
```

**Time:** ~30-60 seconds (approximately real-time to 2x real-time)

**Cost:** $0.006 per minute ($0.012 for 2-minute video)

**Code Location:** `/lib/ai/whisper-client.ts`

---

### 8. Analyze Frames + Transcript (Claude Vision API)

**Flow:**
- Send extracted frames to Claude Vision API
- Include transcript as context
- Request structured analysis (JSON format)
- Parse viral score, strengths, weaknesses, recommendations
- Store analysis in database

**API Request:**
```typescript
{
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 4096,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analysis prompt with transcript..."
        },
        // 30 image blocks (base64 frames)
        { type: "image", source: { type: "base64", data: "..." } },
        // ... more images
      ]
    }
  ]
}
```

**Analysis Output:**
```typescript
{
  viralScore: 8,  // 1-10 rating
  summary: "Engaging parenting hack video with clear demonstration...",
  strengths: [
    "Strong hook in first 3 seconds",
    "Authentic, relatable presentation",
    "Clear value proposition for mom audience"
  ],
  weaknesses: [
    "Lighting could be improved in second half",
    "Audio quality dips at 1:30 mark"
  ],
  hooks: [
    "\"You won't believe this diaper hack!\" (0:00)",
    "Visual reveal of organized nursery (0:45)"
  ],
  emotionalTones: ["helpful", "authentic", "enthusiastic"],
  recommendations: [
    "Add text overlay for key tips",
    "Use trending audio in first 3 seconds",
    "Include call-to-action at end"
  ],
  targetAudience: "New moms, parents of toddlers",
  contentType: "Parenting hack / Tutorial",
  usage: {
    inputTokens: 45500,
    outputTokens: 850,
    estimatedCost: 0.149  // ~$0.15
  }
}
```

**Time:** ~5-15 seconds (API processing)

**Cost:** ~$0.10-0.15 per video (with prompt caching)

**Token Breakdown:**
- System prompt: ~200 tokens (cacheable)
- User prompt: ~300 tokens (cacheable)
- Images (30 frames): ~45,000 tokens (1,500 per frame)
- Output: ~800 tokens

**Code Location:** `/lib/ai/claude-client.ts`

---

### 9. Generate Viral Score (1-10)

**Flow:**
- Aggregate data from multiple sources:
  - Claude's initial viral score
  - Transcript quality metrics (speaking rate, clarity)
  - Visual quality (frame analysis)
  - Content structure (hooks, pacing)
  - Technical quality (resolution, audio)
- Apply weighted scoring algorithm
- Generate final viral score (1-10)

**Scoring Weights:**
```typescript
{
  claudeScore: 0.50,           // 50% - AI analysis
  contentStructure: 0.20,      // 20% - hooks, pacing
  technicalQuality: 0.15,      // 15% - video/audio quality
  transcriptQuality: 0.15      // 15% - speaking, clarity
}
```

**Final Score Calculation:**
```typescript
viralScore = (
  claudeScore * 0.50 +
  contentStructureScore * 0.20 +
  technicalQualityScore * 0.15 +
  transcriptQualityScore * 0.15
)
```

**Time:** <1 second

**Code Location:** `/lib/scoring/viral-score.ts`

---

### 10. Store Results in Database

**Flow:**
- Save all analysis data to PostgreSQL/Supabase
- Update video status to `completed`
- Store:
  - Video metadata
  - Transcript
  - Analysis results
  - Viral score
  - Processing timestamps
  - Cost tracking

**Database Schema:**
```sql
-- videos table
{
  id: uuid PRIMARY KEY,
  user_id: uuid,
  video_url: text,
  duration: integer,
  resolution: text,
  status: enum('pending', 'processing', 'completed', 'failed'),
  created_at: timestamp,
  processed_at: timestamp
}

-- video_analysis table
{
  id: uuid PRIMARY KEY,
  video_id: uuid,
  viral_score: integer,
  summary: text,
  strengths: jsonb,
  weaknesses: jsonb,
  recommendations: jsonb,
  transcript: text,
  processing_cost: decimal,
  created_at: timestamp
}
```

**Time:** ~0.5-1 second

**Code Location:** `/lib/database/video-repository.ts`

---

### 11. Notify User (Video Analyzed!)

**Flow:**
- Update job status to `completed`
- Send real-time notification via WebSocket
- Send email notification (optional)
- Update UI with results

**Notification Payload:**
```typescript
{
  type: "video_analysis_complete",
  videoId: "uuid",
  viralScore: 8,
  message: "Your video has been analyzed! Viral Score: 8/10",
  resultsUrl: "/dashboard/videos/uuid"
}
```

**Time:** <1 second

**Code Location:** `/lib/notifications/notifier.ts`

---

## Total Processing Time Breakdown

For a **2-minute video** (typical use case):

| Step | Time | Notes |
|------|------|-------|
| 1. Upload to R2 | 10-60s | User-side, varies by connection |
| 2. Add to queue | <1s | Instant |
| 3. Worker pickup | 2-5s | Download from R2 |
| 4. Extract metadata | 0.5-1s | FFmpeg probe |
| 5. Extract frames | 3-8s | 30 frames |
| 6. Extract audio | 1-3s | FFmpeg conversion |
| 7. Transcribe (Whisper) | 30-60s | API processing |
| 8. Analyze (Claude) | 5-15s | Vision API |
| 9. Calculate score | <1s | Local processing |
| 10. Store results | 0.5-1s | Database write |
| 11. Notify user | <1s | WebSocket/email |
| **TOTAL (server-side)** | **43-95s** | **~1-1.5 minutes** |

**User Experience:**
- Upload: 10-60 seconds (their internet speed)
- Processing: 1-1.5 minutes (our pipeline)
- **Total: 70-155 seconds (~1-3 minutes)**

---

## Cost Per Video Breakdown

For a **2-minute video, 1080p, 50MB**:

| Component | Cost | Notes |
|-----------|------|-------|
| Frame extraction (FFmpeg) | $0.00 | Local processing |
| Audio extraction (FFmpeg) | $0.00 | Local processing |
| Whisper transcription | $0.012 | $0.006/min × 2min |
| Claude Vision analysis | $0.149 | ~45K input + 800 output tokens |
| R2 storage (30 days) | $0.001 | Storage + operations |
| **TOTAL** | **$0.162** | **~$0.15-0.20 per video** |

**Monthly Cost Projections:**

| Videos/Month | Cost per Video | Total Monthly Cost | With 70% Margin | Suggested Price |
|--------------|----------------|-------------------|-----------------|-----------------|
| 10 | $0.162 | $1.62 | $5.40 | $10/month |
| 30 | $0.162 | $4.86 | $16.20 | $20/month |
| 100 | $0.162 | $16.20 | $54.00 | $59/month |
| 500 | $0.162 | $81.00 | $270.00 | $279/month |

---

## Error Handling Strategy

### Error Types

1. **Upload Errors**
   - Invalid file format → Immediate user feedback
   - File too large → Immediate user feedback
   - Upload timeout → Retry mechanism with exponential backoff

2. **Processing Errors**
   - FFmpeg failure → Retry once, then fail job
   - Whisper API error → Retry with exponential backoff (max 3 attempts)
   - Claude API error → Retry with exponential backoff (max 3 attempts)
   - Insufficient funds → Notify admin, pause processing

3. **Storage Errors**
   - R2 unavailable → Queue job for retry
   - Database write failure → Retry with transaction rollback

### Retry Logic

```typescript
interface RetryConfig {
  maxAttempts: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
  maxBackoffMs: 30000
}

// Example: Retry with exponential backoff
async function retryWithBackoff(fn, config) {
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === config.maxAttempts) throw error;

      const delay = Math.min(
        config.backoffMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxBackoffMs
      );

      console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}
```

### Failure Handling

- **Graceful degradation:** If Claude fails, still provide basic analysis
- **User notification:** Clear error messages explaining what went wrong
- **Automatic refunds:** If processing fails, refund credit to user
- **Admin alerts:** Critical failures trigger admin notifications

---

## Optimization Strategies

### 1. Prompt Caching (90% Cost Savings)

**Strategy:**
- Cache system prompts and analysis framework
- Only images change per video
- 90% reduction in input token costs on cache hits

**Implementation:**
```typescript
// Mark cacheable content
{
  system: "You are an expert social media analyst...", // CACHED
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze frames..." }, // CACHED
        ...imageBlocks // NOT CACHED (changes each video)
      ]
    }
  ]
}
```

**Savings:** ~$0.10 per video after first request

---

### 2. Batch Processing

**Strategy:**
- Process multiple videos in parallel
- Optimize API calls with batching where possible
- Queue prioritization (paid users first)

**Benefits:**
- 10-15% throughput improvement
- Better resource utilization
- Reduced per-video processing time

---

### 3. Frame Sampling Optimization

**Strategy:**
- Smart frame selection (detect scene changes)
- Reduce redundant frames (similar consecutive frames)
- Extract keyframes instead of fixed intervals

**Savings:** ~20% reduction in API tokens

---

### 4. CDN Caching for Results

**Strategy:**
- Cache analysis results in CDN
- Reuse analysis for re-uploaded identical videos
- Hash-based deduplication

**Savings:** Avoid re-processing duplicate content

---

### 5. Processing Queue Optimization

**Strategy:**
- Priority queue (paid > free users)
- Smart scheduling based on video length
- Parallel processing with worker pools

**Benefits:**
- Better user experience for paid users
- Optimized resource usage
- Predictable processing times

---

## Monitoring & Metrics

### Key Metrics to Track

1. **Processing Time**
   - Average time per video
   - P50, P95, P99 latencies
   - Breakdown by processing step

2. **Cost Tracking**
   - Per-video cost
   - Monthly burn rate
   - API usage (Whisper, Claude)

3. **Error Rates**
   - Failed jobs percentage
   - Retry success rate
   - API error rates

4. **Quality Metrics**
   - Viral score distribution
   - User satisfaction (ratings)
   - Analysis accuracy

### Alerting

- Processing time > 5 minutes → Alert
- Error rate > 5% → Alert
- Daily cost > budget → Alert
- API rate limits approaching → Alert

---

## Future Enhancements

### Phase 2 (Weeks 3-4)
- [ ] Thumbnail analysis (optimize thumbnail selection)
- [ ] Caption generation (auto-generate captions)
- [ ] Hashtag recommendations (trending hashtags)
- [ ] Music suggestions (trending audio)

### Phase 3 (Month 2)
- [ ] Competitor analysis (compare to similar videos)
- [ ] A/B testing recommendations
- [ ] Posting time optimization
- [ ] Multi-platform optimization (TikTok, Instagram, YouTube)

### Phase 4 (Month 3)
- [ ] Real-time processing (live video analysis)
- [ ] Video editing suggestions (trim, speed up, effects)
- [ ] Automated content calendar
- [ ] Performance tracking (view count, engagement)

---

## Technical Stack

**Video Processing:**
- FFmpeg (frame extraction, audio extraction, metadata)
- @ffmpeg-installer/ffmpeg (bundled FFmpeg binary)
- fluent-ffmpeg (Node.js wrapper)

**AI APIs:**
- Claude Sonnet 4.5 (video/image analysis)
- OpenAI Whisper (audio transcription)

**Storage:**
- Cloudflare R2 (video storage, S3-compatible)

**Queue:**
- Redis (job queue, caching)
- Bull/BullMQ (job processing library)

**Database:**
- PostgreSQL/Supabase (metadata, analysis results)

**Framework:**
- Next.js 14 (App Router)
- TypeScript
- Server Actions

---

## Getting Started

### Prerequisites

```bash
# Install dependencies
npm install

# Set environment variables
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Running Locally

```bash
# Start development server
npm run dev

# Start worker process
npm run worker

# Run cost examples
npx tsx lib/ai/cost-calculator.ts
```

### Testing Pipeline

```bash
# Test with sample video
npx tsx tests/test-pipeline.ts path/to/video.mp4
```

---

## Conclusion

The ViralMommy video processing pipeline is designed for:
- **Speed:** 1-3 minute total processing time
- **Cost:** $0.15-0.20 per video (with optimization)
- **Quality:** State-of-the-art AI analysis (Claude Sonnet 4.5 + Whisper)
- **Reliability:** Robust error handling and retry logic
- **Scalability:** Queue-based architecture, horizontal scaling

This pipeline provides mom creators with professional-grade video analysis at a fraction of traditional costs, enabling them to create viral content confidently.
