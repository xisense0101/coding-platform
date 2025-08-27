import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, GraduationCap, Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reset Password - Enterprise Educational Platform',
  description: 'Create a new password for your account.',
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              EduPlatform
            </span>
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/auth/login" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
              <CardDescription>
                Enter your new password below to complete the reset process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingSpinner />}>
                <ResetPasswordForm />
              </Suspense>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Remember your password? </span>
                <Link 
                  href="/auth/login" 
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="font-medium mb-1">Security Notice</p>
              <p>
                For your security, this password reset link will expire after use or in 1 hour.
                If you didn't request this reset, please contact support immediately.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto">
          <p>
            &copy; 2025 Enterprise Educational Platform. All rights reserved.
          </p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/support" className="hover:underline">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
