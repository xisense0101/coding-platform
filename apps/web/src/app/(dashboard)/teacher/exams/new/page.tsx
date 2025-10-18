'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { logger } from '@/lib/utils/logger'

import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Clock, 
  Users, 
  FileText, 
  Settings,
  Calendar,
  Shield,
  Target
} from 'lucide-react'

export default function CreateExamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    instructions: '',
    duration_minutes: 60,
    start_time: '',
    end_time: '',
    total_marks: 100,
    pass_marks: 50,
    is_published: false,
    proctoring_enabled: false,
    randomize_questions: false,
    show_results_immediately: true,
    allow_review: true,
    max_attempts: 1
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/teacher/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...examData,
          slug: examData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        })
      })

      if (response.ok) {
        const exam = await response.json()
        router.push(`/teacher/exams/${exam.id}`)
      } else {
        throw new Error('Failed to create exam')
      }
    } catch (error) {
      logger.error('Error creating exam:', error)
      alert('Failed to create exam. Please try again.')
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-2xl font-bold">Create New Exam</h1>
              <p className="text-gray-600">Design a comprehensive assessment for your students</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSave}
              disabled={loading || !examData.title}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Exam'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exam Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Database Management Final Exam"
                    value={examData.title}
                    onChange={(e) => setExamData({...examData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the exam content and objectives..."
                    value={examData.description}
                    onChange={(e) => setExamData({...examData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions for Students</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Detailed instructions for taking the exam..."
                    value={examData.instructions}
                    onChange={(e) => setExamData({...examData, instructions: e.target.value})}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timing and Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={examData.duration_minutes}
                      onChange={(e) => setExamData({...examData, duration_minutes: parseInt(e.target.value) || 60})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="total_marks">Total Marks</Label>
                    <Input
                      id="total_marks"
                      type="number"
                      min="1"
                      value={examData.total_marks}
                      onChange={(e) => setExamData({...examData, total_marks: parseInt(e.target.value) || 100})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pass_marks">Pass Marks</Label>
                    <Input
                      id="pass_marks"
                      type="number"
                      min="0"
                      max={examData.total_marks}
                      value={examData.pass_marks}
                      onChange={(e) => setExamData({...examData, pass_marks: parseInt(e.target.value) || 50})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Date & Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={examData.start_time}
                      onChange={(e) => setExamData({...examData, start_time: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">End Date & Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={examData.end_time}
                      onChange={(e) => setExamData({...examData, end_time: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="proctoring">Enable Proctoring</Label>
                      <p className="text-sm text-gray-600">Monitor students during the exam with camera and screen recording</p>
                    </div>
                    <Switch
                      id="proctoring"
                      checked={examData.proctoring_enabled}
                      onCheckedChange={(checked) => setExamData({...examData, proctoring_enabled: checked})}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="randomize">Randomize Questions</Label>
                      <p className="text-sm text-gray-600">Present questions in random order for each student</p>
                    </div>
                    <Switch
                      id="randomize"
                      checked={examData.randomize_questions}
                      onCheckedChange={(checked) => setExamData({...examData, randomize_questions: checked})}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="immediate_results">Show Results Immediately</Label>
                      <p className="text-sm text-gray-600">Display results to students after submission</p>
                    </div>
                    <Switch
                      id="immediate_results"
                      checked={examData.show_results_immediately}
                      onCheckedChange={(checked) => setExamData({...examData, show_results_immediately: checked})}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow_review">Allow Review</Label>
                      <p className="text-sm text-gray-600">Let students review their answers after completion</p>
                    </div>
                    <Switch
                      id="allow_review"
                      checked={examData.allow_review}
                      onCheckedChange={(checked) => setExamData({...examData, allow_review: checked})}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="max_attempts">Maximum Attempts</Label>
                      <p className="text-sm text-gray-600">Number of times a student can take this exam</p>
                    </div>
                    <Input
                      id="max_attempts"
                      type="number"
                      min="1"
                      max="10"
                      value={examData.max_attempts}
                      onChange={(e) => setExamData({...examData, max_attempts: parseInt(e.target.value) || 1})}
                      className="w-20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="publish">Publish Exam</Label>
                    <p className="text-sm text-gray-600">Make exam available to students</p>
                  </div>
                  <Switch
                    id="publish"
                    checked={examData.is_published}
                    onCheckedChange={(checked) => setExamData({...examData, is_published: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Exam Status</Label>
                  <Badge variant={examData.is_published ? "default" : "secondary"}>
                    {examData.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Exam Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Duration
                  </span>
                  <span className="font-medium">{examData.duration_minutes} min</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    Total Marks
                  </span>
                  <span className="font-medium">{examData.total_marks}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    Pass Marks
                  </span>
                  <span className="font-medium">{examData.pass_marks} ({Math.round((examData.pass_marks / examData.total_marks) * 100)}%)</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Max Attempts</span>
                  <span className="font-medium">{examData.max_attempts}</span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Security Features</Label>
                  <div className="space-y-1">
                    {examData.proctoring_enabled && (
                      <Badge variant="outline" className="mr-1 mb-1">
                        <Shield className="h-3 w-3 mr-1" />
                        Proctoring
                      </Badge>
                    )}
                    {examData.randomize_questions && (
                      <Badge variant="outline" className="mr-1 mb-1">
                        Randomized
                      </Badge>
                    )}
                    {!examData.proctoring_enabled && !examData.randomize_questions && (
                      <p className="text-sm text-gray-500">No security features enabled</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>After creating, you'll be able to add questions and sections to your exam.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Configure question banks and assign point values for each section.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Test your exam before publishing to ensure everything works correctly.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
