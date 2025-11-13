import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Video {
  id: string
  userId: string
  filename: string
  originalName: string
  storageKey: string
  storageUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  size: number
  mimeType: string
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'PUBLISHED'
  errorMessage: string | null
  aiAnalysis: any | null
  transcription: string | null
  metadata: any | null
  createdAt: string
  updatedAt: string
  aiStrategies?: AiStrategy[]
}

export interface AiStrategy {
  id: string
  videoId: string
  hooks: string[]
  captions: string[]
  hashtags: string[][]
  bestPostingTimes: any
  targetAudience: string | null
  contentPillars: string[] | null
  viralScore: number | null
  createdAt: string
  updatedAt: string
}

interface VideosResponse {
  videos: Video[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface UseVideosOptions {
  page?: number
  pageSize?: number
  status?: Video['status'] | 'ALL'
  sortBy?: 'createdAt' | 'originalName' | 'duration'
  sortOrder?: 'asc' | 'desc'
}

export function useVideos(options: UseVideosOptions = {}) {
  const {
    page = 1,
    pageSize = 12,
    status = 'ALL',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options

  return useQuery<VideosResponse>({
    queryKey: ['videos', { page, pageSize, status, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
      })

      if (status !== 'ALL') {
        params.append('status', status)
      }

      const response = await fetch(`/api/videos?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      return response.json()
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useVideo(videoId: string | null) {
  return useQuery<Video>({
    queryKey: ['video', videoId],
    queryFn: async () => {
      if (!videoId) throw new Error('Video ID is required')
      const response = await fetch(`/api/videos/${videoId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch video')
      }
      return response.json()
    },
    enabled: !!videoId,
  })
}

export function useDeleteVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete video')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch videos
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    },
  })
}

export function useUpdateVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ videoId, data }: { videoId: string; data: Partial<Video> }) => {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to update video')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate specific video and videos list
      queryClient.invalidateQueries({ queryKey: ['video', variables.videoId] })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    },
  })
}
