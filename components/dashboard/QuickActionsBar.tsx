import { Button } from '@/components/ui/button'
import { Upload, Video, BarChart3, Settings, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function QuickActionsBar() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link href="/upload" className="block">
        <div className="group bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white hover:shadow-xl transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-white/20 p-2">
              <Upload className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-lg mb-1">Upload New Video</h3>
          <p className="text-sm text-white/80">Get AI-powered insights instantly</p>
        </div>
      </Link>

      <Link href="/videos" className="block">
        <div className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Video className="h-5 w-5 text-purple-600" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all" />
          </div>
          <h3 className="font-bold text-lg mb-1 text-gray-900">View All Videos</h3>
          <p className="text-sm text-gray-600">Manage your video library</p>
        </div>
      </Link>

      <Link href="/analytics" className="block">
        <div className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all" />
          </div>
          <h3 className="font-bold text-lg mb-1 text-gray-900">View Analytics</h3>
          <p className="text-sm text-gray-600">Track your performance</p>
        </div>
      </Link>

      <Link href="/settings" className="block">
        <div className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Settings className="h-5 w-5 text-green-600" />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all" />
          </div>
          <h3 className="font-bold text-lg mb-1 text-gray-900">Connect Platforms</h3>
          <p className="text-sm text-gray-600">Manage social accounts</p>
        </div>
      </Link>
    </div>
  )
}
