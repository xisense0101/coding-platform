'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  FileText, 
  BarChart3, 
  Plus, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Eye, 
  Edit, 
  Users,
  Activity,
  Target,
  Monitor,
  Home,
  Shield
} from 'lucide-react'
import { useTeacherCourses, useTeacherStats, useTeacherExams, useTeacherActivity } from '@/hooks/useData'
import { useAuth } from '@/lib/auth/AuthContext'
import { logger } from '@/lib/utils/logger'
import { DashboardShell } from '@/components/layouts'

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'active' | 'completed';
  studentCount: number;
  nextDeadline: string;
}

interface Exam {
  id: string;
  originalId: string;
  title: string;
  course: string;
  slug: string;
  isPublished: boolean;
  testCode?: string;
  testCodeType?: string;
  testCodeRotationMinutes?: number;
  date: string;
  time: string;
  students: number;
  status: 'upcoming' | 'active' | 'draft';
  totalMarks: number;
  duration: number;
}

interface ActivityItem {
  id: string;
  type: 'course' | 'exam' | 'student';
  message: string;
  time: string;
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { signOut, userProfile } = useAuth()
  const [activeSection, setActiveSection] = useState("overview")
  
  // Use real data hooks
  const { courses, loading: coursesLoading } = useTeacherCourses()
  const { stats, loading: statsLoading } = useTeacherStats()
  const { exams, loading: examsLoading } = useTeacherExams()
  const { activities, loading: activitiesLoading } = useTeacherActivity()

  const handleCreateCourse = () => {
    router.push('/teacher/courses/create')
  }

  const handleCreateExam = () => {
    router.push('/teacher/exams/create')
  }

  const handleLogout = async () => {
    try {
      logger.log('Logout button clicked')
      await signOut()
    } catch (error) {
      logger.error('Logout error:', error)
      window.location.href = '/auth/login'
    }
  }

  // Transform courses data for UI with real stats
  const transformedCourses: Course[] = courses.map(course => {
    const courseStats = stats?.courseStats?.find(s => s.courseId === course.id)
    
    return {
      id: course.id,
      title: course.title,
      description: course.description || 'No description available',
      progress: courseStats?.avgProgress || 0,
      status: course.published ? 'active' : 'completed',
      studentCount: courseStats?.studentCount || 0,
      nextDeadline: courseStats && courseStats.completionCount > 0 
        ? `${courseStats.completionCount} students completed` 
        : 'No completions yet'
    }
  })

  // Transform exams data for UI
  const upcomingExams: Exam[] = exams.map(exam => {
    const startDate = exam.start_time ? new Date(exam.start_time) : new Date()
    const isUpcoming = startDate > new Date()
    
    return {
      id: exam.id,
      originalId: exam.id,
      title: exam.title,
      course: exam.description || 'No description',
      slug: exam.slug,
      isPublished: exam.is_published,
      testCode: exam.test_code,
      testCodeType: exam.test_code_type,
      testCodeRotationMinutes: exam.test_code_rotation_minutes,
      date: startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      students: exam.submission_count || 0,
      status: isUpcoming ? 'upcoming' : exam.is_published ? 'active' : 'draft',
      totalMarks: exam.total_marks || 0,
      duration: exam.duration_minutes || 0
    }
  })

  // Transform activities
  const transformedActivities: ActivityItem[] = activities.map(activity => ({
    id: activity.id,
    type: activity.type as 'course' | 'exam' | 'student',
    message: activity.message,
    time: activity.time
  }))

  const handleToggleExamStatus = async (examId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: isPublished
        })
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Failed to update exam status')
      }
    } catch (error) {
      logger.error('Error updating exam status:', error)
      alert('Failed to update exam status')
    }
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users },
  ];

  const getPriorityColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'exam': return <Target className="w-4 h-4" />;
      case 'student': return <Users className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCourseIcon = (index: number) => {
    const colors = [
      'from-yellow-500 to-orange-500',
      'from-blue-500 to-blue-600',
      'from-cyan-500 to-blue-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-red-500 to-orange-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userProfile={{
        name: userProfile?.full_name || 'Professor',
        email: userProfile?.email || 'teacher@example.com',
      }}
      onLogout={handleLogout}
      organizationBranding={{
        name: 'BlocksCode',
        // logoUrl: '/logo.png' // Add if available
      }}
      colorScheme="emerald"
    >
      {activeSection === 'overview' && (
        <>
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-gray-900 text-3xl mb-2">Welcome back, {userProfile?.full_name || 'Professor'}! 👋</h2>
            <p className="text-gray-500">Here&apos;s what&apos;s happening with your courses today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-gray-900 text-3xl mb-1">{stats?.totalCourses || 0}</h3>
              <p className="text-gray-500 text-sm">Total Courses</p>
              <p className="text-gray-400 text-xs mt-1">Active and completed</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-gray-900 text-3xl mb-1">{stats?.totalStudents || 0}</h3>
              <p className="text-gray-500 text-sm">Total Students</p>
              <p className="text-gray-400 text-xs mt-1">Enrolled across all courses</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-gray-900 text-3xl mb-1">{stats?.activeExams || 0}</h3>
              <p className="text-gray-500 text-sm">Active Exams</p>
              <p className="text-gray-400 text-xs mt-1">Currently running</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Recent Activity & Courses */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Courses */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-gray-900 text-xl">Your Courses</h3>
                  <button 
                    onClick={() => setActiveSection('courses')}
                    className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1"
                  >
                    View all
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {coursesLoading ? (
                    <p className="text-gray-500 text-sm">Loading...</p>
                  ) : transformedCourses.length > 0 ? (
                    transformedCourses.slice(0, 3).map((course, index) => (
                      <div
                        key={course.id}
                        className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => router.push(`/teacher/courses/${course.id}`)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 bg-gradient-to-br ${getCourseIcon(index)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <BookOpen className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">{course.title}</h4>
                            <p className="text-gray-500 text-sm mb-3 line-clamp-1">{course.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {course.studentCount} students
                              </span>
                              <span className={`px-2 py-1 rounded-md text-xs ${course.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {course.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No courses created yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Upcoming Exams */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-gray-900 text-xl mb-6">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={handleCreateCourse}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm">Create New Course</span>
                  </button>
                  <button 
                    onClick={handleCreateExam}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-sm">Create Exam</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
                    <Edit className="w-5 h-5" />
                    <span className="text-sm">Create Assignment</span>
                  </button>
                  <button 
                    onClick={() => setActiveSection('students')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm">Manage Students</span>
                  </button>
                  <button 
                    onClick={() => setActiveSection('analytics')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-sm">View Analytics</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">Schedule Session</span>
                  </button>
                </div>
              </div>

              {/* Upcoming Exams */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-gray-900 text-xl flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Exams
                  </h3>
                  <button 
                    onClick={() => setActiveSection('exams')}
                    className="text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-3">
                  {examsLoading ? (
                    <p className="text-gray-500 text-sm">Loading...</p>
                  ) : upcomingExams.length > 0 ? (
                    upcomingExams.slice(0, 3).map((exam) => (
                      <div
                        key={exam.id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h4 className="text-gray-900 text-sm flex-1">{exam.title}</h4>
                          <span className={`px-2 py-1 rounded-md text-xs border ${getPriorityColor(exam.status)}`}>
                            {exam.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mb-2 line-clamp-1">{exam.course}</p>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>{exam.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{exam.students}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No exams created yet</p>
                      <p className="text-xs mt-1">Create your first exam</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'courses' && (
        <CoursesSection 
          courses={transformedCourses} 
          loading={coursesLoading}
          getCourseIcon={getCourseIcon}
          onCreateCourse={handleCreateCourse}
          onViewCourse={(id) => router.push(`/teacher/courses/${id}`)}
          onEditCourse={(id) => router.push(`/teacher/courses/create?edit=${id}`)}
        />
      )}

      {activeSection === 'exams' && (
        <ExamsSection 
          exams={upcomingExams}
          loading={examsLoading}
          onCreateExam={handleCreateExam}
          onViewExam={(id) => router.push(`/teacher/exams/${id}`)}
          onEditExam={(id) => router.push(`/teacher/exams/create?edit=${id}`)}
          onMonitorExam={(id) => router.push(`/teacher/exams/${id}/monitoring`)}
          onViewResults={(id) => router.push(`/teacher/exams/${id}/results`)}
          onToggleExamStatus={handleToggleExamStatus}
          getPriorityColor={getPriorityColor}
        />
      )}

      {activeSection === 'analytics' && (
        <AnalyticsSection 
          courses={transformedCourses}
          loading={coursesLoading}
        />
      )}

      {activeSection === 'students' && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 text-xl mb-2">Student Management</h3>
          <p className="text-gray-500">This section is under development.</p>
        </div>
      )}
    </DashboardShell>
  )
}

// Courses Section Component
function CoursesSection({ 
  courses, 
  loading, 
  getCourseIcon, 
  onCreateCourse, 
  onViewCourse, 
  onEditCourse 
}: { 
  courses: Course[]; 
  loading: boolean;
  getCourseIcon: (index: number) => string;
  onCreateCourse?: () => void;
  onViewCourse?: (id: string) => void;
  onEditCourse?: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-gray-900 text-3xl mb-2">My Courses</h2>
        </div>
        <button 
          onClick={onCreateCourse}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Course</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-32 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : courses.length > 0 ? (
          courses.map((course, index) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all group"
            >
              <div className={`h-32 bg-gradient-to-br ${getCourseIcon(index)} flex items-center justify-center relative`}>
                <BookOpen className="w-12 h-12 text-white opacity-80" />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs text-white ${course.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}>
                    {course.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-gray-900 text-lg mb-2 group-hover:text-emerald-600 transition-colors">{course.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.description}</p>
                
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.studentCount} students
                    </span>
                    <span className="text-xs text-gray-500">{course.progress}% avg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{course.nextDeadline}</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onViewCourse && onViewCourse(course.id)}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button 
                    onClick={() => onEditCourse && onEditCourse(course.id)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 text-xl mb-2">No courses created yet</h3>
              <p className="text-gray-500 mb-6">Create your first course to start teaching</p>
              <button 
                onClick={onCreateCourse}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Course</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Exams Section Component
function ExamsSection({ 
  exams, 
  loading, 
  onCreateExam, 
  onViewExam, 
  onEditExam, 
  onMonitorExam, 
  onViewResults, 
  onToggleExamStatus,
  getPriorityColor 
}: { 
  exams: Exam[];
  loading: boolean;
  onCreateExam?: () => void;
  onViewExam?: (id: string) => void;
  onEditExam?: (id: string) => void;
  onMonitorExam?: (id: string) => void;
  onViewResults?: (id: string) => void;
  onToggleExamStatus?: (id: string, isPublished: boolean) => void;
  getPriorityColor: (status: string) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-gray-900 text-3xl mb-2">Exam Management</h2>
        </div>
        <button 
          onClick={onCreateExam}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Exam</span>
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : exams.length > 0 ? (
          exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl border border-purple-200 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-gray-900 text-xl mb-2">{exam.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{exam.course}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {exam.date} at {exam.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exam.duration} minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {exam.totalMarks} marks
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mb-2">
                    URL: /exam/{exam.slug}
                  </div>
                  {exam.testCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Test Code:</span>
                      <code className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {exam.testCode}
                      </code>
                      {exam.testCodeType === 'rotating' && (
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded border border-purple-200">
                          Rotates every {exam.testCodeRotationMinutes}min
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`px-3 py-1 rounded-full text-xs border ${getPriorityColor(exam.status)}`}>
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {exam.students} submissions
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {exam.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => onViewExam && onViewExam(exam.originalId)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button 
                  onClick={() => onEditExam && onEditExam(exam.originalId)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => onMonitorExam && onMonitorExam(exam.originalId)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm border border-blue-200"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Monitor</span>
                </button>
                <button 
                  onClick={() => onToggleExamStatus && onToggleExamStatus(exam.originalId, !exam.isPublished)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                    exam.isPublished 
                      ? 'bg-orange-500 text-white hover:bg-orange-600' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {exam.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button 
                  onClick={() => onViewResults && onViewResults(exam.originalId)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Results</span>
                </button>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Exam ID: {exam.id}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 text-xl mb-2">No exams created yet</h3>
            <p className="text-gray-500 mb-6">Create your first exam to start assessing your students</p>
            <button 
              onClick={onCreateExam}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Exam</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Analytics Section Component
function AnalyticsSection({ 
  courses, 
  loading 
}: { 
  courses: Course[];
  loading: boolean;
}) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <BarChart3 className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-gray-900 text-xl mb-2">Analytics Dashboard</h3>
      <p className="text-gray-500">This section is under development.</p>
    </div>
  );
}
