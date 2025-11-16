'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard'
import { NewCreatorDashboard } from '@/components/dashboard/NewCreatorDashboard'
import { ActiveDashboard } from '@/components/dashboard/ActiveDashboard'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'

export default function DashboardPage() {
  const { hasConnections, hasVideos, connectedPlatformNames, isLoading } = usePlatformConnections()

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // STATE 1: No platform connections - show empty state
  if (!hasConnections) {
    return (
      <DashboardLayout>
        <EmptyDashboard />
      </DashboardLayout>
    )
  }

  // STATE 2: Has platform connections but no videos yet
  if (hasConnections && !hasVideos) {
    return (
      <DashboardLayout>
        <NewCreatorDashboard connectedPlatforms={connectedPlatformNames} />
      </DashboardLayout>
    )
  }

  // STATE 3: Has connections AND videos - show full analytics dashboard
  return (
    <DashboardLayout>
      <ActiveDashboard />
    </DashboardLayout>
  )
}
