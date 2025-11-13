import { NextRequest, NextResponse } from 'next/server';
import { videoQueue, aiQueue, strategyQueue } from '@/lib/queue/video-queue';

/**
 * GET /api/queue/health
 * Health check endpoint for queue system
 */
export async function GET(request: NextRequest) {
  try {
    const healthChecks = await Promise.all([
      checkQueueHealth(videoQueue, 'video-processing'),
      checkQueueHealth(aiQueue, 'ai-analysis'),
      checkQueueHealth(strategyQueue, 'strategy-generation'),
    ]);

    const allHealthy = healthChecks.every(check => check.healthy);

    return NextResponse.json({
      success: true,
      healthy: allHealthy,
      queues: healthChecks,
      timestamp: new Date().toISOString(),
    }, {
      status: allHealthy ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
      healthy: false,
      error: 'Failed to check queue health',
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
    });
  }
}

async function checkQueueHealth(queue: any, name: string) {
  try {
    // Try to get queue counts (this will fail if Redis is down)
    const [waiting, active, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
    ]);

    // Queue is unhealthy if there are too many failed jobs
    const healthy = failed < 10;

    return {
      name,
      healthy,
      waiting,
      active,
      failed,
      status: healthy ? 'operational' : 'degraded',
    };
  } catch (error) {
    return {
      name,
      healthy: false,
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
