import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete YouTube connection
    await prisma.platformConnection.deleteMany({
      where: {
        userId: user.id,
        platform: 'YOUTUBE',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'YouTube disconnected successfully'
    })

  } catch (error) {
    console.error('YouTube disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect YouTube' },
      { status: 500 }
    )
  }
}
