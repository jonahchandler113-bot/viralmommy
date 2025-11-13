'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Clock, CheckCircle, Video, TrendingUp } from 'lucide-react'
import { VideoUploadZone } from '@/components/upload/VideoUploadZone'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { useVideoUpload } from '@/hooks/useVideoUpload'
import { useVideos } from '@/hooks/useVideos'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from '@/lib/format-date'

interface UploadItem {
  id: string
  fileName: string
  fileSize: number
  progress: number
  status: 'uploading' | 'processing' | 'success' | 'error'
  error?: string
}

export default function UploadPage() {
  const [currentUpload, setCurrentUpload] = useState<UploadItem | null>(null)
  const [completedUploads, setCompletedUploads] = useState<UploadItem[]>([])
  const { showToast } = useToast()

  const { data: videosData, isLoading: isLoadingVideos } = useVideos({
    page: 1,
    pageSize: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const {
    upload,
    cancel,
    reset,
    progress,
    status,
    error,
    isUploading,
    isProcessing,
    isSuccess,
    isError,
  } = useVideoUpload({
    onSuccess: (video) => {
      showToast({
        title: 'Upload Complete!',
        description: `${video.filename} is ready for viral strategies`,
        variant: 'success',
      })

      // Move to completed uploads
      if (currentUpload) {
        setCompletedUploads(prev => [{
          ...currentUpload,
          status: 'success',
          progress: 100,
        }, ...prev.slice(0, 4)]) // Keep only last 5
      }

      // Reset after a delay
      setTimeout(() => {
        setCurrentUpload(null)
        reset()
      }, 3000)
    },
    onError: (error) => {
      showToast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'error',
      })
    },
  })

  const handleFileSelect = (file: File) => {
    const uploadItem: UploadItem = {
      id: Math.random().toString(36).substring(7),
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'uploading',
    }

    setCurrentUpload(uploadItem)
    upload(file)
  }

  // Update current upload progress
  useEffect(() => {
    if (currentUpload && (isUploading || isProcessing)) {
      setCurrentUpload(prev => prev ? {
        ...prev,
        progress,
        status: status as any,
      } : null)
    }
  }, [progress, status, isUploading, isProcessing, currentUpload])

  const handleCancel = () => {
    cancel()
    setCurrentUpload(null)
    showToast({
      title: 'Upload Cancelled',
      description: 'Your video upload was cancelled',
      variant: 'info',
    })
  }

  const handleRetry = () => {
    if (currentUpload) {
      // Note: In a real app, you'd need to store the original File object
      showToast({
        title: 'Please select the file again',
        description: 'Click the upload zone to select your video',
        variant: 'info',
      })
      setCurrentUpload(null)
      reset()
    }
  }

  const handleClose = () => {
    setCurrentUpload(null)
    reset()
  }

  const getStatusBadge = (videoStatus: string) => {
    const config = {
      UPLOADING: { label: 'Uploading', className: 'bg-purple-100 text-purple-700' },
      PROCESSING: { label: 'Processing', className: 'bg-pink-100 text-pink-700' },
      READY: { label: 'Ready', className: 'bg-success-100 text-success-700' },
      FAILED: { label: 'Failed', className: 'bg-error-100 text-error-700' },
      PUBLISHED: { label: 'Published', className: 'bg-blue-100 text-blue-700' },
    }
    return config[videoStatus as keyof typeof config] || config.UPLOADING
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Upload Your Video
        </h1>
        <p className="text-gray-600">
          Upload your video and let AI create viral strategies to boost your reach
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <VideoUploadZone
          onFileSelect={handleFileSelect}
          isUploading={isUploading || isProcessing}
          error={error}
        />

        {currentUpload && (
          <UploadProgress
            fileName={currentUpload.fileName}
            fileSize={currentUpload.fileSize}
            progress={currentUpload.progress}
            status={currentUpload.status}
            error={error}
            onCancel={isUploading ? handleCancel : undefined}
            onRetry={isError ? handleRetry : undefined}
            onClose={isSuccess || isError ? handleClose : undefined}
          />
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">AI Analysis</p>
                <p className="text-xs text-gray-600">Automatic optimization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                <TrendingUp className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Viral Strategies</p>
                <p className="text-xs text-gray-600">Boost your reach</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Easy Process</p>
                <p className="text-xs text-gray-600">Upload and go viral</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Recent Uploads
          </CardTitle>
          <CardDescription>
            Your recently uploaded videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVideos ? (
            <div className="text-center py-8 text-gray-500">
              Loading videos...
            </div>
          ) : videosData?.videos && videosData.videos.length > 0 ? (
            <div className="space-y-3">
              {videosData.videos.map((video) => {
                const statusConfig = getStatusBadge(video.status)
                return (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {video.originalName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(video.size / (1024 * 1024)).toFixed(2)} MB
                        {video.duration && ` • ${Math.round(video.duration)}s`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(video.createdAt))} ago
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No videos uploaded yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload your first video to get started!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
