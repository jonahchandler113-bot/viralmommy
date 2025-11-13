# ViralMommy - Quick Start Guide

## Installation

```bash
git clone https://github.com/jonahchandler113-bot/viralmommy.git
cd viralmommy
npm install
```

## Environment Setup

Create `.env` file:
```env
CLAUDE_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

## Test APIs

```bash
# Test Claude + Whisper APIs
npx tsx tests/test-api.ts

# Run cost calculator demo
npx tsx tests/test-cost-calculator.ts
```

## Usage Examples

### Extract Video Frames
```typescript
import { extractFrames } from './lib/video/frame-extraction';

const frames = await extractFrames('video.mp4', {
  interval: 2,
  maxFrames: 30
});
```

### Get Video Metadata
```typescript
import { getVideoMetadata } from './lib/video/metadata';

const metadata = await getVideoMetadata('video.mp4');
console.log(metadata.duration, metadata.width, metadata.height);
```

### Transcribe Video
```typescript
import { transcribeVideo } from './lib/ai/whisper-client';

const result = await transcribeVideo('video.mp4');
console.log(result.text);
console.log(`Cost: $${result.estimatedCost}`);
```

### Analyze with Claude
```typescript
import { analyzeVideoFrames } from './lib/ai/claude-client';

const analysis = await analyzeVideoFrames(frames, transcript);
console.log('Viral Score:', analysis.viralScore);
console.log('Recommendations:', analysis.recommendations);
```

### Calculate Costs
```typescript
import { calculateVideoProcessingCost } from './lib/ai/cost-calculator';

const cost = calculateVideoProcessingCost(metadata);
console.log(`Cost per video: $${cost.total.toFixed(4)}`);
```

## Key Files

- **Frame Extraction:** `/lib/video/frame-extraction.ts`
- **Metadata:** `/lib/video/metadata.ts`
- **Claude Client:** `/lib/ai/claude-client.ts`
- **Whisper Client:** `/lib/ai/whisper-client.ts`
- **Cost Calculator:** `/lib/ai/cost-calculator.ts`
- **Pipeline Docs:** `/docs/VIDEO_PROCESSING_PIPELINE.md`

## Processing Pipeline

```
Video Upload → R2 Storage → Redis Queue → Worker →
  1. Extract Metadata (FFmpeg)
  2. Extract Frames (FFmpeg)
  3. Extract Audio (FFmpeg)
  4. Transcribe (Whisper)
  5. Analyze (Claude Vision)
  6. Calculate Viral Score
  7. Store Results → Notify User
```

## Performance

- **Processing Time:** ~1-1.5 minutes per 2-min video
- **Cost Per Video:** ~$0.15-0.20
- **APIs Used:** Claude Sonnet 4.5 + OpenAI Whisper

## Pricing Tiers (Suggested)

| Tier | Videos/Month | Price |
|------|--------------|-------|
| Starter | 10 | $5/mo |
| Creator | 30 | $15/mo |
| Pro | 100 | $50/mo |
| Business | 500 | $245/mo |

## Next Steps

1. Build Next.js frontend
2. Integrate R2 storage
3. Set up Redis queue
4. Create worker process
5. Launch beta

## Documentation

- Full Pipeline: `/docs/VIDEO_PROCESSING_PIPELINE.md`
- Deliverables: `/docs/DAY_1-2_DELIVERABLES.md`
- Main README: `/README.md`

## Support

GitHub: https://github.com/jonahchandler113-bot/viralmommy
