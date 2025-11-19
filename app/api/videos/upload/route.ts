/**
 * Video Upload API Route
 * Handles video file uploads with authentication, validation, and database integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, getUserWithSubscription } from '@/lib/auth/session';
import { handleVideoUpload } from '@/lib/video/upload-handler';
import { addProcessVideoJob } from '@/lib/queue/video-queue';

// Next.js App Router handles multipart/form-data automatically
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user subscription tier
    const user = await getUserWithSubscription(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Handle upload with validation and processing
    let uploadResult;
    try {
      uploadResult = await handleVideoUpload(file, {
        userId,
        tier: user.subscriptionTier,
        generateThumbnail: true,
      });
    } catch (uploadError: any) {
      return NextResponse.json(
        { error: uploadError.message || 'Failed to process video' },
        { status: 400 }
      );
    }

    // Save video record to database
    // Storage URLs are now R2 URLs (r2://bucket/key format)
    const video = await prisma.video.create({
      data: {
        userId,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        storageKey: uploadResult.storageKey,
        storageUrl: `r2://${process.env.CLOUDFLARE_R2_BUCKET_NAME}/${uploadResult.storageKey}`,
        thumbnailUrl: uploadResult.thumbnailUrl,
        duration: uploadResult.duration,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        status: 'PROCESSING',
        metadata: uploadResult.metadata || {},
      },
    });

    // Add video to processing queue
    // Note: filePath is now just a placeholder for R2 videos - the worker will download from R2
    const job = await addProcessVideoJob({
      videoId: video.id,
      userId,
      filePath: uploadResult.storageKey, // This is the R2 key, worker will handle download
      filename: uploadResult.filename,
    });

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        filename: video.originalName,
        storageKey: video.storageKey,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        size: video.size,
        status: video.status,
        createdAt: video.createdAt,
      },
      job: {
        id: job.id,
        state: await job.getState(),
      },
      message: 'Video uploaded and queued for processing',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
