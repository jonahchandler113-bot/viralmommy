import { Worker, Job } from 'bullmq';
import { JobType, ProcessVideoJobData, addAnalyzeVideoJob } from './video-queue';
import { extractKeyFrames } from '../video/frame-extraction';
import { getVideoMetadata } from '../video/metadata';
import { PrismaClient } from '@prisma/client';
import path from 'path';

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

// Skip worker initialization during Next.js build
const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Video Processing Worker
 * Handles video upload processing:
 * 1. Extract metadata
 * 2. Extract key frames
 * 3. Update database
 * 4. Trigger AI analysis
 */
export const videoWorker = !isBuilding ? new Worker(
  'video-processing',
  async (job: Job<ProcessVideoJobData>) => {
    const { videoId, userId, filePath, filename } = job.data;

    console.log(`[Video Worker] Processing video ${videoId}...`);

    try {
      // Step 1: Update status to PROCESSING
      await job.updateProgress(10);
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'PROCESSING' },
      });

      console.log(`[Video Worker] Extracting metadata for ${videoId}...`);

      // Step 2: Extract metadata
      await job.updateProgress(20);
      const metadata = await getVideoMetadata(filePath);

      console.log(`[Video Worker] Metadata extracted: ${metadata.duration}s, ${metadata.width}x${metadata.height}`);

      // Step 3: Extract key frames (5 frames evenly distributed)
      await job.updateProgress(40);
      console.log(`[Video Worker] Extracting key frames for ${videoId}...`);

      const numberOfFrames = Math.min(5, Math.floor(metadata.duration / 10)); // 1 frame per 10 seconds, max 5
      const frames = await extractKeyFrames(filePath, numberOfFrames);

      console.log(`[Video Worker] Extracted ${frames.length} frames`);

      // Step 4: Update video record with metadata
      await job.updateProgress(60);
      await prisma.video.update({
        where: { id: videoId },
        data: {
          duration: metadata.duration,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            fps: metadata.fps,
            codec: metadata.codec,
            audioCodec: metadata.audioCodec,
            bitrate: metadata.bitrate,
            aspectRatio: metadata.aspectRatio,
            format: metadata.format,
            hasAudio: metadata.hasAudio,
          },
        },
      });

      console.log(`[Video Worker] Database updated with metadata`);

      // Step 5: Queue AI analysis job
      await job.updateProgress(80);
      await addAnalyzeVideoJob({
        videoId,
        userId,
        filePath,
        framesExtracted: frames.length,
      });

      console.log(`[Video Worker] AI analysis job queued for ${videoId}`);

      // Step 6: Complete
      await job.updateProgress(100);

      return {
        success: true,
        videoId,
        metadata: {
          duration: metadata.duration,
          resolution: `${metadata.width}x${metadata.height}`,
          frames: frames.length,
        },
      };
    } catch (error) {
      console.error(`[Video Worker] Error processing video ${videoId}:`, error);

      // Update video status to FAILED
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error during processing',
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Process 2 videos simultaneously
    limiter: {
      max: 5, // Max 5 jobs per duration
      duration: 60000, // per 60 seconds
    },
  }
) : null as any;

// Event listeners (only attach if worker exists)
videoWorker?.on('completed', (job: Job, result: any) => {
  console.log(`[Video Worker] Job ${job.id} completed successfully:`, result);
});

videoWorker?.on('failed', (job: Job | undefined, error: Error) => {
  if (job) {
    console.error(`[Video Worker] Job ${job.id} failed:`, error.message);
  } else {
    console.error(`[Video Worker] Job failed:`, error.message);
  }
});

videoWorker?.on('progress', (job: Job, progress: any) => {
  console.log(`[Video Worker] Job ${job.id} progress: ${progress}%`);
});

videoWorker?.on('error', (error: Error) => {
  console.error('[Video Worker] Worker error:', error);
});

// Graceful shutdown
export async function stopVideoWorker() {
  if (videoWorker) {
    console.log('[Video Worker] Stopping worker...');
    await videoWorker.close();
    await prisma.$disconnect();
    console.log('[Video Worker] Worker stopped');
  }
}

process.on('SIGTERM', stopVideoWorker);
process.on('SIGINT', stopVideoWorker);

console.log('[Video Worker] Worker started and ready to process jobs');
