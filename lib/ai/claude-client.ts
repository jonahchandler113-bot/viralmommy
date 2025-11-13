import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client with API key from environment
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

export const claudeClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  estimatedCost: number; // in USD
}

export interface VideoAnalysisResult {
  viralScore: number; // 1-10 rating
  summary: string; // overall video summary
  strengths: string[]; // what makes it viral-worthy
  weaknesses: string[]; // areas for improvement
  hooks: string[]; // engaging moments/hooks found
  emotionalTones: string[]; // detected emotions
  recommendations: string[]; // actionable suggestions
  targetAudience: string; // primary audience
  contentType: string; // type of content (tutorial, vlog, etc.)
  usage: ClaudeUsage;
}

/**
 * Analyze video frames using Claude Vision API
 * @param frames - Array of base64-encoded frames
 * @param transcript - Optional video transcript
 * @returns Promise resolving to video analysis
 */
export async function analyzeVideoFrames(
  frames: Array<{ base64: string; timestamp: number }>,
  transcript?: string
): Promise<VideoAnalysisResult> {
  try {
    const startTime = Date.now();

    // Build the message content with images
    const imageContent: Anthropic.ImageBlockParam[] = frames.map(frame => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/png' as const,
        data: frame.base64,
      },
    }));

    // Construct the analysis prompt
    const promptText = buildVideoAnalysisPrompt(frames.length, transcript);

    const message = await claudeClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: promptText,
            },
            ...imageContent,
          ],
        },
      ],
      system: `You are an expert social media analyst specializing in viral content for mom creators.
Your job is to analyze videos and provide actionable insights to help content creators maximize engagement.
Be specific, encouraging, and data-driven in your analysis.`,
    });

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Calculate costs
    const usage: ClaudeUsage = calculateCosts(message.usage);

    // Parse structured response (expecting JSON in response)
    const analysis = parseAnalysisResponse(responseText, usage);

    const processingTime = Date.now() - startTime;
    console.log(`Claude analysis completed in ${processingTime}ms`);
    console.log(`Cost: $${usage.estimatedCost.toFixed(4)}`);

    return analysis;
  } catch (error) {
    console.error('Error analyzing video with Claude:', error);
    throw error;
  }
}

/**
 * Simple text generation using Claude
 * @param prompt - Text prompt
 * @param systemPrompt - Optional system prompt
 * @returns Generated text response
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<{ text: string; usage: ClaudeUsage }> {
  try {
    const message = await claudeClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: systemPrompt,
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const usage = calculateCosts(message.usage);

    return { text, usage };
  } catch (error) {
    console.error('Error generating text with Claude:', error);
    throw error;
  }
}

/**
 * Analyze a single image with Claude Vision
 * @param base64Image - Base64-encoded image
 * @param prompt - Analysis prompt
 * @returns Analysis result
 */
export async function analyzeImage(
  base64Image: string,
  prompt: string
): Promise<{ analysis: string; usage: ClaudeUsage }> {
  try {
    const message = await claudeClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const analysis = message.content[0].type === 'text' ? message.content[0].text : '';
    const usage = calculateCosts(message.usage);

    return { analysis, usage };
  } catch (error) {
    console.error('Error analyzing image with Claude:', error);
    throw error;
  }
}

/**
 * Build comprehensive video analysis prompt
 */
function buildVideoAnalysisPrompt(frameCount: number, transcript?: string): string {
  let prompt = `I'm sharing ${frameCount} frames from a video created by a stay-at-home mom content creator. `;

  if (transcript) {
    prompt += `Here's the video transcript:\n\n"${transcript}"\n\n`;
  }

  prompt += `Please analyze these frames and provide a comprehensive assessment in JSON format with the following structure:

{
  "viralScore": <number 1-10>,
  "summary": "<overall video summary>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "hooks": ["<engaging moment 1>", "<engaging moment 2>", ...],
  "emotionalTones": ["<emotion 1>", "<emotion 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "targetAudience": "<primary target audience>",
  "contentType": "<content category>"
}

Evaluation criteria:
1. **Viral Score (1-10)**: Based on engagement potential, emotional impact, relatability, and shareability
2. **Summary**: 2-3 sentence overview of the video content
3. **Strengths**: What makes this content engaging (hooks, authenticity, emotional connection, etc.)
4. **Weaknesses**: Areas for improvement (pacing, clarity, production quality, etc.)
5. **Hooks**: Specific moments or elements that grab attention
6. **Emotional Tones**: Primary emotions conveyed (joy, surprise, inspiration, humor, etc.)
7. **Recommendations**: 3-5 actionable tips to increase viral potential
8. **Target Audience**: Who would most connect with this content
9. **Content Type**: Category (tutorial, day-in-life, parenting hack, product review, etc.)

Consider mom creator best practices:
- Authenticity and relatability
- Quick hooks in first 3 seconds
- Emotional storytelling
- Clear value proposition
- Community building potential
- Shareability factor

Provide ONLY the JSON response, no additional text.`;

  return prompt;
}

/**
 * Parse Claude's analysis response into structured format
 */
function parseAnalysisResponse(responseText: string, usage: ClaudeUsage): VideoAnalysisResult {
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        usage,
      };
    }

    // Fallback: return basic structure
    return {
      viralScore: 5,
      summary: responseText.substring(0, 200),
      strengths: ['Unable to parse detailed analysis'],
      weaknesses: [],
      hooks: [],
      emotionalTones: [],
      recommendations: [],
      targetAudience: 'Unknown',
      contentType: 'Unknown',
      usage,
    };
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    throw error;
  }
}

/**
 * Calculate costs based on Claude API usage
 * Pricing for Claude Sonnet 4.5 (as of 2025):
 * - Input: $3.00 per million tokens
 * - Output: $15.00 per million tokens
 * - Cache writes: $3.75 per million tokens
 * - Cache reads: $0.30 per million tokens
 */
function calculateCosts(usage: Anthropic.Usage): ClaudeUsage {
  const inputCost = (usage.input_tokens / 1_000_000) * 3.0;
  const outputCost = (usage.output_tokens / 1_000_000) * 15.0;

  let cacheCreationCost = 0;
  let cacheReadCost = 0;

  // Check for cache usage (if available in response)
  if ('cache_creation_input_tokens' in usage && usage.cache_creation_input_tokens) {
    cacheCreationCost = (usage.cache_creation_input_tokens / 1_000_000) * 3.75;
  }
  if ('cache_read_input_tokens' in usage && usage.cache_read_input_tokens) {
    cacheReadCost = (usage.cache_read_input_tokens / 1_000_000) * 0.30;
  }

  const totalCost = inputCost + outputCost + cacheCreationCost + cacheReadCost;

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationTokens: 'cache_creation_input_tokens' in usage ? (usage.cache_creation_input_tokens ?? undefined) : undefined,
    cacheReadTokens: 'cache_read_input_tokens' in usage ? (usage.cache_read_input_tokens ?? undefined) : undefined,
    estimatedCost: totalCost,
  };
}

/**
 * Test Claude API connection
 */
export async function testClaudeConnection(): Promise<boolean> {
  try {
    const message = await claudeClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from ViralMommy!"',
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('Claude API test successful:', response);
    return true;
  } catch (error) {
    console.error('Claude API test failed:', error);
    return false;
  }
}

/**
 * Rate limiting helper
 * Claude API limits: 50 requests per minute for Sonnet
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 50, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
  }
}

export const rateLimiter = new RateLimiter();
