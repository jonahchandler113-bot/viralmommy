import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { promises as fs } from 'fs';

// Set ffmpeg path to use the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface VideoMetadata {
  duration: number; // duration in seconds
  width: number; // video width in pixels
  height: number; // video height in pixels
  fps: number; // frames per second
  size: number; // file size in bytes
  codec: string; // video codec
  audioCodec?: string; // audio codec (optional)
  bitrate: number; // bitrate in kbps
  aspectRatio?: string; // aspect ratio (e.g., "16:9")
  format: string; // container format (e.g., "mp4", "mov")
  hasAudio: boolean; // whether video has audio track
}

/**
 * Extract comprehensive metadata from a video file
 * @param videoPath - Absolute path to the video file
 * @returns Promise resolving to video metadata
 */
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  try {
    // Get file stats for size
    const stats = await fs.stat(videoPath);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error('Error reading video metadata:', err);
          return reject(err);
        }

        // Extract video stream information
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        if (!videoStream) {
          return reject(new Error('No video stream found in file'));
        }

        // Parse FPS (can be in various formats like "30/1" or "29.97")
        let fps = 0;
        if (videoStream.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
          fps = den ? num / den : num;
        } else if (videoStream.avg_frame_rate) {
          const [num, den] = videoStream.avg_frame_rate.split('/').map(Number);
          fps = den ? num / den : num;
        }

        // Calculate aspect ratio
        let aspectRatio = undefined;
        if (videoStream.width && videoStream.height) {
          const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
          const divisor = gcd(videoStream.width, videoStream.height);
          aspectRatio = `${videoStream.width / divisor}:${videoStream.height / divisor}`;
        }

        const result: VideoMetadata = {
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: Math.round(fps * 100) / 100, // Round to 2 decimal places
          size: stats.size,
          codec: videoStream.codec_name || 'unknown',
          audioCodec: audioStream?.codec_name,
          bitrate: Math.round((metadata.format.bit_rate || 0) / 1000), // Convert to kbps
          aspectRatio,
          format: metadata.format.format_name || 'unknown',
          hasAudio: !!audioStream,
        };

        resolve(result);
      });
    });
  } catch (error) {
    console.error('Error extracting video metadata:', error);
    throw error;
  }
}

/**
 * Check if a file is a valid video file
 * @param filePath - Path to the file to check
 * @returns Promise resolving to true if file is a valid video
 */
export async function isValidVideo(filePath: string): Promise<boolean> {
  try {
    await getVideoMetadata(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a human-readable summary of video metadata
 * @param videoPath - Absolute path to the video file
 * @returns Promise resolving to formatted string
 */
export async function getVideoSummary(videoPath: string): Promise<string> {
  const metadata = await getVideoMetadata(videoPath);

  const durationMin = Math.floor(metadata.duration / 60);
  const durationSec = Math.floor(metadata.duration % 60);
  const sizeInMB = (metadata.size / (1024 * 1024)).toFixed(2);

  return `
Video Summary:
--------------
Duration: ${durationMin}m ${durationSec}s (${metadata.duration.toFixed(2)}s)
Resolution: ${metadata.width}x${metadata.height} (${metadata.aspectRatio || 'N/A'})
Frame Rate: ${metadata.fps} fps
File Size: ${sizeInMB} MB
Bitrate: ${metadata.bitrate} kbps
Video Codec: ${metadata.codec}
Audio Codec: ${metadata.audioCodec || 'None'}
Format: ${metadata.format}
Has Audio: ${metadata.hasAudio ? 'Yes' : 'No'}
  `.trim();
}

/**
 * Calculate estimated processing time for video
 * Based on duration and complexity
 * @param metadata - Video metadata object
 * @returns Estimated processing time in seconds
 */
export function estimateProcessingTime(metadata: VideoMetadata): number {
  // Base time: ~1 second per 10 seconds of video for frame extraction
  const frameExtractionTime = metadata.duration / 10;

  // Audio extraction: ~0.5 seconds per minute
  const audioExtractionTime = (metadata.duration / 60) * 0.5;

  // Transcription (Whisper): roughly real-time to 2x real-time
  const transcriptionTime = metadata.hasAudio ? metadata.duration * 1.5 : 0;

  // Claude Vision analysis: ~2-3 seconds per frame (for 30 frames max)
  const maxFrames = Math.min(30, Math.floor(metadata.duration / 2));
  const visionAnalysisTime = maxFrames * 2.5;

  // Add buffer for overhead (20%)
  const totalTime = (frameExtractionTime + audioExtractionTime + transcriptionTime + visionAnalysisTime) * 1.2;

  return Math.ceil(totalTime);
}

/**
 * Validate video meets platform requirements
 * @param videoPath - Path to video file
 * @param requirements - Platform requirements
 * @returns Validation result with any errors
 */
export async function validateVideo(
  videoPath: string,
  requirements: {
    maxDuration?: number; // max duration in seconds
    maxSize?: number; // max size in bytes
    minWidth?: number; // minimum width
    minHeight?: number; // minimum height
    requiresAudio?: boolean; // whether audio is required
    allowedFormats?: string[]; // allowed video formats
  } = {}
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const metadata = await getVideoMetadata(videoPath);

    if (requirements.maxDuration && metadata.duration > requirements.maxDuration) {
      errors.push(`Video duration (${metadata.duration}s) exceeds maximum (${requirements.maxDuration}s)`);
    }

    if (requirements.maxSize && metadata.size > requirements.maxSize) {
      const maxSizeMB = (requirements.maxSize / (1024 * 1024)).toFixed(2);
      const actualSizeMB = (metadata.size / (1024 * 1024)).toFixed(2);
      errors.push(`File size (${actualSizeMB}MB) exceeds maximum (${maxSizeMB}MB)`);
    }

    if (requirements.minWidth && metadata.width < requirements.minWidth) {
      errors.push(`Video width (${metadata.width}px) is below minimum (${requirements.minWidth}px)`);
    }

    if (requirements.minHeight && metadata.height < requirements.minHeight) {
      errors.push(`Video height (${metadata.height}px) is below minimum (${requirements.minHeight}px)`);
    }

    if (requirements.requiresAudio && !metadata.hasAudio) {
      errors.push('Video must contain an audio track');
    }

    if (requirements.allowedFormats && !requirements.allowedFormats.some(format =>
      metadata.format.includes(format.toLowerCase())
    )) {
      errors.push(`Video format (${metadata.format}) is not in allowed formats: ${requirements.allowedFormats.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(`Failed to read video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      valid: false,
      errors,
    };
  }
}
