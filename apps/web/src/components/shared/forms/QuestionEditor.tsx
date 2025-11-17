'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { RichTextEditor } from '@/components/editors/RichTextEditor'
import { CodeEditor } from '@/components/editors/CodeEditor'
import { CodeTemplateRow } from '@/components/coding'
import { Plus, Trash2, Eye, EyeOff, Code, CheckCircle, FileText } from 'lucide-react'

export interface TestCase {
  id: number
  input: string
  expectedOutput: string
  isHidden: boolean
  weight?: number
}

export interface Question {
  id: number
  type: 'mcq' | 'coding' | 'essay' | 'reading'
  title: string
  content: string
  options?: string[]
  correctAnswer?: string | number
  code?: string
  head?: Record<string, string>
  body_template?: Record<string, string>
  tail?: Record<string, string>
  testCases?: TestCase[]
  languages?: string[]
  isVisible: boolean
  points: number
  hasChanges?: boolean
}

interface QuestionEditorProps {
  question: Question
  onUpdate: (question: Question) => void
  onDelete: () => void
  programmingLanguages: string[]
}

export function QuestionEditor({
  question,
  onUpdate,
  onDelete,
  programmingLanguages,
}: QuestionEditorProps) {
  const [showTestCases, setShowTestCases] = useState(false)

  const updateQuestion = (updates: Partial<Question>) => {
    onUpdate({ ...question, ...updates, hasChanges: true })
  }

  const addOption = () => {
    const options = question.options || []
    updateQuestion({ options: [...options, ''] })
  }

  const updateOption = (index: number, value: string) => {
    const options = [...(question.options || [])]
    options[index] = value
    updateQuestion({ options })
  }

  const removeOption = (index: number) => {
    const options = question.options?.filter((_, i) => i !== index)
    updateQuestion({ options })
  }

  const addTestCase = () => {
    const testCases = question.testCases || []
    updateQuestion({
      testCases: [
        ...testCases,
        { id: Date.now(), input: '', expectedOutput: '', isHidden: false },
      ],
    })
  }

  const updateTestCase = (index: number, updates: Partial<TestCase>) => {
    const testCases = [...(question.testCases || [])]
    testCases[index] = { ...testCases[index], ...updates }
    updateQuestion({ testCases })
  }

  const removeTestCase = (index: number) => {
    const testCases = question.testCases?.filter((_, i) => i !== index)
    updateQuestion({ testCases })
  }

  const getQuestionTypeIcon = () => {
    switch (question.type) {
      case 'mcq':
        return <CheckCircle className="h-4 w-4" />
      case 'coding':
        return <Code className="h-4 w-4" />
      case 'essay':
      case 'reading':
        return <FileText className="h-4 w-4" />
    }
  }

  const getQuestionTypeColor = () => {
    switch (question.type) {
      case 'mcq':
        return 'bg-green-100 text-green-800'
      case 'coding':
        return 'bg-purple-100 text-purple-800'
      case 'essay':
      case 'reading':
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Badge className={getQuestionTypeColor()}>
              {getQuestionTypeIcon()}
              <span className="ml-1">{question.type.toUpperCase()}</span>
            </Badge>
            <Input
              value={question.title}
              onChange={(e) => updateQuestion({ title: e.target.value })}
              placeholder="Question title"
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Visible:</Label>
              <Switch
                checked={question.isVisible}
                onCheckedChange={(checked) => updateQuestion({ isVisible: checked })}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content */}
        <div>
          <Label>Question Content</Label>
          <RichTextEditor
            value={question.content}
            onChange={(value) => updateQuestion({ content: value })}
          />
        </div>

        {/* MCQ Options */}
        {question.type === 'mcq' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button size="sm" variant="outline" onClick={addOption}>
                <Plus className="h-3 w-3 mr-1" /> Add Option
              </Button>
            </div>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correctAnswer === index}
                  onChange={() => updateQuestion({ correctAnswer: index })}
                  className="w-4 h-4"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Coding Question */}
        {question.type === 'coding' && (
          <div className="space-y-4">
            {/* Language Selection */}
            <div>
              <Label>Supported Languages</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {programmingLanguages.map((lang) => (
                  <Badge
                    key={lang}
                    variant={question.languages?.includes(lang) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const languages = question.languages || []
                      const updated = languages.includes(lang)
                        ? languages.filter((l) => l !== lang)
                        : [...languages, lang]
                      updateQuestion({ languages: updated })
                    }}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Code Templates */}
            {question.languages?.map((lang) => (
              <CodeTemplateRow
                key={lang}
                language={lang}
                head={question.head?.[lang] || ''}
                bodyTemplate={question.body_template?.[lang] || ''}
                tail={question.tail?.[lang] || ''}
                onHeadChange={(value) =>
                  updateQuestion({
                    head: { ...question.head, [lang]: value },
                  })
                }
                onBodyTemplateChange={(value) =>
                  updateQuestion({
                    body_template: { ...question.body_template, [lang]: value },
                  })
                }
                onTailChange={(value) =>
                  updateQuestion({
                    tail: { ...question.tail, [lang]: value },
                  })
                }
              />
            ))}

            {/* Test Cases */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Test Cases</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTestCases(!showTestCases)}
                  >
                    {showTestCases ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={addTestCase}>
                    <Plus className="h-3 w-3 mr-1" /> Add Test Case
                  </Button>
                </div>
              </div>

              {showTestCases &&
                question.testCases?.map((testCase, index) => (
                  <Card key={testCase.id} className="p-3 mb-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Test Case {index + 1}</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={testCase.isHidden}
                              onChange={(e) =>
                                updateTestCase(index, { isHidden: e.target.checked })
                              }
                              className="w-3 h-3"
                            />
                            <span className="text-xs">Hidden</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTestCase(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Input</Label>
                          <Textarea
                            value={testCase.input}
                            onChange={(e) =>
                              updateTestCase(index, { input: e.target.value })
                            }
                            placeholder="Input"
                            className="h-20 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Expected Output</Label>
                          <Textarea
                            value={testCase.expectedOutput}
                            onChange={(e) =>
                              updateTestCase(index, { expectedOutput: e.target.value })
                            }
                            placeholder="Expected output"
                            className="h-20 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Points */}
        <div className="flex items-center gap-2">
          <Label className="w-20">Points:</Label>
          <Input
            type="number"
            value={question.points}
            onChange={(e) => updateQuestion({ points: parseInt(e.target.value) || 0 })}
            className="w-24"
            min="0"
          />
        </div>
      </CardContent>
    </Card>
  )
}
