import { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from '@/components/forms/RegisterForm'
import { AuthPageLayout } from '@/components/layouts'

import { logger } from '@/lib/utils/logger'

export const metadata: Metadata = {
  title: 'Register - Enterprise Educational Platform',
  description: 'Create your account to get started with our learning platform.',
}

export default function RegisterPage() {
  logger.log('RegisterPage component loaded')
  
  return (
    <AuthPageLayout
      title="Create your account"
      description="Join thousands of learners and start your educational journey"
      showSocialAuth={true}
      footerHelpText="Need help getting started?"
      footerHelpLink="/support"
    >
      <RegisterForm />
      
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link 
          href="/auth/login" 
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    </AuthPageLayout>
  )
}
