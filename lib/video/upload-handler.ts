/**
 * Video Upload Handler
 * Handles file validation, storage, thumbnail generation, and metadata extraction
 * Now uses Cloudflare R2 for cloud storage
 */

import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { nanoid } from 'nanoid';
import { getVideoMetadata } from './metadata';
import { validateVideoFile, VideoConstraints, FREE_TIER_CONSTRAINTS, PRO_TIER_CONSTRAINTS } from './video-validator';
import { uploadVideoToR2, uploadThumbnailToR2, getSignedUrl } from '@/lib/storage/r2-storage';

// Set ffmpeg path - use system ffmpeg in production, installer in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  } catch (e) {
    console.log('Using system ffmpeg');
  }
} else {
  // Production: Railway has ffmpeg installed
  ffmpeg.setFfmpegPath('ffmpeg');
}

export interface UploadResult {
  storageKey: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  duration?: number;
  thumbnailUrl?: string;
  metadata?: {
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
    hasAudio: boolean;
  };
}

/**
 * Get upload constraints based on user subscription tier
 */
export function getUploadConstraints(tier: string = 'FREE'): VideoConstraints {
  switch (tier) {
    case 'PRO':
    case 'ENTERPRISE':
      return PRO_TIER_CONSTRAINTS;
    default:
      return FREE_TIER_CONSTRAINTS;
  }
}

/**
 * Validate and upload video file to R2
 */
export async function handleVideoUpload(
  file: File,
  options: {
    userId: string;
    tier?: string;
    generateThumbnail?: boolean;
  }
): Promise<UploadResult> {
  const { userId, tier = 'FREE', generateThumbnail: shouldGenerateThumbnail = true } = options;

  // Validate file
  const constraints = getUploadConstraints(tier);
  const validation = validateVideoFile(file, constraints);

  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Generate unique filename
  const fileId = nanoid(12);
  const extension = file.name.split('.').pop() || 'mp4';
  const storageKey = `videos/${userId}/${fileId}.${extension}`;
  const filename = `${fileId}.${extension}`;

  // Convert File to Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create temporary directory for processing
  const tempDir = join(process.cwd(), 'temp');
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  // Save to temp file for metadata extraction
  const tempFilepath = join(tempDir, filename);
  await writeFile(tempFilepath, buffer);

  // Extract metadata
  let metadata;
  let duration;
  let thumbnailUrl;

  try {
    const videoMetadata = await getVideoMetadata(tempFilepath);
    duration = videoMetadata.duration;
    metadata = {
      width: videoMetadata.width,
      height: videoMetadata.height,
      fps: videoMetadata.fps,
      codec: videoMetadata.codec,
      bitrate: videoMetadata.bitrate,
      hasAudio: videoMetadata.hasAudio,
    };

    // Generate and upload thumbnail to R2
    if (shouldGenerateThumbnail) {
      thumbnailUrl = await generateAndUploadThumbnail(tempFilepath, userId, fileId);
    }
  } catch (error) {
    console.error('Error extracting metadata:', error);
    // Continue without metadata - video is still uploaded
  }

  // Upload video to R2
  let r2Result;
  try {
    r2Result = await uploadVideoToR2(buffer, storageKey, {
      contentType: file.type,
      metadata: {
        userId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...(duration && { duration: duration.toString() }),
        ...(metadata && {
          width: metadata.width.toString(),
          height: metadata.height.toString(),
        }),
      },
    });
  } catch (error) {
    // Clean up temp file
    await unlink(tempFilepath).catch(console.error);
    throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Clean up temp file
  await unlink(tempFilepath).catch(console.error);

  return {
    storageKey: r2Result.key,
    filename,
    originalName: file.name,
    size: file.size,
    mimeType: file.type,
    duration,
    thumbnailUrl,
    metadata,
  };
}

/**
 * Generate video thumbnail and upload to R2
 */
export async function generateAndUploadThumbnail(
  videoPath: string,
  userId: string,
  videoId: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const tempDir = join(process.cwd(), 'temp');
    const thumbnailFilename = `${videoId}-thumb.jpg`;
    const thumbnailPath = join(tempDir, thumbnailFilename);

    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01'], // Take screenshot at 1 second
        filename: thumbnailFilename,
        folder: tempDir,
        size: '1280x720', // HD thumbnail
      })
      .on('end', async () => {
        try {
          // Optimize thumbnail with sharp
          const optimizedBuffer = await sharp(thumbnailPath)
            .resize(1280, 720, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            })
            .jpeg({ quality: 85 })
            .toBuffer();

          // Upload to R2
          const thumbnailKey = `thumbnails/${userId}/${videoId}.jpg`;
          const r2Result = await uploadThumbnailToR2(optimizedBuffer, thumbnailKey);

          // Clean up temp file
          await unlink(thumbnailPath).catch(console.error);

          // Return R2 storage URL
          resolve(r2Result.storageUrl);
        } catch (error) {
          console.error('Error optimizing/uploading thumbnail:', error);
          // Clean up temp file
          await unlink(thumbnailPath).catch(console.error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error generating thumbnail:', error);
        reject(error);
      });
  });
}

/**
 * Generate video thumbnail (legacy local storage version)
 * Kept for backward compatibility
 */
export async function generateThumbnail(
  videoPath: string,
  userId: string,
  videoId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const thumbnailsDir = join(process.cwd(), 'uploads', userId, 'thumbnails');

    // Create thumbnails directory if it doesn't exist
    if (!existsSync(thumbnailsDir)) {
      mkdir(thumbnailsDir, { recursive: true }).catch(reject);
    }

    const thumbnailFilename = `${videoId}.jpg`;
    const thumbnailPath = join(thumbnailsDir, thumbnailFilename);

    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01'], // Take screenshot at 1 second
        filename: thumbnailFilename,
        folder: thumbnailsDir,
        size: '1280x720', // HD thumbnail
      })
      .on('end', async () => {
        try {
          // Optimize thumbnail with sharp
          await sharp(thumbnailPath)
            .resize(1280, 720, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath + '.tmp');

          // Replace original with optimized
          await writeFile(thumbnailPath, await sharp(thumbnailPath + '.tmp').toBuffer());

          const thumbnailUrl = `/uploads/${userId}/thumbnails/${thumbnailFilename}`;
          resolve(thumbnailUrl);
        } catch (error) {
          console.error('Error optimizing thumbnail:', error);
          resolve(`/uploads/${userId}/thumbnails/${thumbnailFilename}`);
        }
      })
      .on('error', (error) => {
        console.error('Error generating thumbnail:', error);
        reject(error);
      });
  });
}

/**
 * Delete uploaded video and associated files from R2
 */
export async function deleteVideoFiles(storageKey: string): Promise<void> {
  try {
    // Import R2 storage functions
    const { deleteVideoFromR2, batchDeleteFromR2, extractKeyFromStorageUrl } = await import('@/lib/storage/r2-storage');

    // Extract key from storage URL if needed
    const videoKey = extractKeyFromStorageUrl(storageKey);

    // Delete video file
    await deleteVideoFromR2(videoKey);

    // Delete thumbnail if exists
    // Storage key format: videos/userId/fileId.ext or r2://bucket/videos/userId/fileId.ext
    const parts = videoKey.split('/');
    if (parts.length >= 3) {
      // Extract userId and fileId
      const userId = parts[parts.length - 2];
      const filename = parts[parts.length - 1];
      const fileId = filename.split('.')[0];
      const thumbnailKey = `thumbnails/${userId}/${fileId}.jpg`;

      // Try to delete thumbnail (ignore errors if it doesn't exist)
      try {
        await deleteVideoFromR2(thumbnailKey);
      } catch (error) {
        console.log('Thumbnail not found or already deleted');
      }
    }
  } catch (error) {
    console.error('Error deleting video files from R2:', error);
    throw error;
  }
}

/**
 * Validate file is actually a video
 */
export async function validateVideoContent(filepath: string): Promise<boolean> {
  try {
    const metadata = await getVideoMetadata(filepath);
    return metadata.duration > 0 && metadata.width > 0 && metadata.height > 0;
  } catch {
    return false;
  }
}
