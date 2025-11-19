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
    const { messages, context } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request - messages array required' },
        { status: 400 }
      )
    }

    // Get user's latest message
    const userMessage = messages[messages.length - 1]
    if (!userMessage || !userMessage.content) {
      return NextResponse.json(
        { error: 'Invalid request - message content required' },
        { status: 400 }
      )
    }

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context)

    // Format messages for Anthropic API
    const anthropicMessages = messages.map((msg: any) => ({
      role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.content
    }))

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    // Extract assistant response
    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: 500 }
      )
    }

    // Save conversation to database
    try {
      await prisma.aiConversation.create({
        data: {
          userId: user.id,
          messages: {
            history: [
              ...messages,
              {
                role: 'assistant',
                content: assistantMessage,
                timestamp: new Date().toISOString(),
              }
            ]
          },
          context: context || {},
          model: 'claude-sonnet-4-20250514',
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        }
      })
    } catch (dbError) {
      console.error('Failed to save conversation to database:', dbError)
      // Continue anyway - don't fail the request
    }

    // Generate contextual suggestions based on the response
    const suggestions = generateSuggestions(assistantMessage, context)

    // Return successful response
    return NextResponse.json({
      message: assistantMessage,
      suggestions,
      metadata: {
        model: 'claude-sonnet-4-20250514',
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error: any) {
    console.error('AI Chat API Error:', error)

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
      { error: error.message || 'Failed to process AI chat request' },
      { status: 500 }
    )
  }
}

/**
 * Build system prompt with context about ViralMommy platform
 */
function buildSystemPrompt(context: any = {}): string {
  const basePrompt = `You are an AI assistant for ViralMommy, a content creation platform that helps creators optimize their social media presence across TikTok, Instagram, Facebook, and YouTube.

Your role is to help users:
- Generate viral content ideas and captions
- Analyze video performance and provide insights
- Suggest optimal posting times and strategies
- Answer questions about content creation best practices
- Provide platform-specific advice (TikTok, Instagram, Facebook, YouTube)

Be concise, actionable, and friendly. Focus on practical advice that drives engagement and growth.`

  // Add video context if available
  if (context.videoId || context.videoTitle) {
    return `${basePrompt}

Current Context:
- Video: ${context.videoTitle || 'Untitled'}
- Platform: ${context.platform || 'Not specified'}
- User is working on: ${context.task || 'content optimization'}`
  }

  // Add analytics context if available
  if (context.analyticsPage) {
    return `${basePrompt}

Current Context:
- User is viewing: Analytics Dashboard
- Focus area: ${context.focusArea || 'Overall performance'}
- Help them understand their metrics and improve performance`
  }

  return basePrompt
}

/**
 * Generate contextual suggestions based on AI response and context
 */
function generateSuggestions(response: string, context: any = {}): string[] {
  const suggestions: string[] = []

  // Video-related suggestions
  if (context.videoId || context.videoTitle) {
    if (response.toLowerCase().includes('caption') || response.toLowerCase().includes('description')) {
      suggestions.push('Generate a viral caption for this video')
      suggestions.push('What hashtags should I use?')
      suggestions.push('Optimize this caption for engagement')
    }

    if (response.toLowerCase().includes('edit') || response.toLowerCase().includes('improve')) {
      suggestions.push('What edits would make this more viral?')
      suggestions.push('Analyze the hook in my video')
    }

    suggestions.push('When is the best time to post this?')
    suggestions.push('Which platform is best for this content?')
  }

  // Analytics-related suggestions
  if (context.analyticsPage) {
    suggestions.push('Why is my engagement rate dropping?')
    suggestions.push('What content performs best on TikTok?')
    suggestions.push('How can I improve my Instagram reach?')
  }

  // General suggestions
  if (suggestions.length === 0) {
    suggestions.push('Generate viral content ideas')
    suggestions.push('Analyze my top performing videos')
    suggestions.push('What\'s trending on TikTok right now?')
    suggestions.push('Help me optimize my posting schedule')
  }

  return suggestions.slice(0, 4) // Return max 4 suggestions
}
