'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Lock, 
  Check, 
  X, 
  AlertCircle,
  CheckCircle 
} from 'lucide-react'
import { createClient } from '@/lib/database/client'

import { logger } from '@/lib/utils/logger'

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface PasswordStrengthProps {
  password: string
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = [
    { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
    { label: 'One uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'One number', test: (pwd: string) => /[0-9]/.test(pwd) },
    { label: 'One special character', test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
  ]

  const passedChecks = checks.filter(check => check.test(password)).length
  const strength = passedChecks / checks.length

  const getStrengthColor = () => {
    if (strength < 0.4) return 'bg-red-500'
    if (strength < 0.6) return 'bg-yellow-500'
    if (strength < 0.8) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (strength < 0.4) return 'Weak'
    if (strength < 0.6) return 'Fair'
    if (strength < 0.8) return 'Good'
    return 'Strong'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength</span>
        <span className={`text-sm font-medium ${
          strength < 0.4 ? 'text-red-600' :
          strength < 0.6 ? 'text-yellow-600' :
          strength < 0.8 ? 'text-blue-600' : 'text-green-600'
        }`}>
          {getStrengthText()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength * 100}%` }}
        />
      </div>
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            {check.test(password) ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-gray-400" />
            )}
            <span className={check.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  })

  const password = watch('password', '')

  // Debug logging for form state
  useEffect(() => {
    console.log('📊 Component state:', { isLoading, isValidSession, isCheckingSession })
  }, [isLoading, isValidSession, isCheckingSession])

  // Debug logging for form validation
  useEffect(() => {
    console.log('📝 Form validation state:', { 
      isValid, 
      isSubmitting,
      errors: Object.keys(errors),
      hasPasswordError: !!errors.password,
      hasConfirmError: !!errors.confirmPassword
    })
  }, [errors, isValid, isSubmitting])

  useEffect(() => {
    // When users click the reset link in their email, Supabase redirects with hash fragments
    // The fragments are automatically processed by Supabase client to establish a recovery session
    let mounted = true
    let timeoutId: NodeJS.Timeout
    
    const checkSession = async () => {
      if (!mounted) return
      
      setIsCheckingSession(true)
      console.log('🔍 Checking password reset session...')
      console.log('🌐 Current URL:', window.location.href)
      console.log('🔗 Hash:', window.location.hash)
      
      try {
        const supabase = createClient()
        
        // Listen for auth state changes - this is important for detecting the session from URL
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔔 Auth state changed:', event, 'Session:', !!session)
          
          if (!mounted) return
          
          if (event === 'PASSWORD_RECOVERY' && session) {
            console.log('✅ PASSWORD_RECOVERY event detected!')
            setIsValidSession(true)
            setIsCheckingSession(false)
            if (timeoutId) clearTimeout(timeoutId)
          } else if (event === 'SIGNED_IN' && session) {
            console.log('✅ SIGNED_IN event with session')
            setIsValidSession(true)
            setIsCheckingSession(false)
            if (timeoutId) clearTimeout(timeoutId)
          }
        })
        
        // Also do an immediate session check
        // Add a small delay to allow URL hash processing
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (!mounted) return
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('📧 Session check result:', { 
          hasSession: !!session,
          userId: session?.user?.id,
          error: sessionError?.message 
        })
        
        logger.info('Password reset session check:', { 
          hasSession: !!session, 
          sessionError: sessionError?.message 
        })
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          logger.error('Session error:', sessionError)
          if (mounted) {
            setError('Failed to verify reset link. Please try again.')
            setIsValidSession(false)
            setIsCheckingSession(false)
          }
          subscription.unsubscribe()
          return
        }
        
        // For password reset, we need a valid session
        if (!session) {
          console.warn('⚠️ No session found after 1s - waiting for auth state change...')
          // Set a timeout to show error if session doesn't arrive
          timeoutId = setTimeout(() => {
            if (mounted) {
              console.error('❌ Timeout: No session established after 5 seconds')
              setError('Your password reset link has expired or is invalid. Please request a new one.')
              setIsValidSession(false)
              setIsCheckingSession(false)
            }
            subscription.unsubscribe()
          }, 5000) // Give 5 more seconds total
        } else {
          // Session exists, enable the form
          console.log('✅ Valid session found - form enabled')
          if (mounted) {
            setIsValidSession(true)
            setIsCheckingSession(false)
          }
          logger.info('Valid session found, form enabled')
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error('💥 Session check error:', err)
        logger.error('Session check error:', err)
        if (mounted) {
          setError('Failed to verify reset link. Please try again.')
          setIsValidSession(false)
          setIsCheckingSession(false)
        }
      }
    }
    
    checkSession()
    
    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    console.log('═══════════════════════════════════════')
    console.log('🚀 FORM SUBMITTED!')
    console.log('═══════════════════════════════════════')
    console.log('Current state:', { isLoading, isValidSession })
    console.log('Form data:', { password: '***hidden***', confirmPassword: '***hidden***' })
    
    if (isLoading || !isValidSession) {
      console.warn('⚠️⚠️⚠️ FORM SUBMISSION BLOCKED!')
      console.warn('Reason:', { isLoading, isValidSession })
      return
    }

    console.log('✅ Validation passed, setting isLoading to true...')
    setIsLoading(true)
    setError(null)

    console.log('🔐 Starting password update...')

    try {
      // Use Supabase client directly to update password
      const supabase = createClient()
      
      // First, verify we have a valid session
      console.log('🔍 Checking current session before update...')
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      console.log('📋 Current session:', { 
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
        accessToken: currentSession?.access_token ? 'present' : 'missing',
        expiresAt: currentSession?.expires_at
      })
      
      if (!currentSession) {
        throw new Error('No active session found. Please click the reset link again.')
      }
      
      console.log('📝 Attempting password update using Supabase REST API directly...')
      
      // Use fetch to call Supabase REST API directly with the access token
      // This bypasses the JS client which might be having issues
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        },
        body: JSON.stringify({
          password: data.password
        })
      })
      
      console.log('📬 REST API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ REST API error:', errorData)
        throw new Error(errorData.message || 'Failed to update password')
      }
      
      const updateData = await response.json()
      console.log('✅ REST API success:', { userId: updateData.id })

      console.log('✅ Password updated successfully!')
      setSuccess(true)
      
      // Sign out the recovery session before redirecting to login
      console.log('🚪 Signing out recovery session...')
      try {
        const signOutResult = await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 3000))
        ])
        console.log('✅ Signed out successfully', signOutResult)
      } catch (signOutError) {
        console.warn('⚠️ Sign out error (continuing anyway):', signOutError)
        // Continue with redirect even if sign out fails
      }
      
      // Redirect to login
      console.log('🔄 Redirecting to login...')
      router.push('/auth/login?message=Password reset successfully. You can now sign in with your new password.')

    } catch (err) {
      console.error('💥 Password reset submission error:', err)
      logger.error('Password reset error:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to reset password. Please try again or request a new reset link.'
      )
    } finally {
      setIsLoading(false)
      console.log('🏁 Password update process complete')
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Password reset successful!</strong>
            <br />
            Your password has been updated. Redirecting to login page...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    console.log('🎯 Form onSubmit event triggered!')
    console.log('Event:', e)
    handleSubmit(onSubmit)(e)
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            className="pl-9 pr-9"
            autoComplete="new-password"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Password Strength Indicator */}
      {password && (
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <PasswordStrength password={password} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your new password"
            className="pl-9 pr-9"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {isCheckingSession && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Verifying your reset link...
          </AlertDescription>
        </Alert>
      )}

      {!isCheckingSession && !isValidSession && !error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to verify reset link. Please request a new password reset.
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !isValidSession || isCheckingSession}
        onClick={(e) => {
          console.log('═══════════════════════════════════════')
          console.log('🖱️ BUTTON CLICKED!')
          console.log('═══════════════════════════════════════')
          console.log('Button state:', { 
            isLoading, 
            isValidSession, 
            isCheckingSession,
            disabled: isLoading || !isValidSession || isCheckingSession,
            buttonType: e.currentTarget.type
          })
          console.log('Form errors:', errors)
          console.log('Form values:', { password: password ? '***' : 'empty' })
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating password...
          </>
        ) : isCheckingSession ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Update password
          </>
        )}
      </Button>

      <div className="text-xs text-center text-muted-foreground">
        <p>
          After updating your password, you'll be able to sign in with your new credentials.
        </p>
      </div>
    </form>
  )
}
