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
  const [videoCount, setVideoCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      // TODO: Fetch real platform connections and video count from API
      // For now, return empty array (no connections)
      // Simulate different states for testing:
      // STATE 1: No connections (default)
      setConnections([])
      setVideoCount(0)

      // Uncomment to test STATE 2 (connections but no videos):
      // setConnections([{ id: '1', platform: 'tiktok', username: 'testuser', isActive: true, connectedAt: new Date() }])
      // setVideoCount(0)

      // Uncomment to test STATE 3 (connections and videos):
      // setConnections([{ id: '1', platform: 'tiktok', username: 'testuser', isActive: true, connectedAt: new Date() }])
      // setVideoCount(5)

      setIsLoading(false)
    } else {
      setConnections([])
      setVideoCount(0)
      setIsLoading(false)
    }
  }, [session])

  const hasConnections = connections.length > 0
  const hasVideos = videoCount > 0
  const hasTikTok = connections.some(c => c.platform === 'tiktok')
  const hasInstagram = connections.some(c => c.platform === 'instagram')
  const hasYouTube = connections.some(c => c.platform === 'youtube')
  const hasFacebook = connections.some(c => c.platform === 'facebook')

  const connectedPlatformNames = connections.map(c =>
    c.platform.charAt(0).toUpperCase() + c.platform.slice(1)
  )

  return {
    connections,
    videoCount,
    isLoading,
    hasConnections,
    hasVideos,
    hasTikTok,
    hasInstagram,
    hasYouTube,
    hasFacebook,
    connectedPlatformNames,
  }
}
