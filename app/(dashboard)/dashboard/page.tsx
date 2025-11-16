'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard'
import { usePlatformConnections } from '@/hooks/usePlatformConnections'

export default function DashboardPage() {
  const { hasConnections, isLoading } = usePlatformConnections()

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

  // STATE 2 & 3: Will be implemented in next phase
  // For now, show coming soon message
  return (
    <DashboardLayout>
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Full Dashboard Coming Soon!</h2>
        <p className="text-gray-600 mt-2">
          You have connections - the full analytics dashboard will be available in the next update.
        </p>
      </div>
    </DashboardLayout>
  )
}
