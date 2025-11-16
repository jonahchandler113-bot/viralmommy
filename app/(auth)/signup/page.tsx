'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Heart, Mail, Lock, User, Chrome, Check, Apple } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isAppleLoading, setIsAppleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions')
      return
    }
    setIsLoading(true)
    // TODO: Implement email/password signup logic
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Google signup error:', error)
      setIsGoogleLoading(false)
    }
  }

  const handleAppleSignup = async () => {
    setIsAppleLoading(true)
    try {
      await signIn('apple', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Apple signup error:', error)
      setIsAppleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-12 w-12 text-white fill-white" />
            <span className="text-3xl font-bold text-white">ViralMommy</span>
          </div>
          <p className="text-white/90 text-lg">
            Join thousands of mom creators building their empire
          </p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription>
              Start your journey to becoming a viral content creator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="mom@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className="flex-shrink-0 mt-1"
                >
                  <div className={`h-4 w-4 rounded border ${agreedToTerms ? 'bg-purple-600 border-purple-600' : 'border-gray-300'} flex items-center justify-center`}>
                    {agreedToTerms && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
                <label className="text-sm text-gray-600 cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                  I agree to the{' '}
                  <Link href="/terms" className="text-purple-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-purple-600 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <div className="mr-2 h-5 w-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                    Signing up...
                  </>
                ) : (
                  <>
                    <Chrome className="mr-2 h-5 w-5" />
                    Sign up with Google
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-black text-white hover:bg-gray-900"
                size="lg"
                onClick={handleAppleSignup}
                disabled={isAppleLoading}
              >
                {isAppleLoading ? (
                  <>
                    <div className="mr-2 h-5 w-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                    Signing up...
                  </>
                ) : (
                  <>
                    <Apple className="mr-2 h-5 w-5" />
                    Sign up with Apple
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center w-full text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
