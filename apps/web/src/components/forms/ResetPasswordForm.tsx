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
import { useAuth } from '@/lib/auth/AuthContext'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password', '')

  useEffect(() => {
    // Check if we have the necessary URL parameters for password reset
    const code = searchParams.get('code')
    if (!code) {
      setError('Invalid password reset link. Please request a new one.')
    }
  }, [searchParams])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const code = searchParams.get('code')
      if (!code) {
        throw new Error('Invalid password reset link')
      }

      const { error: resetError } = await updatePassword(data.password)

      if (resetError) {
        throw resetError
      }

      setSuccess(true)
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login?message=Password reset successfully. You can now sign in with your new password.')
      }, 2000)

    } catch (err) {
      console.error('Password reset error:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to reset password. Please try again.'
      )
    } finally {
      setIsLoading(false)
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
            Your password has been updated. You'll be redirected to the login page shortly.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !searchParams.get('code')}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating password...
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
