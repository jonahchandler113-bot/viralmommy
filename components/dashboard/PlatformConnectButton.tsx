'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ComingSoonModal } from './ComingSoonModal'
import { Loader2 } from 'lucide-react'

interface PlatformConnectButtonProps {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'google'
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
  available?: boolean
  onConnect?: () => void | Promise<void>
  highlight?: boolean
}

export function PlatformConnectButton({
  platform,
  label,
  icon,
  color,
  bgColor,
  available = false,
  onConnect,
  highlight = false,
}: PlatformConnectButtonProps) {
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!available) {
      setShowComingSoon(true)
      return
    }

    if (onConnect) {
      setIsLoading(true)
      try {
        await onConnect()
      } catch (error) {
        console.error('Connection error:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          relative h-auto flex-col gap-4 p-6 transition-all duration-200
          ${highlight
            ? 'border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 shadow-lg'
            : `border-2 hover:border-gray-300 ${bgColor} hover:shadow-md`
          }
        `}
        variant="outline"
        size="lg"
      >
        {highlight && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
            🔥 TRENDING
          </div>
        )}

        <div className={`rounded-2xl ${bgColor} p-4`}>
          <div style={{ color }} className="h-10 w-10">
            {icon}
          </div>
        </div>

        <div className="text-center space-y-1">
          <div className="font-semibold text-gray-900 text-lg">{label}</div>
          {!available && (
            <div className="text-xs text-gray-500 font-medium">Coming Soon</div>
          )}
          {highlight && (
            <div className="text-xs font-medium text-orange-600">Facebook Reels are paying 💰</div>
          )}
        </div>

        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        )}
      </Button>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        platform={label}
        platformColor={color}
      />
    </>
  )
}
