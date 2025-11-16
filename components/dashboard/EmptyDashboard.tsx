'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { PlatformConnectButton } from './PlatformConnectButton'
import { BeginnerOnboarding } from './BeginnerOnboarding'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

// Platform icons as SVG components
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
  </svg>
)

export function EmptyDashboard() {
  const [showBeginnerGuide, setShowBeginnerGuide] = useState(false)

  const handleGoogleConnect = async () => {
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  if (showBeginnerGuide) {
    return <BeginnerOnboarding onClose={() => setShowBeginnerGuide(false)} />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        {/* Empty State Illustration */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Main circle with disconnected icons */}
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
              <Sparkles className="h-16 w-16 text-purple-400" />

              {/* Floating disconnected platform icons */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center opacity-50">
                <div className="w-6 h-6 text-black"><TikTokIcon /></div>
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center opacity-50">
                <div className="w-6 h-6 text-pink-600"><InstagramIcon /></div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center opacity-50">
                <div className="w-6 h-6 text-red-600"><YouTubeIcon /></div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center opacity-50">
                <div className="w-6 h-6 text-blue-600"><FacebookIcon /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Your Content Empire Starts Here
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect any platform to track performance, or start creating even if you're brand new
          </p>
        </div>
      </div>

      {/* Platform Connection Buttons */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Connect Your Platforms
        </h2>
        <p className="text-center text-gray-600 max-w-xl mx-auto">
          Link your social media accounts to track analytics, manage content, and grow your audience
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <PlatformConnectButton
            platform="tiktok"
            label="TikTok"
            icon={<TikTokIcon />}
            color="#000000"
            bgColor="bg-gray-50"
            available={false}
          />

          <PlatformConnectButton
            platform="instagram"
            label="Instagram"
            icon={<InstagramIcon />}
            color="#E4405F"
            bgColor="bg-pink-50"
            available={false}
          />

          <PlatformConnectButton
            platform="youtube"
            label="YouTube"
            icon={<YouTubeIcon />}
            color="#FF0000"
            bgColor="bg-red-50"
            available={false}
          />

          <PlatformConnectButton
            platform="facebook"
            label="Facebook"
            icon={<FacebookIcon />}
            color="#1877F2"
            bgColor="bg-blue-50"
            available={false}
            highlight={true}
          />
        </div>

        <p className="text-center text-sm text-gray-500 max-w-lg mx-auto pt-4">
          🔒 We only read your public analytics - we never post without permission.{' '}
          <a href="#" className="text-purple-600 hover:underline">Learn about data privacy</a>
        </p>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">OR</span>
        </div>
      </div>

      {/* Beginner Option */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-8 text-center space-y-4 hover:border-purple-400 hover:bg-purple-50 transition-all">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">
              New to Content Creation?
            </h3>
            <p className="text-gray-600">
              No problem! We'll guide you through creating your first viral video step-by-step.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => setShowBeginnerGuide(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            I'm New - Show Me How to Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}
