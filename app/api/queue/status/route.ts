import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/queue/video-queue';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/queue/status?jobId=xxx&queue=video
 * Get the status of a specific job
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const queue = searchParams.get('queue') as 'video' | 'ai' | 'strategy' | null;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    if (!queue || !['video', 'ai', 'strategy'].includes(queue)) {
      return NextResponse.json(
        { error: 'Invalid queue parameter. Must be: video, ai, or strategy' },
        { status: 400 }
      );
    }

    const jobStatus = await getJobStatus(jobId, queue);

    if (!jobStatus.exists) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: jobStatus,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/queue/status/[videoId]
 * Get all jobs related to a video
 */
export async function getVideoJobs(videoId: string) {
  try {
    const [videoJob, aiJob, strategyJob] = await Promise.all([
      getJobStatus(`process-${videoId}`, 'video'),
      getJobStatus(`analyze-${videoId}`, 'ai'),
      getJobStatus(`strategy-${videoId}`, 'strategy'),
    ]);

    return {
      videoId,
      jobs: {
        processing: videoJob.exists ? videoJob : null,
        analysis: aiJob.exists ? aiJob : null,
        strategy: strategyJob.exists ? strategyJob : null,
      },
    };
  } catch (error) {
    console.error('Error getting video jobs:', error);
    throw error;
  }
}
