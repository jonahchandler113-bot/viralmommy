'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MoreVertical, Play, Download, Share2, Trash2, Clock, CheckCircle2, XCircle, Loader2, Eye, Heart, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Video } from '@/hooks/useVideos'

// Platform icon components
const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.46 6c-.85.38-1.78.64-2.75.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.54-2.12-9.91-5.04-.42.72-.66 1.55-.66 2.44 0 1.67.85 3.14 2.14 4-.79-.03-1.53-.24-2.18-.6v.06c0 2.33 1.66 4.28 3.86 4.72-.4.11-.83.17-1.27.17-.31 0-.62-.03-.92-.08.62 1.94 2.42 3.35 4.55 3.39-1.67 1.31-3.77 2.09-6.05 2.09-.39 0-.78-.02-1.17-.07 2.18 1.4 4.77 2.21 7.56 2.21 9.05 0 14-7.5 14-14 0-.21 0-.42-.02-.63.96-.69 1.8-1.56 2.46-2.55z"/>
  </svg>
)

const platformIcons: Record<string, { icon: React.FC; color: string; bg: string }> = {
  TIKTOK: { icon: TikTokIcon, color: 'text-black', bg: 'bg-gray-100' },
  INSTAGRAM: { icon: InstagramIcon, color: 'text-pink-600', bg: 'bg-pink-50' },
  YOUTUBE: { icon: YouTubeIcon, color: 'text-red-600', bg: 'bg-red-50' },
  FACEBOOK: { icon: FacebookIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  TWITTER: { icon: TwitterIcon, color: 'text-sky-500', bg: 'bg-sky-50' },
}

interface VideoCardProps {
  video: Video
  onPlay: (video: Video) => void
  onDelete: (videoId: string) => void
  onDownload?: (video: Video) => void
  onShare?: (video: Video) => void
}

const statusConfig = {
  UPLOADING: {
    label: 'Uploading',
    variant: 'uploading' as const,
    icon: Loader2,
    animate: true,
  },
  PROCESSING: {
    label: 'Processing',
    variant: 'processing' as const,
    icon: Loader2,
    animate: true,
  },
  READY: {
    label: 'Ready',
    variant: 'ready' as const,
    icon: CheckCircle2,
    animate: false,
  },
  FAILED: {
    label: 'Failed',
    variant: 'failed' as const,
    icon: XCircle,
    animate: false,
  },
  PUBLISHED: {
    label: 'Published',
    variant: 'ready' as const,
    icon: CheckCircle2,
    animate: false,
  },
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'N/A'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export function VideoCard({ video, onPlay, onDelete, onDownload, onShare }: VideoCardProps) {
  const [imageError, setImageError] = useState(false)
  const status = statusConfig[video.status]
  const StatusIcon = status.icon

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-gray-100 overflow-hidden"
        onClick={() => video.status === 'READY' && onPlay(video)}
      >
        {video.thumbnailUrl && !imageError ? (
          <img
            src={video.thumbnailUrl}
            alt={video.originalName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <Play className="h-16 w-16 text-purple-400" />
          </div>
        )}

        {/* Overlay on hover */}
        {video.status === 'READY' && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-8 w-8 text-purple-600 ml-1" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className={cn('h-3 w-3', status.animate && 'animate-spin')} />
            {status.label}
          </Badge>
        </div>

        {/* Actions menu */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {video.status === 'READY' && (
                <>
                  <DropdownMenuItem onClick={() => onPlay(video)}>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </DropdownMenuItem>
                  {onDownload && (
                    <DropdownMenuItem onClick={() => onDownload(video)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem onClick={() => onShare(video)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(video.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sm truncate mb-2" title={video.originalName}>
          {video.originalName}
        </h3>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
          </div>
          <span>{formatFileSize(video.size)}</span>
        </div>

        {/* Published Platforms */}
        {video.publishedPosts && video.publishedPosts.length > 0 && (
          <div className="mb-3 pb-3 border-b">
            <p className="text-xs text-gray-500 mb-2">Published on:</p>
            <div className="flex gap-2 flex-wrap">
              {video.publishedPosts.map((post) => {
                const platformConfig = platformIcons[post.platform]
                const PlatformIcon = platformConfig?.icon
                return PlatformIcon ? (
                  <div
                    key={post.id}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                      platformConfig.bg,
                      platformConfig.color
                    )}
                    title={post.platform}
                  >
                    <PlatformIcon />
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Analytics Summary */}
        {video.analytics && video.analytics.totalViews > 0 && (
          <div className="mb-3 pb-3 border-b">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <Eye className="h-3 w-3 mx-auto mb-1 text-gray-400" />
                <p className="font-semibold text-gray-900">{formatNumber(video.analytics.totalViews)}</p>
                <p className="text-gray-500">Views</p>
              </div>
              <div className="text-center">
                <Heart className="h-3 w-3 mx-auto mb-1 text-gray-400" />
                <p className="font-semibold text-gray-900">{formatNumber(video.analytics.totalLikes)}</p>
                <p className="text-gray-500">Likes</p>
              </div>
              <div className="text-center">
                <MessageCircle className="h-3 w-3 mx-auto mb-1 text-gray-400" />
                <p className="font-semibold text-gray-900">{formatNumber(video.analytics.totalComments)}</p>
                <p className="text-gray-500">Comments</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Viral Score */}
        {video.aiStrategies && video.aiStrategies.length > 0 && video.aiStrategies[0].viralScore && (
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Viral Score</span>
              <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {Math.round(video.aiStrategies[0].viralScore * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-300"
                style={{ width: `${video.aiStrategies[0].viralScore * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {video.status === 'FAILED' && video.errorMessage && (
          <p className="mt-2 text-xs text-red-600 line-clamp-2">{video.errorMessage}</p>
        )}
      </div>
    </Card>
  )
}
