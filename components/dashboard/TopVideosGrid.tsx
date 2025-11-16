import { Card, CardContent } from '@/components/ui/card'
import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react'
import Image from 'next/image'

interface TopVideo {
  id: string
  title: string
  thumbnail: string
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook'
}

interface TopVideosGridProps {
  videos: TopVideo[]
}

const platformColors = {
  tiktok: 'bg-black text-white',
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
  youtube: 'bg-red-600 text-white',
  facebook: 'bg-blue-600 text-white',
}

const platformLabels = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
}

export function TopVideosGrid({ videos }: TopVideosGridProps) {
  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No videos yet. Upload your first video to see it here!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <Card
          key={video.id}
          className="group hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
        >
          {/* Thumbnail */}
          <div className="relative aspect-[9/16] bg-gray-100 overflow-hidden">
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />

            {/* Platform Badge */}
            <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${platformColors[video.platform]}`}>
              {platformLabels[video.platform]}
            </div>

            {/* Engagement Rate Badge */}
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-bold">
              {video.engagementRate}% 🔥
            </div>
          </div>

          <CardContent className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 group-hover:text-purple-600 transition-colors">
              {video.title}
            </h3>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span className="font-medium">{formatNumber(video.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span className="font-medium">{formatNumber(video.likes)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span className="font-medium">{formatNumber(video.comments)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                <span className="font-medium">{formatNumber(video.shares)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
