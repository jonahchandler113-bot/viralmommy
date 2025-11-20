'use client'

import { useState } from 'react'
import { Loader2, TrendingUp, Check, X, Lightbulb, Target, Clock, Users, Zap, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface PlatformScores {
  tiktok: number
  instagram: number
  youtube: number
  facebook: number
}

interface ViralAnalysis {
  overallScore: number
  platformScores: PlatformScores
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  hooks: string[]
  trendingElements: string[]
  targetAudience: string
  optimalTiming: string
  similarContent: string[]
}

interface AnalysisResponse {
  success: boolean
  analysis: ViralAnalysis
  rawText: string
  metadata: {
    model: string
    tokens: {
      input: number
      output: number
      total: number
    }
    platform: string
    timestamp: string
  }
}

export default function ViralScorePredictor() {
  const [videoIdea, setVideoIdea] = useState('')
  const [description, setDescription] = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [targetAudience, setTargetAudience] = useState('')
  const [niche, setNiche] = useState('general')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ViralAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeIdea = async () => {
    if (!videoIdea.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/viral-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoIdea: videoIdea.trim(),
          description: description.trim() || undefined,
          platform,
          targetAudience: targetAudience.trim() || undefined,
          niche: niche !== 'general' ? niche : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to analyze video idea')
      }

      const data: AnalysisResponse = await response.json()
      setAnalysis(data.analysis)

    } catch (err: any) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze video idea. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100 border-green-300'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100 border-yellow-300'
    if (score >= 4) return 'text-orange-600 bg-orange-100 border-orange-300'
    return 'text-red-600 bg-red-100 border-red-300'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Viral Potential 🔥'
    if (score >= 7) return 'Strong Potential ⭐'
    if (score >= 5) return 'Good Potential 👍'
    if (score >= 3) return 'Moderate Potential 📊'
    return 'Low Potential 📉'
  }

  const getPlatformIcon = (platformName: string) => {
    const icons: Record<string, string> = {
      tiktok: '🎵',
      instagram: '📷',
      youtube: '▶️',
      facebook: '👥',
    }
    return icons[platformName] || '📱'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Viral Score Predictor
        </h2>
        <p className="text-muted-foreground">
          Get AI-powered predictions on your video idea's viral potential before you create it
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Video Idea Details
              </CardTitle>
              <CardDescription>
                Tell us about your video concept and we'll predict its viral potential
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoIdea">
                  Video Title / Idea <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="videoIdea"
                  placeholder="e.g., 'How I made $10k in 30 days' or 'This productivity hack changed my life'"
                  value={videoIdea}
                  onChange={(e) => setVideoIdea(e.target.value)}
                  disabled={isAnalyzing}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {videoIdea.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add more details about your video concept, format, or unique angle..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isAnalyzing}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Target Platform</Label>
                  <Select value={platform} onValueChange={setPlatform} disabled={isAnalyzing}>
                    <SelectTrigger id="platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="niche">Niche / Category</Label>
                  <Select value={niche} onValueChange={setNiche} disabled={isAnalyzing}>
                    <SelectTrigger id="niche">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="beauty">Beauty</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., 'College students', 'Working moms', 'Gen Z entrepreneurs'"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={isAnalyzing}
                  maxLength={100}
                />
              </div>

              <Button
                onClick={analyzeIdea}
                disabled={!videoIdea.trim() || isAnalyzing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Viral Potential...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Predict Viral Score
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className={cn("border-2", getScoreColor(analysis.overallScore))}>
              <CardHeader>
                <CardTitle className="text-center">Overall Viral Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className={cn(
                  "text-8xl font-bold mb-2",
                  getScoreColor(analysis.overallScore)
                )}>
                  {analysis.overallScore}
                </div>
                <div className="text-2xl font-semibold text-gray-700 mb-4">
                  {getScoreLabel(analysis.overallScore)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={cn(
                      "h-3 rounded-full transition-all",
                      analysis.overallScore >= 8 ? 'bg-green-600' :
                      analysis.overallScore >= 6 ? 'bg-yellow-600' :
                      analysis.overallScore >= 4 ? 'bg-orange-600' : 'bg-red-600'
                    )}
                    style={{ width: `${(analysis.overallScore / 10) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platform Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Platform Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analysis.platformScores).map(([platformName, score]) => (
                  <div key={platformName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize flex items-center gap-2">
                        <span className="text-xl">{getPlatformIcon(platformName)}</span>
                        {platformName}
                      </span>
                      <span className={cn("font-bold", getScoreColor(score))}>
                        {score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          score >= 8 ? 'bg-green-600' :
                          score >= 6 ? 'bg-yellow-600' :
                          score >= 4 ? 'bg-orange-600' : 'bg-red-600'
                        )}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Strengths ({analysis.strengths.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Weaknesses */}
            {analysis.weaknesses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-600" />
                    Potential Challenges ({analysis.weaknesses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Improvements */}
            {analysis.improvements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Improvement Suggestions ({analysis.improvements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Hooks */}
            {analysis.hooks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Recommended Hooks ({analysis.hooks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.hooks.map((hook, index) => (
                    <div
                      key={index}
                      className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                    >
                      <p className="text-sm font-medium">{hook}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Trending Elements */}
            {analysis.trendingElements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Trending Elements to Leverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.trendingElements.map((element, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-600 mt-0.5">▸</span>
                        <span>{element}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Target Audience Insights */}
            {analysis.targetAudience && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Target Audience Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{analysis.targetAudience}</p>
                </CardContent>
              </Card>
            )}

            {/* Optimal Timing */}
            {analysis.optimalTiming && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Optimal Posting Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{analysis.optimalTiming}</p>
                </CardContent>
              </Card>
            )}

            {/* Similar Viral Content */}
            {analysis.similarContent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Similar Viral Content Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.similarContent.map((content, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{content}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysis && !isAnalyzing && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 p-8">
              <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Ready to Analyze</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Enter your video idea and details, then click "Predict Viral Score" to get AI-powered insights on its viral potential.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 p-8">
              <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center animate-pulse">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Analyzing Viral Potential...</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Claude is analyzing your video idea against current trends, platform algorithms, and viral patterns. This may take a few moments.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
