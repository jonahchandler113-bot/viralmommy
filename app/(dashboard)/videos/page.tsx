'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Video, Upload, Filter, SortAsc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { VideoCard } from '@/components/videos/VideoCard'
import { VideoPlayerModal } from '@/components/videos/VideoPlayerModal'
import { useVideos, useDeleteVideo, type Video as VideoType } from '@/hooks/useVideos'
import { cn } from '@/lib/utils'

type StatusFilter = 'ALL' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'PUBLISHED'
type SortBy = 'createdAt' | 'originalName' | 'duration'
type SortOrder = 'asc' | 'desc'

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All Videos', value: 'ALL' },
  { label: 'Ready', value: 'READY' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Published', value: 'PUBLISHED' },
]

const sortOptions: { label: string; value: SortBy }[] = [
  { label: 'Upload Date', value: 'createdAt' },
  { label: 'Name', value: 'originalName' },
  { label: 'Duration', value: 'duration' },
]

export default function VideosPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null)
  const [playerOpen, setPlayerOpen] = useState(false)

  const { data, isLoading, error } = useVideos({
    page,
    pageSize: 12,
    status: statusFilter,
    sortBy,
    sortOrder,
  })

  const deleteVideo = useDeleteVideo()

  const handlePlayVideo = (video: VideoType) => {
    setSelectedVideo(video)
    setPlayerOpen(true)
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo.mutateAsync(videoId)
      } catch (error) {
        console.error('Failed to delete video:', error)
      }
    }
  }

  const handleDownload = (video: VideoType) => {
    if (video.storageUrl) {
      window.open(video.storageUrl, '_blank')
    }
  }

  const handleShare = (video: VideoType) => {
    // Mock share functionality
    const shareUrl = `${window.location.origin}/videos/${video.id}`
    navigator.clipboard.writeText(shareUrl)
    alert('Video link copied to clipboard!')
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Videos</h1>
          <p className="text-gray-600 mt-1">
            Manage your uploaded videos and AI-generated strategies
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/upload">
            <Upload className="h-5 w-5 mr-2" />
            Upload Video
          </Link>
        </Button>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setStatusFilter(filter.value)
                setPage(1)
              }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === filter.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 sm:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Sort by: {sortOptions.find((opt) => opt.value === sortBy)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value)
                    setPage(1)
                  }}
                  className={cn(sortBy === option.value && 'bg-purple-50')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            <SortAsc
              className={cn('h-4 w-4 transition-transform', sortOrder === 'desc' && 'rotate-180')}
            />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Loading videos..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-20">
          <p className="text-red-600">Failed to load videos. Please try again.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.videos.length === 0 && (
        <EmptyState
          icon={Video}
          title="No videos yet"
          description="Upload your first video to get started with AI-powered viral strategies!"
          action={{
            label: 'Upload Video',
            onClick: () => (window.location.href = '/upload'),
          }}
        />
      )}

      {/* Video Grid */}
      {!isLoading && !error && data && data.videos.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onPlay={handlePlayVideo}
                onDelete={handleDeleteVideo}
                onDownload={handleDownload}
                onShare={handleShare}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}

          {/* Results Count */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Showing {data.videos.length} of {data.total} videos
          </p>
        </>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal video={selectedVideo} open={playerOpen} onClose={() => setPlayerOpen(false)} />
    </div>
  )
}
