/**
 * Video Upload Handler
 * Handles file validation, storage, thumbnail generation, and metadata extraction
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { nanoid } from 'nanoid';
import { getVideoMetadata } from './metadata';
import { validateVideoFile, VideoConstraints, FREE_TIER_CONSTRAINTS, PRO_TIER_CONSTRAINTS } from './video-validator';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

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
 * Validate and upload video file
 */
export async function handleVideoUpload(
  file: File,
  options: {
    userId: string;
    tier?: string;
    generateThumbnail?: boolean;
  }
): Promise<UploadResult> {
  const { userId, tier = 'FREE', generateThumbnail = true } = options;

  // Validate file
  const constraints = getUploadConstraints(tier);
  const validation = validateVideoFile(file, constraints);

  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Generate unique filename
  const fileId = nanoid(12);
  const extension = file.name.split('.').pop() || 'mp4';
  const storageKey = `${userId}/${fileId}.${extension}`;
  const filename = `${fileId}.${extension}`;

  // Create upload directories
  const uploadsDir = join(process.cwd(), 'uploads');
  const userDir = join(uploadsDir, userId);

  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  if (!existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
  }

  // Save video file
  const filepath = join(userDir, filename);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  // Extract metadata
  let metadata;
  let duration;
  let thumbnailUrl;

  try {
    const videoMetadata = await getVideoMetadata(filepath);
    duration = videoMetadata.duration;
    metadata = {
      width: videoMetadata.width,
      height: videoMetadata.height,
      fps: videoMetadata.fps,
      codec: videoMetadata.codec,
      bitrate: videoMetadata.bitrate,
      hasAudio: videoMetadata.hasAudio,
    };

    // Generate thumbnail
    if (generateThumbnail) {
      thumbnailUrl = await generateThumbnail(filepath, userId, fileId);
    }
  } catch (error) {
    console.error('Error extracting metadata:', error);
    // Continue without metadata - video is still uploaded
  }

  return {
    storageKey,
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
 * Generate video thumbnail
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
 * Delete uploaded video and associated files
 */
export async function deleteVideoFiles(storageKey: string): Promise<void> {
  const filepath = join(process.cwd(), 'uploads', storageKey);

  try {
    // Delete video file
    const fs = await import('fs/promises');
    await fs.unlink(filepath);

    // Delete thumbnail if exists
    const parts = storageKey.split('/');
    if (parts.length === 2) {
      const [userId, filename] = parts;
      const fileId = filename.split('.')[0];
      const thumbnailPath = join(
        process.cwd(),
        'uploads',
        userId,
        'thumbnails',
        `${fileId}.jpg`
      );

      if (existsSync(thumbnailPath)) {
        await fs.unlink(thumbnailPath);
      }
    }
  } catch (error) {
    console.error('Error deleting video files:', error);
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
