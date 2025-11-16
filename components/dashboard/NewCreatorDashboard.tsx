'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, TrendingUp, DollarSign, Users, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface NewCreatorDashboardProps {
  connectedPlatforms: string[]
}

export function NewCreatorDashboard({ connectedPlatforms }: NewCreatorDashboardProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">
            {connectedPlatforms.length} {connectedPlatforms.length === 1 ? 'Platform' : 'Platforms'} Connected
          </span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900">
          Ready to Create Your First Video? 🎬
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          You've connected your accounts! Now let's upload your first video and see the magic happen.
        </p>
      </div>

      {/* Main Upload CTA */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">Upload Your First Video</CardTitle>
              <CardDescription className="text-base">
                Get instant AI analysis, viral score, and optimization tips
              </CardDescription>
            </div>
            <Sparkles className="h-12 w-12 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <Link href="/upload">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8">
              <Upload className="mr-2 h-5 w-5" />
              Upload Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Platform-Specific Monetization Tips */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Monetization Tips for Your Platforms</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {connectedPlatforms.includes('TikTok') && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-black p-2">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>TikTok Creator Fund</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>✅ Aim for 10K followers to join the Creator Fund</p>
                <p>💰 Average: $0.02-0.04 per 1,000 views</p>
                <p>🎯 Focus on watch time and engagement rate</p>
              </CardContent>
            </Card>
          )}

          {connectedPlatforms.includes('Instagram') && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>Instagram Reels Bonuses</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>✅ Post consistently (3-5 Reels per week)</p>
                <p>💰 Reels Play Bonus: up to $35K/month</p>
                <p>🎯 Create original, trending content</p>
              </CardContent>
            </Card>
          )}

          {connectedPlatforms.includes('YouTube') && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-600 p-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>YouTube Shorts Fund</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>✅ 1K subscribers + 10M views (90 days)</p>
                <p>💰 $100-10K/month based on performance</p>
                <p>🎯 Vertical 9:16 videos under 60 seconds</p>
              </CardContent>
            </Card>
          )}

          {connectedPlatforms.includes('Facebook') && (
            <Card className="hover:shadow-lg transition-shadow border-2 border-orange-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-600 p-2">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Facebook Reels Bonuses</CardTitle>
                    <p className="text-xs text-orange-600 font-semibold">🔥 Highest Payouts Right Now!</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>✅ Meta is aggressively paying creators</p>
                <p>💰 $0.01-0.05 per view (higher than others!)</p>
                <p>🎯 Cross-post from TikTok/Instagram for easy wins</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Content Planning Tools */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">📅 Content Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Plan your content schedule for maximum consistency
            </p>
            <Button variant="outline" className="w-full">
              Open Calendar
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">💡 Idea Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Get AI-powered video ideas based on trending topics
            </p>
            <Button variant="outline" className="w-full">
              Generate Ideas
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">🎨 Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Browse our library of proven video templates
            </p>
            <Button variant="outline" className="w-full">
              Browse Templates
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            First Video Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Keep it under 60 seconds for maximum engagement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Hook viewers in the first 3 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Use trending audio or sounds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Add captions for accessibility and reach</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Post during peak hours (6-9 PM)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Include a clear call-to-action</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
