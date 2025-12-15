'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  MoreHorizontal, 
  Mail, 
  BookOpen, 
  GraduationCap,
  Calendar,
  BarChart3,
  User
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StudentCourse {
  course_id: string
  course_title: string
  progress: number
  final_grade?: number
  grade_letter?: string
  last_accessed_at?: string
  enrolled_at: string
}

interface Student {
  id: string
  full_name: string
  email: string
  student_id?: string
  profile_image_url?: string
  courses: StudentCourse[]
}

export function StudentsSection() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/teacher/students')
        if (response.ok) {
          const data = await response.json()
          setStudents(data)
        }
      } catch (error) {
        console.error('Error fetching students:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAverageProgress = (courses: StudentCourse[]) => {
    if (courses.length === 0) return 0
    const total = courses.reduce((acc, curr) => acc + curr.progress, 0)
    return Math.round(total / courses.length)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Management</h2>
          <p className="text-muted-foreground">
            Manage and track progress of {students.length} enrolled students
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Enrolled Courses</TableHead>
              <TableHead>Avg. Progress</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-10 w-40 bg-gray-100 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-gray-100 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 w-8 bg-gray-100 rounded animate-pulse ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow 
                  key={student.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedStudent(student)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.profile_image_url} />
                        <AvatarFallback>{getInitials(student.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {student.courses.length} Courses
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={getAverageProgress(student.courses)} className="w-16 h-2" />
                      <span className="text-sm text-muted-foreground">
                        {getAverageProgress(student.courses)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(student.courses.sort((a, b) => 
                        new Date(b.last_accessed_at || 0).getTime() - new Date(a.last_accessed_at || 0).getTime()
                      )[0]?.last_accessed_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Detailed progress report for {selectedStudent?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStudent.profile_image_url} />
                  <AvatarFallback className="text-lg">{getInitials(selectedStudent.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedStudent.full_name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedStudent.email}
                    </div>
                    {selectedStudent.student_id && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        ID: {selectedStudent.student_id}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">
                    {getAverageProgress(selectedStudent.courses)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Overall Progress</div>
                </div>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Enrolled Courses ({selectedStudent.courses.length})
                  </h4>
                  {selectedStudent.courses.map((course) => (
                    <div key={course.course_id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-lg">{course.course_title}</h5>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Enrolled: {formatDate(course.enrolled_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              Last Active: {formatDate(course.last_accessed_at)}
                            </span>
                          </div>
                        </div>
                        {course.grade_letter && (
                          <Badge className={
                            course.grade_letter.startsWith('A') ? 'bg-green-500' :
                            course.grade_letter.startsWith('B') ? 'bg-blue-500' :
                            course.grade_letter.startsWith('C') ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }>
                            Grade: {course.grade_letter}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
