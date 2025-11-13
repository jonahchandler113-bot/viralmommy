import { Queue, QueueEvents, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// Job data types
export interface ProcessVideoJobData {
  videoId: string;
  userId: string;
  filePath: string;
  filename: string;
}

export interface AnalyzeVideoJobData {
  videoId: string;
  userId: string;
  filePath: string;
  framesExtracted: number;
}

export interface GenerateStrategyJobData {
  videoId: string;
  userId: string;
  analysisResult: any;
}

// Job types
export enum JobType {
  PROCESS_VIDEO = 'process-video',
  ANALYZE_VIDEO = 'analyze-video',
  GENERATE_STRATEGY = 'generate-strategy',
}

// Queue configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const USE_IN_MEMORY = process.env.USE_IN_MEMORY_QUEUE === 'true';

// Create Redis connection or in-memory alternative
let connection: IORedis | ConnectionOptions;

if (USE_IN_MEMORY) {
  console.log('Using in-memory queue (development mode)');
  // For development without Redis, we'll use a simple connection config
  // BullMQ will handle the fallback
  connection = {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
  };
} else {
  connection = new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  connection.on('connect', () => {
    console.log('Redis connected successfully');
  });

  connection.on('error', (err: Error) => {
    console.error('Redis connection error:', err);
  });
}

// Create queues
export const videoQueue = new Queue('video-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 60 * 60, // Keep for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
});

export const aiQueue = new Queue('ai-analysis', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 60 * 60,
    },
    removeOnFail: {
      count: 500,
    },
  },
});

export const strategyQueue = new Queue('strategy-generation', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 60 * 60,
    },
    removeOnFail: {
      count: 500,
    },
  },
});

// Queue events for monitoring
export const videoQueueEvents = new QueueEvents('video-processing', { connection });
export const aiQueueEvents = new QueueEvents('ai-analysis', { connection });
export const strategyQueueEvents = new QueueEvents('strategy-generation', { connection });

// Helper functions to add jobs to queue
export async function addProcessVideoJob(data: ProcessVideoJobData) {
  const job = await videoQueue.add(JobType.PROCESS_VIDEO, data, {
    jobId: `process-${data.videoId}`,
    priority: 1, // Higher priority for initial processing
  });

  console.log(`Added process-video job: ${job.id} for video ${data.videoId}`);
  return job;
}

export async function addAnalyzeVideoJob(data: AnalyzeVideoJobData) {
  const job = await aiQueue.add(JobType.ANALYZE_VIDEO, data, {
    jobId: `analyze-${data.videoId}`,
    priority: 2,
  });

  console.log(`Added analyze-video job: ${job.id} for video ${data.videoId}`);
  return job;
}

export async function addGenerateStrategyJob(data: GenerateStrategyJobData) {
  const job = await strategyQueue.add(JobType.GENERATE_STRATEGY, data, {
    jobId: `strategy-${data.videoId}`,
    priority: 3,
  });

  console.log(`Added generate-strategy job: ${job.id} for video ${data.videoId}`);
  return job;
}

// Get job status
export async function getJobStatus(jobId: string, queueName: 'video' | 'ai' | 'strategy') {
  const queue = queueName === 'video' ? videoQueue : queueName === 'ai' ? aiQueue : strategyQueue;
  const job = await queue.getJob(jobId);

  if (!job) {
    return { exists: false };
  }

  const state = await job.getState();
  const progress = job.progress;
  const failedReason = job.failedReason;
  const returnvalue = job.returnvalue;

  return {
    exists: true,
    id: job.id,
    state,
    progress,
    data: job.data,
    failedReason,
    returnvalue,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

// Get queue stats
export async function getQueueStats() {
  const [videoStats, aiStats, strategyStats] = await Promise.all([
    getIndividualQueueStats(videoQueue, 'video-processing'),
    getIndividualQueueStats(aiQueue, 'ai-analysis'),
    getIndividualQueueStats(strategyQueue, 'strategy-generation'),
  ]);

  return {
    video: videoStats,
    ai: aiStats,
    strategy: strategyStats,
  };
}

async function getIndividualQueueStats(queue: Queue, name: string) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

// Graceful shutdown
export async function closeQueues() {
  console.log('Closing queues...');
  await Promise.all([
    videoQueue.close(),
    aiQueue.close(),
    strategyQueue.close(),
    videoQueueEvents.close(),
    aiQueueEvents.close(),
    strategyQueueEvents.close(),
  ]);

  if (connection instanceof IORedis) {
    await connection.quit();
  }

  console.log('All queues closed');
}

// Handle process termination
process.on('SIGTERM', async () => {
  await closeQueues();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closeQueues();
  process.exit(0);
});
