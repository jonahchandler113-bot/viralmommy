'use client'

import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard'
import { NewCreatorDashboard } from '@/components/dashboard/NewCreatorDashboard'
import { ActiveDashboard } from '@/components/dashboard/ActiveDashboard'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'

export default function DashboardPage() {
  const { hasConnections, hasVideos, connectedPlatformNames, isLoading } = usePlatformConnections()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // STATE 1: No platform connections - show empty state
  if (!hasConnections) {
    return <EmptyDashboard />
  }

  // STATE 2: Has platform connections but no videos yet
  if (hasConnections && !hasVideos) {
    return <NewCreatorDashboard connectedPlatforms={connectedPlatformNames} />
  }

  // STATE 3: Has connections AND videos - show full analytics dashboard
  return <ActiveDashboard />
}
