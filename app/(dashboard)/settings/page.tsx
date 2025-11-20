'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Lock, CreditCard, CheckCircle2, XCircle, Link as LinkIcon, Crown, Zap, Loader2 } from 'lucide-react'
import { ComingSoonModal } from '@/components/dashboard/ComingSoonModal'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedColor, setSelectedColor] = useState('')

  // Profile state
  const [name, setName] = useState(session?.user?.name || '')
  const [bio, setBio] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')

  // Subscription state
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  // Platform connections state
  const [platforms, setPlatforms] = useState([
    { name: 'TikTok', platform: 'TIKTOK', connected: false, color: '#000000', icon: '📱', accountName: '' },
    { name: 'Instagram', platform: 'INSTAGRAM', connected: false, color: '#E4405F', icon: '📷', accountName: '' },
    { name: 'YouTube', platform: 'YOUTUBE', connected: false, color: '#FF0000', icon: '▶️', accountName: '' },
    { name: 'Facebook', platform: 'FACEBOOK', connected: false, color: '#1877F2', icon: '👥', accountName: '' },
  ])
  const [connectionsLoading, setConnectionsLoading] = useState(true)

  const userEmail = session?.user?.email || 'user@example.com'
  const userName = session?.user?.name || 'Creator'
  const userImage = session?.user?.image
  const userInitial = userName.charAt(0).toUpperCase()

  // Fetch platform connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/platforms/connections')
        if (response.ok) {
          const data = await response.json()

          // Update platforms with connection status
          setPlatforms(prev => prev.map(platform => {
            const connection = data.connections?.find(
              (c: any) => c.platform === platform.platform
            )
            return {
              ...platform,
              connected: !!connection,
              accountName: connection?.accountName || connection?.accountHandle || '',
              connectionId: connection?.id,
            }
          }))
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error)
      } finally {
        setConnectionsLoading(false)
      }
    }

    fetchConnections()
  }, [])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'platforms', label: 'Platform Connections', icon: LinkIcon },
    { id: 'subscription', label: 'Subscription', icon: Crown },
  ]

  const handlePlatformConnect = (platformName: string, platformColor: string) => {
    // Platform OAuth routes
    const platformRoutes: Record<string, string> = {
      'Facebook': '/api/platforms/facebook/connect',
      'TikTok': '/api/platforms/tiktok/connect',
      'YouTube': '/api/platforms/youtube/connect',
      'Instagram': '/api/platforms/facebook/connect', // Instagram through Facebook
    }

    // Check if platform has OAuth integration
    if (platformRoutes[platformName]) {
      window.location.href = platformRoutes[platformName]
      return
    }

    // Others show "Coming Soon" modal
    setSelectedPlatform(platformName)
    setSelectedColor(platformColor)
    setShowComingSoon(true)
  }

  const handlePlatformDisconnect = async (platformName: string, platformType: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platformName}?`)) {
      return
    }

    try {
      // Platform disconnect routes
      const disconnectRoutes: Record<string, string> = {
        'FACEBOOK': '/api/platforms/facebook/disconnect',
        'TIKTOK': '/api/platforms/tiktok/disconnect',
        'YOUTUBE': '/api/platforms/youtube/disconnect',
        'INSTAGRAM': '/api/platforms/instagram/disconnect',
      }

      const route = disconnectRoutes[platformType]
      if (!route) {
        alert('Disconnect not yet implemented for this platform')
        return
      }

      const response = await fetch(route, { method: 'POST' })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to disconnect platform')
      }

      // Update UI
      setPlatforms(prev => prev.map(p =>
        p.platform === platformType
          ? { ...p, connected: false, accountName: '', connectionId: undefined }
          : p
      ))

      alert(`${platformName} disconnected successfully`)
    } catch (error: any) {
      alert(error.message || 'Failed to disconnect platform')
    }
  }

  const handleProfileSave = async () => {
    setProfileLoading(true)
    setProfileMessage('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update session
      await update({ name: data.user.name })
      setProfileMessage('Profile updated successfully!')
      setTimeout(() => setProfileMessage(''), 3000)
    } catch (error: any) {
      setProfileMessage(error.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordLoading(true)
    setPasswordMessage('')

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match')
      setPasswordLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters')
      setPasswordLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }

      setPasswordMessage('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordMessage(''), 3000)
    } catch (error: any) {
      setPasswordMessage(error.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSubscribe = async (priceId: string, planName: string) => {
    setCheckoutLoading(planName)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (error: any) {
      alert(error.message || 'Failed to start checkout')
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and platform connections</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-purple-200">
                  <AvatarImage src={userImage || undefined} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-3xl font-semibold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="mb-2">Change Photo</Button>
                  <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 2MB.</p>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  placeholder="your@email.com"
                  disabled
                />
                <p className="text-xs text-gray-500">Email cannot be changed after registration</p>
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Tell us about yourself and your content..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {profileMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  profileMessage.includes('success')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {profileMessage}
                </div>
              )}

              <Button
                onClick={handleProfileSave}
                disabled={profileLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Change your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  passwordMessage.includes('success')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {passwordMessage}
                </div>
              )}

              <Button
                variant="outline"
                onClick={handlePasswordChange}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Connections Tab */}
      {activeTab === 'platforms' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>Manage your social media platform connections for publishing content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading connections...</span>
                </div>
              ) : (
                platforms.map((platform) => (
                  <div
                    key={platform.name}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{platform.icon}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{platform.name}</p>
                        <p className="text-sm text-gray-600">
                          {platform.connected
                            ? platform.accountName
                              ? `@${platform.accountName}`
                              : 'Connected'
                            : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {platform.connected ? (
                        <>
                          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Connected
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePlatformDisconnect(platform.name, platform.platform)}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => handlePlatformConnect(platform.name, platform.color)}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Why Connect Platforms?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">One-Click Publishing</p>
                  <p className="text-sm text-gray-600">Upload once, publish everywhere instantly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Real-Time Analytics</p>
                  <p className="text-sm text-gray-600">Track performance across all platforms in one dashboard</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">AI-Optimized Content</p>
                  <p className="text-sm text-gray-600">Auto-adjust captions and formats for each platform</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white">
                <div>
                  <p className="text-2xl font-bold">Free Plan</p>
                  <p className="text-purple-100 mt-1">Get started with basic features</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">$0</p>
                  <p className="text-purple-100 text-sm">/month</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Up to 10 video uploads per month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Basic AI analysis and recommendations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Bulk publishing</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-purple-300 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <CardHeader>
                <CardTitle>Pro Plan</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Unlimited video uploads</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Advanced AI insights & strategies</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Priority video processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Detailed analytics dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Connect up to 4 platforms</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro', 'pro')}
                  disabled={checkoutLoading === 'pro'}
                >
                  {checkoutLoading === 'pro' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Upgrade to Pro'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle>Enterprise Plan</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-gray-900">$99</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Everything in Pro, plus:</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Bulk publishing & scheduling</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>White-label watermarks</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Priority support (24/7)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>API access</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise', 'enterprise')}
                  disabled={checkoutLoading === 'enterprise'}
                >
                  {checkoutLoading === 'enterprise' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Upgrade to Enterprise'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        platform={selectedPlatform}
        platformColor={selectedColor}
      />
    </div>
  )
}
