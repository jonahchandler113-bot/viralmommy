/**
 * Database client stub
 * TODO: Implement actual database connection with Prisma
 */

// Stub types for database records
type PlatformConnection = {
  id: string;
  userId: string;
  platform: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  status: string;
  platformUserId?: string;
  platformUsername?: string;
}

type Video = {
  id: string;
  userId: string;
  title: string;
  status: string;
}

type User = {
  id: string;
  email: string;
  name: string;
}

export const db = {
  platformConnection: {
    findFirst: async (_args?: any): Promise<PlatformConnection | null> => null,
    findMany: async (_args?: any): Promise<PlatformConnection[]> => [],
    update: async (_args?: any): Promise<PlatformConnection> => ({} as PlatformConnection),
    create: async (_args?: any): Promise<PlatformConnection> => ({} as PlatformConnection),
  },
  video: {
    findMany: async (_args?: any): Promise<Video[]> => [],
    findUnique: async (_args?: any): Promise<Video | null> => null,
    create: async (_args?: any): Promise<Video> => ({} as Video),
    update: async (_args?: any): Promise<Video> => ({} as Video),
  },
  user: {
    findUnique: async (_args?: any): Promise<User | null> => null,
    create: async (_args?: any): Promise<User> => ({} as User),
    update: async (_args?: any): Promise<User> => ({} as User),
  }
};
