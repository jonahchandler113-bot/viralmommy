import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { videoIdea, description, platform, targetAudience, niche } = body

    if (!videoIdea || videoIdea.trim().length === 0) {
      return NextResponse.json(
        { error: 'Video idea/title is required' },
        { status: 400 }
      )
    }

    // Build analysis prompt
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(videoIdea, description, platform, targetAudience, niche)

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3072,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: userPrompt,
        },
      ],
    })

    // Extract response
    const analysisText = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Failed to analyze video idea' },
        { status: 500 }
      )
    }

    // Parse the structured response
    const analysis = parseAnalysisResponse(analysisText)

    // Save to database (for tracking)
    try {
      await prisma.aiConversation.create({
        data: {
          userId: user.id,
          messages: {
            analysis: 'viral-score',
            videoIdea,
            platform: platform || 'general',
            response: analysisText,
          },
          context: {
            feature: 'viral-score',
            platform: platform || 'general',
            targetAudience: targetAudience || 'general',
            niche: niche || 'general',
          },
          model: 'claude-sonnet-4-20250514',
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        }
      })
    } catch (dbError) {
      console.error('Failed to save analysis to database:', dbError)
      // Continue anyway
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      analysis,
      rawText: analysisText,
      metadata: {
        model: 'claude-sonnet-4-20250514',
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        platform: platform || 'general',
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error: any) {
    console.error('Viral Score API Error:', error)

    // Handle specific error types
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key - Please check ANTHROPIC_API_KEY' },
        { status: 500 }
      )
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded - Please try again in a moment' },
        { status: 429 }
      )
    }

    if (error.status === 529) {
      return NextResponse.json(
        { error: 'Anthropic API is temporarily overloaded - Please try again' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to analyze video idea' },
      { status: 500 }
    )
  }
}

/**
 * Build system prompt for viral score analysis
 */
function buildSystemPrompt(): string {
  return `You are an expert social media strategist and viral content analyst. You specialize in predicting which content will go viral based on proven psychological triggers, platform algorithms, and current trends.

When analyzing video ideas, provide a comprehensive viral potential assessment with:

1. **Overall Viral Score** (1-10): Likelihood of going viral
2. **Platform Scores**: Viral potential broken down by platform (TikTok, Instagram, YouTube, Facebook)
3. **Strengths**: What makes this idea compelling (3-5 points)
4. **Weaknesses**: What could prevent it from going viral (2-4 points)
5. **Improvement Suggestions**: Specific, actionable recommendations (4-6 points)
6. **Hook Recommendations**: 3-4 proven opening hooks for this concept
7. **Trending Elements**: Current trends this could leverage
8. **Target Audience Insights**: Who will engage most
9. **Optimal Timing**: Best time/day to post for maximum reach
10. **Similar Viral Content**: Examples of similar concepts that went viral

Base your analysis on:
- Psychological triggers (curiosity, emotion, relatability, controversy)
- Platform algorithm preferences
- Current trending topics and formats
- Engagement patterns and viewer retention factors
- Hook strength and value proposition clarity

Provide specific, actionable insights. Be honest about weaknesses but also suggest how to overcome them.

Format your response as structured JSON for easy parsing.`
}

/**
 * Build user prompt with video idea details
 */
function buildUserPrompt(
  videoIdea: string,
  description?: string,
  platform?: string,
  targetAudience?: string,
  niche?: string
): string {
  let prompt = `Analyze the viral potential of this video idea:\n\n**Title/Idea**: ${videoIdea}`

  if (description) {
    prompt += `\n\n**Description**: ${description}`
  }

  if (platform) {
    prompt += `\n\n**Target Platform**: ${platform}`
  }

  if (targetAudience) {
    prompt += `\n\n**Target Audience**: ${targetAudience}`
  }

  if (niche) {
    prompt += `\n\n**Niche/Category**: ${niche}`
  }

  prompt += `\n\nProvide a comprehensive viral potential analysis with specific, actionable insights.`

  return prompt
}

/**
 * Parse AI response into structured format
 */
function parseAnalysisResponse(text: string) {
  try {
    // Try to parse as JSON first
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return normalizeAnalysis(parsed)
    }
  } catch (e) {
    // If JSON parsing fails, extract sections manually
  }

  // Fallback: Extract sections from markdown-style response
  const analysis = {
    overallScore: extractViralScore(text),
    platformScores: extractPlatformScores(text),
    strengths: extractList(text, ['Strengths', 'What Works', 'Positive Factors']),
    weaknesses: extractList(text, ['Weaknesses', 'Challenges', 'Potential Issues', 'What Could Prevent']),
    improvements: extractList(text, ['Improvement Suggestions', 'Recommendations', 'How to Improve', 'Suggestions']),
    hooks: extractList(text, ['Hook Recommendations', 'Hooks', 'Opening Lines', 'Attention Grabbers']),
    trendingElements: extractList(text, ['Trending Elements', 'Current Trends', 'Trends to Leverage']),
    targetAudience: extractSection(text, ['Target Audience Insights', 'Audience', 'Who Will Engage']),
    optimalTiming: extractSection(text, ['Optimal Timing', 'Best Time to Post', 'When to Post']),
    similarContent: extractList(text, ['Similar Viral Content', 'Similar Videos', 'Examples']),
  }

  return normalizeAnalysis(analysis)
}

/**
 * Normalize analysis to ensure all fields are present
 */
function normalizeAnalysis(analysis: any) {
  return {
    overallScore: analysis.overallScore || analysis.overall_score || 7,
    platformScores: analysis.platformScores || analysis.platform_scores || {
      tiktok: 7,
      instagram: 7,
      youtube: 7,
      facebook: 6,
    },
    strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
    weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
    improvements: Array.isArray(analysis.improvements) ? analysis.improvements : [],
    hooks: Array.isArray(analysis.hooks) ? analysis.hooks : [],
    trendingElements: Array.isArray(analysis.trendingElements || analysis.trending_elements)
      ? (analysis.trendingElements || analysis.trending_elements)
      : [],
    targetAudience: analysis.targetAudience || analysis.target_audience || '',
    optimalTiming: analysis.optimalTiming || analysis.optimal_timing || '',
    similarContent: Array.isArray(analysis.similarContent || analysis.similar_content)
      ? (analysis.similarContent || analysis.similar_content)
      : [],
  }
}

/**
 * Extract overall viral score (1-10)
 */
function extractViralScore(text: string): number {
  const patterns = [
    /overall.*?score[:\s]*(\d+)(?:\/10)?/i,
    /viral.*?score[:\s]*(\d+)(?:\/10)?/i,
    /score[:\s]*(\d+)(?:\/10)?/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const score = parseInt(match[1], 10)
      if (score >= 1 && score <= 10) return score
    }
  }

  return 7 // Default
}

/**
 * Extract platform-specific scores
 */
function extractPlatformScores(text: string): Record<string, number> {
  const scores: Record<string, number> = {}
  const platforms = ['tiktok', 'instagram', 'youtube', 'facebook']

  for (const platform of platforms) {
    const regex = new RegExp(`${platform}[:\\s]*(\d+)(?:/10)?`, 'i')
    const match = text.match(regex)
    if (match && match[1]) {
      scores[platform] = parseInt(match[1], 10)
    } else {
      scores[platform] = 7 // Default
    }
  }

  return scores
}

/**
 * Extract section content by header
 */
function extractSection(text: string, headers: string[]): string {
  for (const header of headers) {
    const regex = new RegExp(`${header}[:\\s]*([^#\\n]+(?:\\n(?!#+)[^\\n]+)*)`, 'i')
    const match = text.match(regex)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return ''
}

/**
 * Extract list items from section
 */
function extractList(text: string, headers: string[]): string[] {
  for (const header of headers) {
    const regex = new RegExp(`${header}[:\\s]*([^#]+)(?=#{1,3}|$)`, 'i')
    const match = text.match(regex)
    if (match && match[1]) {
      const items = match[1]
        .split('\n')
        .map(line => line.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(line => line.length > 0 && !line.match(/^#{1,3}/))

      if (items.length > 0) return items
    }
  }
  return []
}
