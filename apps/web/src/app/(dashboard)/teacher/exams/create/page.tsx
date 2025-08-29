
"use client"

import { RichTextPreview } from '@/components/editors/RichTextEditor'
import { CodeEditor } from '@/components/editors/CodeEditor'

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from '@/components/editors/RichTextEditor'
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Save, Eye, EyeOff, Code, CheckCircle, Trash2, Settings } from 'lucide-react'

interface Question {
  id: number
  type: "mcq" | "coding"
  title: string
  content: string
  options?: string[]
  correctAnswer?: string | number
  code?: string
  head?: string
  body_template?: string
  tail?: string
  testCases?: TestCase[]
  languages?: string[]
  isVisible: boolean
  points: number
  hasChanges?: boolean
}

interface TestCase {
  id: number
  input: string
  expectedOutput: string
  isHidden: boolean
  weight?: number
}

interface Section {
  id: number
  title: string
  description: string
  questions: Question[]
  isVisible: boolean
}

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
  const [isPublished, setIsPublished] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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
      
      console.log('Loaded exam data for editing:', exam)
      
      setExamTitle(exam.title)
      setExamDescription(exam.description || "")
      setExamSlug(exam.slug || "")
      setIsPublished(exam.is_published || false)
      setDurationMinutes(exam.duration_minutes || 60)
      
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
        console.log('Converting exam sections:', exam.exam_sections)
        const convertedSections: Section[] = exam.exam_sections.map((section: any) => {
          console.log('Processing section:', section)
          const questions: Question[] = section.exam_questions.map((examQuestion: any) => {
            const question = examQuestion.question
            console.log('Processing question:', question)
            
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
              // Handle boilerplate code format
              if (typeof codingData.boilerplate_code === 'object') {
                baseQuestion.code = codingData.boilerplate_code?.javascript || 
                                  codingData.boilerplate_code?.python || 
                                  Object.values(codingData.boilerplate_code)[0] || 
                                  "// Write your code here"
              } else {
                baseQuestion.code = codingData.boilerplate_code || "// Write your code here"
              }
              baseQuestion.languages = Array.isArray(codingData.allowed_languages) ? 
                                     codingData.allowed_languages : 
                                     ["JavaScript", "Python"]
              baseQuestion.testCases = Array.isArray(codingData.test_cases) ?
                                     codingData.test_cases.map((tc: any, index: number) => ({
                                       id: index,
                                       input: tc.input || "",
                                       expectedOutput: tc.expected_output || "",
                                       isHidden: tc.is_hidden || false
                                     })) : []
            } else if (question.type === 'coding') {
              baseQuestion.code = "// Write your code here"
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
      console.error('Error loading exam data:', error)
      alert('Failed to load exam data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
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

  const addTestCase = (sectionId: number, questionId: number) => {
    const newTestCase: TestCase = {
      id: Date.now(),
      input: "",
      expectedOutput: "",
      isHidden: true,
      weight: 1
    }

    updateQuestion(sectionId, questionId, {
      testCases: [
        ...(sections.find(s => s.id === sectionId)?.questions.find(q => q.id === questionId)?.testCases || []),
        newTestCase
      ]
    })
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
        // Update existing exam - use the existing PATCH endpoint
        const examResponse = await fetch(`/api/exams/${editExamId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: examTitle,
            description: examDescription,
            slug: examSlug,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            duration_minutes: durationMinutes,
            is_published: isPublished
          })
        })

        if (!examResponse.ok) {
          throw new Error('Failed to update exam')
        }

        setSuccess('Exam updated successfully!')
        setTimeout(() => {
          router.push(`/teacher/exams/${editExamId}`)
        }, 1500)
      } else {
        // Create new exam - send datetime values directly to API
        console.log('Frontend date processing:')
        console.log('startTime input:', startTime)
        console.log('endTime input:', endTime)
        
        const examData = {
          title: examTitle,
          description: examDescription,
          examUrl: examSlug || `exam-${examTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          duration_minutes: durationMinutes,
          is_published: isPublished,
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
                head: question.head || "",
                body_template: question.body_template || question.code || "// Write your code here",
                tail: question.tail || "",
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

        console.log('Sending exam data to API:', JSON.stringify(examData, null, 2))

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
          console.error('API Error:', errorData)
          throw new Error(errorData.error || 'Failed to create exam')
        }
      }
    } catch (error) {
      console.error('Error saving exam:', error)
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
      console.error('Error deleting exam:', error)
      setError('Failed to delete exam. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderQuestionEditor = (section: Section, question: Question) => {
    return (
      <Card key={question.id} className="border-blue-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Badge variant={question.type === "mcq" ? "default" : "secondary"}>
                {question.type.toUpperCase()}
              </Badge>
              <Input
                value={question.title}
                onChange={(e) => updateQuestion(section.id, question.id, { title: e.target.value })}
                className="font-medium"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={question.points}
                onChange={(e) => updateQuestion(section.id, question.id, { points: parseInt(e.target.value) || 1 })}
                className="w-20"
                placeholder="Points"
              />
              <Switch
                checked={question.isVisible}
                onCheckedChange={(checked) => updateQuestion(section.id, question.id, { isVisible: checked })}
              />
              {question.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteQuestion(section.id, question.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Question Content</Label>
            <RichTextEditor
              value={question.content}
              onChange={(val) => updateQuestion(section.id, question.id, { content: val })}
              placeholder="Enter your question here..."
              height={160}
              toolbar="full"
            />
            <div className="mt-4">
              <RichTextPreview content={question.content} />
            </div>
          </div>

          {question.type === "mcq" && (
            <div className="space-y-3">
              <Label>Options</Label>
              {(question.options || ["", "", "", ""]).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || ["", "", "", ""])]
                      newOptions[index] = e.target.value
                      updateQuestion(section.id, question.id, { options: newOptions })
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Switch
                    checked={question.correctAnswer === index}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateQuestion(section.id, question.id, { correctAnswer: index })
                      }
                    }}
                  />
                  <Label className="text-sm">Correct</Label>
                </div>
              ))}
            </div>
          )}

          {question.type === "coding" && (
            <div className="space-y-4">
              <div>
                <Label>Allowed Programming Languages</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {programmingLanguages.map((lang) => (
                    <Badge
                      key={lang}
                      variant={(question.languages || []).includes(lang) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentLangs = question.languages || ["JavaScript", "Python"]
                        const newLangs = currentLangs.includes(lang)
                          ? currentLangs.filter(l => l !== lang)
                          : [...currentLangs, lang]
                        updateQuestion(section.id, question.id, { languages: newLangs })
                      }}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Code Problem Setup</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Head (optional)</Label>
                    <CodeEditor
                      value={question.head || ""}
                      onChange={val => updateQuestion(section.id, question.id, { head: val })}
                      placeholder="// Setup code (e.g. imports, function signature)"
                      height={120}
                    />
                  </div>
                  <div>
                    <Label>Body Template</Label>
                    <CodeEditor
                      value={question.body_template || ""}
                      onChange={val => updateQuestion(section.id, question.id, { body_template: val })}
                      placeholder="// Main code area for student"
                      height={120}
                    />
                  </div>
                  <div>
                    <Label>Tail (optional)</Label>
                    <CodeEditor
                      value={question.tail || ""}
                      onChange={val => updateQuestion(section.id, question.id, { tail: val })}
                      placeholder="// Code to run after student code (e.g. output checks)"
                      height={120}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label>Test Cases</Label>
                  <Button
                    size="sm"
                    onClick={() => addTestCase(section.id, question.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Test Case
                  </Button>
                </div>
                <div className="space-y-3 mt-2">
                  {(question.testCases || []).map((testCase, index) => (
                    <Card key={testCase.id} className="p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Input</Label>
                          <Textarea
                            value={testCase.input}
                            onChange={(e) => {
                              const newTestCases = (question.testCases || []).map(tc =>
                                tc.id === testCase.id ? { ...tc, input: e.target.value } : tc
                              )
                              updateQuestion(section.id, question.id, { testCases: newTestCases })
                            }}
                            rows={2}
                            className="font-mono text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Expected Output</Label>
                          <Textarea
                            value={testCase.expectedOutput}
                            onChange={(e) => {
                              const newTestCases = (question.testCases || []).map(tc =>
                                tc.id === testCase.id ? { ...tc, expectedOutput: e.target.value } : tc
                              )
                              updateQuestion(section.id, question.id, { testCases: newTestCases })
                            }}
                            rows={2}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={testCase.isHidden}
                            onCheckedChange={(checked) => {
                              const newTestCases = (question.testCases || []).map(tc =>
                                tc.id === testCase.id ? { ...tc, isHidden: checked } : tc
                              )
                              updateQuestion(section.id, question.id, { testCases: newTestCases })
                            }}
                          />
                          <Label className="text-xs">Hidden from students</Label>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newTestCases = (question.testCases || []).filter(tc => tc.id !== testCase.id)
                            updateQuestion(section.id, question.id, { testCases: newTestCases })
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

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
              <Button variant="outline">
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
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label>Published</Label>
                </div>
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
                <div className="space-y-2">
                  <Label>Sections ({sections.length})</Label>
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`p-2 rounded border cursor-pointer ${
                        activeSection === section.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{section.title}</span>
                        <div className="flex items-center space-x-1">
                          {section.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <Badge variant="outline" className="text-xs">
                            {section.questions.length}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Editor */}
          <div className="lg:col-span-3">
            {activeSection ? (
              <div className="space-y-6">
                {sections
                  .filter(section => section.id === activeSection)
                  .map(section => (
                    <div key={section.id}>
                      {/* Section Header */}
                      <Card className="border-blue-200">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-blue-900">Section Settings</CardTitle>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={section.isVisible}
                                onCheckedChange={(checked) => updateSection(section.id, { isVisible: checked })}
                              />
                              {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteSection(section.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Section Title</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              placeholder="Enter section title"
                            />
                          </div>
                          <div>
                            <Label>Section Description</Label>
                            <Textarea
                              value={section.description}
                              onChange={(e) => updateSection(section.id, { description: e.target.value })}
                              placeholder="Enter section description"
                              rows={2}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => addQuestion(section.id, "mcq")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              MCQ Question
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => addQuestion(section.id, "coding")}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Code className="w-4 h-4 mr-1" />
                              Coding Question
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Questions */}
                      <div className="space-y-4">
                        {section.questions.map(question => renderQuestionEditor(section, question))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <Card className="border-blue-200">
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Section Selected</h3>
                    <p className="text-gray-500">Select a section from the sidebar to start editing, or create a new section.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
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
