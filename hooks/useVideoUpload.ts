import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

interface UploadProgress {
  progress: number
  status: UploadStatus
  error: string | null
}

interface UploadedVideo {
  id: string
  filename: string
  storageKey: string
  size: number
  mimeType: string
  status: string
  uploadedAt: string
}

interface UseVideoUploadOptions {
  onSuccess?: (video: UploadedVideo) => void
  onError?: (error: Error) => void
  onProgress?: (progress: number) => void
}

export function useVideoUpload(options: UseVideoUploadOptions = {}) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
    error: null,
  })

  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Reset progress
      setUploadProgress({
        progress: 0,
        status: 'uploading',
        error: null,
      })

      const formData = new FormData()
      formData.append('video', file)

      // Create XMLHttpRequest for upload progress tracking
      return new Promise<UploadedVideo>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress({
              progress,
              status: 'uploading',
              error: null,
            })
            options.onProgress?.(progress)
          }
        })

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)

              // Set processing status
              setUploadProgress({
                progress: 100,
                status: 'processing',
                error: null,
              })

              // Simulate processing delay (in real app, this would be server-driven)
              setTimeout(() => {
                setUploadProgress({
                  progress: 100,
                  status: 'success',
                  error: null,
                })
                resolve(response.video)
              }, 1500)
            } catch (error) {
              reject(new Error('Invalid response from server'))
            }
          } else {
            try {
              const response = JSON.parse(xhr.responseText)
              reject(new Error(response.error || 'Upload failed'))
            } catch {
              reject(new Error('Upload failed'))
            }
          }
        })

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred during upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'))
        })

        // Send request
        xhr.open('POST', '/api/videos/upload')
        xhr.send(formData)

        // Store xhr for potential cancellation
        ;(uploadMutation as any)._xhr = xhr
      })
    },
    onSuccess: (video) => {
      // Invalidate videos query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      options.onSuccess?.(video)
    },
    onError: (error: Error) => {
      setUploadProgress({
        progress: 0,
        status: 'error',
        error: error.message,
      })
      options.onError?.(error)
    },
  })

  const upload = useCallback((file: File) => {
    return uploadMutation.mutate(file)
  }, [uploadMutation])

  const cancel = useCallback(() => {
    const xhr = (uploadMutation as any)._xhr
    if (xhr) {
      xhr.abort()
    }
    setUploadProgress({
      progress: 0,
      status: 'idle',
      error: null,
    })
  }, [uploadMutation])

  const reset = useCallback(() => {
    setUploadProgress({
      progress: 0,
      status: 'idle',
      error: null,
    })
    uploadMutation.reset()
  }, [uploadMutation])

  return {
    upload,
    cancel,
    reset,
    progress: uploadProgress.progress,
    status: uploadProgress.status,
    error: uploadProgress.error,
    isUploading: uploadProgress.status === 'uploading',
    isProcessing: uploadProgress.status === 'processing',
    isSuccess: uploadProgress.status === 'success',
    isError: uploadProgress.status === 'error',
    isIdle: uploadProgress.status === 'idle',
  }
}
