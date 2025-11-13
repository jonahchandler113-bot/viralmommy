import { VideoMetadata } from '../video/metadata';

/**
 * Cost breakdown for video processing
 */
export interface CostBreakdown {
  frameExtraction: number; // FFmpeg (local, free)
  audioExtraction: number; // FFmpeg (local, free)
  whisperTranscription: number; // OpenAI Whisper API
  claudeVisionAnalysis: number; // Claude Vision API
  storageR2: number; // Cloudflare R2 storage
  total: number; // Total cost per video
  breakdown: {
    item: string;
    cost: number;
    unit: string;
  }[];
}

/**
 * Monthly cost projection based on volume
 */
export interface MonthlyCostProjection {
  videosPerMonth: number;
  costPerVideo: number;
  totalCost: number;
  breakdown: CostBreakdown;
  optimizations: {
    promptCaching: number; // savings from prompt caching
    batchProcessing: number; // savings from batch processing
    potentialSavings: number; // total potential savings
  };
}

/**
 * Pricing constants (as of January 2025)
 */
export const PRICING = {
  // Claude Sonnet 4.5
  claude: {
    inputPerMillion: 3.0, // $3 per million tokens
    outputPerMillion: 15.0, // $15 per million tokens
    cacheWritePerMillion: 3.75, // $3.75 per million tokens
    cacheReadPerMillion: 0.3, // $0.30 per million tokens
  },
  // OpenAI Whisper
  whisper: {
    perMinute: 0.006, // $0.006 per minute
  },
  // Cloudflare R2
  r2: {
    storagePerGBMonth: 0.015, // $0.015 per GB-month
    classAOperations: 4.5 / 1_000_000, // $4.50 per million (write)
    classBOperations: 0.36 / 1_000_000, // $0.36 per million (read)
  },
  // FFmpeg (local processing)
  ffmpeg: {
    cost: 0, // Free (local processing)
  },
};

/**
 * Calculate cost for processing a single video
 * @param metadata - Video metadata
 * @param options - Processing options
 * @returns Detailed cost breakdown
 */
export function calculateVideoProcessingCost(
  metadata: VideoMetadata,
  options: {
    framesInterval?: number; // seconds between frames
    maxFrames?: number; // max frames to extract
    usePromptCaching?: boolean; // whether to use prompt caching
    analyzeFrames?: boolean; // whether to analyze with Claude
    transcribe?: boolean; // whether to transcribe audio
  } = {}
): CostBreakdown {
  const {
    framesInterval = 2,
    maxFrames = 30,
    usePromptCaching = true,
    analyzeFrames = true,
    transcribe = true,
  } = options;

  const breakdown: CostBreakdown['breakdown'] = [];

  // 1. Frame extraction (FFmpeg - local, free)
  const frameExtractionCost = 0;
  breakdown.push({
    item: 'Frame extraction (FFmpeg)',
    cost: frameExtractionCost,
    unit: 'free',
  });

  // 2. Audio extraction (FFmpeg - local, free)
  const audioExtractionCost = 0;
  breakdown.push({
    item: 'Audio extraction (FFmpeg)',
    cost: audioExtractionCost,
    unit: 'free',
  });

  // 3. Whisper transcription
  let whisperCost = 0;
  if (transcribe && metadata.hasAudio) {
    const durationMinutes = metadata.duration / 60;
    whisperCost = durationMinutes * PRICING.whisper.perMinute;
    breakdown.push({
      item: `Whisper transcription (${durationMinutes.toFixed(2)} min)`,
      cost: whisperCost,
      unit: `$${PRICING.whisper.perMinute}/min`,
    });
  }

  // 4. Claude Vision analysis
  let claudeCost = 0;
  if (analyzeFrames) {
    const actualFrames = Math.min(
      maxFrames,
      Math.floor(metadata.duration / framesInterval)
    );

    // Estimate token usage:
    // - System prompt: ~200 tokens
    // - User prompt: ~300 tokens
    // - Each image (PNG): ~1500 tokens (approximate)
    // - Output: ~800 tokens (for detailed analysis)

    const systemTokens = 200;
    const promptTokens = 300;
    const imageTokens = actualFrames * 1500;
    const outputTokens = 800;

    const totalInputTokens = systemTokens + promptTokens + imageTokens;

    if (usePromptCaching) {
      // With caching: system prompt cached after first use
      // First request: full cost
      // Subsequent: cache read for system prompt (90% savings on that part)
      const cacheableTokens = systemTokens + promptTokens; // Cache the static context
      const nonCacheableTokens = imageTokens; // Images change each video

      // Average cost assuming 50% cache hits
      const cacheWriteCost = (cacheableTokens / 1_000_000) * PRICING.claude.cacheWritePerMillion;
      const cacheReadCost = (cacheableTokens / 1_000_000) * PRICING.claude.cacheReadPerMillion * 0.5;
      const regularInputCost = (nonCacheableTokens / 1_000_000) * PRICING.claude.inputPerMillion;
      const outputCost = (outputTokens / 1_000_000) * PRICING.claude.outputPerMillion;

      claudeCost = cacheWriteCost * 0.5 + cacheReadCost + regularInputCost + outputCost;

      breakdown.push({
        item: `Claude Vision analysis (${actualFrames} frames, cached)`,
        cost: claudeCost,
        unit: `~${totalInputTokens + outputTokens} tokens`,
      });
    } else {
      // No caching: full cost
      const inputCost = (totalInputTokens / 1_000_000) * PRICING.claude.inputPerMillion;
      const outputCost = (outputTokens / 1_000_000) * PRICING.claude.outputPerMillion;

      claudeCost = inputCost + outputCost;

      breakdown.push({
        item: `Claude Vision analysis (${actualFrames} frames)`,
        cost: claudeCost,
        unit: `~${totalInputTokens + outputTokens} tokens`,
      });
    }
  }

  // 5. R2 storage (minimal per video)
  // Assume ~50MB average video size
  const videoSizeMB = metadata.size / (1024 * 1024);
  const videoSizeGB = videoSizeMB / 1024;

  // Storage cost per month (prorated per video assuming 30-day retention)
  const storageCost = videoSizeGB * PRICING.r2.storagePerGBMonth;

  // Operations: 1 upload (Class A), estimated 5 reads per month (Class B)
  const uploadCost = PRICING.r2.classAOperations;
  const readCost = PRICING.r2.classBOperations * 5;

  const r2Cost = storageCost + uploadCost + readCost;

  breakdown.push({
    item: `R2 storage (${videoSizeMB.toFixed(2)} MB)`,
    cost: r2Cost,
    unit: '30-day retention',
  });

  // Total
  const total = frameExtractionCost + audioExtractionCost + whisperCost + claudeCost + r2Cost;

  return {
    frameExtraction: frameExtractionCost,
    audioExtraction: audioExtractionCost,
    whisperTranscription: whisperCost,
    claudeVisionAnalysis: claudeCost,
    storageR2: r2Cost,
    total,
    breakdown,
  };
}

/**
 * Project monthly costs based on video volume
 * @param videosPerMonth - Expected number of videos per month
 * @param averageMetadata - Average video metadata
 * @returns Monthly cost projection with optimizations
 */
export function projectMonthlyCosts(
  videosPerMonth: number,
  averageMetadata: VideoMetadata
): MonthlyCostProjection {
  // Calculate base cost (without optimizations)
  const baseCost = calculateVideoProcessingCost(averageMetadata, {
    usePromptCaching: false,
  });

  // Calculate optimized cost (with caching)
  const optimizedCost = calculateVideoProcessingCost(averageMetadata, {
    usePromptCaching: true,
  });

  // Calculate savings
  const promptCachingSavings =
    (baseCost.claudeVisionAnalysis - optimizedCost.claudeVisionAnalysis) * videosPerMonth;

  // Batch processing savings (assume 10% reduction from optimized queueing)
  const batchProcessingSavings = optimizedCost.total * 0.1 * videosPerMonth;

  const totalPotentialSavings = promptCachingSavings + batchProcessingSavings;

  // Total monthly cost with optimizations
  const monthlyTotal = optimizedCost.total * videosPerMonth - batchProcessingSavings;

  return {
    videosPerMonth,
    costPerVideo: optimizedCost.total,
    totalCost: monthlyTotal,
    breakdown: optimizedCost,
    optimizations: {
      promptCaching: promptCachingSavings,
      batchProcessing: batchProcessingSavings,
      potentialSavings: totalPotentialSavings,
    },
  };
}

/**
 * Format cost breakdown as human-readable string
 */
export function formatCostBreakdown(breakdown: CostBreakdown): string {
  let output = 'Cost Breakdown:\n';
  output += '=' .repeat(60) + '\n\n';

  breakdown.breakdown.forEach(item => {
    const costStr = item.cost === 0 ? 'FREE' : `$${item.cost.toFixed(4)}`;
    output += `${item.item.padEnd(40)} ${costStr.padStart(10)} ${item.unit}\n`;
  });

  output += '\n' + '-'.repeat(60) + '\n';
  output += `${'TOTAL'.padEnd(40)} ${'$' + breakdown.total.toFixed(4).padStart(9)}\n`;

  return output;
}

/**
 * Format monthly projection as human-readable string
 */
export function formatMonthlyProjection(projection: MonthlyCostProjection): string {
  let output = `Monthly Cost Projection (${projection.videosPerMonth} videos/month):\n`;
  output += '=' .repeat(60) + '\n\n';

  output += `Cost per video: $${projection.costPerVideo.toFixed(4)}\n`;
  output += `Total monthly cost: $${projection.totalCost.toFixed(2)}\n\n`;

  output += 'Optimizations:\n';
  output += `  - Prompt caching savings: $${projection.optimizations.promptCaching.toFixed(2)}\n`;
  output += `  - Batch processing savings: $${projection.optimizations.batchProcessing.toFixed(2)}\n`;
  output += `  - Total potential savings: $${projection.optimizations.potentialSavings.toFixed(2)}\n\n`;

  output += 'Cost Breakdown per Video:\n';
  projection.breakdown.breakdown.forEach(item => {
    const costStr = item.cost === 0 ? 'FREE' : `$${item.cost.toFixed(4)}`;
    output += `  - ${item.item}: ${costStr}\n`;
  });

  return output;
}

/**
 * Calculate break-even point for subscription pricing
 * @param subscriptionPrice - Monthly subscription price
 * @param costPerVideo - Cost to process one video
 * @returns Number of videos needed to break even
 */
export function calculateBreakEven(
  subscriptionPrice: number,
  costPerVideo: number
): number {
  return Math.ceil(subscriptionPrice / costPerVideo);
}

/**
 * Suggest optimal pricing tiers based on usage patterns
 */
export function suggestPricingTiers(averageMetadata: VideoMetadata): {
  tier: string;
  videosPerMonth: number;
  price: number;
  margin: number;
}[] {
  const tiers = [
    { tier: 'Starter', videosPerMonth: 10 },
    { tier: 'Creator', videosPerMonth: 30 },
    { tier: 'Pro', videosPerMonth: 100 },
    { tier: 'Business', videosPerMonth: 500 },
  ];

  return tiers.map(tier => {
    const projection = projectMonthlyCosts(tier.videosPerMonth, averageMetadata);
    const costPerVideo = projection.costPerVideo;
    const totalCost = projection.totalCost;

    // Target 70% margin
    const price = Math.ceil((totalCost / 0.3) / 5) * 5; // Round to nearest $5
    const margin = ((price - totalCost) / price) * 100;

    return {
      tier: tier.tier,
      videosPerMonth: tier.videosPerMonth,
      price,
      margin: Math.round(margin),
    };
  });
}

/**
 * Example usage and testing
 */
export function runCostExamples(): void {
  console.log('ViralMommy Cost Estimation Examples\n');

  // Example video metadata (2-minute video, 1080p)
  const exampleMetadata: VideoMetadata = {
    duration: 120, // 2 minutes
    width: 1920,
    height: 1080,
    fps: 30,
    size: 50 * 1024 * 1024, // 50 MB
    codec: 'h264',
    audioCodec: 'aac',
    bitrate: 3500,
    aspectRatio: '16:9',
    format: 'mp4',
    hasAudio: true,
  };

  // Single video cost
  console.log('Example 1: Single Video Processing Cost');
  console.log('=' .repeat(60));
  const singleVideoCost = calculateVideoProcessingCost(exampleMetadata);
  console.log(formatCostBreakdown(singleVideoCost));
  console.log('\n');

  // Monthly projection
  console.log('Example 2: Monthly Cost Projection (50 videos)');
  console.log('=' .repeat(60));
  const monthlyProjection = projectMonthlyCosts(50, exampleMetadata);
  console.log(formatMonthlyProjection(monthlyProjection));
  console.log('\n');

  // Pricing tiers
  console.log('Example 3: Suggested Pricing Tiers');
  console.log('=' .repeat(60));
  const pricingTiers = suggestPricingTiers(exampleMetadata);
  pricingTiers.forEach(tier => {
    console.log(`${tier.tier} Tier:`);
    console.log(`  - ${tier.videosPerMonth} videos/month`);
    console.log(`  - Price: $${tier.price}/month`);
    console.log(`  - Margin: ${tier.margin}%\n`);
  });
}
