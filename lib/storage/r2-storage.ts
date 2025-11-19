/**
 * Cloudflare R2 Storage Service
 * Provides video upload, deletion, and signed URL generation using Cloudflare R2 (S3-compatible storage)
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment validation
function validateR2Config() {
  const required = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missing.join(', ')}`);
  }
}

// Initialize S3 client for Cloudflare R2
function getR2Client(): S3Client {
  validateR2Config();

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

/**
 * Upload video to R2
 */
export async function uploadVideoToR2(
  buffer: Buffer,
  key: string,
  options: {
    contentType: string;
    metadata?: Record<string, string>;
  }
): Promise<{ storageUrl: string; key: string }> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: options.contentType,
    Metadata: options.metadata,
  });

  await client.send(command);

  // R2 storage URL (internal identifier)
  const storageUrl = `r2://${bucketName}/${key}`;

  return {
    storageUrl,
    key,
  };
}

/**
 * Upload thumbnail to R2
 */
export async function uploadThumbnailToR2(
  buffer: Buffer,
  key: string
): Promise<{ storageUrl: string; key: string }> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  });

  await client.send(command);

  const storageUrl = `r2://${bucketName}/${key}`;

  return {
    storageUrl,
    key,
  };
}

/**
 * Delete video from R2
 */
export async function deleteVideoFromR2(key: string): Promise<void> {
  const client = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await client.send(command);
}

/**
 * Check if object exists in R2
 */
export async function checkObjectExists(key: string): Promise<boolean> {
  const client = getR2Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Generate signed URL for temporary access
 * Useful for video playback, downloads, or sharing
 */
export async function getSignedUrl(
  key: string,
  expiresIn: number = 3600 // Default 1 hour
): Promise<string> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const signedUrl = await getS3SignedUrl(client, command, { expiresIn });
  return signedUrl;
}

/**
 * Generate public URL for R2 object
 * Requires R2 bucket to have public access configured or custom domain
 */
export function getPublicUrl(key: string): string {
  const customDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

  if (customDomain) {
    // If custom domain is configured, use it
    return `https://${customDomain}/${key}`;
  }

  // Otherwise return the R2 internal URL (requires signed URLs for access)
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
}

/**
 * Get video metadata from R2
 */
export async function getVideoMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}> {
  const client = getR2Client();

  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await client.send(command);

  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType || 'application/octet-stream',
    lastModified: response.LastModified || new Date(),
    metadata: response.Metadata,
  };
}

/**
 * Helper function to extract key from R2 storage URL
 */
export function extractKeyFromStorageUrl(storageUrl: string): string {
  if (storageUrl.startsWith('r2://')) {
    // Format: r2://bucket-name/path/to/file
    const parts = storageUrl.replace('r2://', '').split('/');
    parts.shift(); // Remove bucket name
    return parts.join('/');
  }
  return storageUrl; // Already a key
}

/**
 * Batch delete multiple objects from R2
 */
export async function batchDeleteFromR2(keys: string[]): Promise<void> {
  const client = getR2Client();

  // Delete in parallel for efficiency
  await Promise.all(
    keys.map(key =>
      client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }))
    )
  );
}
