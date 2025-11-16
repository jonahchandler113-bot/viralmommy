'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Clock } from 'lucide-react'

interface ComingSoonModalProps {
  isOpen: boolean
  onClose: () => void
  platform: string
  platformColor: string
}

export function ComingSoonModal({ isOpen, onClose, platform, platformColor }: ComingSoonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {platform} Integration Coming Soon!
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            We're working hard to bring you {platform} analytics and automation.
            <span className="block mt-3 text-base font-medium" style={{ color: platformColor }}>
              🚀 Expected: Early 2025
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4 border border-purple-100">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Get notified when it's ready</p>
                <p className="text-sm text-gray-600 mt-1">
                  We'll email you the moment {platform} integration goes live. For now, Google OAuth is fully functional!
                </p>
              </div>
            </div>
          </div>

          <Button onClick={onClose} className="w-full" size="lg">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
