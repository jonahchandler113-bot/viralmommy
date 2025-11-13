# ViralMommy

AI-powered content creation platform for stay-at-home mom creators - Turn your passion into income through viral content

## Project Overview

ViralMommy helps mom creators analyze and optimize their video content for maximum viral potential using state-of-the-art AI technology.

### Key Features

- **Video Analysis**: Upload videos and get AI-powered insights
- **Viral Score**: 1-10 rating based on engagement potential
- **Actionable Recommendations**: Specific tips to improve content
- **Transcription**: Automatic audio transcription with timestamps
- **Cost-Effective**: ~$0.15-0.20 per video analysis

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Authentication**: NextAuth.js v4

### Backend
- **Database**: PostgreSQL (via Prisma ORM)
- **ORM**: Prisma 5.x with complete schema
- **API**: Next.js API Routes (App Router)
- **Auth**: NextAuth.js with Google OAuth

### Video Processing
- **FFmpeg**: Frame extraction, audio extraction, metadata analysis
- **fluent-ffmpeg**: Node.js wrapper for FFmpeg

### AI APIs
- **Claude Sonnet 4.5**: Advanced video/image analysis with Vision API
- **OpenAI Whisper**: State-of-the-art audio transcription

### Infrastructure
- **Storage**: Cloudflare R2 (S3-compatible)
- **Redis**: Job queue and caching (configured)
- **Railway**: Deployment platform

## Project Structure

```
viralmommy/
├── prisma/
│   └── schema.prisma               # Complete database schema
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/              # Login page
│   │   │   └── signup/             # Signup page
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/          # Main dashboard
│   │   │   └── videos/             # Videos management
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # NextAuth endpoints
│   │   │   ├── health/             # Health check endpoint
│   │   │   ├── upload/             # Video upload API (stub)
│   │   │   └── video/              # Video CRUD operations
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   └── globals.css             # Global styles
│   ├── lib/
│   │   ├── db.ts                   # Prisma client
│   │   ├── auth.ts                 # NextAuth config
│   │   ├── video/
│   │   │   ├── frame-extraction.ts # FFmpeg frame extraction
│   │   │   └── metadata.ts         # Video metadata extraction
│   │   └── ai/
│   │       ├── claude-client.ts    # Claude API integration
│   │       ├── whisper-client.ts   # Whisper API integration
│   │       └── cost-calculator.ts  # Cost estimation tools
│   ├── types/
│   │   └── next-auth.d.ts          # NextAuth types
│   └── middleware.ts               # Protected routes middleware
├── docs/
│   ├── VIDEO_PROCESSING_PIPELINE.md
│   └── TIKTOK_INTEGRATION.md
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md
```

## Getting Started

### Prerequisites

1. **Node.js**: Version 20 or higher
2. **PostgreSQL**: Database server (local or Railway)
3. **API Keys**:
   - Google OAuth credentials
   - Anthropic Claude API key
   - OpenAI API key

### Installation

```bash
# Clone repository
git clone https://github.com/jonahchandler113-bot/viralmommy.git
cd viralmommy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
npx prisma generate
npx prisma migrate dev --name init

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/viralmommy"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI API Keys
ANTHROPIC_API_KEY="sk-ant-api03-..."
OPENAI_API_KEY="sk-proj-..."

# Storage (Cloudflare R2)
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="viralmommy-videos"

# Platform APIs
TIKTOK_CLIENT_KEY="your-tiktok-client-key"
TIKTOK_CLIENT_SECRET="your-tiktok-client-secret"
```

See `.env.example` for a complete list with detailed descriptions.

## Database Schema

The Prisma schema includes complete models for all features:

### Core Models
- **User**: Authentication, subscriptions, Stripe integration
- **Video**: Video uploads with AI analysis and metadata
- **AiStrategy**: AI-generated hooks, captions, hashtags, viral scores
- **PlatformConnection**: OAuth tokens for social platforms
- **PublishedPost**: Cross-platform post tracking with analytics
- **BrandKit**: User branding colors, fonts, logos

### Enums
- **VideoStatus**: UPLOADING, PROCESSING, READY, FAILED, PUBLISHED
- **Platform**: TIKTOK, INSTAGRAM, YOUTUBE, TWITTER, FACEBOOK
- **SubscriptionTier**: FREE, BASIC, PRO, ENTERPRISE
- **PostStatus**: SCHEDULED, PUBLISHING, PUBLISHED, FAILED

### Database Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Push schema changes without migration
npx prisma db push
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with Google OAuth
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Videos
- `GET /api/video` - List all videos (paginated)
- `GET /api/video/[id]` - Get video details
- `PATCH /api/video/[id]` - Update video metadata
- `DELETE /api/video/[id]` - Delete video
- `POST /api/upload` - Upload video (stub - to be implemented)

### Health
- `GET /api/health` - Health check with database status

### Running Tests

```bash
# Test API connections (Claude + Whisper)
npx tsx tests/test-api.ts

# Run cost calculator examples
npx tsx tests/test-cost-calculator.ts
```

## Usage Examples

### Extract Frames from Video

```typescript
import { extractFrames } from './lib/video/frame-extraction';

const frames = await extractFrames('/path/to/video.mp4', {
  interval: 2,      // Extract frame every 2 seconds
  maxFrames: 30,    // Maximum 30 frames
  outputFormat: 'png'
});

console.log(`Extracted ${frames.length} frames`);
```

### Get Video Metadata

```typescript
import { getVideoMetadata, getVideoSummary } from './lib/video/metadata';

const metadata = await getVideoMetadata('/path/to/video.mp4');
console.log(metadata);

const summary = await getVideoSummary('/path/to/video.mp4');
console.log(summary);
```

### Transcribe Video

```typescript
import { transcribeVideo } from './lib/ai/whisper-client';

const transcription = await transcribeVideo('/path/to/video.mp4', {
  language: 'en',
  responseFormat: 'verbose_json'
});

console.log('Transcript:', transcription.text);
console.log(`Cost: $${transcription.estimatedCost.toFixed(4)}`);
```

### Analyze Video with Claude

```typescript
import { analyzeVideoFrames } from './lib/ai/claude-client';
import { extractFrames } from './lib/video/frame-extraction';
import { transcribeVideo } from './lib/ai/whisper-client';

// Extract frames
const frames = await extractFrames('/path/to/video.mp4', {
  interval: 2,
  maxFrames: 30
});

// Transcribe video
const transcription = await transcribeVideo('/path/to/video.mp4');

// Analyze with Claude
const analysis = await analyzeVideoFrames(
  frames.map(f => ({ base64: f.base64, timestamp: f.timestamp })),
  transcription.text
);

console.log('Viral Score:', analysis.viralScore);
console.log('Summary:', analysis.summary);
console.log(`Cost: $${analysis.usage.estimatedCost.toFixed(4)}`);
```

### Calculate Processing Costs

```typescript
import { calculateVideoProcessingCost, projectMonthlyCosts } from './lib/ai/cost-calculator';
import { getVideoMetadata } from './lib/video/metadata';

const metadata = await getVideoMetadata('/path/to/video.mp4');

// Calculate cost for single video
const cost = calculateVideoProcessingCost(metadata);
console.log(`Cost per video: $${cost.total.toFixed(4)}`);

// Project monthly costs
const projection = projectMonthlyCosts(50, metadata);
console.log(`Monthly cost (50 videos): $${projection.totalCost.toFixed(2)}`);
```

## Video Processing Pipeline

The complete video processing pipeline is documented in detail here:
[VIDEO_PROCESSING_PIPELINE.md](./docs/VIDEO_PROCESSING_PIPELINE.md)

### Pipeline Overview

```
1. User uploads video → R2 storage
2. Job added to Redis queue
3. Worker picks up job
4. Extract metadata (FFmpeg)
5. Extract frames (FFmpeg, every 2 sec, max 30)
6. Extract audio (FFmpeg)
7. Transcribe audio (Whisper API)
8. Analyze frames + transcript (Claude Vision API)
9. Generate viral score (1-10)
10. Store results in database
11. Notify user (video analyzed!)
```

### Processing Time

For a typical **2-minute video**:
- Server-side processing: **1-1.5 minutes**
- Total user wait time: **1-3 minutes** (including upload)

### Cost Per Video

For a **2-minute video, 1080p, 50MB**:
- Frame extraction: **$0.00** (local FFmpeg)
- Audio extraction: **$0.00** (local FFmpeg)
- Whisper transcription: **$0.012** ($0.006/min)
- Claude Vision analysis: **$0.149** (~45K tokens)
- R2 storage: **$0.001** (30-day retention)
- **Total: ~$0.15-0.20 per video**

## Cost Optimization Strategies

### 1. Prompt Caching (90% savings)
- Cache system prompts and analysis framework
- Only images change per video
- Reduces input token costs by ~90% on cache hits

### 2. Batch Processing
- Process multiple videos in parallel
- Queue prioritization for paid users
- 10-15% throughput improvement

### 3. Smart Frame Sampling
- Extract keyframes instead of fixed intervals
- Detect scene changes for optimal frame selection
- ~20% reduction in API tokens

## Pricing Tiers (Suggested)

Based on cost analysis with 70% profit margin:

| Tier | Videos/Month | Price/Month | Cost | Margin |
|------|--------------|-------------|------|--------|
| **Starter** | 10 | $10 | $1.62 | 84% |
| **Creator** | 30 | $20 | $4.86 | 76% |
| **Pro** | 100 | $59 | $16.20 | 73% |
| **Business** | 500 | $279 | $81.00 | 71% |

## API Documentation

### Frame Extraction API

```typescript
extractFrames(videoPath: string, options: FrameExtractionOptions): Promise<ExtractedFrame[]>
extractFrameAtTimestamp(videoPath: string, timestamp: number): Promise<ExtractedFrame>
extractKeyFrames(videoPath: string, numberOfFrames: number): Promise<ExtractedFrame[]>
```

### Metadata API

```typescript
getVideoMetadata(videoPath: string): Promise<VideoMetadata>
isValidVideo(filePath: string): Promise<boolean>
getVideoSummary(videoPath: string): Promise<string>
estimateProcessingTime(metadata: VideoMetadata): number
validateVideo(videoPath: string, requirements: ValidationRequirements): Promise<ValidationResult>
```

### Claude API

```typescript
analyzeVideoFrames(frames: Frame[], transcript?: string): Promise<VideoAnalysisResult>
generateText(prompt: string, systemPrompt?: string): Promise<{ text: string; usage: ClaudeUsage }>
analyzeImage(base64Image: string, prompt: string): Promise<{ analysis: string; usage: ClaudeUsage }>
testClaudeConnection(): Promise<boolean>
```

### Whisper API

```typescript
transcribeVideo(videoPath: string, options?: WhisperOptions): Promise<TranscriptionResult>
transcribeAudio(audioPath: string, options?: WhisperOptions): Promise<TranscriptionResult>
extractAudioFromVideo(videoPath: string): Promise<string>
formatAsSRT(segments: TranscriptionSegment[]): string
formatAsVTT(segments: TranscriptionSegment[]): string
```

### Cost Calculator API

```typescript
calculateVideoProcessingCost(metadata: VideoMetadata, options?: ProcessingOptions): CostBreakdown
projectMonthlyCosts(videosPerMonth: number, averageMetadata: VideoMetadata): MonthlyCostProjection
calculateBreakEven(subscriptionPrice: number, costPerVideo: number): number
suggestPricingTiers(averageMetadata: VideoMetadata): PricingTier[]
```

## Development Roadmap

### Week 1 - Days 1-2: Backend Architecture (COMPLETE)
- [x] Next.js 16 setup with App Router
- [x] TypeScript configuration (strict mode)
- [x] Prisma ORM setup
- [x] Complete database schema (all tables, enums, indexes)
- [x] NextAuth.js with Google OAuth
- [x] Protected routes middleware
- [x] API route stubs (health, upload, video CRUD)
- [x] Project structure and folder organization
- [x] FFmpeg integration (frame extraction, metadata, audio)
- [x] Claude API integration (Vision API)
- [x] Whisper API integration (transcription)
- [x] Cost calculator

### Week 1 - Days 3-5: Frontend Development
- [ ] Implement video upload UI with drag-and-drop
- [ ] Build responsive dashboard with analytics
- [ ] Create video gallery with filters
- [ ] Design video player with preview
- [ ] Implement navigation and layout components
- [ ] Add loading states and error handling

### Week 1 - Days 6-7: AI Integration
- [ ] Complete video upload to R2 storage
- [ ] Implement video transcription pipeline
- [ ] Build AI strategy generation engine
- [ ] Create content optimization system
- [ ] Add viral score calculation
- [ ] Generate hooks and captions

### Week 2: Social Media Integration
- [ ] TikTok OAuth and posting
- [ ] Instagram OAuth and posting
- [ ] YouTube OAuth and posting
- [ ] Analytics sync across platforms
- [ ] Scheduled posting system
- [ ] Cross-platform content optimization

### Week 3: Polish & Advanced Features
- [ ] Stripe payment integration
- [ ] Subscription tier management
- [ ] Email notifications (Resend)
- [ ] Brand kit customization
- [ ] Batch video processing
- [ ] Performance optimization

### Week 4: Launch Preparation
- [ ] Admin dashboard
- [ ] User onboarding flow
- [ ] Documentation and help center
- [ ] Beta testing
- [ ] Production deployment
- [ ] Launch!

## Contributing

This is currently a private project in development. Contributions will be welcomed after initial launch.

## License

Proprietary - All rights reserved

## Contact

For questions or support, please reach out via GitHub issues.

---

Built with ❤️ for mom creators everywhere
