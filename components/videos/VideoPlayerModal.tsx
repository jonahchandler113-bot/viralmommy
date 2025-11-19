'use client'

import { useEffect } from 'react'
import { X, Sparkles, TrendingUp, Hash, Target, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Video } from '@/hooks/useVideos'
import { useVideoStream } from '@/hooks/useVideoStream'

interface VideoPlayerModalProps {
  video: Video | null
  open: boolean
  onClose: () => void
}

export function VideoPlayerModal({ video, open, onClose }: VideoPlayerModalProps) {
  // Get signed URLs for R2 videos
  const { videoUrl, thumbnailUrl, isLoading, error } = useVideoStream(
    video?.id || null,
    video?.storageUrl || undefined
  )

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!video) return null

  const aiStrategy = video.aiStrategies?.[0]
  const hasAiAnalysis = !!aiStrategy

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <p className="ml-3 text-white">Loading video...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-400 mb-2">Failed to load video</p>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
            </div>
          ) : videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full"
              poster={thumbnailUrl || video.thumbnailUrl || undefined}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>Video not available</p>
            </div>
          )}
        </div>

        {/* Video Info and AI Analysis */}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">{video.originalName}</DialogTitle>
          </DialogHeader>

          {/* Viral Score */}
          {hasAiAnalysis && aiStrategy.viralScore !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Viral Potential Score</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {Math.round(aiStrategy.viralScore * 100)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
                  style={{ width: `${aiStrategy.viralScore * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* AI Strategies */}
          {hasAiAnalysis && (
            <div className="mt-6 space-y-6">
              {/* Hooks */}
              {aiStrategy.hooks && aiStrategy.hooks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">Viral Hooks</h3>
                  </div>
                  <div className="space-y-2">
                    {aiStrategy.hooks.map((hook: string, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-purple-50 border border-purple-200 rounded-lg"
                      >
                        <p className="text-sm">{hook}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Captions */}
              {aiStrategy.captions && aiStrategy.captions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-pink-600" />
                    <h3 className="font-semibold">Suggested Captions</h3>
                  </div>
                  <div className="space-y-2">
                    {aiStrategy.captions.map((caption: string, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-pink-50 border border-pink-200 rounded-lg"
                      >
                        <p className="text-sm">{caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {aiStrategy.hashtags && aiStrategy.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Hashtag Sets</h3>
                  </div>
                  <div className="space-y-2">
                    {aiStrategy.hashtags.map((hashtagSet: string[], index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex flex-wrap gap-2">
                          {hashtagSet.map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience */}
              {aiStrategy.targetAudience && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Target Audience</h3>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm">{aiStrategy.targetAudience}</p>
                  </div>
                </div>
              )}

              {/* Content Pillars */}
              {aiStrategy.contentPillars && aiStrategy.contentPillars.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">Content Themes</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiStrategy.contentPillars.map((pillar: string, index: number) => (
                      <Badge
                        key={index}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      >
                        {pillar}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No AI Analysis */}
          {!hasAiAnalysis && (
            <div className="mt-6 text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                AI analysis not available yet. It will appear once processing is complete.
              </p>
            </div>
          )}

          {/* Transcription */}
          {video.transcription && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Transcription</h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{video.transcription}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
