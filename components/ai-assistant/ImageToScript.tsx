'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Loader2, Copy, Check, Sparkles, TrendingUp, Hash, Lightbulb, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ScriptAnalysis {
  imageAnalysis?: string
  viralPotential?: {
    score: number
    explanation: string
  }
  scriptIdeas?: string[]
  hooks?: string[]
  trendingAngles?: string[]
  platformTips?: string[]
  hashtags?: string[]
}

interface AnalysisResponse {
  success: boolean
  analysis: ScriptAnalysis
  rawText: string
  metadata: {
    model: string
    tokens: {
      input: number
      output: number
      total: number
    }
    platform: string
    contentType: string
  }
}

export default function ImageToScript() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [platform, setPlatform] = useState<string>('tiktok')
  const [contentType, setContentType] = useState<string>('general')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image must be smaller than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
      setError(null)
      setAnalysis(null)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/image-to-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          platform,
          contentType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to analyze image')
      }

      const data: AnalysisResponse = await response.json()
      setAnalysis(data.analysis)

    } catch (err: any) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze image. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getViralScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-orange-600 bg-orange-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Image to Script Generator
        </h2>
        <p className="text-muted-foreground">
          Upload any image and get AI-powered viral script ideas with Claude Vision
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Upload & Settings */}
        <div className="space-y-6">
          {/* Image Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Upload Image
              </CardTitle>
              <CardDescription>
                Drag and drop an image or click to browse (max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
                )}
              >
                {selectedImage ? (
                  <div className="space-y-4">
                    <img
                      src={selectedImage}
                      alt="Selected"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage(null)
                        setAnalysis(null)
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Drop your image here
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        or click to browse files
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          {selectedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Customize the analysis for your target platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Target Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube Shorts</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger id="contentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="tutorial">Tutorial / How-To</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="product">Product Showcase</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Script Ideas
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Viral Potential Score */}
            {analysis.viralPotential && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Viral Potential
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "text-5xl font-bold px-6 py-4 rounded-lg",
                      getViralScoreColor(analysis.viralPotential.score)
                    )}>
                      {analysis.viralPotential.score}/10
                    </div>
                    <p className="text-sm text-gray-600 flex-1">
                      {analysis.viralPotential.explanation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Analysis */}
            {analysis.imageAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                    What AI Sees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{analysis.imageAnalysis}</p>
                </CardContent>
              </Card>
            )}

            {/* Script Ideas */}
            {analysis.scriptIdeas && analysis.scriptIdeas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                    Script Ideas ({analysis.scriptIdeas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.scriptIdeas.map((script, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg flex items-start justify-between gap-2 hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-sm flex-1">{script}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(script, `script-${index}`)}
                        className="flex-shrink-0"
                      >
                        {copiedItem === `script-${index}` ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Hook Suggestions */}
            {analysis.hooks && analysis.hooks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Opening Hooks ({analysis.hooks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.hooks.map((hook, index) => (
                    <div
                      key={index}
                      className="p-3 bg-yellow-50 rounded-lg flex items-center justify-between gap-2 hover:bg-yellow-100 transition-colors"
                    >
                      <p className="text-sm font-medium flex-1">{hook}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(hook, `hook-${index}`)}
                        className="flex-shrink-0"
                      >
                        {copiedItem === `hook-${index}` ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Trending Angles */}
            {analysis.trendingAngles && analysis.trendingAngles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Trending Angles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.trendingAngles.map((angle, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-purple-600 mt-1">•</span>
                        <span className="flex-1">{angle}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Platform Tips */}
            {analysis.platformTips && analysis.platformTips.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Platform Optimization Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.platformTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="flex-1">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Hashtags */}
            {analysis.hashtags && analysis.hashtags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-5 w-5 text-purple-600" />
                      Hashtag Strategy ({analysis.hashtags.length})
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(analysis.hashtags!.join(' '), 'all-hashtags')}
                    >
                      {copiedItem === 'all-hashtags' ? (
                        <>
                          <Check className="h-4 w-4 mr-1 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy All
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.hashtags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-purple-100 transition-colors"
                        onClick={() => copyToClipboard(tag, `tag-${index}`)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State for Results */}
        {!analysis && selectedImage && !isAnalyzing && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 p-8">
              <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Ready to Analyze</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Select your target platform and content type, then click "Generate Script Ideas" to get AI-powered insights.
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
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Analyzing Image...</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Claude Vision is examining your image and generating viral script ideas. This may take a few moments.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
