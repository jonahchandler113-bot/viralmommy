/**
 * YouTube Data API Service
 * Handles uploading videos and Shorts to YouTube
 */

interface YouTubePublishOptions {
  videoUrl: string
  title: string
  description: string
  accessToken: string
  isShort?: boolean // Whether this is a YouTube Short (< 60 seconds)
}

interface YouTubeVideoResponse {
  id: string
  url: string
}

export class YouTubeService {
  private readonly apiBaseUrl = 'https://www.googleapis.com/youtube/v3'
  private readonly uploadBaseUrl = 'https://www.googleapis.com/upload/youtube/v3'

  /**
   * Upload video to YouTube
   * For Shorts: video must be < 60 seconds and vertical (9:16 aspect ratio)
   */
  async publishVideo(options: YouTubePublishOptions): Promise<YouTubeVideoResponse> {
    const { videoUrl, title, description, accessToken, isShort = false } = options

    try {
      // Step 1: Fetch the video file from the URL
      const videoResponse = await fetch(videoUrl)
      const videoBlob = await videoResponse.blob()

      // Step 2: Create video metadata
      const metadata = {
        snippet: {
          title: title.substring(0, 100), // Max 100 chars
          description: isShort
            ? `${description}\n\n#Shorts` // Add #Shorts hashtag for Shorts
            : description,
          categoryId: '22', // People & Blogs category
          tags: isShort ? ['Shorts'] : [],
        },
        status: {
          privacyStatus: 'public', // Can be: public, private, unlisted
          selfDeclaredMadeForKids: false,
        },
      }

      // Step 3: Upload video
      const uploadResponse = await fetch(
        `${this.uploadBaseUrl}/videos?uploadType=multipart&part=snippet,status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/related; boundary=video_boundary',
          },
          body: this.createMultipartBody(metadata, videoBlob),
        }
      )

      const uploadData = await uploadResponse.json()

      if (uploadData.error) {
        throw new Error(uploadData.error.message || 'Failed to upload to YouTube')
      }

      const videoId = uploadData.id

      return {
        id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }
    } catch (error) {
      console.error('YouTube upload error:', error)
      throw error
    }
  }

  /**
   * Get video statistics
   */
  async getVideoStats(videoId: string, accessToken: string) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/videos?part=statistics,snippet&id=${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (data.error || !data.items?.[0]) {
        throw new Error(data.error?.message || 'Video not found')
      }

      const video = data.items[0]

      return {
        views: parseInt(video.statistics.viewCount || '0'),
        likes: parseInt(video.statistics.likeCount || '0'),
        comments: parseInt(video.statistics.commentCount || '0'),
        title: video.snippet.title,
        publishedAt: video.snippet.publishedAt,
      }
    } catch (error) {
      console.error('YouTube stats error:', error)
      throw error
    }
  }

  /**
   * List channel's videos
   */
  async listVideos(accessToken: string, maxResults: number = 25) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/search?part=snippet&forMine=true&type=video&maxResults=${maxResults}&order=date`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.items || []
    } catch (error) {
      console.error('YouTube list videos error:', error)
      throw error
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || data.error_description)
      }

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 3600,
      }
    } catch (error) {
      console.error('YouTube token refresh error:', error)
      throw error
    }
  }

  /**
   * Create multipart body for video upload
   */
  private createMultipartBody(metadata: any, videoBlob: Blob): string {
    const boundary = 'video_boundary'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const parts = [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      'Content-Type: video/*\r\n\r\n',
      videoBlob,
      closeDelimiter,
    ]

    return parts.join('')
  }
}

export const youtubeService = new YouTubeService()
