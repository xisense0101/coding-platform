'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Lock, User, Mail, Hash, Shield, Info, GraduationCap, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'

import { logger } from '@/lib/utils/logger'

interface StudentAuthModalProps {
  examTitle: string
  examId: string
  onAuthenticate: (data: StudentAuthData) => void
  onCancel?: () => void
}

export interface StudentAuthData {
  rollNumber: string
  studentName: string
  studentEmail: string
  studentSection: string
  testCode: string
  password: string
  userId?: string  // Added after password verification
}

export default function StudentAuthModal({ 
  examTitle, 
  examId, 
  onAuthenticate,
  onCancel 
}: StudentAuthModalProps) {
  const [formData, setFormData] = useState<StudentAuthData>({
    rollNumber: '',
    studentName: '',
    studentEmail: '',
    studentSection: '',
    testCode: '',
    password: ''
  })
  const [errors, setErrors] = useState<Partial<StudentAuthData>>({})
  const [isValidating, setIsValidating] = useState(false)

  const handleChange = (field: keyof StudentAuthData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentAuthData> = {}

    if (!formData.rollNumber.trim()) {
      newErrors.rollNumber = 'Roll number is required'
    }

    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Name is required'
    }

    if (!formData.studentEmail.trim()) {
      newErrors.studentEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.studentEmail)) {
      newErrors.studentEmail = 'Invalid email format'
    }

    if (!formData.studentSection.trim()) {
      newErrors.studentSection = 'Section is required'
    }

    if (!formData.testCode.trim()) {
      newErrors.testCode = 'Test code is required'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsValidating(true)

    try {
      // Step 1: Verify password with backend
      const credentialsResponse = await fetch('/api/auth/verify-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.studentEmail,
          password: formData.password
        })
      })

      const credentialsData = await credentialsResponse.json()

      if (!credentialsResponse.ok || !credentialsData.valid) {
        setErrors(prev => ({
          ...prev,
          password: credentialsData.message || 'Invalid email or password'
        }))
        setIsValidating(false)
        return
      }

      // Step 2: Validate test code with backend AND check for duplicate submission
      const response = await fetch(`/api/exams/${examId}/validate-test-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testCode: formData.testCode,
          studentEmail: formData.studentEmail // Send email for duplicate check
        })
      })

      const data = await response.json()

      if (!response.ok || !data.valid) {
        // If it's a duplicate submission, show error on email field
        if (data.isDuplicate) {
          setErrors(prev => ({
            ...prev,
            studentEmail: data.message || 'This email has already submitted the exam'
          }))
        } else {
          setErrors(prev => ({
            ...prev,
            testCode: data.message || 'Invalid test code'
          }))
        }
        setIsValidating(false)
        return
      }

      // Both password and test code are valid, proceed with authentication
      // Pass the verified user ID from credentials check
      onAuthenticate({
        ...formData,
        userId: credentialsData.user.id
      } as any)
    } catch (error) {
      logger.error('Error during authentication:', error)
      setErrors(prev => ({
        ...prev,
        testCode: 'Failed to authenticate. Please try again.'
      }))
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Main Card with Two Columns */}
        <Card className="border border-gray-200 shadow-lg bg-white overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Login Form */}
            <CardContent className="p-8 md:p-12">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
                  <GraduationCap className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Student Login
                </h2>
                <p className="text-gray-600">
                  Enter your details to access the exam
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Student Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Roll Number */}
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-indigo-600" />
                      Roll Number
                    </Label>
                    <Input
                      id="rollNumber"
                      type="text"
                      value={formData.rollNumber}
                      onChange={(e) => handleChange('rollNumber', e.target.value)}
                      className={cn(
                        "h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                        errors.rollNumber && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      )}
                    />
                    {errors.rollNumber && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.rollNumber}
                      </p>
                    )}
                  </div>

                  {/* Section */}
                  <div className="space-y-2">
                    <Label htmlFor="studentSection" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      Section
                    </Label>
                    <Input
                      id="studentSection"
                      type="text"
                      value={formData.studentSection}
                      onChange={(e) => handleChange('studentSection', e.target.value)}
                      className={cn(
                        "h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                        errors.studentSection && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      )}
                    />
                    {errors.studentSection && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.studentSection}
                      </p>
                    )}
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="studentName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Full Name
                  </Label>
                  <Input
                    id="studentName"
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => handleChange('studentName', e.target.value)}
                    className={cn(
                      "h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                      errors.studentName && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                  />
                  {errors.studentName && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.studentName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="studentEmail" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Email Address
                  </Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => handleChange('studentEmail', e.target.value)}
                    className={cn(
                      "h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                      errors.studentEmail && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                  />
                  {errors.studentEmail && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.studentEmail}
                    </p>
                  )}
                </div>

                {/* Test Code & Password Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={cn(
                        "h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                        errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      )}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Test Code */}
                  <div className="space-y-2">
                    <Label htmlFor="testCode" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      Test Code
                    </Label>
                    <Input
                      id="testCode"
                      type="text"
                      value={formData.testCode}
                      onChange={(e) => handleChange('testCode', e.target.value.toUpperCase())}
                      className={cn(
                        "h-10 font-mono tracking-wider uppercase border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
                        errors.testCode && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      )}
                    />
                    {errors.testCode && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.testCode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Start Exam
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            {/* Right Side - Exam Details */}
            <div className="bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Secure Exam Portal</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
                    {examTitle}
                  </h2>
                  <p className="text-indigo-100 text-lg">
                    Please authenticate to begin your examination
                  </p>
                </div>

                <div className="space-y-4 pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Secure Authentication</h3>
                      <p className="text-indigo-100 text-sm">
                        Your credentials are verified to ensure exam integrity
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Monitored Session</h3>
                      <p className="text-indigo-100 text-sm">
                        Activity is tracked to maintain academic honesty
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">IP Recording</h3>
                      <p className="text-indigo-100 text-sm">
                        Your IP address will be logged for security purposes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/20">
                  <p className="text-sm text-indigo-100">
                    Need help? Contact your instructor for assistance with test codes or access issues.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
