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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ChevronLeft, 
  Plus, 
  Save, 
  Eye, 
  EyeOff, 
  Trash2, 
  Settings, 
  BookOpen, 
  FileText, 
  Code2, 
  CheckCircle2, 
  GripVertical, 
  Users, 
  Mail 
} from 'lucide-react'

import { logger } from '@/lib/utils/logger'

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
  activeLanguage?: string; // UI state for coding question editor
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
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

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
    setExpandedQuestion(newQuestion.id);
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
              questions: section.questions.map(question => {
                // Construct head/body/tail objects for coding questions
                const allLangs = programmingLanguages;
                const headObj: Record<string, string> = {};
                const bodyTemplateObj: Record<string, string> = {};
                const tailObj: Record<string, string> = {};
                
                if (question.type === 'coding') {
                  allLangs.forEach(lang => {
                    headObj[lang.toLowerCase()] = (question.head && typeof question.head === 'object' ? question.head[lang.toLowerCase()] : "") || "";
                    bodyTemplateObj[lang.toLowerCase()] = (question.body_template && typeof question.body_template === 'object' ? question.body_template[lang.toLowerCase()] : "") || "";
                    tailObj[lang.toLowerCase()] = (question.tail && typeof question.tail === 'object' ? question.tail[lang.toLowerCase()] : "") || "";
                  });
                }

                return {
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
                    testCases: question.testCases || [],
                    head: headObj,
                    body_template: bodyTemplateObj,
                    tail: tailObj
                  })
                };
              })
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

                    await fetch(`/api/questions/${createdQuestion.id}/coding`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        problem_statement: question.content || "",
                        rich_problem_statement: question.content || "",
                        test_cases: testCases,
                        allowed_languages: question.languages || ["javascript", "python"],
                        head: headObj,
                        body_template: bodyTemplateObj,
                        tail: tailObj
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
            questions: section.questions.map(question => {
              // Construct head/body/tail objects for coding questions
              const allLangs = programmingLanguages;
              const headObj: Record<string, string> = {};
              const bodyTemplateObj: Record<string, string> = {};
              const tailObj: Record<string, string> = {};
              
              if (question.type === 'coding') {
                allLangs.forEach(lang => {
                  headObj[lang.toLowerCase()] = (question.head && typeof question.head === 'object' ? question.head[lang.toLowerCase()] : "") || "";
                  bodyTemplateObj[lang.toLowerCase()] = (question.body_template && typeof question.body_template === 'object' ? question.body_template[lang.toLowerCase()] : "") || "";
                  tailObj[lang.toLowerCase()] = (question.tail && typeof question.tail === 'object' ? question.tail[lang.toLowerCase()] : "") || "";
                });
              }

              return {
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
                  testCases: question.testCases,
                  head: headObj,
                  body_template: bodyTemplateObj,
                  tail: tailObj
                })
              };
            })
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

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'coding':
        return <Code2 className="w-4 h-4" />;
      case 'essay':
        return <FileText className="w-4 h-4" />;
      case 'reading':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'coding':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'essay':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'reading':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const activeSecData = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-xl text-gray-900">
                  {isEditMode ? 'Edit Course' : 'Create New Course'}
                </h1>
                <p className="text-xs text-gray-500">
                  Build engaging courses with multiple question types
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditMode && (
                <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
                  <DialogTrigger asChild>
                    <button
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Users className="w-4 h-4" />
                      Enroll Students
                    </button>
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
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={handleSaveCourse}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Update Course' : 'Save Course'}
                  </>
                )}
              </button>
              {isEditMode && (
                <button
                  onClick={handleDeleteCourse}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

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

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Course Info & Sections */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Course Info */}
            <div className="space-y-4">
              <h3 className="text-sm text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Course Information
              </h3>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Enter course title"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Enter course description"
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Sections List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Sections ({sections.length})
                </h3>
                <button
                  onClick={addSection}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {sections.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No sections yet
                  </div>
                ) : (
                  sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        activeSection === section.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {section.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {section.questions.length} question
                            {section.questions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {section.isVisible ? (
                            <Eye className="w-3 h-3 text-green-600" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Section Editor */}
        <div className="flex-1 overflow-y-auto">
          {activeSecData ? (
            <div className="p-6 space-y-6">
              {/* Section Header */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg text-gray-900">Section Settings</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateSection(activeSecData.id, {
                          isVisible: !activeSecData.isVisible
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-colors ${
                        activeSecData.isVisible
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      {activeSecData.isVisible ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteSection(activeSecData.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Section Title *
                    </label>
                    <input
                      type="text"
                      value={activeSecData.title}
                      onChange={(e) =>
                        updateSection(activeSecData.id, { title: e.target.value })
                      }
                      placeholder="Enter section title"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Section Description
                    </label>
                    <textarea
                      value={activeSecData.description}
                      onChange={(e) =>
                        updateSection(activeSecData.id, {
                          description: e.target.value
                        })
                      }
                      placeholder="Enter section description"
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">
                      Add Questions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => addQuestion(activeSecData.id, 'mcq')}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-xs"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        MCQ Quiz
                      </button>
                      <button
                        onClick={() => addQuestion(activeSecData.id, 'coding')}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-xs"
                      >
                        <Code2 className="w-3 h-3" />
                        Coding
                      </button>
                      <button
                        onClick={() => addQuestion(activeSecData.id, 'essay')}
                        className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-xs"
                      >
                        <FileText className="w-3 h-3" />
                        Essay
                      </button>
                      <button
                        onClick={() => addQuestion(activeSecData.id, 'reading')}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-xs"
                      >
                        <BookOpen className="w-3 h-3" />
                        Reading
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {activeSecData.questions.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 mb-2">No Questions Yet</h3>
                    <p className="text-gray-500 text-sm">
                      Add questions using the buttons above
                    </p>
                  </div>
                ) : (
                  activeSecData.questions.map((question, qIdx) => (
                    <div
                      key={question.id}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* Question Header */}
                      <div
                        className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() =>
                          setExpandedQuestion(
                            expandedQuestion === question.id ? null : question.id
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <span
                              className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${getQuestionTypeBadge(question.type)}`}
                            >
                              {getQuestionTypeIcon(question.type)}
                              {question.type.toUpperCase()}
                            </span>
                            <input
                              type="text"
                              value={question.title}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateQuestion(activeSecData.id, question.id, {
                                  title: e.target.value
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={question.points}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateQuestion(activeSecData.id, question.id, {
                                  points: parseInt(e.target.value) || 1
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-16 px-2 py-1 bg-white border border-gray-300 rounded text-xs text-center"
                              placeholder="pts"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuestion(activeSecData.id, question.id, {
                                  isVisible: !question.isVisible
                                });
                              }}
                              className={`px-2 py-1 rounded text-xs ${
                                question.isVisible
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {question.isVisible ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuestion(activeSecData.id, question.id);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Question Content (Expandable) */}
                      {expandedQuestion === question.id && (
                        <div className="p-6 space-y-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Question Content
                            </label>
                            <RichTextEditor
                              value={question.content}
                              onChange={(val) => updateQuestion(activeSecData.id, question.id, { content: val })}
                              placeholder="Enter your question here..."
                              height={160}
                              toolbar="full"
                            />
                          </div>

                          {/* MCQ Options */}
                          {question.type === 'mcq' && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-2">
                                Answer Options
                              </label>
                              <div className="space-y-2">
                                {(question.options || ['', '', '', '']).map(
                                  (option, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2"
                                    >
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [
                                            ...(question.options || [
                                              '',
                                              '',
                                              '',
                                              ''
                                            ])
                                          ];
                                          newOptions[idx] = e.target.value;
                                          updateQuestion(
                                            activeSecData.id,
                                            question.id,
                                            { options: newOptions }
                                          );
                                        }}
                                        placeholder={`Option ${idx + 1}`}
                                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                      <button
                                        onClick={() =>
                                          updateQuestion(
                                            activeSecData.id,
                                            question.id,
                                            { correctAnswer: idx }
                                          )
                                        }
                                        className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                                          question.correctAnswer === idx
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                      >
                                        {question.correctAnswer === idx
                                          ? '✓ Correct'
                                          : 'Mark Correct'}
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Coding Question */}
                          {question.type === 'coding' && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-2">
                                  Allowed Programming Languages
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {programmingLanguages.map((lang) => (
                                    <button
                                      key={lang}
                                      onClick={() => {
                                        const currentLangs =
                                          question.languages || [
                                            'JavaScript',
                                            'Python'
                                          ];
                                        const newLangs = currentLangs.includes(lang)
                                          ? currentLangs.filter((l) => l !== lang)
                                          : [...currentLangs, lang];
                                        updateQuestion(activeSecData.id, question.id, {
                                          languages: newLangs
                                        });
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                                        (question.languages || []).includes(lang)
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                      }`}
                                    >
                                      {lang}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Code Problem Setup - Head/Body/Tail for each language */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-2">
                                  Code Problem Setup
                                </label>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <p className="text-xs text-gray-500 mb-3">
                                    Configure the code template for each language. The final code will be: <strong>HEAD + BODY_TEMPLATE + TAIL</strong>
                                  </p>
                                  
                                  {/* Language tabs */}
                                  <div className="mb-3">
                                    <div className="flex flex-wrap gap-1 mb-3">
                                      {(question.languages || ['JavaScript', 'Python']).map((lang) => (
                                        <button
                                          key={lang}
                                          onClick={() => {
                                            // Set active language for editing
                                            const langLower = lang.toLowerCase();
                                            updateQuestion(activeSecData.id, question.id, {
                                              activeLanguage: langLower
                                            });
                                          }}
                                          className={`px-3 py-1.5 rounded text-xs transition-colors ${
                                            (question.activeLanguage === lang.toLowerCase() || 
                                            (!question.activeLanguage && lang === (question.languages || ['JavaScript'])[0]))
                                              ? 'bg-blue-600 text-white'
                                              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                                          }`}
                                        >
                                          {lang}
                                        </button>
                                      ))}
                                    </div>
                                    
                                    {/* Display editors for active language */}
                                    {(question.languages || ['JavaScript', 'Python']).map((lang) => {
                                      const langLower = lang.toLowerCase();
                                      const isActive = (question.activeLanguage === langLower || 
                                        (!question.activeLanguage && lang === (question.languages || ['JavaScript'])[0]));
                                      
                                      if (!isActive) return null;
                                      
                                      return (
                                        <div key={lang} className="space-y-3">
                                          {/* HEAD */}
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              HEAD - Prepended to student code (hidden from student)
                                            </label>
                                            <CodeEditor
                                              value={(question.head && typeof question.head === 'object' ? question.head[langLower] : '') || ''}
                                              onChange={(val) => {
                                                const newHead = { ...(question.head || {}) };
                                                newHead[langLower] = val;
                                                updateQuestion(activeSecData.id, question.id, {
                                                  head: newHead
                                                });
                                              }}
                                              language={langLower}
                                              placeholder={`// Code that runs before student's solution\n// Example: import statements, helper functions, etc.`}
                                              height={100}
                                              className="rounded border"
                                            />
                                          </div>

                                          {/* BODY TEMPLATE */}
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              BODY TEMPLATE - What students see and edit
                                            </label>
                                            <CodeEditor
                                              value={(question.body_template && typeof question.body_template === 'object' ? question.body_template[langLower] : '') || question.code || ''}
                                              onChange={(val) => {
                                                const newBodyTemplate = { ...(question.body_template || {}) };
                                                newBodyTemplate[langLower] = val;
                                                updateQuestion(activeSecData.id, question.id, {
                                                  body_template: newBodyTemplate,
                                                  code: val // Keep for backward compatibility
                                                });
                                              }}
                                              language={langLower}
                                              placeholder={lang === 'JavaScript' 
                                                ? `function solution(input) {\n  // Write your code here\n  \n}`
                                                : lang === 'Python'
                                                ? `def solution(input):\n    # Write your code here\n    pass`
                                                : `// Write your code here`
                                              }
                                              height={200}
                                              className="rounded border"
                                            />
                                          </div>

                                          {/* TAIL */}
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              TAIL - Appended to student code (hidden from student)
                                            </label>
                                            <CodeEditor
                                              value={(question.tail && typeof question.tail === 'object' ? question.tail[langLower] : '') || ''}
                                              onChange={(val) => {
                                                const newTail = { ...(question.tail || {}) };
                                                newTail[langLower] = val;
                                                updateQuestion(activeSecData.id, question.id, {
                                                  tail: newTail
                                                });
                                              }}
                                              language={langLower}
                                              placeholder={`// Code that runs after student's solution\n// Example: test runner, output formatter, etc.`}
                                              height={100}
                                              className="rounded border"
                                            />
                                          </div>

                                          {/* Preview */}
                                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-xs text-blue-800 mb-1">
                                              <strong>Final execution order:</strong>
                                            </p>
                                            <p className="text-xs text-blue-700 font-mono">
                                              HEAD → BODY_TEMPLATE (student code) → TAIL
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-xs text-gray-600">
                                    Test Cases
                                  </label>
                                  <button
                                    onClick={() =>
                                      addTestCase(activeSecData.id, question.id)
                                    }
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Test
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {(question.testCases || []).map((tc, tcIdx) => (
                                    <div
                                      key={tc.id}
                                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                    >
                                      <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div>
                                          <label className="block text-xs text-gray-500 mb-1">
                                            Input
                                          </label>
                                          <Textarea
                                            value={tc.input}
                                            onChange={(e) => {
                                              const newTestCases = [
                                                ...(question.testCases || [])
                                              ];
                                              newTestCases[tcIdx] = {
                                                ...tc,
                                                input: e.target.value
                                              };
                                              updateQuestion(
                                                activeSecData.id,
                                                question.id,
                                                { testCases: newTestCases }
                                              );
                                            }}
                                            rows={2}
                                            className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-gray-500 mb-1">
                                            Expected Output
                                          </label>
                                          <Textarea
                                            value={tc.expectedOutput}
                                            onChange={(e) => {
                                              const newTestCases = [
                                                ...(question.testCases || [])
                                              ];
                                              newTestCases[tcIdx] = {
                                                ...tc,
                                                expectedOutput: e.target.value
                                              };
                                              updateQuestion(
                                                activeSecData.id,
                                                question.id,
                                                { testCases: newTestCases }
                                              );
                                            }}
                                            rows={2}
                                            className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-xs text-gray-600">
                                          <input
                                            type="checkbox"
                                            checked={tc.isHidden}
                                            onChange={(e) => {
                                              const newTestCases = [
                                                ...(question.testCases || [])
                                              ];
                                              newTestCases[tcIdx] = {
                                                ...tc,
                                                isHidden: e.target.checked
                                              };
                                              updateQuestion(
                                                activeSecData.id,
                                                question.id,
                                                { testCases: newTestCases }
                                              );
                                            }}
                                            className="rounded"
                                          />
                                          Hidden from students
                                        </label>
                                        <button
                                          onClick={() => {
                                            const newTestCases = (
                                              question.testCases || []
                                            ).filter((_, i) => i !== tcIdx);
                                            updateQuestion(
                                              activeSecData.id,
                                              question.id,
                                              { testCases: newTestCases }
                                            );
                                          }}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-900 mb-2">No Section Selected</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Select a section from the sidebar or create a new one
                </p>
                <button
                  onClick={addSection}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Section
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enroll Students Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg text-gray-900">Enroll Students</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add students to this course
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm text-gray-600 mb-2">
                Student Email Addresses
              </label>
              <Textarea
                value={studentEmails}
                onChange={(e) => setStudentEmails(e.target.value)}
                placeholder="Enter student email addresses (one per line or separated by commas)"
                rows={6}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                You can enter multiple emails separated by new lines, commas, or
                spaces
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnrollStudents}
                disabled={enrolling || !studentEmails.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {enrolling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Enroll Students
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
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
