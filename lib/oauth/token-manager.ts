/**
 * OAuth Token Manager
 *
 * Centralized token management for all social media platforms:
 * - TikTok (24-hour access tokens, 1-year refresh tokens)
 * - Instagram (60-day long-lived tokens)
 * - YouTube (1-hour access tokens, indefinite refresh tokens)
 *
 * Features:
 * - Secure token storage (encrypted in database)
 * - Automatic token refresh before expiration
 * - Multi-platform support per user
 * - Token expiration tracking
 * - Refresh failure handling
 */

import { db } from '@/lib/db';
import { Platform, ConnectionStatus } from '@/lib/types/prisma';
import crypto from 'crypto';

// TODO: Week 3 - Install encryption library
// npm install crypto-js @types/crypto-js

/**
 * Token refresh thresholds (in milliseconds)
 * Refresh tokens when they have this much time remaining
 */
const REFRESH_THRESHOLDS: Record<Platform, number> = {
  [Platform.TIKTOK]: 2.4 * 60 * 60 * 1000,      // 2.4 hours (10% of 24 hours)
  [Platform.INSTAGRAM]: 5 * 24 * 60 * 60 * 1000, // 5 days (before 60-day expiration)
  [Platform.YOUTUBE]: 5 * 60 * 1000,             // 5 minutes (before 1-hour expiration)
  [Platform.FACEBOOK]: 5 * 24 * 60 * 60 * 1000,  // 5 days
};

/**
 * Encryption key for storing tokens
 * TODO: Week 3 - Move to environment variable
 */
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || '';

/**
 * Encrypt a token before storing in database
 */
export function encryptToken(token: string): string {
  // TODO: Week 3 - Implement AES encryption
  // const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  // return encrypted;

  // Placeholder: Base64 encoding (NOT SECURE - replace in Week 3)
  return Buffer.from(token).toString('base64');
}

/**
 * Decrypt a token retrieved from database
 */
export function decryptToken(encryptedToken: string): string {
  // TODO: Week 3 - Implement AES decryption
  // const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  // return decrypted;

  // Placeholder: Base64 decoding (NOT SECURE - replace in Week 3)
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
}

/**
 * Store platform connection tokens in database
 */
export async function storeConnection({
  userId,
  platform,
  accessToken,
  refreshToken,
  expiresAt,
  platformUserId,
  platformUsername,
}: {
  userId: string;
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  platformUserId: string;
  platformUsername: string;
}) {
  // Encrypt tokens before storage
  const encryptedAccessToken = encryptToken(accessToken);
  const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;

  // Check if connection already exists
  const existingConnection = await db.platformConnection.findFirst({
    where: {
      userId,
      platform,
    },
  });

  if (existingConnection) {
    // Update existing connection
    return await db.platformConnection.update({
      where: { id: existingConnection.id },
      data: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        platformUserId,
        platformUsername,
        status: ConnectionStatus.ACTIVE,
      },
    });
  } else {
    // Create new connection
    return await db.platformConnection.create({
      data: {
        userId,
        platform,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        platformUserId,
        platformUsername,
        status: ConnectionStatus.ACTIVE,
      },
    });
  }
}

/**
 * Get platform connection for a user
 */
export async function getConnection(userId: string, platform: Platform) {
  const connection = await db.platformConnection.findFirst({
    where: {
      userId,
      platform,
      status: ConnectionStatus.ACTIVE,
    },
  });

  if (!connection) {
    return null;
  }

  // Decrypt tokens
  return {
    ...connection,
    accessToken: decryptToken(connection.accessToken),
    refreshToken: connection.refreshToken ? decryptToken(connection.refreshToken) : null,
  };
}

/**
 * Check if a token needs to be refreshed
 */
export function needsRefresh(expiresAt: Date | null, platform: Platform): boolean {
  if (!expiresAt) {
    return false; // No expiration set (e.g., Instagram long-lived tokens)
  }

  const threshold = REFRESH_THRESHOLDS[platform];
  const timeRemaining = expiresAt.getTime() - Date.now();

  return timeRemaining <= threshold;
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(
  userId: string,
  platform: Platform
): Promise<string> {
  const connection = await getConnection(userId, platform);

  if (!connection) {
    throw new Error(`No ${platform} connection found for user ${userId}`);
  }

  // Check if token needs refresh
  if (connection.expiresAt && needsRefresh(connection.expiresAt, platform)) {
    // Refresh token
    const newTokens = await refreshPlatformToken(platform, connection.refreshToken!);

    // Update database
    await storeConnection({
      userId,
      platform,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken || connection.refreshToken!,
      expiresAt: newTokens.expiresAt,
      platformUserId: connection.platformUserId || '',
      platformUsername: connection.platformUsername || '',
    });

    return newTokens.accessToken;
  }

  return connection.accessToken;
}

/**
 * Refresh tokens for a specific platform
 */
async function refreshPlatformToken(
  platform: Platform,
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  switch (platform) {
    case Platform.TIKTOK:
      return await refreshTikTokToken(refreshToken);
    case Platform.INSTAGRAM:
      return await refreshInstagramToken(refreshToken);
    case Platform.YOUTUBE:
      return await refreshYouTubeToken(refreshToken);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Refresh TikTok access token
 * TODO: Week 3 - Implement using TikTok API
 */
async function refreshTikTokToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  // TODO: Week 3 - Implement
  // POST https://open.tiktokapis.com/v2/oauth/token/
  // with refresh_token grant type

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`TikTok token refresh failed: ${data.error?.message}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh Instagram long-lived token
 * TODO: Week 3 - Implement using Facebook Graph API
 */
async function refreshInstagramToken(currentToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  // TODO: Week 3 - Implement
  // GET https://graph.facebook.com/v18.0/oauth/access_token
  // with fb_exchange_token grant type

  const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!);
  url.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!);
  url.searchParams.set('fb_exchange_token', currentToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) {
    throw new Error(`Instagram token refresh failed: ${data.error.message}`);
  }

  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
  };
}

/**
 * Refresh YouTube access token
 * TODO: Week 3 - Implement using Google OAuth
 */
async function refreshYouTubeToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  // TODO: Week 3 - Implement
  // POST https://oauth2.googleapis.com/token
  // with refresh_token grant type

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`YouTube token refresh failed: ${data.error_description}`);
  }

  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Revoke/disconnect a platform connection
 */
export async function disconnectPlatform(userId: string, platform: Platform) {
  const connection = await getConnection(userId, platform);

  if (!connection) {
    return;
  }

  // TODO: Week 3 - Call platform-specific revocation endpoints

  // Mark as expired in database
  await db.platformConnection.update({
    where: { id: connection.id },
    data: {
      status: ConnectionStatus.EXPIRED,
    },
  });
}

/**
 * Get all active connections for a user
 */
export async function getAllConnections(userId: string) {
  const connections = await db.platformConnection.findMany({
    where: {
      userId,
      status: ConnectionStatus.ACTIVE,
    },
  });

  return connections.map((conn) => ({
    ...conn,
    accessToken: decryptToken(conn.accessToken),
    refreshToken: conn.refreshToken ? decryptToken(conn.refreshToken) : null,
  }));
}

/**
 * Refresh all expiring tokens for a user
 * Call this in a cron job to proactively refresh tokens
 */
export async function refreshExpiringTokens(userId: string) {
  const connections = await getAllConnections(userId);
  const refreshPromises = [];

  for (const connection of connections) {
    if (connection.expiresAt && needsRefresh(connection.expiresAt, connection.platform as Platform)) {
      refreshPromises.push(
        getValidAccessToken(userId, connection.platform as Platform).catch((error) => {
          console.error(
            `Failed to refresh ${connection.platform} token for user ${userId}:`,
            error
          );

          // Mark connection as expired if refresh fails
          return db.platformConnection.update({
            where: { id: connection.id },
            data: { status: ConnectionStatus.EXPIRED },
          });
        })
      );
    }
  }

  await Promise.allSettled(refreshPromises);
}

/**
 * Cron job handler: Refresh all users' expiring tokens
 * TODO: Week 3 - Set up cron job (e.g., Vercel Cron or GitHub Actions)
 * Run this every hour
 */
export async function refreshAllUsersTokens() {
  // Get all users with active connections
  const connections = await db.platformConnection.findMany({
    where: {
      status: ConnectionStatus.ACTIVE,
      expiresAt: {
        not: null,
      },
    },
    select: {
      userId: true,
      platform: true,
      expiresAt: true,
    },
  });

  // Group by userId
  const userIds = [...new Set(connections.map((c) => c.userId))];

  console.log(`Refreshing tokens for ${userIds.length} users...`);

  for (const userId of userIds) {
    await refreshExpiringTokens(userId).catch((error) => {
      console.error(`Failed to refresh tokens for user ${userId}:`, error);
    });
  }

  console.log('Token refresh complete.');
}
