/**
 * Facebook Graph API Service
 * Handles publishing to Facebook Pages and Instagram
 */

interface FacebookVideoUploadResponse {
  id: string
  success: boolean
}

interface FacebookPublishOptions {
  videoUrl: string
  caption: string
  accessToken: string
  pageId: string
}

export class FacebookService {
  private readonly apiVersion = 'v18.0'
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`

  /**
   * Publish video to Facebook Page
   */
  async publishVideo(options: FacebookPublishOptions): Promise<FacebookVideoUploadResponse> {
    const { videoUrl, caption, accessToken, pageId } = options

    try {
      // Step 1: Initialize video upload
      const initResponse = await fetch(
        `${this.baseUrl}/${pageId}/videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            upload_phase: 'start',
            access_token: accessToken,
          }),
        }
      )

      const initData = await initResponse.json()

      if (!initData.video_id || !initData.upload_session_id) {
        throw new Error('Failed to initialize Facebook video upload')
      }

      const videoId = initData.video_id
      const uploadSessionId = initData.upload_session_id

      // Step 2: Upload video file (Facebook will fetch from URL)
      const uploadResponse = await fetch(
        `${this.baseUrl}/${pageId}/videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            upload_phase: 'transfer',
            upload_session_id: uploadSessionId,
            video_file_url: videoUrl, // Facebook fetches from this URL
            access_token: accessToken,
          }),
        }
      )

      const uploadData = await uploadResponse.json()

      if (uploadData.error) {
        throw new Error(uploadData.error.message || 'Video upload failed')
      }

      // Step 3: Finalize upload with caption
      const finalizeResponse = await fetch(
        `${this.baseUrl}/${pageId}/videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            upload_phase: 'finish',
            upload_session_id: uploadSessionId,
            description: caption,
            access_token: accessToken,
          }),
        }
      )

      const finalizeData = await finalizeResponse.json()

      if (finalizeData.error) {
        throw new Error(finalizeData.error.message || 'Failed to finalize video')
      }

      return {
        id: videoId,
        success: finalizeData.success === true,
      }
    } catch (error) {
      console.error('Facebook video publish error:', error)
      throw error
    }
  }

  /**
   * Publish video to Instagram (connected via Facebook Page)
   */
  async publishToInstagram(options: FacebookPublishOptions & { instagramAccountId: string }) {
    const { videoUrl, caption, accessToken, instagramAccountId } = options

    try {
      // Step 1: Create Instagram media container
      const containerResponse = await fetch(
        `${this.baseUrl}/${instagramAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            media_type: 'REELS',
            video_url: videoUrl,
            caption: caption,
            access_token: accessToken,
          }),
        }
      )

      const containerData = await containerResponse.json()

      if (containerData.error) {
        throw new Error(containerData.error.message || 'Failed to create Instagram container')
      }

      const containerId = containerData.id

      // Step 2: Publish the container
      const publishResponse = await fetch(
        `${this.baseUrl}/${instagramAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: accessToken,
          }),
        }
      )

      const publishData = await publishResponse.json()

      if (publishData.error) {
        throw new Error(publishData.error.message || 'Failed to publish to Instagram')
      }

      return {
        id: publishData.id,
        success: true,
      }
    } catch (error) {
      console.error('Instagram video publish error:', error)
      throw error
    }
  }

  /**
   * Get Facebook Page insights
   */
  async getPageInsights(pageId: string, accessToken: string, metric: string[] = ['page_impressions', 'page_engaged_users']) {
    try {
      const metricsParam = metric.join(',')
      const response = await fetch(
        `${this.baseUrl}/${pageId}/insights?metric=${metricsParam}&access_token=${accessToken}`
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.data
    } catch (error) {
      console.error('Facebook insights error:', error)
      throw error
    }
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(videoId: string, accessToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${videoId}?fields=views,likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      return {
        views: data.views || 0,
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares?.count || 0,
      }
    } catch (error) {
      console.error('Facebook video analytics error:', error)
      throw error
    }
  }

  /**
   * Refresh long-lived token (call this periodically to keep tokens fresh)
   */
  async refreshToken(currentToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const url = new URL(`${this.baseUrl}/oauth/access_token`)
      url.searchParams.set('grant_type', 'fb_exchange_token')
      url.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!)
      url.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!)
      url.searchParams.set('fb_exchange_token', currentToken)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 5184000, // Default 60 days
      }
    } catch (error) {
      console.error('Facebook token refresh error:', error)
      throw error
    }
  }
}

export const facebookService = new FacebookService()
