'use client'

import { CheckCircle2, XCircle, X, Loader2, FileVideo, Sparkles } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type UploadStatus = 'uploading' | 'processing' | 'success' | 'error'

interface UploadProgressProps {
  fileName: string
  fileSize: number
  progress: number
  status: UploadStatus
  error?: string | null
  onCancel?: () => void
  onRetry?: () => void
  onClose?: () => void
}

export function UploadProgress({
  fileName,
  fileSize,
  progress,
  status,
  error,
  onCancel,
  onRetry,
  onClose
}: UploadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return {
          icon: Loader2,
          iconClassName: 'text-purple-600 animate-spin',
          bgClassName: 'bg-purple-50 border-purple-200',
          title: 'Uploading...',
          description: `${progress}% complete`,
        }
      case 'processing':
        return {
          icon: Sparkles,
          iconClassName: 'text-pink-600 animate-pulse',
          bgClassName: 'bg-pink-50 border-pink-200',
          title: 'Processing...',
          description: 'Preparing your video for viral success',
        }
      case 'success':
        return {
          icon: CheckCircle2,
          iconClassName: 'text-success-600',
          bgClassName: 'bg-success-50 border-success-200',
          title: 'Upload Complete!',
          description: 'Your video is ready',
        }
      case 'error':
        return {
          icon: XCircle,
          iconClassName: 'text-error-600',
          bgClassName: 'bg-error-50 border-error-200',
          title: 'Upload Failed',
          description: error || 'Something went wrong',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={cn(
      'rounded-xl border-2 p-4 transition-all duration-300',
      config.bgClassName
    )}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <Icon className={cn('h-6 w-6', config.iconClassName)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {fileName}
              </p>
              <p className="text-sm text-gray-600">
                {formatFileSize(fileSize)}
              </p>
            </div>

            {(status === 'success' || status === 'error') && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">
                {config.title}
              </span>
              {(status === 'uploading' || status === 'processing') && (
                <span className="text-gray-600">
                  {status === 'uploading' ? `${progress}%` : '...'}
                </span>
              )}
            </div>

            {(status === 'uploading' || status === 'processing') && (
              <Progress
                value={status === 'uploading' ? progress : 100}
                className={cn(
                  status === 'processing' && 'animate-pulse'
                )}
              />
            )}

            <p className="text-sm text-gray-600">
              {config.description}
            </p>
          </div>

          {status === 'uploading' && onCancel && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-gray-700 hover:bg-white"
              >
                Cancel Upload
              </Button>
            </div>
          )}

          {status === 'error' && onRetry && (
            <div className="mt-3">
              <Button
                variant="default"
                size="sm"
                onClick={onRetry}
              >
                Try Again
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-success-200">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-600" />
                Ready for AI-powered viral strategies!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
