/**
 * Platform Connections API Route
 * GET: Fetch user's connected platforms
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth/session'

export async function GET() {
  try {
    // Check authentication
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch all platform connections for the user
    const connections = await prisma.platformConnection.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        platform: true,
        isActive: true,
        accountName: true,
        accountHandle: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      connections,
    })
  } catch (error) {
    console.error('Error fetching platform connections:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch platform connections',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
