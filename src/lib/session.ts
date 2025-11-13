import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Get the current user session
 * Use this in Server Components and API Routes
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}

/**
 * Require authentication or throw error
 * Use this in API routes that require auth
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
