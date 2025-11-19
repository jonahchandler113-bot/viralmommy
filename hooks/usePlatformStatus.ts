import { useQuery } from '@tanstack/react-query'

export interface PlatformConnection {
  id: string
  platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'FACEBOOK' | 'TWITTER'
  isActive: boolean
  accountName: string | null
  accountHandle: string | null
}

export function usePlatformStatus() {
  return useQuery<{ connections: PlatformConnection[] }>({
    queryKey: ['platformConnections'],
    queryFn: async () => {
      const response = await fetch('/api/platforms/connections')
      if (!response.ok) {
        // If endpoint doesn't exist yet, return empty array
        if (response.status === 404) {
          return { connections: [] }
        }
        throw new Error('Failed to fetch platform connections')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
  })
}
