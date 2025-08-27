'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth/AuthContext'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirm_password: z.string(),
  role: z.enum(['student', 'teacher'], {
    required_error: 'Please select your role',
  }),
  organization_code: z.string().optional(),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { signUp } = useAuth()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
      role: undefined,
      organization_code: '',
      terms_accepted: false,
    },
  })

  const password = form.watch('password')
  const confirmPassword = form.watch('confirm_password')

  // Password strength indicators
  const passwordChecks = {
    length: password?.length >= 8,
    uppercase: /[A-Z]/.test(password || ''),
    lowercase: /[a-z]/.test(password || ''),
    number: /[0-9]/.test(password || ''),
    special: /[^A-Za-z0-9]/.test(password || ''),
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await signUp(
        values.email, 
        values.password, 
        values.full_name, 
        values.role
      )

      if (error) {
        setError(error.message)
        return
      }

      // Check if user needs email verification
      if (data?.user && !data.user.email_confirmed_at) {
        setSuccess(true)
        return
      }

      // Redirect based on role
      if (values.role === 'teacher') {
        router.push('/teacher/dashboard')
      } else {
        router.push('/student/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-muted-foreground">
          We've sent you a confirmation link. Please check your email and click the link to activate your account.
        </p>
        <Button asChild variant="outline">
          <Link href="/auth/login">
            Back to Sign In
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          placeholder="Enter your full name"
          {...form.register('full_name')}
          disabled={isLoading}
        />
        {form.formState.errors.full_name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.full_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...form.register('email')}
          disabled={isLoading}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">I am a</Label>
        <Controller
          name="role"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.role && (
          <p className="text-sm text-destructive">
            {form.formState.errors.role.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            {...form.register('password')}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
        
        {password && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Password requirements:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center space-x-1 ${passwordChecks.length ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-3 w-3" />
                <span>8+ characters</span>
              </div>
              <div className={`flex items-center space-x-1 ${passwordChecks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-3 w-3" />
                <span>Uppercase</span>
              </div>
              <div className={`flex items-center space-x-1 ${passwordChecks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-3 w-3" />
                <span>Lowercase</span>
              </div>
              <div className={`flex items-center space-x-1 ${passwordChecks.number ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-3 w-3" />
                <span>Number</span>
              </div>
              <div className={`flex items-center space-x-1 ${passwordChecks.special ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-3 w-3" />
                <span>Special char</span>
              </div>
            </div>
          </div>
        )}
        
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            {...form.register('confirm_password')}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showConfirmPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
        
        {confirmPassword && (
          <div className={`flex items-center space-x-1 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
            <CheckCircle className="h-3 w-3" />
            <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
          </div>
        )}
        
        {form.formState.errors.confirm_password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirm_password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization_code">Organization Code (Optional)</Label>
        <Input
          id="organization_code"
          placeholder="Enter your organization code"
          {...form.register('organization_code')}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Ask your institution for the organization code to join automatically
        </p>
      </div>

      <div className="flex items-start space-x-2">
        <Controller
          name="terms_accepted"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              id="terms_accepted"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading}
            />
          )}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="terms_accepted" className="text-sm font-normal">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
      </div>
      {form.formState.errors.terms_accepted && (
        <p className="text-sm text-destructive">
          {form.formState.errors.terms_accepted.message}
        </p>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  )
}
