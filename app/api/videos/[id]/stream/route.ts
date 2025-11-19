/**
 * Video Stream API Route
 * Generates signed URLs for video playback from R2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { getSignedUrl, extractKeyFromStorageUrl } from '@/lib/storage/r2-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { id: videoId } = await params;

    // Get video from database
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        userId: true,
        storageKey: true,
        storageUrl: true,
        thumbnailUrl: true,
        status: true,
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if user owns the video
    if (video.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this video.' },
        { status: 403 }
      );
    }

    // Check if video is ready
    if (video.status !== 'READY' && video.status !== 'PROCESSING' && video.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Video is not ready for playback' },
        { status: 400 }
      );
    }

    // Generate signed URLs for video and thumbnail
    const videoKey = extractKeyFromStorageUrl(video.storageKey);
    const videoUrl = await getSignedUrl(videoKey, 3600); // 1 hour expiry

    let thumbnailUrl = video.thumbnailUrl;
    if (thumbnailUrl && thumbnailUrl.startsWith('r2://')) {
      const thumbnailKey = extractKeyFromStorageUrl(thumbnailUrl);
      thumbnailUrl = await getSignedUrl(thumbnailKey, 3600);
    }

    return NextResponse.json({
      success: true,
      videoId: video.id,
      videoUrl,
      thumbnailUrl,
      expiresIn: 3600, // seconds
    });
  } catch (error) {
    console.error('Stream error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate video URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
