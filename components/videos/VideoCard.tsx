'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MoreVertical, Play, Download, Share2, Trash2, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
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

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
          </div>
          <span>{formatFileSize(video.size)}</span>
        </div>

        {/* AI Viral Score */}
        {video.aiStrategies && video.aiStrategies.length > 0 && video.aiStrategies[0].viralScore && (
          <div className="mt-3 pt-3 border-t">
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
