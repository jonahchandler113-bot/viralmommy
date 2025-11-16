'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Lightbulb, BookOpen, Palette, ArrowRight } from 'lucide-react'

interface BeginnerOnboardingProps {
  onClose?: () => void
}

export function BeginnerOnboarding({ onClose }: BeginnerOnboardingProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Header */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Your Creator Journey! 🎉</CardTitle>
          <CardDescription className="text-base">
            Starting from scratch? No problem! Here's everything you need to create your first viral video.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Content Creation Checklist */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Content Creation Checklist</CardTitle>
                <CardDescription>Your first video roadmap</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Pick a topic you're passionate about</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Record a 15-60 second video</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Add captions or text overlay</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Upload to ViralMommy for AI analysis</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Post on your platform of choice</span>
              </label>
            </div>
            <Button className="w-full mt-4" variant="outline">
              <ArrowRight className="mr-2 h-4 w-4" />
              Start Creating
            </Button>
          </CardContent>
        </Card>

        {/* Get Video Ideas */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Get Your First 5 Video Ideas</CardTitle>
                <CardDescription>AI-powered content inspiration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Stuck on what to create? Our AI will generate personalized video ideas based on trending topics in your niche.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">💡</span>
                <span>Parenting life hacks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">💡</span>
                <span>Quick meal prep tutorials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">💡</span>
                <span>Day-in-the-life vlogs</span>
              </li>
            </ul>
            <Button className="w-full" variant="default">
              Generate More Ideas
            </Button>
          </CardContent>
        </Card>

        {/* Quickstart Guide */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Creator Quickstart Guide</CardTitle>
                <CardDescription>Essential tips & tutorials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Learn the fundamentals of viral content creation with our step-by-step guide.
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                📚 How to film with your phone
              </div>
              <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                🎬 Editing basics for beginners
              </div>
              <div className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                🎯 Understanding the algorithm
              </div>
            </div>
            <Button className="w-full" variant="outline">
              View Full Guide
            </Button>
          </CardContent>
        </Card>

        {/* Free Templates */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-pink-100 p-2">
                <Palette className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <CardTitle>Access Free Templates</CardTitle>
                <CardDescription>Professional designs ready to use</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Download our collection of proven video templates that work for mom creators.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
                Morning Routine
              </div>
              <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-medium">
                Product Review
              </div>
            </div>
            <Button className="w-full" variant="outline">
              Browse Templates
            </Button>
          </CardContent>
        </Card>
      </div>

      {onClose && (
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} variant="ghost">
            Close Guide
          </Button>
        </div>
      )}
    </div>
  )
}
