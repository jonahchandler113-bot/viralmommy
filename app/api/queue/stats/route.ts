import { NextRequest, NextResponse } from 'next/server';
import { getQueueStats } from '@/lib/queue/video-queue';

/**
 * GET /api/queue/stats
 * Get statistics for all queues
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return NextResponse.json(
      { error: 'Failed to get queue statistics' },
      { status: 500 }
    );
  }
}
