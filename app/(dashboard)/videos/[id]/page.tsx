'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Share2, Download, Sparkles, TrendingUp, Hash, Target, Clock, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, FullPageLoader } from '@/components/shared/LoadingSpinner'
import { useVideo, useDeleteVideo } from '@/hooks/useVideos'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import { cn } from '@/lib/utils'

export default function VideoDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string

  const { data: video, isLoading, error } = useVideo(videoId)
  const deleteVideo = useDeleteVideo()

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      try {
        await deleteVideo.mutateAsync(videoId)
        router.push('/videos')
      } catch (error) {
        console.error('Failed to delete video:', error)
        alert('Failed to delete video. Please try again.')
      }
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/videos/${videoId}`
    navigator.clipboard.writeText(shareUrl)
    alert('Video link copied to clipboard!')
  }

  const handleDownload = () => {
    if (video?.storageUrl) {
      window.open(video.storageUrl, '_blank')
    }
  }

  if (isLoading) {
    return <FullPageLoader />
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-600 mb-4">Failed to load video details.</p>
        <Button onClick={() => router.push('/videos')}>Back to Videos</Button>
      </div>
    )
  }

  const aiStrategy = video.aiStrategies?.[0]
  const hasAiAnalysis = !!aiStrategy
  const viralScore = aiStrategy?.viralScore || 0

  // Prepare data for viral score chart
  const chartData = [
    {
      name: 'Viral Score',
      value: viralScore * 100,
      fill: viralScore > 0.7 ? '#22c55e' : viralScore > 0.4 ? '#f59e0b' : '#ef4444',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/videos')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Videos
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{video.originalName}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
              </div>
              {video.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{Math.floor(video.duration / 60)}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
              <Badge variant={video.status.toLowerCase() as any}>
                {video.status}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            {video.status === 'READY' && (
              <>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {video.storageUrl ? (
                  <video
                    src={video.storageUrl}
                    controls
                    className="w-full h-full"
                    poster={video.thumbnailUrl || undefined}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <p>Video not available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Strategies */}
          {hasAiAnalysis && (
            <>
              {/* Viral Hooks */}
              {aiStrategy.hooks && aiStrategy.hooks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Viral Hooks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiStrategy.hooks.map((hook: string, index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
                      >
                        <p className="text-sm font-medium text-gray-900">{hook}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Captions */}
              {aiStrategy.captions && aiStrategy.captions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-pink-600" />
                      Suggested Captions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiStrategy.captions.map((caption: string, index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-pink-50 border border-pink-200 rounded-lg"
                      >
                        <p className="text-sm text-gray-900">{caption}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Hashtags */}
              {aiStrategy.hashtags && aiStrategy.hashtags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-blue-600" />
                      Hashtag Sets
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiStrategy.hashtags.map((hashtagSet: string[], index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
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
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Transcription */}
          {video.transcription && (
            <Card>
              <CardHeader>
                <CardTitle>Transcription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{video.transcription}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Viral Score */}
          {hasAiAnalysis && aiStrategy.viralScore !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Viral Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      barSize={20}
                      data={chartData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-4">
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {Math.round(viralScore * 100)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {viralScore > 0.7
                        ? 'High viral potential!'
                        : viralScore > 0.4
                        ? 'Good potential'
                        : 'Needs improvement'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Audience */}
          {hasAiAnalysis && aiStrategy.targetAudience && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{aiStrategy.targetAudience}</p>
              </CardContent>
            </Card>
          )}

          {/* Content Pillars */}
          {hasAiAnalysis && aiStrategy.contentPillars && aiStrategy.contentPillars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Content Themes</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}

          {/* Video Info */}
          <Card>
            <CardHeader>
              <CardTitle>Video Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">File Size</p>
                <p className="text-sm font-medium">
                  {(video.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Format</p>
                <p className="text-sm font-medium">{video.mimeType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="text-sm font-medium">
                  {video.duration
                    ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Uploaded</p>
                <p className="text-sm font-medium">
                  {new Date(video.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          {!hasAiAnalysis && (video.status === 'PROCESSING' || video.status === 'UPLOADING') && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-sm text-gray-600">
                    {video.status === 'UPLOADING' ? 'Uploading video...' : 'Processing video and generating AI strategies...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {video.status === 'FAILED' && video.errorMessage && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Processing Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">{video.errorMessage}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
