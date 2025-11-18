/**
 * TikTok API Service
 * Handles publishing videos to TikTok
 */

interface TikTokPublishOptions {
  videoUrl: string
  caption: string
  accessToken: string
}

interface TikTokVideoInfo {
  id: string
  create_time: number
  share_url: string
}

export class TikTokService {
  private readonly baseUrl = 'https://open.tiktokapis.com'

  /**
   * Publish video to TikTok
   * TikTok uses a 3-step process: initialize, upload, publish
   */
  async publishVideo(options: TikTokPublishOptions): Promise<{ id: string; shareUrl: string }> {
    const { videoUrl, caption, accessToken } = options

    try {
      // Step 1: Initialize video upload
      const initResponse = await fetch(`${this.baseUrl}/v2/post/publish/video/init/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: caption,
            privacy_level: 'SELF_ONLY', // Can be: PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, SELF_ONLY
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000,
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_url: videoUrl,
          },
        }),
      })

      const initData = await initResponse.json()

      if (initData.error || !initData.data) {
        throw new Error(initData.error?.message || 'Failed to initialize TikTok upload')
      }

      const publishId = initData.data.publish_id

      // Step 2: Check upload status (TikTok will fetch the video from the URL)
      // Wait a bit for TikTok to process
      await this.sleep(5000)

      const statusResponse = await fetch(
        `${this.baseUrl}/v2/post/publish/status/${publishId}/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const statusData = await statusResponse.json()

      if (statusData.error) {
        throw new Error(statusData.error.message || 'Failed to check upload status')
      }

      const status = statusData.data?.status
      const videoId = statusData.data?.video_id

      // Status can be: PROCESSING_UPLOAD, PROCESSING_DOWNLOAD, PUBLISH_COMPLETE, FAILED
      if (status === 'FAILED') {
        throw new Error('TikTok video upload failed')
      }

      return {
        id: videoId || publishId,
        shareUrl: `https://www.tiktok.com/@user/video/${videoId}`,
      }
    } catch (error) {
      console.error('TikTok publish error:', error)
      throw error
    }
  }

  /**
   * Get video info and analytics
   */
  async getVideoInfo(videoId: string, accessToken: string): Promise<TikTokVideoInfo> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/video/query/?fields=id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters: {
              video_ids: [videoId],
            },
          }),
        }
      )

      const data = await response.json()

      if (data.error || !data.data?.videos?.[0]) {
        throw new Error(data.error?.message || 'Video not found')
      }

      return data.data.videos[0]
    } catch (error) {
      console.error('TikTok video info error:', error)
      throw error
    }
  }

  /**
   * List user's videos
   */
  async listVideos(accessToken: string, maxCount: number = 20) {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/video/list/?fields=id,create_time,cover_image_url,share_url,video_description,duration,like_count,comment_count,share_count,view_count&max_count=${maxCount}`,
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

      return data.data?.videos || []
    } catch (error) {
      console.error('TikTok list videos error:', error)
      throw error
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/oauth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 86400,
      }
    } catch (error) {
      console.error('TikTok token refresh error:', error)
      throw error
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const tiktokService = new TikTokService()
