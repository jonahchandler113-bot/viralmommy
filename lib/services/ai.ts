import { claudeClient, rateLimiter } from '@/lib/ai/claude-client'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CaptionResponse {
  caption: string
  usage: {
    inputTokens: number
    outputTokens: number
    estimatedCost: number
  }
}

export interface HashtagsResponse {
  hashtags: string[]
  usage: {
    inputTokens: number
    outputTokens: number
    estimatedCost: number
  }
}

export interface BestTimeResponse {
  bestHours: number[]
  reasoning: string
  recommendations: string[]
  platformBreakdown: {
    platform: string
    bestHours: number[]
    avgEngagement: number
  }[]
}

export interface AIError {
  code: string
  message: string
  details?: any
}

// ============================================================================
// PLATFORM CHARACTER LIMITS
// ============================================================================

const PLATFORM_LIMITS = {
  TIKTOK: 150,
  INSTAGRAM: 300,
  FACEBOOK: 300,
  YOUTUBE: 500,
  TWITTER: 280,
} as const

// ============================================================================
// AI SERVICE CLASS
// ============================================================================

export class AIService {
  /**
   * Generate engaging caption for a specific platform
   * @param description - Video description or context
   * @param platform - Target platform (TIKTOK, INSTAGRAM, FACEBOOK, YOUTUBE)
   * @returns Generated caption with usage stats
   */
  static async generateCaption(
    description: string,
    platform: string
  ): Promise<CaptionResponse> {
    try {
      // Wait for rate limit slot
      await rateLimiter.waitForSlot()

      const charLimit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS] || 300

      const systemPrompt = `You are an expert social media copywriter specializing in content for mom creators.
Your captions are engaging, authentic, relatable, and optimized for high engagement.
You understand what resonates with mom audiences and how to maximize viral potential.`

      const userPrompt = `Create an engaging ${platform} caption for a video about: "${description}"

Requirements:
- Maximum ${charLimit} characters
- Include relevant emojis that feel natural (not excessive)
- Use an authentic, relatable tone that resonates with moms
- Include a clear call-to-action (like, comment, share, follow)
- For mom content, focus on relatability, authenticity, and community
- Make it conversational and warm
- Consider ${platform} best practices

Platform-specific guidelines:
${this.getPlatformGuidelines(platform)}

Return ONLY the caption text, nothing else. No explanations, no quotes, just the ready-to-use caption.`

      const message = await claudeClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      })

      const caption = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

      // Calculate costs
      const usage = this.calculateUsage(message.usage)

      return {
        caption,
        usage,
      }
    } catch (error) {
      console.error('Error generating caption:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Generate relevant hashtags for a specific platform
   * @param description - Video description or context
   * @param platform - Target platform
   * @returns Array of hashtags with usage stats
   */
  static async generateHashtags(
    description: string,
    platform: string
  ): Promise<HashtagsResponse> {
    try {
      // Wait for rate limit slot
      await rateLimiter.waitForSlot()

      const systemPrompt = `You are a social media hashtag expert specializing in viral growth strategies for mom creators.
You understand trending hashtags, niche communities, and platform-specific optimization.`

      const userPrompt = `Generate effective hashtags for a ${platform} video about: "${description}"

Requirements:
- Provide 7-10 hashtags
- Mix of high-traffic (viral potential) and niche (targeted audience) hashtags
- ${platform}-appropriate hashtags
- Focus on mom creator community hashtags
- Include trending hashtags when relevant
- Balance broad reach with targeted engagement

For mom content, consider hashtags related to:
- Parenting life (#momlife, #sahm, #momof2)
- Relatable moments (#momstruggles, #realmomlife)
- Community building (#momsofinstagram, #momcommunity)
- Platform-specific trends

Return as a JSON array of strings, like: ["hashtag1", "hashtag2", "hashtag3"]
Include the # symbol in each hashtag.
Return ONLY the JSON array, nothing else.`

      const message = await claudeClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

      // Parse hashtags from response
      let hashtags: string[] = []
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(responseText)
        if (Array.isArray(parsed)) {
          hashtags = parsed
        }
      } catch {
        // Fallback: extract hashtags from text
        const hashtagMatches = responseText.match(/#\w+/g)
        if (hashtagMatches) {
          hashtags = hashtagMatches
        } else {
          // If no hashtags found, create generic ones
          hashtags = ['#momlife', '#momcontent', '#viral', '#momsofinstagram']
        }
      }

      // Calculate costs
      const usage = this.calculateUsage(message.usage)

      return {
        hashtags,
        usage,
      }
    } catch (error) {
      console.error('Error generating hashtags:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Analyze user's posting history and suggest best times to post
   * @param userId - User ID to analyze
   * @returns Best posting times with reasoning
   */
  static async suggestBestTime(userId: string): Promise<BestTimeResponse> {
    try {
      // Fetch user's published posts
      const publishedPosts = await prisma.publishedPost.findMany({
        where: {
          userId,
          publishedAt: { not: null },
          views: { gt: 0 }, // Only posts with engagement data
        },
        select: {
          platform: true,
          publishedAt: true,
          views: true,
          likes: true,
          comments: true,
          shares: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 100, // Analyze last 100 posts
      })

      if (publishedPosts.length < 5) {
        // Not enough data - return general best practices
        return this.getDefaultBestTimes()
      }

      // Analyze posting times and engagement
      const hourAnalysis: Record<number, {
        posts: number
        totalEngagement: number
        totalViews: number
        platforms: Set<string>
      }> = {}

      const platformAnalysis: Record<string, {
        hours: Record<number, { posts: number; engagement: number }>
      }> = {}

      publishedPosts.forEach(post => {
        if (!post.publishedAt) return

        const hour = new Date(post.publishedAt).getHours()
        const engagement = (post.likes || 0) + (post.comments || 0) * 2 + (post.shares || 0) * 3
        const platform = post.platform

        // Overall hour analysis
        if (!hourAnalysis[hour]) {
          hourAnalysis[hour] = {
            posts: 0,
            totalEngagement: 0,
            totalViews: 0,
            platforms: new Set(),
          }
        }
        hourAnalysis[hour].posts++
        hourAnalysis[hour].totalEngagement += engagement
        hourAnalysis[hour].totalViews += post.views || 0
        hourAnalysis[hour].platforms.add(platform)

        // Platform-specific analysis
        if (!platformAnalysis[platform]) {
          platformAnalysis[platform] = { hours: {} }
        }
        if (!platformAnalysis[platform].hours[hour]) {
          platformAnalysis[platform].hours[hour] = { posts: 0, engagement: 0 }
        }
        platformAnalysis[platform].hours[hour].posts++
        platformAnalysis[platform].hours[hour].engagement += engagement
      })

      // Calculate average engagement per post for each hour
      const hourScores = Object.entries(hourAnalysis).map(([hour, data]) => ({
        hour: parseInt(hour),
        avgEngagement: data.totalEngagement / data.posts,
        avgViews: data.totalViews / data.posts,
        posts: data.posts,
        score: (data.totalEngagement / data.posts) * Math.log(data.posts + 1), // Weight by frequency
      }))

      // Sort by score and get top hours
      const bestHours = hourScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(h => h.hour)
        .sort((a, b) => a - b)

      // Platform breakdown
      const platformBreakdown = Object.entries(platformAnalysis).map(([platform, data]) => {
        const platformHourScores = Object.entries(data.hours).map(([hour, stats]) => ({
          hour: parseInt(hour),
          avgEngagement: stats.engagement / stats.posts,
          posts: stats.posts,
        }))

        const topHours = platformHourScores
          .sort((a, b) => b.avgEngagement - a.avgEngagement)
          .slice(0, 3)
          .map(h => h.hour)

        const totalEngagement = Object.values(data.hours).reduce((sum, h) => sum + h.engagement, 0)
        const totalPosts = Object.values(data.hours).reduce((sum, h) => sum + h.posts, 0)

        return {
          platform,
          bestHours: topHours,
          avgEngagement: totalEngagement / totalPosts,
        }
      })

      // Generate AI-powered reasoning
      await rateLimiter.waitForSlot()

      const analysisPrompt = `Analyze this posting time data for a mom content creator:

Total posts analyzed: ${publishedPosts.length}
Best performing hours: ${bestHours.map(h => `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`).join(', ')}

Hour breakdown:
${hourScores.slice(0, 10).map(h =>
  `${h.hour % 12 || 12}${h.hour < 12 ? 'AM' : 'PM'}: ${h.posts} posts, avg ${h.avgEngagement.toFixed(1)} engagement`
).join('\n')}

Platform breakdown:
${platformBreakdown.map(p =>
  `${p.platform}: Best hours ${p.bestHours.map(h => `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`).join(', ')}`
).join('\n')}

Provide:
1. Brief explanation of why these times work well (2-3 sentences)
2. 3 specific recommendations for optimizing posting schedule

Consider mom creator audience (when are moms most active? morning routine, nap time, evening wind-down)

Format as JSON:
{
  "reasoning": "explanation here",
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}`

      const message = await claudeClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        system: 'You are a data analyst specializing in social media optimization for mom creators.',
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

      let reasoning = 'Based on your posting history, these times show the highest engagement.'
      let recommendations = [
        'Continue posting at these peak hours',
        'Test posting 1 hour before/after for optimization',
        'Consider your audience timezone',
      ]

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          reasoning = parsed.reasoning || reasoning
          recommendations = parsed.recommendations || recommendations
        }
      } catch (e) {
        console.log('Could not parse AI reasoning, using defaults')
      }

      return {
        bestHours,
        reasoning,
        recommendations,
        platformBreakdown,
      }
    } catch (error) {
      console.error('Error analyzing best posting times:', error)
      throw this.handleError(error)
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get platform-specific guidelines for caption generation
   */
  private static getPlatformGuidelines(platform: string): string {
    const guidelines = {
      TIKTOK: `- Keep it short and punchy (under 150 chars)
- Use trending sounds/challenges references if relevant
- Strong hook in first 3 words
- Encourage duets/stitches
- Use line breaks for readability`,

      INSTAGRAM: `- Can be longer (up to 300 chars for Reels)
- Use line breaks for structure
- Ask questions to drive comments
- Include story-telling elements
- Encourage saves and shares`,

      FACEBOOK: `- Conversational tone
- Can include more context
- Ask for opinions/experiences
- Build community connection
- Use paragraph breaks`,

      YOUTUBE: `- Include key information
- Can be longer and more descriptive
- Include timestamps if relevant
- Encourage likes and subscriptions
- Add context about the video`,

      TWITTER: `- Ultra concise (under 280 chars)
- Strong statement or question
- Use thread format if needed
- Encourage retweets and replies`,
    }

    return guidelines[platform as keyof typeof guidelines] || guidelines.INSTAGRAM
  }

  /**
   * Get default best posting times when insufficient data
   */
  private static getDefaultBestTimes(): BestTimeResponse {
    return {
      bestHours: [7, 9, 12, 15, 20], // Morning, mid-day, nap time, evening
      reasoning: 'Based on general mom creator best practices: early morning (7-9 AM) catches the morning routine crowd, midday (12-1 PM) reaches lunch break scrollers, 3 PM is prime nap time for moms with young kids, and 8 PM is evening wind-down time.',
      recommendations: [
        'Start posting at 7-9 AM to catch moms during morning routines',
        'Midday (12-1 PM) works well for quick lunch break engagement',
        'Evening (8-9 PM) is perfect for moms winding down after bedtime',
        'Test weekends separately as schedules differ from weekdays',
        'Build more posting history to get personalized recommendations',
      ],
      platformBreakdown: [
        {
          platform: 'TIKTOK',
          bestHours: [7, 15, 20],
          avgEngagement: 0,
        },
        {
          platform: 'INSTAGRAM',
          bestHours: [9, 12, 20],
          avgEngagement: 0,
        },
        {
          platform: 'FACEBOOK',
          bestHours: [8, 12, 19],
          avgEngagement: 0,
        },
      ],
    }
  }

  /**
   * Calculate usage costs from Anthropic API response
   */
  private static calculateUsage(usage: Anthropic.Usage): {
    inputTokens: number
    outputTokens: number
    estimatedCost: number
  } {
    // Pricing for Claude 3.5 Sonnet:
    // Input: $3.00 per million tokens
    // Output: $15.00 per million tokens
    const inputCost = (usage.input_tokens / 1_000_000) * 3.0
    const outputCost = (usage.output_tokens / 1_000_000) * 15.0
    const totalCost = inputCost + outputCost

    return {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      estimatedCost: totalCost,
    }
  }

  /**
   * Handle errors consistently
   */
  private static handleError(error: any): AIError {
    if (error instanceof Anthropic.APIError) {
      return {
        code: error.status?.toString() || 'API_ERROR',
        message: error.message,
        details: error,
      }
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        code: 'CONNECTION_ERROR',
        message: 'Unable to connect to AI service. Please try again.',
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error,
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AIService
