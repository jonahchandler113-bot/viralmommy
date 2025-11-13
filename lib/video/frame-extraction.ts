import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

// Set ffmpeg path to use the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface FrameExtractionOptions {
  interval: number; // seconds between frames
  maxFrames: number; // maximum number of frames to extract
  outputFormat?: 'png' | 'jpg'; // output image format
  quality?: number; // quality for jpg (1-31, lower is better)
}

export interface ExtractedFrame {
  buffer: Buffer;
  timestamp: number; // timestamp in seconds
  frameNumber: number;
  base64: string; // base64 encoded for Claude API
}

/**
 * Extract frames from a video file at specified intervals
 * @param videoPath - Absolute path to the video file
 * @param options - Frame extraction options
 * @returns Promise resolving to array of extracted frames with metadata
 */
export async function extractFrames(
  videoPath: string,
  options: FrameExtractionOptions
): Promise<ExtractedFrame[]> {
  const { interval, maxFrames, outputFormat = 'png', quality = 2 } = options;

  // Create temporary directory for frames
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'viralmommy-frames-'));
  const frames: ExtractedFrame[] = [];

  try {
    // Get video duration first
    const metadata = await getVideoMetadata(videoPath);
    const duration = metadata.duration;

    // Calculate actual number of frames to extract
    const calculatedFrames = Math.floor(duration / interval);
    const framesToExtract = Math.min(calculatedFrames, maxFrames);

    console.log(`Extracting ${framesToExtract} frames from video (duration: ${duration}s)`);

    // Extract frames using ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=1/${interval}`, // Extract one frame every N seconds
        ])
        .output(path.join(tempDir, `frame-%04d.${outputFormat}`))
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    // Read extracted frames
    const files = await fs.readdir(tempDir);
    const sortedFiles = files
      .filter(f => f.startsWith('frame-'))
      .sort()
      .slice(0, maxFrames);

    for (let i = 0; i < sortedFiles.length; i++) {
      const filePath = path.join(tempDir, sortedFiles[i]);
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');
      const timestamp = i * interval;

      frames.push({
        buffer,
        timestamp,
        frameNumber: i + 1,
        base64,
      });
    }

    console.log(`Successfully extracted ${frames.length} frames`);
    return frames;
  } catch (error) {
    console.error('Error extracting frames:', error);
    throw error;
  } finally {
    // Cleanup: remove temporary directory
    try {
      const files = await fs.readdir(tempDir);
      await Promise.all(files.map(f => fs.unlink(path.join(tempDir, f))));
      await fs.rmdir(tempDir);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary directory:', cleanupError);
    }
  }
}

/**
 * Extract a single frame at a specific timestamp
 * @param videoPath - Absolute path to the video file
 * @param timestamp - Timestamp in seconds
 * @param outputFormat - Output image format (png or jpg)
 * @returns Promise resolving to the extracted frame
 */
export async function extractFrameAtTimestamp(
  videoPath: string,
  timestamp: number,
  outputFormat: 'png' | 'jpg' = 'png'
): Promise<ExtractedFrame> {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'viralmommy-frame-'));
  const outputPath = path.join(tempDir, `frame.${outputFormat}`);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .outputOptions(['-frames:v 1'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    const buffer = await fs.readFile(outputPath);
    const base64 = buffer.toString('base64');

    return {
      buffer,
      timestamp,
      frameNumber: 1,
      base64,
    };
  } finally {
    // Cleanup
    try {
      await fs.unlink(outputPath);
      await fs.rmdir(tempDir);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError);
    }
  }
}

/**
 * Extract frames at strategic points (beginning, middle, end)
 * Useful for quick video preview or analysis
 */
export async function extractKeyFrames(
  videoPath: string,
  numberOfFrames: number = 5
): Promise<ExtractedFrame[]> {
  const metadata = await getVideoMetadata(videoPath);
  const duration = metadata.duration;

  // Calculate timestamps evenly distributed across the video
  const timestamps: number[] = [];
  for (let i = 0; i < numberOfFrames; i++) {
    const timestamp = (duration / (numberOfFrames + 1)) * (i + 1);
    timestamps.push(Math.floor(timestamp));
  }

  const frames: ExtractedFrame[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const frame = await extractFrameAtTimestamp(videoPath, timestamps[i]);
    frame.frameNumber = i + 1;
    frames.push(frame);
  }

  return frames;
}

// Helper function to get video metadata (referenced but defined in metadata.ts)
async function getVideoMetadata(videoPath: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve({
        duration: metadata.format.duration || 0,
      });
    });
  });
}
