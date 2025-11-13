'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ToastProvider } from '@/components/ui/toast'

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ToastProvider>
  )
}
