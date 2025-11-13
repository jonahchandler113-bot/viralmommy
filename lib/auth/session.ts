/**
 * Authentication utilities for API routes
 * Provides session management and user authentication
 */

import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

/**
 * Get the current authenticated user session
 * This is a placeholder - you'll need to configure NextAuth properly
 */
export async function getSession(): Promise<AuthSession | null> {
  // TODO: Replace with actual NextAuth configuration
  // For now, return a mock session for development
  if (process.env.NODE_ENV === 'development') {
    return {
      user: {
        id: 'dev-user-id',
        email: 'dev@viralmommy.com',
        name: 'Dev User',
        image: null,
      },
    };
  }

  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return null;
    }

    return {
      user: {
        id: (session.user as any).id || '',
        email: session.user.email || '',
        name: session.user.name,
        image: session.user.image,
      },
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get user ID from session or throw error
 */
export async function requireAuth(): Promise<string> {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  return session.user.id;
}

/**
 * Check if user has access to a resource
 */
export async function checkResourceAccess(
  userId: string,
  resourceUserId: string
): Promise<boolean> {
  return userId === resourceUserId;
}

/**
 * Get user with subscription details
 */
export async function getUserWithSubscription(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndDate: true,
    },
  });
}
