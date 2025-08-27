'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  BookOpen, 
  Code, 
  FileText, 
  Upload,
  Eye,
  Star,
  Tag
} from 'lucide-react'
import { RichTextEditor } from '@/components/editors/RichTextEditor'
import { CodeEditor } from '@/components/editors/CodeEditor'

interface Question {
  id: string
  type: 'mcq' | 'coding' | 'essay' | 'file_upload'
  title: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  tags: string[]
  created_at: string
  mcq_question?: {
    question_text: string
    options: Array<{ id: string; text: string; isCorrect: boolean }>
    correct_answers: string[]
    explanation?: string
  }
  coding_question?: {
    problem_statement: string
    boilerplate_code: any
    test_cases: any[]
    allowed_languages: string[]
    time_limit: number
    memory_limit: number
  }
}

export default function QuestionBankPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  // Mock data - in real app this would come from API
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      type: 'mcq',
      title: 'Database Normalization Concepts',
      description: 'Understanding normal forms in database design',
      difficulty: 'medium',
      points: 2,
      tags: ['database', 'normalization', 'sql'],
      created_at: '2024-01-10',
      mcq_question: {
        question_text: 'Which normal form eliminates transitive dependencies?',
        options: [
          { id: 'a', text: '1NF', isCorrect: false },
          { id: 'b', text: '2NF', isCorrect: false },
          { id: 'c', text: '3NF', isCorrect: true },
          { id: 'd', text: 'BCNF', isCorrect: false }
        ],
        correct_answers: ['c'],
        explanation: '3NF eliminates transitive dependencies by ensuring all non-key attributes depend directly on the primary key.'
      }
    },
    {
      id: '2',
      type: 'coding',
      title: 'Binary Search Implementation',
      description: 'Implement binary search algorithm',
      difficulty: 'medium',
      points: 5,
      tags: ['algorithms', 'search', 'arrays'],
      created_at: '2024-01-09',
      coding_question: {
        problem_statement: 'Implement a binary search function that finds the index of a target value in a sorted array.',
        boilerplate_code: {
          javascript: 'function binarySearch(arr, target) {\n  // Your code here\n}',
          python: 'def binary_search(arr, target):\n    # Your code here\n    pass'
        },
        test_cases: [
          { input: [[1, 2, 3, 4, 5], 3], expected: 2 },
          { input: [[1, 2, 3, 4, 5], 6], expected: -1 }
        ],
        allowed_languages: ['javascript', 'python', 'java'],
        time_limit: 30,
        memory_limit: 128
      }
    },
    {
      id: '3',
      type: 'essay',
      title: 'Explain MVC Architecture',
      description: 'Describe the Model-View-Controller design pattern',
      difficulty: 'hard',
      points: 10,
      tags: ['architecture', 'design-patterns', 'mvc'],
      created_at: '2024-01-08'
    }
  ])

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesDifficulty = selectedDifficulty === 'all' || question.difficulty === selectedDifficulty
    const matchesType = selectedType === 'all' || question.type === selectedType
    const matchesTab = activeTab === 'all' || question.type === activeTab
    
    return matchesSearch && matchesDifficulty && matchesType && matchesTab
  })

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq': return <BookOpen className="h-4 w-4" />
      case 'coding': return <Code className="h-4 w-4" />
      case 'essay': return <FileText className="h-4 w-4" />
      case 'file_upload': return <Upload className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mcq': return 'bg-blue-100 text-blue-800'
      case 'coding': return 'bg-purple-100 text-purple-800'
      case 'essay': return 'bg-orange-100 text-orange-800'
      case 'file_upload': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Question Bank</h1>
            <p className="text-gray-600">Manage and organize your collection of questions</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Question
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold">{questions.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">MCQ Questions</p>
                  <p className="text-2xl font-bold">{questions.filter(q => q.type === 'mcq').length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Coding Questions</p>
                  <p className="text-2xl font-bold">{questions.filter(q => q.type === 'coding').length}</p>
                </div>
                <Code className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Essay Questions</p>
                  <p className="text-2xl font-bold">{questions.filter(q => q.type === 'essay').length}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search questions by title or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="file_upload">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Question Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="mcq">MCQ ({questions.filter(q => q.type === 'mcq').length})</TabsTrigger>
            <TabsTrigger value="coding">Coding ({questions.filter(q => q.type === 'coding').length})</TabsTrigger>
            <TabsTrigger value="essay">Essay ({questions.filter(q => q.type === 'essay').length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No questions found matching your filters.</p>
                <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getQuestionTypeIcon(question.type)}
                        <h3 className="text-lg font-semibold">{question.title}</h3>
                        <Badge className={getTypeColor(question.type)}>
                          {question.type.toUpperCase()}
                        </Badge>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {question.points} pts
                        </Badge>
                      </div>
                      
                      {question.description && (
                        <p className="text-gray-600 mb-3">{question.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created {question.created_at}</span>
                        {question.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="h-3 w-3" />
                            <span>{question.tags.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingQuestion(question)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
