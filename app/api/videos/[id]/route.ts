/**
 * Individual Video API Route
 * GET: Fetch video by ID
 * PATCH: Update video status or metadata
 * DELETE: Delete video
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, checkResourceAccess } from '@/lib/auth/session';
import { VideoStatus } from '@prisma/client';
import { deleteVideoFiles } from '@/lib/video/upload-handler';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/videos/[id]
 * Fetch a single video by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    // Check authentication
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch video
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        aiStrategies: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        publishedPosts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkResourceAccess(session.user.id, video.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this video.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/videos/[id]
 * Update video status or metadata
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    // Check authentication
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch video to check ownership
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkResourceAccess(session.user.id, video.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this video.' },
        { status: 403 }
      );
    }

    // Parse update data
    const body = await request.json();
    const updateData: any = {};

    // Allowed fields to update
    if (body.status && Object.values(VideoStatus).includes(body.status)) {
      updateData.status = body.status;
    }

    if (body.aiAnalysis !== undefined) {
      updateData.aiAnalysis = body.aiAnalysis;
    }

    if (body.transcription !== undefined) {
      updateData.transcription = body.transcription;
    }

    if (body.metadata !== undefined) {
      updateData.metadata = body.metadata;
    }

    if (body.errorMessage !== undefined) {
      updateData.errorMessage = body.errorMessage;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update video
    const updatedVideo = await prisma.video.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      video: updatedVideo,
      message: 'Video updated successfully',
    });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      {
        error: 'Failed to update video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/videos/[id]
 * Delete video and associated files
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    // Check authentication
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Fetch video to check ownership
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkResourceAccess(session.user.id, video.userId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this video.' },
        { status: 403 }
      );
    }

    // Delete associated files
    try {
      await deleteVideoFiles(video.storageKey);
    } catch (fileError) {
      console.error('Error deleting video files:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database (cascade will delete related records)
    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
