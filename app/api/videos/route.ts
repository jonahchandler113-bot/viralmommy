/**
 * Videos List API Route
 * GET: List user's videos with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { VideoStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Filter parameters
    const statusFilter = searchParams.get('status') as VideoStatus | null;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: any = {
      userId,
    };

    if (statusFilter && Object.values(VideoStatus).includes(statusFilter)) {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.video.count({ where });

    // Get videos with published platforms and analytics
    const videos = await prisma.video.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
      select: {
        id: true,
        originalName: true,
        filename: true,
        storageKey: true,
        storageUrl: true,
        thumbnailUrl: true,
        duration: true,
        size: true,
        mimeType: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        aiAnalysis: true,
        metadata: true,
        publishedPosts: {
          select: {
            id: true,
            platform: true,
            status: true,
            views: true,
            likes: true,
            comments: true,
            shares: true,
            engagementRate: true,
            publishedAt: true,
            postUrl: true,
          },
        },
        aiStrategies: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            viralScore: true,
            hooks: true,
            captions: true,
            hashtags: true,
          },
        },
      },
    });

    // Calculate aggregated stats for each video
    const videosWithStats = videos.map(video => {
      const totalViews = video.publishedPosts.reduce((sum, post) => sum + (post.views || 0), 0);
      const totalLikes = video.publishedPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const totalComments = video.publishedPosts.reduce((sum, post) => sum + (post.comments || 0), 0);
      const totalShares = video.publishedPosts.reduce((sum, post) => sum + (post.shares || 0), 0);
      const totalEngagement = totalLikes + totalComments + totalShares;
      const avgEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

      return {
        ...video,
        analytics: {
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          totalEngagement,
          avgEngagementRate,
        },
      };
    });

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      videos: videosWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch videos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
