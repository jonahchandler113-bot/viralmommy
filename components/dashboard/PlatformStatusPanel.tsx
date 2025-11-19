'use client'

import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Platform icon components
const TikTokIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

const InstagramIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
  </svg>
)

const YouTubeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
  </svg>
)

const FacebookIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
  </svg>
)

interface PlatformConnection {
  platform: string
  isConnected: boolean
  accountName?: string
  accountHandle?: string
}

interface PlatformStatusPanelProps {
  connections?: PlatformConnection[]
}

const platformConfigs = {
  TIKTOK: {
    name: 'TikTok',
    icon: TikTokIcon,
    color: 'text-black',
    bg: 'bg-gray-100',
    connectUrl: '/api/platforms/tiktok/connect',
  },
  INSTAGRAM: {
    name: 'Instagram',
    icon: InstagramIcon,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    connectUrl: '/api/platforms/facebook/connect', // Instagram uses Facebook OAuth
  },
  YOUTUBE: {
    name: 'YouTube',
    icon: YouTubeIcon,
    color: 'text-red-600',
    bg: 'bg-red-50',
    connectUrl: '/api/platforms/youtube/connect',
  },
  FACEBOOK: {
    name: 'Facebook',
    icon: FacebookIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    connectUrl: '/api/platforms/facebook/connect',
  },
}

export function PlatformStatusPanel({ connections = [] }: PlatformStatusPanelProps) {
  const platforms = Object.entries(platformConfigs).map(([key, config]) => {
    const connection = connections.find((c) => c.platform === key)
    return {
      key,
      ...config,
      isConnected: connection?.isConnected || false,
      accountName: connection?.accountName,
      accountHandle: connection?.accountHandle,
    }
  })

  const connectedCount = platforms.filter((p) => p.isConnected).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Platform Connections</CardTitle>
          <span className="text-sm text-gray-500">
            {connectedCount} of {platforms.length} connected
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {platforms.map((platform) => {
            const Icon = platform.icon
            return (
              <div
                key={platform.key}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${platform.bg}`}>
                    <Icon className={`w-5 h-5 ${platform.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{platform.name}</p>
                    {platform.isConnected && platform.accountHandle && (
                      <p className="text-xs text-gray-500">@{platform.accountHandle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {platform.isConnected ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Connected</span>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.location.href = platform.connectUrl
                      }}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link href="/settings">
            <Button variant="ghost" className="w-full" size="sm">
              Manage All Connections
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
