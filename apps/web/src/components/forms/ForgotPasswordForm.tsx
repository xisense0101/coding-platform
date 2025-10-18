'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'

import { logger } from '@/lib/utils/logger'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { resetPassword } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const { error: resetError } = await resetPassword(data.email)

      if (resetError) {
        throw resetError
      }

      setEmailSent(true)
    } catch (err) {
      logger.error('Password reset error:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Check your email!</strong>
            <br />
            We've sent a password reset link to <strong>{getValues('email')}</strong>.
            Click the link in the email to create a new password.
          </AlertDescription>
        </Alert>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Didn't receive the email?</p>
          <div className="space-y-1">
            <p>• Check your spam or junk folder</p>
            <p>• Make sure the email address is correct</p>
            <p>• Wait a few minutes for the email to arrive</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmailSent(false)}
            className="mt-3"
          >
            Try another email address
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            className="pl-9"
            autoComplete="email"
            autoFocus
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Send reset link
          </>
        )}
      </Button>

      <div className="text-xs text-center text-muted-foreground">
        <p>
          You'll receive an email with a link to reset your password.
          The link will expire in 1 hour for security.
        </p>
      </div>
    </form>
  )
}
