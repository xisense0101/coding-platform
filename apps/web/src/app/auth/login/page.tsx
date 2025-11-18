import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/features/auth/LoginForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, GraduationCap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Login - Enterprise Educational Platform',
  description: 'Sign in to your account to access courses, exams, and more.',
}

export default function LoginPage() {
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
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
              </Suspense>
              {/* Registration disabled - users are created by admin via bulk upload */}
              {/* <div className="mt-4 text-center">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link 
                  href="/auth/register" 
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </Link>
              </div> */}
              <div className="mt-4 text-center">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Forgot your password?
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
