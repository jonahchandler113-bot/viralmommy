import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export interface PlatformConnection {
  id: string
  platform: 'tiktok' | 'instagram' | 'youtube' | 'facebook'
  username: string
  isActive: boolean
  connectedAt: Date
}

export function usePlatformConnections() {
  const { data: session } = useSession()
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      // TODO: Fetch real platform connections from API
      // For now, return empty array (no connections)
      setConnections([])
      setIsLoading(false)
    } else {
      setConnections([])
      setIsLoading(false)
    }
  }, [session])

  const hasConnections = connections.length > 0
  const hasTikTok = connections.some(c => c.platform === 'tiktok')
  const hasInstagram = connections.some(c => c.platform === 'instagram')
  const hasYouTube = connections.some(c => c.platform === 'youtube')
  const hasFacebook = connections.some(c => c.platform === 'facebook')

  return {
    connections,
    isLoading,
    hasConnections,
    hasTikTok,
    hasInstagram,
    hasYouTube,
    hasFacebook,
  }
}
