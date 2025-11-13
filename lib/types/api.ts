/**
 * API Response Types
 * TypeScript definitions for API request and response payloads
 */

import { VideoStatus } from '@prisma/client';

// Video Upload Response
export interface VideoUploadResponse {
  success: boolean;
  video: {
    id: string;
    filename: string;
    storageKey: string;
    thumbnailUrl?: string;
    duration?: number;
    size: number;
    status: VideoStatus;
    createdAt: Date;
  };
  job?: {
    id: string;
    state: string;
  };
  message: string;
}

// Video List Response
export interface VideoListResponse {
  success: boolean;
  videos: VideoListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface VideoListItem {
  id: string;
  originalName: string;
  filename: string;
  storageKey: string;
  storageUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  size: number;
  mimeType: string;
  status: VideoStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  aiAnalysis?: any;
  metadata?: any;
}

// Video Detail Response
export interface VideoDetailResponse {
  success: boolean;
  video: VideoDetail;
}

export interface VideoDetail extends VideoListItem {
  userId: string;
  transcription?: string;
  aiStrategies?: AIStrategy[];
  publishedPosts?: PublishedPost[];
}

export interface AIStrategy {
  id: string;
  videoId: string;
  hooks: any[];
  captions: any[];
  hashtags: any[];
  bestPostingTimes: any;
  targetAudience?: string;
  contentPillars?: any[];
  viralScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishedPost {
  id: string;
  platform: string;
  status: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  publishedAt?: Date;
}

// Video Update Request
export interface VideoUpdateRequest {
  status?: VideoStatus;
  aiAnalysis?: any;
  transcription?: string;
  metadata?: any;
  errorMessage?: string;
}

// Video Update Response
export interface VideoUpdateResponse {
  success: boolean;
  video: VideoListItem;
  message: string;
}

// Video Delete Response
export interface VideoDeleteResponse {
  success: boolean;
  message: string;
}

// Error Response
export interface ErrorResponse {
  error: string;
  details?: string;
}

// Query Parameters for Video List
export interface VideoListQueryParams {
  page?: number;
  limit?: number;
  status?: VideoStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'duration' | 'size';
  sortOrder?: 'asc' | 'desc';
}
