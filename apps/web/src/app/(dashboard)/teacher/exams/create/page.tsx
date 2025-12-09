
"use client"

import { ExamPreview } from '@/components/exam/ExamPreview'
import { GenerateExamModal } from '@/components/exam/GenerateExamModal'
import { SectionList } from '@/components/common/content/SectionList'
import { ContentEditor } from '@/components/common/content/ContentEditor'
import { Section, Question } from '@/types/content'

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Eye, Trash2, Settings, Plus, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

import { logger } from '@/lib/utils/logger'
import { formatDateTimeLocal } from '@/lib/utils'

const programmingLanguages = [
  "JavaScript", "Python", "Java", "C++", "C", "Go", "Rust", "TypeScript"
]

function CreateExamPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editExamId = searchParams.get('edit')
  const isEditMode = !!editExamId
  
  const [examTitle, setExamTitle] = useState("")
  const [examDescription, setExamDescription] = useState("")
  const [examSlug, setExamSlug] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [testCode, setTestCode] = useState("")
  const [testCodeType, setTestCodeType] = useState<"permanent" | "rotating">("permanent")
  const [testCodeRotationMinutes, setTestCodeRotationMinutes] = useState(60)
  const [isPublished, setIsPublished] = useState(false)
  
  // Monitoring settings
  const [strictLevel, setStrictLevel] = useState(1)
  const [maxTabSwitches, setMaxTabSwitches] = useState(3)
  const [maxScreenLockDuration, setMaxScreenLockDuration] = useState(30)
  const [autoTerminateOnViolations, setAutoTerminateOnViolations] = useState(false)
  const [trackTabSwitches, setTrackTabSwitches] = useState(true)
  const [trackScreenLocks, setTrackScreenLocks] = useState(true)
  const [detectVm, setDetectVm] = useState(true)
  const [requireSingleMonitor, setRequireSingleMonitor] = useState(false)
  const [allowZoomChanges, setAllowZoomChanges] = useState(true)
  
  const [sections, setSections] = useState<Section[]>([])
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isExamInfoCollapsed, setIsExamInfoCollapsed] = useState(false)

  // Load existing exam data if in edit mode
  useEffect(() => {
    if (isEditMode && editExamId) {
      loadExamData(editExamId)
    }
  }, [isEditMode, editExamId])

  const loadExamData = async (examId: string) => {
    try {
      setIsLoading(true)
      
      // Fetch exam details
      const examResponse = await fetch(`/api/exams/${examId}`)
      if (!examResponse.ok) throw new Error('Failed to fetch exam')
      const { exam } = await examResponse.json()
      
      logger.log('Loaded exam data for editing:', exam)
      
      setExamTitle(exam.title)
      setExamDescription(exam.description || "")
      setExamSlug(exam.slug || "")
      setIsPublished(exam.is_published || false)
      setDurationMinutes(exam.duration_minutes || 60)
      setTestCode(exam.test_code || "")
      setTestCodeType(exam.test_code_type || "permanent")
      setTestCodeRotationMinutes(exam.test_code_rotation_minutes || 60)
      
      // Load monitoring settings
      setStrictLevel(exam.strict_level || 1)
      setMaxTabSwitches(exam.max_tab_switches || 3)
      setMaxScreenLockDuration(exam.max_screen_lock_duration || 30)
      setAutoTerminateOnViolations(exam.auto_terminate_on_violations || false)
      setTrackTabSwitches(exam.track_tab_switches !== false)
      setTrackScreenLocks(exam.track_screen_locks !== false)
      setDetectVm(exam.detect_vm !== false)
      setRequireSingleMonitor(exam.require_single_monitor || false)
      setAllowZoomChanges(exam.allow_zoom_changes !== false)
      
      // Format dates for datetime-local inputs
      if (exam.start_time) {
        const startDate = new Date(exam.start_time)
        setStartTime(formatDateTimeLocal(startDate))
      }
      if (exam.end_time) {
        const endDate = new Date(exam.end_time)
        setEndTime(formatDateTimeLocal(endDate))
      }

      // Convert exam sections data to the format expected by the UI
      if (exam.exam_sections && exam.exam_sections.length > 0) {
        logger.log('Converting exam sections:', exam.exam_sections)
        const convertedSections: Section[] = exam.exam_sections.map((section: any) => {
          logger.log('Processing section:', section)
          const questions: Question[] = section.exam_questions.map((examQuestion: any) => {
            const question = examQuestion.question
            logger.log('Processing question:', question)
            
            const baseQuestion: Question = {
              id: question.id,
              type: question.type,
              title: question.title,
              content: question.description || "",
              points: examQuestion.points,
              isVisible: true,
              hasChanges: false
            }

            // Add MCQ specific data
            if (question.type === 'mcq' && question.mcq_questions && question.mcq_questions[0]) {
              const mcqData = question.mcq_questions[0]
              // Handle different option formats
              if (Array.isArray(mcqData.options)) {
                baseQuestion.options = mcqData.options.map((opt: any) => {
                  if (typeof opt === 'string') return opt
                  if (opt.text) return opt.text
                  return opt.toString()
                })
              } else {
                baseQuestion.options = ["", "", "", ""]
              }
              // Get first correct answer
              if (Array.isArray(mcqData.correct_answers) && mcqData.correct_answers.length > 0) {
                baseQuestion.correctAnswer = parseInt(mcqData.correct_answers[0]) || 0
              } else {
                baseQuestion.correctAnswer = 0
              }
            } else if (question.type === 'mcq') {
              baseQuestion.options = ["", "", "", ""]
              baseQuestion.correctAnswer = 0
            }

            // Add coding specific data
            if (question.type === 'coding' && question.coding_questions && question.coding_questions[0]) {
              const codingData = question.coding_questions[0]
              
              logger.log('Loading coding question data:', {
                questionId: question.id,
                head: codingData.head,
                body_template: codingData.body_template,
                tail: codingData.tail,
                boilerplate_code: codingData.boilerplate_code
              })
              
              // Handle boilerplate code format
              if (typeof codingData.boilerplate_code === 'object') {
                baseQuestion.code = codingData.boilerplate_code?.javascript || 
                                  codingData.boilerplate_code?.python || 
                                  Object.values(codingData.boilerplate_code)[0] || 
                                  "// Write your code here"
              } else {
                baseQuestion.code = codingData.boilerplate_code || "// Write your code here"
              }
              
              // Load head, body_template, and tail (these are objects with per-language code)
              baseQuestion.head = codingData.head || {}
              baseQuestion.body_template = codingData.body_template || codingData.boilerplate_code || {}
              baseQuestion.tail = codingData.tail || {}
              
              logger.log('Loaded into baseQuestion:', {
                head: baseQuestion.head,
                body_template: baseQuestion.body_template,
                tail: baseQuestion.tail
              })
              
              baseQuestion.languages = Array.isArray(codingData.allowed_languages) ? 
                                     codingData.allowed_languages : 
                                     ["JavaScript", "Python"]
              baseQuestion.testCases = Array.isArray(codingData.test_cases) ?
                                     codingData.test_cases.map((tc: any, index: number) => ({
                                       id: index,
                                       input: tc.input || "",
                                       expectedOutput: tc.expected_output || "",
                                       isHidden: tc.is_hidden || false,
                                       weight: tc.weight || 1
                                     })) : []
            } else if (question.type === 'coding') {
              baseQuestion.code = "// Write your code here"
              baseQuestion.head = {}
              baseQuestion.body_template = {}
              baseQuestion.tail = {}
              baseQuestion.languages = ["JavaScript", "Python"]
              baseQuestion.testCases = []
            }

            return baseQuestion
          })

          return {
            id: section.id,
            title: section.title,
            description: section.description || "",
            isVisible: true,
            questions
          }
        })
        
        setSections(convertedSections)
        if (convertedSections.length > 0) {
          setActiveSection(convertedSections[0].id)
        }
      }
    } catch (error) {
      logger.error('Error loading exam data:', error)
      alert('Failed to load exam data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (isEditMode && editExamId) {
      router.push(`/teacher/exams/${editExamId}`)
    } else {
      router.push('/teacher/dashboard')
    }
  }

  const addSection = () => {
    const newSection: Section = {
      id: Date.now(),
      title: `Section ${sections.length + 1}`,
      description: "",
      questions: [],
      isVisible: true
    }
    setSections([...sections, newSection])
    setActiveSection(newSection.id)
  }

  const addQuestion = (sectionId: number, type: Question["type"]) => {
    const baseQuestion = {
      id: Date.now(),
      type,
      title: `New ${type.toUpperCase()} Question`,
      content: "",
      isVisible: true,
      points: type === "coding" ? 10 : 2,
      hasChanges: true
    }

    let newQuestion: Question

    if (type === "mcq") {
      newQuestion = {
        ...baseQuestion,
        options: ["", "", "", ""],
        correctAnswer: 0
      }
    } else if (type === "coding") {
      newQuestion = {
        ...baseQuestion,
        code: "// Write your code here",
        head: {},
        body_template: {},
        tail: {},
        testCases: [
          {
            id: Date.now(),
            input: "",
            expectedOutput: "",
            isHidden: false,
            weight: 1
          }
        ],
        languages: ["JavaScript", "Python"]
      }
    } else {
      newQuestion = baseQuestion
    }

    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      )
    )
  }

  const updateSection = (sectionId: number, updates: Partial<Section>) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    )
  }

  const updateQuestion = (sectionId: number, questionId: number, updates: Partial<Question>) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map(question =>
                question.id === questionId ? { ...question, ...updates, hasChanges: true } : question
              )
            }
          : section
      )
    )
  }



  const deleteSection = async (sectionId: number) => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all questions in this section.')) {
      return
    }

  setSections(prevSections => prevSections.filter(section => section.id !== sectionId))
    if (activeSection === sectionId) {
      setActiveSection(null)
    }
  }

  const deleteQuestion = async (sectionId: number, questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, questions: section.questions.filter(q => q.id !== questionId) }
        : section
    ))
  }

  const handleSaveExam = async () => {
    if (!examTitle.trim()) {
      setError('Please enter an exam title')
      return
    }

    if (!startTime || !endTime) {
      setError('Please set start and end times for the exam')
      return
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')
    
    try {
      if (isEditMode && editExamId) {
        // Update existing exam - send full data including sections and questions
        logger.log('Updating exam with full data...')
        
        const examData = {
          title: examTitle,
          description: examDescription,
          slug: examSlug,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          duration_minutes: durationMinutes,
          is_published: isPublished,
          test_code: testCode || null,
          test_code_type: testCodeType,
          test_code_rotation_minutes: testCodeRotationMinutes,
          test_code_last_rotated: testCode ? new Date().toISOString() : null,
          strict_level: strictLevel,
          max_tab_switches: maxTabSwitches,
          max_screen_lock_duration: maxScreenLockDuration,
          auto_terminate_on_violations: autoTerminateOnViolations,
          track_tab_switches: trackTabSwitches,
          track_screen_locks: trackScreenLocks,
          detect_vm: detectVm,
          require_single_monitor: requireSingleMonitor,
          allow_zoom_changes: allowZoomChanges,
          sections: sections.map(section => ({
            name: section.title,
            description: section.description,
            questions: section.questions.map(question => ({
              type: question.type,
              title: question.title,
              content: question.content,
              points: question.points,
              ...(question.type === 'mcq' && {
                options: question.options || ["", "", "", ""],
                correctAnswer: question.correctAnswer || 0
              }),
              ...(question.type === 'coding' && {
                head: question.head || {},
                body_template: question.body_template || {},
                tail: question.tail || {},
                languages: question.languages || ["JavaScript", "Python"],
                testCases: (question.testCases || []).map(tc => ({
                  id: tc.id,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  isHidden: tc.isHidden
                }))
              })
            }))
          }))
        }

        logger.log('Sending updated exam data to API:', JSON.stringify(examData, null, 2))

        const examResponse = await fetch(`/api/exams/${editExamId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(examData)
        })

        if (!examResponse.ok) {
          const errorData = await examResponse.json()
          logger.error('Update API Error:', errorData)
          throw new Error(errorData.error || 'Failed to update exam')
        }

        setSuccess('Exam updated successfully!')
        setTimeout(() => {
          router.push(`/teacher/exams/${editExamId}`)
        }, 1500)
      } else {
        // Create new exam - send datetime values directly to API
        logger.log('Frontend date processing:')
        logger.log('startTime input:', startTime)
        logger.log('endTime input:', endTime)
        
        const examData = {
          title: examTitle,
          description: examDescription,
          examUrl: examSlug || `exam-${examTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          duration_minutes: durationMinutes,
          is_published: isPublished,
          test_code: testCode || null,
          test_code_type: testCodeType,
          test_code_rotation_minutes: testCodeRotationMinutes,
          test_code_last_rotated: testCode ? new Date().toISOString() : null,
          strict_level: strictLevel,
          max_tab_switches: maxTabSwitches,
          max_screen_lock_duration: maxScreenLockDuration,
          auto_terminate_on_violations: autoTerminateOnViolations,
          track_tab_switches: trackTabSwitches,
          track_screen_locks: trackScreenLocks,
          detect_vm: detectVm,
          require_single_monitor: requireSingleMonitor,
          allow_zoom_changes: allowZoomChanges,
          sections: sections.map(section => ({
            name: section.title,
            questions: section.questions.map(question => ({
              type: question.type,
              title: question.title,
              content: question.content,
              points: question.points,
              ...(question.type === 'mcq' && {
                options: question.options || ["", "", "", ""],
                correctAnswer: question.correctAnswer || 0
              }),
              ...(question.type === 'coding' && {
                head: question.head || {},
                body_template: question.body_template || {},
                tail: question.tail || {},
                languages: question.languages || ["JavaScript", "Python"],
                testCases: (question.testCases || []).map(tc => ({
                  id: tc.id,
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  isHidden: tc.isHidden,
                  weight: tc.weight || 1
                }))
              })
            }))
          }))
        }

        logger.log('Sending exam data to API:', JSON.stringify(examData, null, 2))

        const response = await fetch('/api/exams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(examData)
        })

        if (response.ok) {
          const result = await response.json()
          setSuccess('Exam created successfully!')
          setTimeout(() => {
            router.push(`/teacher/exams/${result.examId}`)
          }, 1500)
        } else {
          const errorData = await response.json()
          logger.error('API Error:', errorData)
          throw new Error(errorData.error || 'Failed to create exam')
        }
      }
    } catch (error) {
      logger.error('Error saving exam:', error)
      setError(`Failed to ${isEditMode ? 'update' : 'create'} exam. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExam = async () => {
    if (!isEditMode || !editExamId) {
      setError('No exam to delete')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this exam? This action cannot be undone and will delete all sections and questions.'
    )

    if (!confirmed) return

    setIsDeleting(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch(`/api/exams/${editExamId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete exam')
      }

      setSuccess('Exam deleted successfully!')
      setTimeout(() => {
        window.location.href = '/teacher/dashboard'
      }, 1500)
      
    } catch (error) {
      logger.error('Error deleting exam:', error)
      setError('Failed to delete exam. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAiGenerated = (generatedSections: Section[]) => {
    // Append generated sections to existing ones
    const newSections = generatedSections.map((s, index) => ({
      ...s,
      id: Date.now() + index, // Ensure unique numeric IDs
      isVisible: true,
      questions: s.questions.map((q, qIndex) => ({
        ...q,
        id: Date.now() + index * 100 + qIndex, // Ensure unique numeric IDs
        isVisible: true,
        hasChanges: false,
        // Ensure test cases have IDs if they exist
        testCases: (q.testCases || []).map((tc, tcIndex) => ({
          ...tc,
          id: tc.id || (Date.now() + index * 100 + qIndex + tcIndex + 10000)
        }))
      }))
    }));
    
    setSections([...sections, ...newSections]);
    setSuccess("Exam content generated successfully!");
    
    // Auto-select the first new section
    if (newSections.length > 0) {
      setActiveSection(newSections[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Loading overlay for edit mode */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exam data...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-blue-900">
                {isEditMode ? 'Edit Exam' : 'Create Exam'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => setShowAiModal(true)}
                className="bg-gradient-to-r from-indigo-50 to-blue-50 border-blue-200 text-blue-700 hover:from-indigo-100 hover:to-blue-100"
              >
                <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                Generate with AI
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowPreview(true)}
                disabled={!examTitle || sections.length === 0}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSaveExam} 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Update Exam' : 'Save Exam'}
                  </>
                )}
              </Button>
              {isEditMode && (
                <Button 
                  onClick={handleDeleteExam} 
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Exam
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Messages */}
      {(error || success) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Exam Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 sticky top-4">
              <CardHeader>
                <CardTitle className="text-blue-900">Exam Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b mb-4 cursor-pointer" onClick={() => setIsExamInfoCollapsed(!isExamInfoCollapsed)}>
                  <span className="text-sm font-medium text-gray-500">
                    {isExamInfoCollapsed ? "Show Details" : "Hide Details"}
                  </span>
                  {isExamInfoCollapsed ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
                </div>

                {!isExamInfoCollapsed && (
                  <div className="space-y-4">
                    <div>
                      <Label>Exam Title</Label>
                  <Input
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Enter exam title"
                  />
                </div>
                <div>
                  <Label>Exam URL Slug</Label>
                  <Input
                    value={examSlug}
                    onChange={(e) => setExamSlug(e.target.value)}
                    placeholder="exam-url-slug (leave empty for auto-generation)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for the public exam URL. Leave empty to auto-generate from title.
                  </p>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="Enter exam description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                    placeholder="60"
                  />
                </div>

                {/* Test Code Settings */}
                <div className="space-y-3 pt-3 border-t">
                  <Label className="text-base font-semibold">Test Code Authentication</Label>
                  <div>
                    <Label>Test Code (Optional)</Label>
                    <Input
                      type="text"
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                      placeholder="e.g., EXAM2024"
                      className="uppercase"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Students must enter this code to access the exam
                    </p>
                  </div>
                  {testCode && (
                    <>
                      <div>
                        <Label>Test Code Type</Label>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={testCodeType === "permanent"}
                              onChange={() => setTestCodeType("permanent")}
                              className="h-4 w-4 text-purple-600"
                            />
                            <span className="text-sm">Permanent</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={testCodeType === "rotating"}
                              onChange={() => setTestCodeType("rotating")}
                              className="h-4 w-4 text-purple-600"
                            />
                            <span className="text-sm">Rotating</span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {testCodeType === "permanent" 
                            ? "Test code remains the same throughout the exam period" 
                            : "Test code changes automatically after specified duration"}
                        </p>
                      </div>
                      {testCodeType === "rotating" && (
                        <div>
                          <Label>Rotation Interval (minutes)</Label>
                          <Input
                            type="number"
                            value={testCodeRotationMinutes}
                            onChange={(e) => setTestCodeRotationMinutes(parseInt(e.target.value) || 60)}
                            placeholder="60"
                            min="5"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Test code will change every {testCodeRotationMinutes} minutes
                          </p>
                        </div>
                      )}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Current Test Code:</strong> <code className="font-mono bg-white px-2 py-1 rounded">{testCode}</code>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          This code will be displayed below each exam in your dashboard
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Monitoring & Security Settings */}
                <div className="space-y-3 pt-3 border-t">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Monitoring & Security
                  </Label>
                  
                  <div>
                    <Label>Strict Level</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setStrictLevel(1)}
                        className={`p-2 text-xs rounded border ${
                          strictLevel === 1 
                            ? 'bg-green-100 border-green-500 text-green-800' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="font-semibold">Level 1</div>
                        <div className="text-[10px]">Relaxed</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStrictLevel(2)}
                        className={`p-2 text-xs rounded border ${
                          strictLevel === 2 
                            ? 'bg-yellow-100 border-yellow-500 text-yellow-800' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="font-semibold">Level 2</div>
                        <div className="text-[10px]">Medium</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStrictLevel(3)}
                        className={`p-2 text-xs rounded border ${
                          strictLevel === 3 
                            ? 'bg-red-100 border-red-500 text-red-800' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="font-semibold">Level 3</div>
                        <div className="text-[10px]">Strict</div>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {strictLevel === 1 && "Basic monitoring only, no restrictions"}
                      {strictLevel === 2 && "Active monitoring with warnings"}
                      {strictLevel === 3 && "Full lockdown with auto-termination"}
                    </p>
                  </div>

                  <div>
                    <Label>Max Tab Switches</Label>
                    <Input
                      type="number"
                      value={maxTabSwitches}
                      onChange={(e) => setMaxTabSwitches(parseInt(e.target.value) || 3)}
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum allowed before warnings/termination
                    </p>
                  </div>

                  <div>
                    <Label>Max Screen Lock (seconds)</Label>
                    <Input
                      type="number"
                      value={maxScreenLockDuration}
                      onChange={(e) => setMaxScreenLockDuration(parseInt(e.target.value) || 30)}
                      min="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum duration before flagged as suspicious
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Track Tab Switches</Label>
                      <Switch
                        checked={trackTabSwitches}
                        onCheckedChange={setTrackTabSwitches}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Track Screen Locks</Label>
                      <Switch
                        checked={trackScreenLocks}
                        onCheckedChange={setTrackScreenLocks}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Detect Virtual Machine</Label>
                      <Switch
                        checked={detectVm}
                        onCheckedChange={setDetectVm}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Require Single Monitor</Label>
                      <Switch
                        checked={requireSingleMonitor}
                        onCheckedChange={setRequireSingleMonitor}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Allow Zoom Changes</Label>
                      <Switch
                        checked={allowZoomChanges}
                        onCheckedChange={setAllowZoomChanges}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-Terminate on Violations</Label>
                      <Switch
                        checked={autoTerminateOnViolations}
                        onCheckedChange={setAutoTerminateOnViolations}
                      />
                    </div>
                  </div>

                  {strictLevel >= 2 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <strong>Monitoring Active:</strong> Students will be monitored for suspicious activity in the Electron app.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-3 border-t">
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label>Published</Label>
                </div>
                  </div>
                )}
                <div className="pt-4">
                  <Button
                    onClick={addSection}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>
                
                {/* Sections List */}
                <SectionList
                  sections={sections}
                  activeSectionId={activeSection}
                  onSelectSection={setActiveSection}
                  onAddSection={addSection}
                  onDeleteSection={deleteSection}
                />
              </CardContent>
            </Card>
          </div>

          {/* Section Editor */}
          <div className="lg:col-span-3">
            <ContentEditor
              activeSection={sections.find(s => s.id === activeSection)}
              onUpdateSection={(updates) => activeSection && updateSection(activeSection, updates)}
              onDeleteSection={() => activeSection && deleteSection(activeSection)}
              onAddQuestion={(type) => activeSection && addQuestion(activeSection, type)}
              onUpdateQuestion={(qId, updates) => activeSection && updateQuestion(activeSection, qId, updates)}
              onDeleteQuestion={(qId) => activeSection && deleteQuestion(activeSection, qId)}
              expandedQuestionId={expandedQuestionId}
              setExpandedQuestionId={setExpandedQuestionId}
            />
          </div>
        </div>
      </div>

      {/* Exam Preview Modal */}
      {showPreview && (
        <ExamPreview
          examTitle={examTitle}
          examDescription={examDescription}
          durationMinutes={durationMinutes}
          sections={sections.map(section => ({
            id: section.id,
            title: section.title,
            description: section.description,
            questions: section.questions.map(question => ({
              id: question.id,
              type: question.type,
              title: question.title,
              content: question.content,
              points: question.points,
              ...(question.type === 'mcq' && {
                options: question.options || [],
                correctAnswer: question.correctAnswer
              }),
              ...(question.type === 'coding' && {
                code: question.code,
                head: question.head || {},
                body_template: question.body_template || {},
                tail: question.tail || {},
                testCases: question.testCases || [],
                languages: question.languages || []
              })
            }))
          }))}
          onClose={() => setShowPreview(false)}
        />
      )}

      <GenerateExamModal 
        open={showAiModal} 
        onOpenChange={setShowAiModal} 
        onExamGenerated={handleAiGenerated} 
      />
    </div>
  )
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CreateExamPageContent />
    </Suspense>
  )
}
