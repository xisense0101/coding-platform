'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  GripVertical,
  BookOpen,
  Users,
  Clock,
  Award,
  Settings,
  Upload
} from 'lucide-react'
import { RichTextEditor } from '@/components/editors/RichTextEditor'

interface Section {
  id: string
  title: string
  description: string
  order_index: number
}

export default function CreateCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimated_hours: 0,
    is_published: false
  })

  const [sections, setSections] = useState<Section[]>([])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...courseData,
          sections: sections
        })
      })

      if (response.ok) {
        const course = await response.json()
        router.push(`/teacher/courses/${course.id}`)
      } else {
        throw new Error('Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Failed to create course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: '',
      description: '',
      order_index: sections.length
    }
    setSections([...sections, newSection])
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ))
  }

  const removeSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Preview Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Edit
            </Button>
            <Badge variant="secondary">Preview Mode</Badge>
          </div>

          {/* Course Preview */}
          <Card>
            <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
              <div className="absolute inset-0 bg-black/20 rounded-t-lg" />
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-3xl font-bold mb-2">{courseData.title || 'Untitled Course'}</h1>
                <div className="flex items-center space-x-4">
                  <Badge className={getDifficultyColor(courseData.difficulty_level)}>
                    {courseData.difficulty_level}
                  </Badge>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {courseData.estimated_hours} hours
                  </span>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <p className="text-gray-600 mb-6">{courseData.description || 'No description provided'}</p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium">Sections</p>
                  <p className="text-2xl font-bold text-blue-600">{sections.length}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium">Duration</p>
                  <p className="text-2xl font-bold text-green-600">{courseData.estimated_hours}h</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium">Level</p>
                  <p className="text-sm font-bold text-purple-600 capitalize">{courseData.difficulty_level}</p>
                </div>
              </div>

              {sections.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Course Content</h3>
                  <div className="space-y-3">
                    {sections.map((section, index) => (
                      <div key={section.id} className="flex items-center p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{section.title || `Section ${index + 1}`}</h4>
                          {section.description && (
                            <p className="text-sm text-gray-600">{section.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Course</h1>
              <p className="text-gray-600">Build an engaging learning experience for your students</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !courseData.title}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Course'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Data Science"
                    value={courseData.title}
                    onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what students will learn in this course..."
                    value={courseData.description}
                    onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Programming"
                      value={courseData.category}
                      onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={courseData.difficulty_level}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                        setCourseData({...courseData, difficulty_level: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="hours">Estimated Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      value={courseData.estimated_hours}
                      onChange={(e) => setCourseData({...courseData, estimated_hours: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Sections */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Course Structure</CardTitle>
                  <Button onClick={addSection} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No sections yet. Add your first section to start building your course.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <div key={section.id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <GripVertical className="h-5 w-5 text-gray-400 mt-2 cursor-move" />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Section {index + 1}</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSection(section.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Input
                              placeholder="Section title"
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            />
                            <Textarea
                              placeholder="Section description (optional)"
                              value={section.description}
                              onChange={(e) => updateSection(section.id, { description: e.target.value })}
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="publish">Publish Course</Label>
                    <p className="text-sm text-gray-600">Make this course visible to students</p>
                  </div>
                  <Switch
                    id="publish"
                    checked={courseData.is_published}
                    onCheckedChange={(checked) => setCourseData({...courseData, is_published: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Course Status</Label>
                  <Badge variant={courseData.is_published ? "default" : "secondary"}>
                    {courseData.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sections</span>
                  <span className="font-medium">{sections.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Duration</span>
                  <span className="font-medium">{courseData.estimated_hours}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Difficulty</span>
                  <Badge className={getDifficultyColor(courseData.difficulty_level)}>
                    {courseData.difficulty_level}
                  </Badge>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="text-sm font-medium">
                      {courseData.title && courseData.description ? '40%' : '20%'}
                    </span>
                  </div>
                  <Progress value={courseData.title && courseData.description ? 40 : 20} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Start with a clear, descriptive title that tells students what they'll learn.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Organize content into logical sections that build upon each other.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Set realistic time estimates to help students plan their learning.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
