import { NextRequest, NextResponse } from 'next/server';
import { addProcessVideoJob } from '@/lib/queue/video-queue';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/queue/add-video
 * Add a video to the processing queue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, userId, filePath, filename } = body;

    // Validate required fields
    if (!videoId || !userId || !filePath || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, userId, filePath, filename' },
        { status: 400 }
      );
    }

    // Verify video exists in database
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Verify user owns the video
    if (video.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Add to processing queue
    const job = await addProcessVideoJob({
      videoId,
      userId,
      filePath,
      filename,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      videoId,
      message: 'Video added to processing queue',
      queuePosition: await job.getState(),
    });
  } catch (error) {
    console.error('Error adding video to queue:', error);
    return NextResponse.json(
      { error: 'Failed to add video to queue' },
      { status: 500 }
    );
  }
}
