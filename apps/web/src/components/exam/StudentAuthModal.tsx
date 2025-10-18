'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Lock, User, Mail, Hash, Shield, Info } from 'lucide-react'
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
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl shadow-2xl border-purple-200/20 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Student Authentication Required
          </CardTitle>
          <CardDescription className="text-center text-base">
            Please provide your details to access<br />
            <strong className="text-purple-700 font-semibold">{examTitle}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Roll Number */}
            <div className="space-y-2">
              <Label htmlFor="rollNumber" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Hash className="h-4 w-4 text-purple-600" />
                </div>
                Roll Number
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rollNumber"
                type="text"
                placeholder="e.g., 2021CS001"
                value={formData.rollNumber}
                onChange={(e) => handleChange('rollNumber', e.target.value)}
                className={cn(
                  "h-12 text-base transition-all duration-200 border-2",
                  errors.rollNumber 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                )}
              />
              {errors.rollNumber && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.rollNumber}
                </p>
              )}
            </div>

            {/* Student Name */}
            <div className="space-y-2">
              <Label htmlFor="studentName" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                Full Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentName"
                type="text"
                placeholder="Enter your full name"
                value={formData.studentName}
                onChange={(e) => handleChange('studentName', e.target.value)}
                className={cn(
                  "h-12 text-base transition-all duration-200 border-2",
                  errors.studentName 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                )}
              />
              {errors.studentName && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.studentName}
                </p>
              )}
            </div>

            {/* Email and Section in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="studentEmail" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Mail className="h-4 w-4 text-purple-600" />
                  </div>
                  Email
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="studentEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.studentEmail}
                  onChange={(e) => handleChange('studentEmail', e.target.value)}
                  className={cn(
                    "h-12 text-base transition-all duration-200 border-2",
                    errors.studentEmail 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                  )}
                />
                {errors.studentEmail && (
                  <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-2">{errors.studentEmail}</span>
                  </p>
                )}
              </div>

              {/* Section */}
              <div className="space-y-2">
                <Label htmlFor="studentSection" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  Section
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="studentSection"
                  type="text"
                  placeholder="e.g., A, B, CS-01"
                  value={formData.studentSection}
                  onChange={(e) => handleChange('studentSection', e.target.value)}
                  className={cn(
                    "h-12 text-base transition-all duration-200 border-2",
                    errors.studentSection 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                  )}
                />
                {errors.studentSection && (
                  <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.studentSection}
                  </p>
                )}
              </div>
            </div>

            {/* Test Code */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="testCode" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-1.5 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
                  <Lock className="h-4 w-4 text-purple-600" />
                </div>
                Test Code
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="testCode"
                type="text"
                placeholder="Enter the test code provided by your teacher"
                value={formData.testCode}
                onChange={(e) => handleChange('testCode', e.target.value.toUpperCase())}
                className={cn(
                  "h-12 text-base font-mono tracking-wider transition-all duration-200 border-2",
                  errors.testCode 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                )}
              />
              {errors.testCode && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.testCode}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>Ask your teacher for the test code if you don't have it</span>
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="p-1.5 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
                  <Lock className="h-4 w-4 text-purple-600" />
                </div>
                Password
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your account password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={cn(
                  "h-12 text-base transition-all duration-200 border-2",
                  errors.password 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                )}
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 h-12 text-base border-2 hover:bg-gray-50 transition-all"
                  disabled={isValidating}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 h-12 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isValidating}
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Start Exam
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Info Message */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Security Notice
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your information and IP address will be recorded for security and verification purposes. This ensures exam integrity and prevents unauthorized access.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
