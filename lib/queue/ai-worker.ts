import { Worker, Job } from 'bullmq';
import { JobType, AnalyzeVideoJobData, GenerateStrategyJobData, addGenerateStrategyJob } from './video-queue';
import { analyzeVideoFrames } from '../ai/claude-client';
import { extractKeyFrames } from '../video/frame-extraction';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Redis connection config (same as queue)
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

/**
 * AI Analysis Worker
 * Handles Claude AI video analysis:
 * 1. Extract frames (if not already done)
 * 2. Analyze with Claude Vision
 * 3. Calculate viral score
 * 4. Save insights to database
 * 5. Trigger strategy generation
 */
export const aiWorker = new Worker(
  'ai-analysis',
  async (job: Job<AnalyzeVideoJobData>) => {
    const { videoId, userId, filePath, framesExtracted } = job.data;

    console.log(`[AI Worker] Analyzing video ${videoId} with Claude...`);

    try {
      // Step 1: Extract frames for analysis
      await job.updateProgress(10);
      console.log(`[AI Worker] Extracting frames for analysis...`);

      // Extract 5 evenly-distributed frames for Claude analysis
      const frames = await extractKeyFrames(filePath, 5);

      console.log(`[AI Worker] Extracted ${frames.length} frames for Claude Vision`);

      // Step 2: Prepare frames for Claude
      await job.updateProgress(30);
      const frameData = frames.map(frame => ({
        base64: frame.base64,
        timestamp: frame.timestamp,
      }));

      // Step 3: Analyze with Claude Vision
      await job.updateProgress(40);
      console.log(`[AI Worker] Sending to Claude for analysis...`);

      const analysis = await analyzeVideoFrames(frameData);

      console.log(`[AI Worker] Claude analysis complete. Viral Score: ${analysis.viralScore}/10`);
      console.log(`[AI Worker] Cost: $${analysis.usage.estimatedCost.toFixed(4)}`);

      // Step 4: Save AI analysis to database
      await job.updateProgress(70);
      await prisma.video.update({
        where: { id: videoId },
        data: {
          aiAnalysis: {
            viralScore: analysis.viralScore,
            summary: analysis.summary,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            hooks: analysis.hooks,
            emotionalTones: analysis.emotionalTones,
            recommendations: analysis.recommendations,
            targetAudience: analysis.targetAudience,
            contentType: analysis.contentType,
            analyzedAt: new Date().toISOString(),
            cost: analysis.usage.estimatedCost,
            tokensUsed: {
              input: analysis.usage.inputTokens,
              output: analysis.usage.outputTokens,
            },
          },
        },
      });

      console.log(`[AI Worker] Analysis saved to database`);

      // Step 5: Queue strategy generation job
      await job.updateProgress(90);
      await addGenerateStrategyJob({
        videoId,
        userId,
        analysisResult: analysis,
      });

      console.log(`[AI Worker] Strategy generation job queued`);

      // Step 6: Complete
      await job.updateProgress(100);

      return {
        success: true,
        videoId,
        viralScore: analysis.viralScore,
        cost: analysis.usage.estimatedCost,
        insights: {
          strengths: analysis.strengths.length,
          weaknesses: analysis.weaknesses.length,
          hooks: analysis.hooks.length,
        },
      };
    } catch (error) {
      console.error(`[AI Worker] Error analyzing video ${videoId}:`, error);

      // Save error to database
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'FAILED',
          errorMessage: `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Process 1 at a time to respect Claude rate limits
    limiter: {
      max: 10, // Max 10 Claude API calls
      duration: 60000, // per 60 seconds (conservative rate limiting)
    },
  }
);

/**
 * Strategy Generation Worker
 * Generates marketing strategies based on AI analysis
 */
export const strategyWorker = new Worker(
  'strategy-generation',
  async (job: Job<GenerateStrategyJobData>) => {
    const { videoId, userId, analysisResult } = job.data;

    console.log(`[Strategy Worker] Generating strategy for video ${videoId}...`);

    try {
      await job.updateProgress(20);

      // Generate strategy based on analysis
      const strategy = {
        hooks: generateHooks(analysisResult),
        captions: generateCaptions(analysisResult),
        hashtags: generateHashtags(analysisResult),
        bestPostingTimes: generatePostingTimes(analysisResult.targetAudience),
        targetAudience: analysisResult.targetAudience,
        contentPillars: analysisResult.emotionalTones,
        viralScore: analysisResult.viralScore,
      };

      await job.updateProgress(60);

      // Save strategy to database
      await prisma.aiStrategy.create({
        data: {
          videoId,
          hooks: strategy.hooks,
          captions: strategy.captions,
          hashtags: strategy.hashtags,
          bestPostingTimes: strategy.bestPostingTimes,
          targetAudience: strategy.targetAudience,
          contentPillars: strategy.contentPillars,
          viralScore: strategy.viralScore,
        },
      });

      console.log(`[Strategy Worker] Strategy saved to database`);

      // Update video status to READY
      await job.updateProgress(90);
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'READY' },
      });

      console.log(`[Strategy Worker] Video ${videoId} marked as READY`);

      await job.updateProgress(100);

      return {
        success: true,
        videoId,
        strategy,
      };
    } catch (error) {
      console.error(`[Strategy Worker] Error generating strategy for ${videoId}:`, error);

      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'FAILED',
          errorMessage: `Strategy generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

// Helper functions for strategy generation
function generateHooks(analysis: any): string[] {
  const hooks = [...analysis.hooks];

  // Add generic hooks based on content type
  if (analysis.contentType.toLowerCase().includes('tutorial')) {
    hooks.push('Learn this simple trick!', 'You won\'t believe how easy this is!');
  } else if (analysis.contentType.toLowerCase().includes('vlog')) {
    hooks.push('Day in the life of a mom...', 'Real talk: ');
  }

  return hooks.slice(0, 10); // Return top 10 hooks
}

function generateCaptions(analysis: any): string[] {
  const captions: string[] = [];

  // Base caption from summary
  captions.push(analysis.summary);

  // Add emotional variations
  analysis.emotionalTones.forEach((tone: string) => {
    captions.push(`${analysis.summary} ${getEmotionalCTA(tone)}`);
  });

  return captions.slice(0, 5);
}

function getEmotionalCTA(tone: string): string {
  const ctas: { [key: string]: string } = {
    joy: 'Double tap if this made you smile!',
    inspiration: 'Tag someone who needs to see this!',
    humor: 'Comment if you can relate!',
    surprise: 'Wait for the end!',
  };

  return ctas[tone.toLowerCase()] || 'Share your thoughts below!';
}

function generateHashtags(analysis: any): string[][] {
  const baseTags = ['#momlife', '#sahm', '#momcontent'];
  const contentTypeTags = getContentTypeTags(analysis.contentType);
  const audienceTags = getAudienceTags(analysis.targetAudience);

  // Create 3 different hashtag sets
  return [
    [...baseTags, ...contentTypeTags.slice(0, 7)], // 10 tags
    [...baseTags, ...audienceTags.slice(0, 7)], // 10 tags
    [...baseTags, ...contentTypeTags.slice(0, 3), ...audienceTags.slice(0, 4)], // Mixed 10 tags
  ];
}

function getContentTypeTags(contentType: string): string[] {
  const type = contentType.toLowerCase();
  const tagMap: { [key: string]: string[] } = {
    tutorial: ['#tutorial', '#howto', '#tips', '#learn', '#diy'],
    vlog: ['#vlog', '#dayinthelife', '#dailyvlog', '#momvlog'],
    'product review': ['#review', '#productreview', '#honest', '#recommendation'],
    'parenting hack': ['#parentinghack', '#momhack', '#lifehack', '#parenting101'],
  };

  for (const [key, tags] of Object.entries(tagMap)) {
    if (type.includes(key)) return tags;
  }

  return ['#content', '#viral', '#trending'];
}

function getAudienceTags(audience: string): string[] {
  const aud = audience.toLowerCase();
  if (aud.includes('mom') || aud.includes('mother')) {
    return ['#momsofinstagram', '#motherhood', '#momcommunity', '#momfriends'];
  } else if (aud.includes('parent')) {
    return ['#parenting', '#parents', '#parenthood', '#family'];
  }
  return ['#community', '#support', '#family', '#lifestyle'];
}

function generatePostingTimes(audience: string): any {
  // Best posting times for mom creators
  return {
    tiktok: ['7:00 AM', '9:00 AM', '12:00 PM', '7:00 PM'],
    instagram: ['9:00 AM', '11:00 AM', '1:00 PM', '8:00 PM'],
    youtube: ['12:00 PM', '3:00 PM', '7:00 PM'],
    general: 'Post when your audience is most active (typically early morning, lunch, and evening)',
  };
}

// Event listeners for AI Worker
aiWorker.on('completed', (job: Job, result: any) => {
  console.log(`[AI Worker] Job ${job.id} completed. Viral Score: ${result.viralScore}/10`);
});

aiWorker.on('failed', (job: Job | undefined, error: Error) => {
  if (job) {
    console.error(`[AI Worker] Job ${job.id} failed:`, error.message);
  } else {
    console.error(`[AI Worker] Job failed:`, error.message);
  }
});

aiWorker.on('progress', (job: Job, progress: number | object) => {
  console.log(`[AI Worker] Job ${job.id} progress: ${progress}%`);
});

// Event listeners for Strategy Worker
strategyWorker.on('completed', (job: Job, result: any) => {
  console.log(`[Strategy Worker] Job ${job.id} completed for video ${result.videoId}`);
});

strategyWorker.on('failed', (job: Job | undefined, error: Error) => {
  if (job) {
    console.error(`[Strategy Worker] Job ${job.id} failed:`, error.message);
  } else {
    console.error(`[Strategy Worker] Job failed:`, error.message);
  }
});

// Graceful shutdown
export async function stopAiWorkers() {
  console.log('[AI Workers] Stopping workers...');
  await Promise.all([aiWorker.close(), strategyWorker.close()]);
  await prisma.$disconnect();
  console.log('[AI Workers] Workers stopped');
}

process.on('SIGTERM', stopAiWorkers);
process.on('SIGINT', stopAiWorkers);

console.log('[AI Worker] AI Analysis worker started');
console.log('[Strategy Worker] Strategy Generation worker started');
