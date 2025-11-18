import { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, GraduationCap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Forgot Password - Enterprise Educational Platform',
  description: 'Reset your password to regain access to your account.',
}

export default function ForgotPasswordPage() {
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
              <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForgotPasswordForm />
              
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
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto">
          <p>
            &copy; 2025 Enterprise Educational Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
