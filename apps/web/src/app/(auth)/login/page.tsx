import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/forms/LoginForm'
import { AuthPageLayout } from '@/components/layouts'

export const metadata: Metadata = {
  title: 'Login - Enterprise Educational Platform',
  description: 'Sign in to your account to access courses, exams, and more.',
}

export default function LoginPage() {
  return (
    <AuthPageLayout
      title="Welcome back"
      description="Sign in to your account to continue your learning journey"
      showSocialAuth={false}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
      
      {/* Registration disabled - users are created by admin via bulk upload */}
      {/* <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link 
          href="/auth/register" 
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </div> */}
    </AuthPageLayout>
  )
}
