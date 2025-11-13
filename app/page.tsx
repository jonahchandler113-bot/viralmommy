import Link from 'next/link'
import { Heart, Sparkles, Video, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
      {/* Navigation */}
      <nav className="border-b border-white/20 backdrop-blur-sm bg-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-white fill-white" />
              <span className="text-xl font-bold text-white">ViralMommy</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="secondary">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-white text-sm font-medium">AI-Powered Content Creation</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Turn Your Passion Into
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Viral Content
            </span>
          </h1>

          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of mom creators building their empire with AI-powered tools designed specifically for busy parents.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="text-lg px-8 py-6 text-white hover:bg-white/20">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500 mb-4">
              <Video className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI Video Enhancement</h3>
            <p className="text-white/80">
              Transform raw footage into polished, engaging content with our AI-powered editing tools.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-pink-500 mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Captions & Hashtags</h3>
            <p className="text-white/80">
              Generate viral captions and trending hashtags automatically for maximum reach.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500 mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-white/80">
              Track your growth with detailed analytics and insights tailored for content creators.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/20 backdrop-blur-sm bg-white/10 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-white/80 text-sm">
            © 2025 ViralMommy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
