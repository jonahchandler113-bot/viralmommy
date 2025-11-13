import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

// Set ffmpeg path - use system ffmpeg in production
if (process.env.NODE_ENV !== 'production') {
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  } catch (e) {
    console.log('Using system ffmpeg');
  }
} else {
  ffmpeg.setFfmpegPath('ffmpeg');
}

// Initialize OpenAI client with API key from environment
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscriptionSegment {
  id: number;
  start: number; // start time in seconds
  end: number; // end time in seconds
  text: string; // transcribed text
}

export interface TranscriptionResult {
  text: string; // full transcript
  segments?: TranscriptionSegment[]; // detailed segments with timestamps
  language?: string; // detected language
  duration: number; // audio duration in seconds
  wordCount: number; // number of words in transcript
  estimatedCost: number; // cost in USD
}

export interface WhisperOptions {
  model?: 'whisper-1'; // OpenAI Whisper model
  language?: string; // ISO-639-1 language code (e.g., 'en', 'es')
  prompt?: string; // optional context to guide transcription
  responseFormat?: 'json' | 'text' | 'srt' | 'vtt' | 'verbose_json';
  temperature?: number; // 0-1, randomness in sampling
}

/**
 * Extract audio from video file
 * @param videoPath - Absolute path to video file
 * @returns Promise resolving to path of extracted audio file
 */
export async function extractAudioFromVideo(videoPath: string): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'viralmommy-audio-'));
  const audioPath = path.join(tempDir, 'audio.mp3');

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-vn', // no video
          '-acodec libmp3lame', // mp3 codec
          '-ar 16000', // sample rate (16kHz is optimal for Whisper)
          '-ac 1', // mono audio
          '-b:a 64k', // bitrate (lower for speech is fine)
        ])
        .output(audioPath)
        .on('end', () => {
          console.log('Audio extraction completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error extracting audio:', err);
          reject(err);
        })
        .run();
    });

    return audioPath;
  } catch (error) {
    // Cleanup on error
    try {
      await fs.unlink(audioPath);
      await fs.rmdir(tempDir);
    } catch {}
    throw error;
  }
}

/**
 * Transcribe audio file using OpenAI Whisper API
 * @param audioPath - Path to audio file
 * @param options - Whisper transcription options
 * @returns Transcription result with text and metadata
 */
export async function transcribeAudio(
  audioPath: string,
  options: WhisperOptions = {}
): Promise<TranscriptionResult> {
  const startTime = Date.now();

  try {
    const {
      model = 'whisper-1',
      language,
      prompt,
      responseFormat = 'verbose_json',
      temperature = 0,
    } = options;

    // Get audio file stats for cost calculation
    const stats = await fs.stat(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    console.log(`Transcribing audio file (${fileSizeInMB.toFixed(2)}MB)...`);

    // Read audio file as a stream
    const audioFile = await fs.readFile(audioPath);
    const audioBlob = new File([audioFile], path.basename(audioPath), { type: 'audio/mpeg' });

    // Call Whisper API
    const transcription = await openaiClient.audio.transcriptions.create({
      file: audioBlob,
      model,
      language,
      prompt,
      response_format: responseFormat,
      temperature,
    });

    const processingTime = Date.now() - startTime;
    console.log(`Transcription completed in ${processingTime}ms`);

    // Parse response based on format
    let result: TranscriptionResult;

    if (responseFormat === 'verbose_json' && typeof transcription === 'object' && 'text' in transcription) {
      // Verbose JSON includes segments
      const segments: TranscriptionSegment[] = (transcription as any).segments?.map((seg: any, idx: number) => ({
        id: idx,
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
      })) || [];

      const duration = (transcription as any).duration || 0;
      const text = transcription.text;
      const wordCount = text.split(/\s+/).length;

      // Whisper pricing: $0.006 per minute
      const durationMinutes = duration / 60;
      const estimatedCost = durationMinutes * 0.006;

      result = {
        text,
        segments,
        language: (transcription as any).language,
        duration,
        wordCount,
        estimatedCost,
      };
    } else {
      // Simple text response
      const text = typeof transcription === 'string' ? transcription : transcription.text;
      const wordCount = text.split(/\s+/).length;

      // Estimate duration (rough: ~150 words per minute for speech)
      const estimatedDuration = (wordCount / 150) * 60;
      const estimatedCost = (estimatedDuration / 60) * 0.006;

      result = {
        text,
        duration: estimatedDuration,
        wordCount,
        estimatedCost,
      };
    }

    console.log(`Transcription cost: $${result.estimatedCost.toFixed(4)}`);
    console.log(`Word count: ${result.wordCount}`);

    return result;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Transcribe video (extract audio + transcribe in one call)
 * @param videoPath - Absolute path to video file
 * @param options - Whisper transcription options
 * @returns Transcription result
 */
export async function transcribeVideo(
  videoPath: string,
  options: WhisperOptions = {}
): Promise<TranscriptionResult> {
  let audioPath: string | null = null;

  try {
    // Extract audio from video
    console.log('Extracting audio from video...');
    audioPath = await extractAudioFromVideo(videoPath);

    // Transcribe audio
    console.log('Transcribing audio with Whisper...');
    const result = await transcribeAudio(audioPath, options);

    return result;
  } finally {
    // Cleanup: remove temporary audio file
    if (audioPath) {
      try {
        await fs.unlink(audioPath);
        await fs.rmdir(path.dirname(audioPath));
        console.log('Cleaned up temporary audio file');
      } catch (cleanupError) {
        console.warn('Failed to cleanup audio file:', cleanupError);
      }
    }
  }
}

/**
 * Format transcription as SRT subtitle file
 * @param segments - Transcription segments with timestamps
 * @returns SRT formatted string
 */
export function formatAsSRT(segments: TranscriptionSegment[]): string {
  let srt = '';

  segments.forEach((segment, index) => {
    const startTime = formatTimestamp(segment.start);
    const endTime = formatTimestamp(segment.end);

    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${segment.text}\n\n`;
  });

  return srt.trim();
}

/**
 * Format transcription as VTT subtitle file
 * @param segments - Transcription segments with timestamps
 * @returns VTT formatted string
 */
export function formatAsVTT(segments: TranscriptionSegment[]): string {
  let vtt = 'WEBVTT\n\n';

  segments.forEach((segment) => {
    const startTime = formatTimestamp(segment.start);
    const endTime = formatTimestamp(segment.end);

    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${segment.text}\n\n`;
  });

  return vtt.trim();
}

/**
 * Format seconds to SRT/VTT timestamp (HH:MM:SS,mmm)
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Extract key phrases and talking points from transcript
 * @param transcript - Full transcript text
 * @returns Array of key phrases
 */
export function extractKeyPhrases(transcript: string): string[] {
  // Simple extraction: sentences that might be key points
  const sentences = transcript.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

  // Return sentences that might be impactful (length between 5-20 words)
  return sentences.filter(sentence => {
    const wordCount = sentence.split(/\s+/).length;
    return wordCount >= 5 && wordCount <= 20;
  }).slice(0, 10); // Top 10 phrases
}

/**
 * Calculate speaking rate (words per minute)
 * @param transcription - Transcription result
 * @returns Speaking rate in WPM
 */
export function calculateSpeakingRate(transcription: TranscriptionResult): number {
  if (!transcription.duration || transcription.duration === 0) return 0;
  const durationMinutes = transcription.duration / 60;
  return Math.round(transcription.wordCount / durationMinutes);
}

/**
 * Test Whisper API connection
 */
export async function testWhisperConnection(): Promise<boolean> {
  try {
    // Create a tiny test audio file (silence)
    const tempDir = await fs.mkdtemp(path.join(tmpdir(), 'viralmommy-test-'));
    const testAudioPath = path.join(tempDir, 'test.mp3');

    // Generate 1 second of silence
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input('anullsrc=r=16000:cl=mono')
        .inputFormat('lavfi')
        .duration(1)
        .outputOptions(['-acodec libmp3lame', '-b:a 32k'])
        .output(testAudioPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    // Try to transcribe it
    const audioFile = await fs.readFile(testAudioPath);
    const audioBlob = new File([audioFile], 'test.mp3', { type: 'audio/mpeg' });

    await openaiClient.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
    });

    // Cleanup
    await fs.unlink(testAudioPath);
    await fs.rmdir(tempDir);

    console.log('Whisper API test successful');
    return true;
  } catch (error) {
    console.error('Whisper API test failed:', error);
    return false;
  }
}
