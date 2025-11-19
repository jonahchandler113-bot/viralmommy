import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { JobType, ProcessVideoJobData, addAnalyzeVideoJob } from './video-queue';
import { extractKeyFrames } from '../video/frame-extraction';
import { getVideoMetadata } from '../video/metadata';
import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

const prisma = new PrismaClient();

// Redis connection config (use REDIS_URL from Railway)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Skip worker initialization during Next.js build
const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Download video from R2 to local temp file for processing
 */
async function downloadVideoFromR2(storageKey: string, localPath: string): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error('Failed to download video from R2');
  }

  // Convert stream to buffer
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);
  await writeFile(localPath, buffer);
}

/**
 * Video Processing Worker
 * Handles video upload processing:
 * 1. Download from R2 (if needed)
 * 2. Extract metadata
 * 3. Extract key frames
 * 4. Update database
 * 5. Trigger AI analysis
 * 6. Clean up temp files
 */
export const videoWorker = !isBuilding ? new Worker(
  'video-processing',
  async (job: Job<ProcessVideoJobData>) => {
    const { videoId, userId, filePath, filename } = job.data;

    console.log(`[Video Worker] Processing video ${videoId}...`);

    let tempFilePath = filePath;
    let needsCleanup = false;

    try {
      // Step 1: Update status to PROCESSING
      await job.updateProgress(10);
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'PROCESSING' },
      });

      // Get video record to check storage location
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        select: { storageKey: true, storageUrl: true },
      });

      if (!video) {
        throw new Error(`Video ${videoId} not found in database`);
      }

      // Check if video is in R2 (new uploads) or local storage (legacy)
      const isR2Video = video.storageUrl?.startsWith('r2://');

      if (isR2Video) {
        console.log(`[Video Worker] Downloading video from R2: ${video.storageKey}`);

        // Create temp directory
        const tempDir = path.join(process.cwd(), 'temp');
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true });
        }

        // Download to temp file
        tempFilePath = path.join(tempDir, `${videoId}-${filename}`);
        await downloadVideoFromR2(video.storageKey, tempFilePath);
        needsCleanup = true;

        console.log(`[Video Worker] Video downloaded to: ${tempFilePath}`);
      } else {
        console.log(`[Video Worker] Using local file: ${filePath}`);
      }

      console.log(`[Video Worker] Extracting metadata for ${videoId}...`);

      // Step 2: Extract metadata
      await job.updateProgress(20);
      const metadata = await getVideoMetadata(tempFilePath);

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
        filePath: tempFilePath, // Use temp file path for AI analysis
        framesExtracted: frames.length,
      });

      console.log(`[Video Worker] AI analysis job queued for ${videoId}`);

      // Step 6: Complete
      await job.updateProgress(100);

      // Step 7: Clean up temp file if needed
      if (needsCleanup) {
        console.log(`[Video Worker] Cleaning up temp file: ${tempFilePath}`);
        await unlink(tempFilePath).catch(err =>
          console.error(`[Video Worker] Failed to cleanup temp file:`, err)
        );
      }

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

      // Clean up temp file if needed
      if (needsCleanup && tempFilePath) {
        await unlink(tempFilePath).catch(err =>
          console.error(`[Video Worker] Failed to cleanup temp file after error:`, err)
        );
      }

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
