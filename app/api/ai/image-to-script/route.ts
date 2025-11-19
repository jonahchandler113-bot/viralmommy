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
    const { image, platform, contentType } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // Extract base64 data and media type
    let imageData: string
    let mediaType: string

    if (image.startsWith('data:')) {
      // Data URL format: data:image/jpeg;base64,/9j/4AAQ...
      const matches = image.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        return NextResponse.json(
          { error: 'Invalid image format - expected base64 data URL' },
          { status: 400 }
        )
      }
      mediaType = matches[1]
      imageData = matches[2]
    } else {
      // Assume it's already base64 without prefix
      imageData = image
      mediaType = 'image/jpeg' // Default
    }

    // Validate media type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${mediaType}. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Build platform-specific prompt
    const systemPrompt = buildSystemPrompt(platform, contentType)

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageData,
              },
            },
            {
              type: 'text',
              text: 'Analyze this image and generate viral video script ideas based on what you see.',
            },
          ],
        },
      ],
    })

    // Extract response
    const analysisText = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Failed to analyze image' },
        { status: 500 }
      )
    }

    // Parse the structured response
    const analysis = parseAnalysisResponse(analysisText)

    // Save to database (optional - for tracking usage)
    try {
      await prisma.aiConversation.create({
        data: {
          userId: user.id,
          messages: {
            analysis: 'image-to-script',
            platform: platform || 'general',
            response: analysisText,
          },
          context: {
            feature: 'image-to-script',
            platform: platform || 'general',
            contentType: contentType || 'general',
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
        contentType: contentType || 'general',
      }
    })

  } catch (error: any) {
    console.error('Image-to-Script API Error:', error)

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
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    )
  }
}

/**
 * Build platform-specific system prompt
 */
function buildSystemPrompt(platform?: string, contentType?: string): string {
  const basePrompt = `You are an expert content strategist specializing in viral social media content. When analyzing images, provide:

1. **Image Analysis**: Brief description of what you see
2. **Viral Potential**: Score from 1-10 and explanation
3. **Script Ideas**: 3-5 video script/caption ideas that would go viral
4. **Hook Suggestions**: 3 attention-grabbing opening lines
5. **Trending Angles**: Current trends this content could leverage
6. **Platform Tips**: Platform-specific optimization advice
7. **Hashtag Strategy**: 10-15 relevant hashtags

Format your response as structured JSON with these sections.`

  // Platform-specific guidance
  const platformGuidance: Record<string, string> = {
    tiktok: '\n\nTikTok Focus: Emphasize trends, sounds, challenges. Hooks must grab attention in 1-2 seconds. Scripts should be 15-60 seconds max. Use trending hashtags.',
    instagram: '\n\nInstagram Focus: Visual aesthetics matter. Hooks should intrigue. Scripts 30-90 seconds for Reels. Mix popular and niche hashtags.',
    youtube: '\n\nYouTube Focus: Longer-form content (60-180 seconds for Shorts). Strong hook + value delivery. SEO-optimized titles/descriptions.',
    facebook: '\n\nFacebook Focus: Emotional connection + shareability. Clear value proposition. Scripts 30-90 seconds. Community-building language.',
  }

  let prompt = basePrompt

  if (platform && platformGuidance[platform.toLowerCase()]) {
    prompt += platformGuidance[platform.toLowerCase()]
  }

  if (contentType) {
    prompt += `\n\nContent Type: ${contentType}. Tailor suggestions accordingly.`
  }

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
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    // If JSON parsing fails, extract sections manually
  }

  // Fallback: Extract sections from markdown-style response
  const sections = {
    imageAnalysis: extractSection(text, ['Image Analysis', 'What I See', 'Description']),
    viralPotential: {
      score: extractViralScore(text),
      explanation: extractSection(text, ['Viral Potential', 'Viral Score']),
    },
    scriptIdeas: extractList(text, ['Script Ideas', 'Video Scripts', 'Caption Ideas']),
    hooks: extractList(text, ['Hook Suggestions', 'Hooks', 'Opening Lines']),
    trendingAngles: extractList(text, ['Trending Angles', 'Trends', 'Trending Topics']),
    platformTips: extractList(text, ['Platform Tips', 'Optimization', 'Platform Advice']),
    hashtags: extractHashtags(text),
  }

  return sections
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
 * Extract viral score (1-10)
 */
function extractViralScore(text: string): number {
  const scoreMatch = text.match(/(?:score|rating)[:\s]*(\d+)(?:\/10)?/i)
  if (scoreMatch && scoreMatch[1]) {
    return parseInt(scoreMatch[1], 10)
  }
  return 7 // Default
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

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
  const hashtagSection = extractSection(text, ['Hashtag Strategy', 'Hashtags', 'Tags'])

  if (hashtagSection) {
    const hashtags = hashtagSection.match(/#[\w]+/g)
    if (hashtags) return hashtags

    // If no # symbols, split by whitespace/commas and add #
    const words = hashtagSection
      .split(/[,\s]+/)
      .map(word => word.trim())
      .filter(word => word.length > 0 && !word.match(/^[-*•\d.]/))
      .map(word => word.startsWith('#') ? word : `#${word}`)

    return words
  }

  // Fallback: find all hashtags in entire text
  const allHashtags = text.match(/#[\w]+/g)
  return allHashtags || []
}
