/**
 * Queue System Type Definitions
 * Shared types for the video processing queue
 */

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

export interface AllQueueStats {
  video: QueueStats;
  ai: QueueStats;
  strategy: QueueStats;
}

export interface JobStatusResponse {
  exists: boolean;
  id?: string;
  state?: string;
  progress?: number | object;
  data?: any;
  failedReason?: string;
  returnvalue?: any;
  attemptsMade?: number;
  timestamp?: number;
  processedOn?: number;
  finishedOn?: number;
}

export interface VideoJobsStatus {
  videoId: string;
  jobs: {
    processing: JobStatusResponse | null;
    analysis: JobStatusResponse | null;
    strategy: JobStatusResponse | null;
  };
}

export enum VideoProcessingStage {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  ANALYZING = 'ANALYZING',
  GENERATING_STRATEGY = 'GENERATING_STRATEGY',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface ProcessingProgress {
  stage: VideoProcessingStage;
  percentage: number;
  message: string;
  error?: string;
}

/**
 * Get human-readable stage description
 */
export function getStageDescription(stage: VideoProcessingStage): string {
  const descriptions: Record<VideoProcessingStage, string> = {
    [VideoProcessingStage.UPLOADING]: 'Uploading video...',
    [VideoProcessingStage.PROCESSING]: 'Extracting frames and metadata...',
    [VideoProcessingStage.ANALYZING]: 'Analyzing with AI...',
    [VideoProcessingStage.GENERATING_STRATEGY]: 'Generating viral strategy...',
    [VideoProcessingStage.READY]: 'Ready for publishing!',
    [VideoProcessingStage.FAILED]: 'Processing failed',
  };

  return descriptions[stage];
}

/**
 * Calculate overall processing progress
 */
export function calculateProgress(jobs: VideoJobsStatus['jobs']): ProcessingProgress {
  // Check for failures
  if (jobs.processing?.state === 'failed') {
    return {
      stage: VideoProcessingStage.FAILED,
      percentage: 0,
      message: 'Video processing failed',
      error: jobs.processing.failedReason,
    };
  }

  if (jobs.analysis?.state === 'failed') {
    return {
      stage: VideoProcessingStage.FAILED,
      percentage: 0,
      message: 'AI analysis failed',
      error: jobs.analysis.failedReason,
    };
  }

  if (jobs.strategy?.state === 'failed') {
    return {
      stage: VideoProcessingStage.FAILED,
      percentage: 0,
      message: 'Strategy generation failed',
      error: jobs.strategy.failedReason,
    };
  }

  // Determine current stage
  if (!jobs.processing || jobs.processing.state === 'waiting' || jobs.processing.state === 'active') {
    const progress = typeof jobs.processing?.progress === 'number' ? jobs.processing.progress : 0;
    return {
      stage: VideoProcessingStage.PROCESSING,
      percentage: Math.floor(progress * 0.33), // Processing is 33% of total
      message: getStageDescription(VideoProcessingStage.PROCESSING),
    };
  }

  if (jobs.processing.state === 'completed' && (!jobs.analysis || jobs.analysis.state === 'waiting' || jobs.analysis.state === 'active')) {
    const progress = typeof jobs.analysis?.progress === 'number' ? jobs.analysis.progress : 0;
    return {
      stage: VideoProcessingStage.ANALYZING,
      percentage: 33 + Math.floor(progress * 0.33), // Analysis is 33-66%
      message: getStageDescription(VideoProcessingStage.ANALYZING),
    };
  }

  if (jobs.analysis?.state === 'completed' && (!jobs.strategy || jobs.strategy.state === 'waiting' || jobs.strategy.state === 'active')) {
    const progress = typeof jobs.strategy?.progress === 'number' ? jobs.strategy.progress : 0;
    return {
      stage: VideoProcessingStage.GENERATING_STRATEGY,
      percentage: 66 + Math.floor(progress * 0.34), // Strategy is 66-100%
      message: getStageDescription(VideoProcessingStage.GENERATING_STRATEGY),
    };
  }

  if (jobs.strategy?.state === 'completed') {
    return {
      stage: VideoProcessingStage.READY,
      percentage: 100,
      message: getStageDescription(VideoProcessingStage.READY),
    };
  }

  // Default: still uploading
  return {
    stage: VideoProcessingStage.UPLOADING,
    percentage: 0,
    message: getStageDescription(VideoProcessingStage.UPLOADING),
  };
}
