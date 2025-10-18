"use client";
import React from "react";
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from '@/components/editors/RichTextEditor'
import { CodeEditor } from '@/components/editors/CodeEditor'
import { CodeTemplateRow } from '@/components/coding'
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Save, Eye, EyeOff, Code, FileText, Trash2, Settings, Users, Mail } from 'lucide-react'

import { logger } from '@/lib/utils/logger'

// Using shared CodeTemplateRow from @/components/coding

interface Question {
  id: number;
  type: "mcq" | "coding" | "essay" | "reading";
  title: string;
  content: string;
  options?: string[];
  correctAnswer?: string | number;
  code?: string;
  head?: Record<string, string>; // per-language
  body_template?: Record<string, string>; // per-language
  tail?: Record<string, string>; // per-language
  testCases?: TestCase[];
  languages?: string[];
  isVisible: boolean;
  points: number;
  hasChanges?: boolean;
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

function CreateCoursePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editCourseId = searchParams.get('edit')
  const isEditMode = !!editCourseId
  
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [sections, setSections] = useState<Section[]>([])
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [studentEmails, setStudentEmails] = useState("")
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Load existing course data if in edit mode
  useEffect(() => {
    if (isEditMode && editCourseId) {
      loadCourseData(editCourseId)
    }
  }, [isEditMode, editCourseId])

  const loadCourseData = async (courseId: string) => {
    try {
      setIsLoading(true)
      
      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`)
      if (!courseResponse.ok) throw new Error('Failed to fetch course')
      const courseData = await courseResponse.json()
      
      setCourseTitle(courseData.title)
      setCourseDescription(courseData.description || "")

      // Fetch course sections
      const sectionsResponse = await fetch(`/api/courses/${courseId}/sections`)
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json()
        
        // Convert sections data to the format expected by the UI
        const convertedSections: Section[] = await Promise.all(
          sectionsData.map(async (section: any) => {
            // For each question, fetch its detailed data
            const questionsWithDetails = await Promise.all(
              section.questions.map(async (question: any) => {
                try {
                  // Fetch question details including MCQ options and coding details
                  let questionDetails: Question = {
                    id: question.id,
                    type: question.type,
                    title: question.title,
                    content: question.description || "",
                    points: question.points,
                    isVisible: question.is_published,
                    hasChanges: false
                  }

                  if (question.type === 'mcq') {
                    // Fetch MCQ details
                    const mcqResponse = await fetch(`/api/questions/${question.id}/mcq`)
                    if (mcqResponse.ok) {
                      const mcqData = await mcqResponse.json()
                      questionDetails.options = mcqData.options || ["", "", "", ""]
                      questionDetails.correctAnswer = Array.isArray(mcqData.correct_answers) ? mcqData.correct_answers[0] : 0
                    } else {
                      // Default MCQ structure
                      questionDetails.options = ["", "", "", ""]
                      questionDetails.correctAnswer = 0
                    }
                  } else if (question.type === 'coding') {
                    // Fetch coding details
                    const codingResponse = await fetch(`/api/questions/${question.id}/coding`)
                    if (codingResponse.ok) {
                      const codingData = await codingResponse.json()
                      questionDetails.code = codingData.boilerplate_code?.javascript || "// Write your code here"
                      questionDetails.languages = codingData.allowed_languages || ["JavaScript", "Python"]
                      // Convert test cases format from API to frontend format
                      questionDetails.testCases = (codingData.test_cases || []).map((tc: any, index: number) => ({
                        id: tc.id || index + 1,
                        input: tc.input || "",
                        expectedOutput: tc.expected_output || "",
                        isHidden: tc.is_hidden || false,
                        weight: tc.weight || 1
                      }))
                      // Load head/body_template/tail for each language (default to javascript)
                      questionDetails.head = typeof codingData.head === 'object' && codingData.head !== null ? codingData.head : {};
                      questionDetails.body_template = typeof codingData.body_template === 'object' && codingData.body_template !== null ? codingData.body_template : {};
                      questionDetails.tail = typeof codingData.tail === 'object' && codingData.tail !== null ? codingData.tail : {};
                    } else {
                      // Default coding structure
                      questionDetails.code = "// Write your code here"
                      questionDetails.languages = ["JavaScript", "Python"]
                      questionDetails.testCases = []
                    }
                  }

                  return questionDetails
                } catch (error) {
                  logger.error('Error loading question details:', error)
                  // Return basic question data if detailed fetch fails
                  return {
                    id: question.id,
                    type: question.type,
                    title: question.title,
                    content: question.description || "",
                    points: question.points,
                    isVisible: question.is_published,
                    ...(question.type === 'mcq' && {
                      options: ["", "", "", ""],
                      correctAnswer: 0
                    }),
                    ...(question.type === 'coding' && {
                      code: "// Write your code here",
                      languages: ["JavaScript", "Python"],
                      testCases: [],
                      head: {},
                      body_template: {},
                      tail: {},
                    })
                  }
                }
              })
            )

            return {
              id: section.id,
              title: section.title,
              description: section.description || "",
              isVisible: section.is_published,
              questions: questionsWithDetails
            }
          })
        )
        
        setSections(convertedSections)
        if (convertedSections.length > 0) {
          setActiveSection(convertedSections[0].id)
        }
      }
    } catch (error) {
      logger.error('Error loading course data:', error)
      alert('Failed to load course data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (isEditMode && editCourseId) {
      router.push(`/teacher/courses/${editCourseId}`)
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
  setSections(prev => [...prev, newSection])
    setActiveSection(newSection.id)
  }

  const addQuestion = (sectionId: number, type: Question["type"]) => {
    const baseQuestion = {
      id: Date.now(),
      type,
      title: `New ${type.toUpperCase()} Question`,
      content: "",
      isVisible: true,
      points: type === "coding" ? 10 : type === "mcq" ? 2 : 5,
      hasChanges: true // New questions should be marked as having changes
    }

    let newQuestion: Question

    if (type === "mcq") {
      newQuestion = {
        ...baseQuestion,
        options: ["", "", "", ""],
        correctAnswer: 0
      };
    } else if (type === "coding") {
      newQuestion = {
        ...baseQuestion,
        head: {},
        body_template: {},
        tail: {},
        code: "// Write your code here", // legacy
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
      };
    } else {
      newQuestion = baseQuestion;
    }

    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, questions: [...section.questions, newQuestion] }
        : section
    ))
  }

  const updateSection = (sectionId: number, updates: Partial<Section>) => {
    setSections(prev => {
      let changed = false
      const next = prev.map(section => {
        if (section.id !== sectionId) return section
        const merged = { ...section, ...updates }
        // shallow compare
        const isEqual = Object.keys(merged).every(k => (merged as any)[k] === (section as any)[k])
        if (!isEqual) changed = true
        return merged
      })
      return changed ? next : prev
    })
  }

  const updateQuestion = (sectionId: number, questionId: number, updates: Partial<Question>) => {
    setSections(prev => {
      let changed = false
      const next = prev.map(section => {
        if (section.id !== sectionId) return section
        const nextQuestions = section.questions.map(question => {
          if (question.id !== questionId) return question
          const merged = { ...question, ...updates }
          // Ensure hasChanges is set only if something actually changed
          const keys = Object.keys(updates) as (keyof Question)[]
          const didChange = keys.some(k => (merged as any)[k] !== (question as any)[k])
          if (didChange && !merged.hasChanges) merged.hasChanges = true
          if (didChange) changed = true
          return merged
        })
        if (changed) {
          return { ...section, questions: nextQuestions }
        }
        return section
      })
      return changed ? next : prev
    })
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
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this section? This will also delete all questions in this section.')) {
      return
    }

    // If editing an existing course and this is an existing section (not a timestamp ID)
    if (isEditMode && editCourseId && typeof sectionId === 'string') {
      try {
        const response = await fetch(`/api/sections/${sectionId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete section from database')
        }

        logger.log('Section deleted from database successfully')
      } catch (error) {
        logger.error('Error deleting section from database:', error)
        alert('Failed to delete section from database. Please try again.')
        return
      }
    }

    // Remove from local state
    setSections(sections.filter(section => section.id !== sectionId))
    if (activeSection === sectionId) {
      setActiveSection(null)
    }
  }

  const deleteQuestion = async (sectionId: number, questionId: number) => {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    // If editing an existing course and this is an existing question (not a timestamp ID)
    if (isEditMode && editCourseId && typeof questionId === 'string') {
      try {
        const response = await fetch(`/api/questions/${questionId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete question from database')
        }

        logger.log('Question deleted from database successfully')
      } catch (error) {
        logger.error('Error deleting question from database:', error)
        alert('Failed to delete question from database. Please try again.')
        return
      }
    }

    // Remove from local state
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, questions: section.questions.filter(q => q.id !== questionId) }
        : section
    ))
  }

  const handleSaveCourse = async () => {
    if (!courseTitle.trim()) {
      setError('Please enter a course title')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')
    
    try {
      if (isEditMode && editCourseId) {
        // Update existing course
        const courseResponse = await fetch(`/api/courses/${editCourseId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: courseTitle,
            description: courseDescription
          })
        })

        if (!courseResponse.ok) {
          throw new Error('Failed to update course')
        }

        // Process sections: update existing ones and create new ones
        for (const section of sections) {
          const isNewSection = typeof section.id === 'number' && section.id > 1000000000
          
          if (isNewSection) {
            // Create new section
            const sectionData = {
              title: section.title,
              description: section.description,
              order_index: sections.indexOf(section),
              questions: section.questions.map(question => ({
                type: question.type,
                title: question.title,
                description: question.content,
                points: question.points,
                isVisible: question.isVisible,
                ...(question.type === 'mcq' && {
                  options: question.options || ["", "", "", ""],
                  correctAnswer: question.correctAnswer || 0
                }),
                ...(question.type === 'coding' && {
                  code: question.code || "// Write your code here",
                  languages: question.languages || ["JavaScript", "Python"],
                  testCases: question.testCases || []
                })
              }))
            }

            const sectionResponse = await fetch(`/api/courses/${editCourseId}/sections`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(sectionData)
            })

            if (!sectionResponse.ok) {
              logger.error('Failed to create section:', section.title)
            }
          } else {
            // Update existing section
            const sectionData = {
              title: section.title,
              description: section.description,
              order_index: sections.indexOf(section),
              is_published: section.isVisible
            }

            const sectionResponse = await fetch(`/api/sections/${section.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(sectionData)
            })

            if (!sectionResponse.ok) {
              logger.error('Failed to update section:', section.title)
            }

            // Handle questions in existing sections
            for (const question of section.questions) {
              const isNewQuestion = typeof question.id === 'number' && question.id > 1000000000

              if (isNewQuestion) {
                // Create new question in existing section
                const questionData = {
                  type: question.type,
                  title: question.title,
                  description: question.content,
                  points: question.points,
                  order_index: section.questions.indexOf(question)
                }

                const questionResponse = await fetch('/api/questions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    ...questionData,
                    section_id: section.id
                  })
                })

                if (!questionResponse.ok) {
                  logger.error('Failed to create question:', question.title)
                } else {
                  // After successfully creating the question, create type-specific data
                  const createdQuestion = await questionResponse.json()
                  
                  if (question.type === 'mcq' && question.options && question.correctAnswer !== undefined) {
                    const correctAnswer = typeof question.correctAnswer === 'string' 
                      ? parseInt(question.correctAnswer) || 0 
                      : question.correctAnswer || 0
                    
                    await fetch(`/api/questions/${createdQuestion.id}/mcq`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        options: question.options || ["", "", "", ""],
                        correct_answers: [correctAnswer],
                        is_multiple_choice: false,
                        question_text: question.content || "",
                        rich_question_text: question.content || ""
                      })
                    })
                  } else if (question.type === 'coding' && question.testCases) {
                    const testCases = (question.testCases || []).map(tc => ({
                      input: tc.input || "",
                      expected_output: tc.expectedOutput || "",
                      is_hidden: tc.isHidden || false,
                      weight: tc.weight || 1
                    }))
                    
                    await fetch(`/api/questions/${createdQuestion.id}/coding`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        problem_statement: question.content || "",
                        rich_problem_statement: question.content || "",
                        test_cases: testCases,
                        allowed_languages: question.languages || ["javascript", "python"]
                      })
                    })
                  } else if (question.type === 'essay') {
                    await fetch(`/api/questions/${createdQuestion.id}/essay`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        prompt: question.content || "",
                        rich_prompt: question.content || ""
                      })
                    })
                  }
                }
              } else if (question.hasChanges) {
                // Update existing question only if it has changes
                const questionData = {
                  title: question.title,
                  description: question.content,
                  points: question.points,
                  is_published: question.isVisible,
                  order_index: section.questions.indexOf(question)
                }

                const questionResponse = await fetch(`/api/questions/${question.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(questionData)
                })

                if (questionResponse.ok) {
                  // Update question type-specific data
                  if (question.type === 'mcq') {
                    const correctAnswer = typeof question.correctAnswer === 'string' 
                      ? parseInt(question.correctAnswer) || 0 
                      : question.correctAnswer || 0
                    
                    const mcqData = {
                      options: question.options || ["", "", "", ""],
                      correct_answers: [correctAnswer],
                      is_multiple_choice: false,
                      question_text: question.content || "",
                      rich_question_text: question.content || ""
                    }

                    await fetch(`/api/questions/${question.id}/mcq`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(mcqData)
                    })
                  } else if (question.type === 'coding') {
                    // Convert test cases format from frontend to API format
                    const testCases = (question.testCases || []).map(tc => ({
                      input: tc.input || "",
                      expected_output: tc.expectedOutput || "",
                      is_hidden: tc.isHidden || false,
                      weight: tc.weight || 1
                    }))
                    
                    // Always save all languages from programmingLanguages for head/body_template/tail
                    const allLangs = programmingLanguages;
                    const headObj: Record<string, string> = {};
                    const bodyTemplateObj: Record<string, string> = {};
                    const tailObj: Record<string, string> = {};
                    allLangs.forEach(lang => {
                      headObj[lang.toLowerCase()] = (question.head && typeof question.head === 'object' ? question.head[lang.toLowerCase()] : "") || "";
                      bodyTemplateObj[lang.toLowerCase()] = (question.body_template && typeof question.body_template === 'object' ? question.body_template[lang.toLowerCase()] : "") || "";
                      tailObj[lang.toLowerCase()] = (question.tail && typeof question.tail === 'object' ? question.tail[lang.toLowerCase()] : "") || "";
                    });
                    const codingData = {
                      problem_statement: question.content || "",
                      rich_problem_statement: question.content || "",
                      boilerplate_code: { 
                        javascript: question.code || "// Write your code here",
                        python: (question.code || "# Write your code here").replace(/\//g, '#').replace(/function|{|}/g, '').trim()
                      },
                      allowed_languages: question.languages && question.languages.length > 0 ? question.languages : programmingLanguages,
                      test_cases: testCases,
                      head: headObj,
                      body_template: bodyTemplateObj,
                      tail: tailObj
                    }

                    const codingResponse = await fetch(`/api/questions/${question.id}/coding`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(codingData)
                    })
                    
                    if (!codingResponse.ok) {
                      const errorData = await codingResponse.text()
                      logger.error('Coding update error:', errorData)
                    }
                  } else if (question.type === 'essay') {
                    // Handle essay question updates
                    const essayData = {
                      prompt: question.content || "",
                      rich_prompt: question.content || "",
                      min_words: 0,
                      max_words: null,
                      time_limit_minutes: null,
                      rubric: null,
                      enable_ai_feedback: false,
                      ai_model_settings: {}
                    }

                    await fetch(`/api/questions/${question.id}/essay`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(essayData)
                    })
                  }
                  
                  // Clear the hasChanges flag after successful update
                  updateQuestion(section.id, question.id, { hasChanges: false })
                } else {
                  logger.error('Failed to update question:', question.title)
                }
              }
            }
          }
        }

        setSuccess('Course updated successfully!')
        setTimeout(() => {
          router.push(`/teacher/courses/${editCourseId}`)
        }, 1500)
      } else {
        // Create new course
        const courseData = {
          title: courseTitle,
          description: courseDescription,
          sections: sections.map(section => ({
            title: section.title,
            description: section.description,
            isVisible: section.isVisible,
            questions: section.questions.map(question => ({
              type: question.type,
              title: question.title,
              content: question.content,
              points: question.points,
              isVisible: question.isVisible,
              ...(question.type === 'mcq' && {
                options: question.options,
                correctAnswer: question.correctAnswer
              }),
              ...(question.type === 'coding' && {
                code: question.code,
                languages: question.languages,
                testCases: question.testCases
              })
            }))
          }))
        }

        const response = await fetch('/api/teacher/create-course', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(courseData)
        })

        if (response.ok) {
          const result = await response.json()
          setSuccess('Course created successfully!')
          setTimeout(() => {
            router.push(`/teacher/courses/${result.courseId}`)
          }, 1500)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create course')
        }
      }
    } catch (error) {
      logger.error('Error saving course:', error)
      setError(`Failed to ${isEditMode ? 'update' : 'create'} course. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCourse = async () => {
    if (!isEditMode || !editCourseId) {
      setError('No course to delete')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this course? This action cannot be undone and will delete all sections, questions, and student progress.'
    )

    if (!confirmed) return

    setIsDeleting(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch(`/api/courses/${editCourseId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete course')
      }

      setSuccess('Course deleted successfully!')
      setTimeout(() => {
        window.location.href = '/teacher/dashboard'
      }, 1500)
      
    } catch (error) {
      logger.error('Error deleting course:', error)
      setError('Failed to delete course. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEnrollStudents = async () => {
    if (!isEditMode || !editCourseId || !studentEmails.trim()) {
      alert('Please enter student emails')
      return
    }

    setEnrolling(true)
    try {
      // Parse emails from textarea (split by newlines, commas, or spaces)
      const emails = studentEmails
        .split(/[\n,\s]+/)
        .map(email => email.trim())
        .filter(email => email.length > 0)

      if (emails.length === 0) {
        alert('Please enter valid email addresses')
        return
      }

      const response = await fetch(`/api/courses/${editCourseId}/bulk-enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emails })
      })

      if (response.ok) {
        const results = await response.json()
        
        let message = ''
        const successful = results.results.filter((r: any) => r.success)
        const failed = results.results.filter((r: any) => !r.success)
        
        if (successful.length > 0) {
          message += `✅ Successfully enrolled (${successful.length}):\n`
          successful.forEach((r: any) => {
            message += `   • ${r.email}${r.studentName ? ` (${r.studentName})` : ''}\n`
          })
        }
        
        if (failed.length > 0) {
          message += `\n❌ Failed to enroll (${failed.length}):\n`
          failed.forEach((r: any) => {
            message += `   • ${r.email}: ${r.error}\n`
          })
        }

        alert(message || 'No students were processed')
        setStudentEmails("")
        setShowEnrollModal(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enroll students')
      }
    } catch (error) {
      logger.error('Error enrolling students:', error)
      alert('Failed to enroll students. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const renderQuestionEditor = (section: Section, question: Question) => {
    return (
      <Card key={question.id} className="border-blue-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Badge variant={question.type === "mcq" ? "default" : question.type === "coding" ? "secondary" : "outline"}>
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
                <CodeTemplateRow
                  question={question}
                  sectionId={section.id}
                  updateQuestion={updateQuestion}
                  programmingLanguages={programmingLanguages}
                />
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
            <p className="text-gray-600">Loading course data...</p>
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
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-blue-900">
                {isEditMode ? 'Edit Course' : 'Create Course'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {isEditMode && (
                <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      Enroll Students
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enroll Students</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="emails">Student Email Addresses</Label>
                        <Textarea
                          id="emails"
                          value={studentEmails}
                          onChange={(e) => setStudentEmails(e.target.value)}
                          placeholder="Enter student email addresses (one per line or separated by commas)"
                          rows={6}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          You can enter multiple emails separated by new lines, commas, or spaces
                        </p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowEnrollModal(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleEnrollStudents}
                          disabled={enrolling || !studentEmails.trim()}
                        >
                          {enrolling ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Enroll Students
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSaveCourse} 
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
                    {isEditMode ? 'Update Course' : 'Save Course'}
                  </>
                )}
              </Button>
              {isEditMode && (
                <Button 
                  onClick={handleDeleteCourse} 
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
                      Delete Course
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
          {/* Course Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 sticky top-4">
              <CardHeader>
                <CardTitle className="text-blue-900">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Course Title</Label>
                  <Input
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Enter course title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Enter course description"
                    rows={4}
                  />
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
                              <Plus className="w-4 h-4 mr-1" />
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
                            <Button
                              size="sm"
                              onClick={() => addQuestion(section.id, "essay")}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Essay Question
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => addQuestion(section.id, "reading")}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Reading Material
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

export default function CreateCoursePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CreateCoursePageContent />
    </Suspense>
  )
}
