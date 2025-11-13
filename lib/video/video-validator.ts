/**
 * Video Validation Utilities
 * Validates video files before upload and processing
 */

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
}

export interface VideoConstraints {
  maxSizeBytes: number;
  maxDurationSeconds: number;
  minDurationSeconds: number;
  allowedFormats: string[];
  maxResolution: { width: number; height: number };
}

// Default constraints for free tier
export const FREE_TIER_CONSTRAINTS: VideoConstraints = {
  maxSizeBytes: 100 * 1024 * 1024, // 100MB
  maxDurationSeconds: 180, // 3 minutes
  minDurationSeconds: 5, // 5 seconds
  allowedFormats: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  maxResolution: { width: 1920, height: 1080 },
};

// Pro tier constraints
export const PRO_TIER_CONSTRAINTS: VideoConstraints = {
  maxSizeBytes: 500 * 1024 * 1024, // 500MB
  maxDurationSeconds: 600, // 10 minutes
  minDurationSeconds: 1, // 1 second
  allowedFormats: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska',
  ],
  maxResolution: { width: 3840, height: 2160 }, // 4K
};

/**
 * Validate video file before upload
 */
export function validateVideoFile(
  file: File,
  constraints: VideoConstraints = FREE_TIER_CONSTRAINTS
): VideoValidationResult {
  const errors: string[] = [];

  // Check file size
  if (file.size > constraints.maxSizeBytes) {
    const maxSizeMB = Math.round(constraints.maxSizeBytes / (1024 * 1024));
    errors.push(`File too large. Maximum: ${maxSizeMB}MB`);
  }

  // Check file type
  if (!constraints.allowedFormats.includes(file.type)) {
    errors.push(`Invalid format. Allowed: ${constraints.allowedFormats.join(', ')}`);
  }

  // Check file name
  if (!file.name || file.name.length === 0) {
    errors.push('Invalid file name');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get video file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'video/x-matroska': 'mkv',
  };

  return map[mimeType] || 'mp4';
}
