'use client'

import { SessionProvider } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ToastProvider } from '@/components/ui/toast'

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <ToastProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </ToastProvider>
    </SessionProvider>
  )
}
