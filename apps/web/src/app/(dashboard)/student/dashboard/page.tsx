"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Shield, 
  LogOut, 
  BookOpen, 
  BarChart3,
  Bell,
  User,
  Settings,
  FileText,
  Award,
  PlayCircle,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useStudentCourses } from '@/hooks/useData';
import { useOrganizationBranding } from '@/hooks/useOrganizationBranding';

interface RecentActivityItem {
  type: 'course' | 'exam' | 'student';
  message: string;
  time: string;
}

interface UpcomingDeadline {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  slug: string;
}

interface Course {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  instructor: string;
  thumbnail: string;
}

interface ActivityData {
  recentActivity: RecentActivityItem[];
  upcomingDeadlines: UpcomingDeadline[];
  currentStreak: number;
}

export default function StudentDashboard() {
  const { signOut, userProfile } = useAuth();
  const router = useRouter();
  const { courses, loading: coursesLoading } = useStudentCourses();
  const { logoUrl, organizationName } = useOrganizationBranding();
  const [activeSection, setActiveSection] = useState('courses');
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const userEmail = userProfile?.email || 'student@example.com';

  // Mock data for demonstration (replace with actual API call)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setActivityData({
        recentActivity: [
          { type: 'course', message: 'Continued learning in JavaScript in Action', time: '2 hours ago' },
          { type: 'exam', message: 'Completed React Fundamentals Quiz', time: '1 day ago' },
          { type: 'course', message: 'Continued learning in Advanced TypeScript', time: '2 days ago' },
          { type: 'exam', message: 'Started Database Design Exam', time: '3 days ago' },
        ],
        upcomingDeadlines: [
          { id: '1', title: 'Final Project Submission', course: 'JavaScript in Action', dueDate: 'Jan 20, 2025', priority: 'high', slug: 'final-project' },
          { id: '2', title: 'Mid-term Assessment', course: 'Advanced TypeScript', dueDate: 'Jan 25, 2025', priority: 'medium', slug: 'midterm' },
          { id: '3', title: 'Quiz: React Hooks', course: 'React Fundamentals', dueDate: 'Feb 1, 2025', priority: 'low', slug: 'quiz-hooks' },
        ],
        currentStreak: 5,
      });

      setLoading(false);
    }, 500);
  }, []);

  const getCourseIcon = (thumbnail: string) => {
    const colors = {
      'js': 'from-yellow-500 to-orange-500',
      'ts': 'from-blue-500 to-blue-600',
      'react': 'from-cyan-500 to-blue-500'
    };
    return colors[thumbnail as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const handleContinueCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const sidebarItems = [
    // { id: 'dashboard', label: 'Dashboard', icon: Home }, // Removed as per request
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    // { id: 'exams', label: 'Exams', icon: FileText },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-transform duration-300 lg:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 shadow-md">
                  <Image 
                    src={logoUrl} 
                    alt={organizationName || 'Organization'} 
                    width={40} 
                    height={40}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-gray-900 text-base">{organizationName || 'BlocksCode'}</h1>
                <p className="text-gray-500 text-xs">Student Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm truncate">Student User</p>
              <p className="text-gray-500 text-xs truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button & Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6 text-gray-600" />
                </button>
                <h2 className="text-gray-900 text-lg sm:text-xl capitalize">{activeSection === 'courses' ? 'My Courses' : activeSection}</h2>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button className="p-2 sm:p-2.5 hover:bg-gray-50 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button 
                  onClick={() => setActiveSection('profile')}
                  className="p-2 sm:p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {activeSection === 'profile' && (
            <ProfileSection userEmail={userEmail} />
          )}

          {activeSection === 'courses' && (
            coursesLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <CoursesSection 
                courses={courses} 
                getCourseIcon={getCourseIcon} 
                onContinue={handleContinueCourse}
              />
            )
          )}

          {activeSection !== 'dashboard' && activeSection !== 'profile' && activeSection !== 'courses' && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-gray-900 text-xl mb-2">Coming Soon</h3>
              <p className="text-gray-500">This section is under development.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Profile Section Component
function ProfileSection({ userEmail }: { userEmail: string }) {
  return (
    <div className="max-w-4xl">
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
          <h3 className="text-gray-900 text-lg sm:text-xl mb-4 sm:mb-6">Personal Information</h3>
          
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl">
                <User className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <div className="flex-1 w-full">
              <h4 className="text-gray-900 text-lg sm:text-xl mb-1">Student User</h4>
              <p className="text-gray-500 text-sm sm:text-base mb-3 sm:mb-4 break-all">{userEmail}</p>
              <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Change Profile Picture
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Full Name</label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500">
                Student User
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Email Address</label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500">
                {userEmail}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Student ID</label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500">
                STU-2025-001
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Phone Number</label>
              <input
                type="tel"
                defaultValue="+1 (555) 123-4567"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
            <button className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>

        {/* Account Security */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
          <h3 className="text-gray-900 text-lg sm:text-xl mb-4 sm:mb-6">Account Security</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
            </div>
          </div>

          <div className="mt-6">
            <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              Update Password
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
          <h3 className="text-gray-900 text-lg sm:text-xl mb-4 sm:mb-6">Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm sm:text-base">Email Notifications</p>
                <p className="text-gray-500 text-xs sm:text-sm">Receive email updates about your courses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm sm:text-base">Push Notifications</p>
                <p className="text-gray-500 text-xs sm:text-sm">Get notified about deadlines and updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-3 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm sm:text-base">Weekly Progress Report</p>
                <p className="text-gray-500 text-xs sm:text-sm">Receive weekly summary of your progress</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Courses Section Component
function CoursesSection({ 
  courses, 
  getCourseIcon,
  onContinue 
}: { 
  courses: Course[]; 
  getCourseIcon: (thumbnail: string) => string;
  onContinue: (courseId: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => onContinue(course.id)}
            className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              {course.thumbnail && (course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/')) ? (
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-md flex-shrink-0"
                />
              ) : (
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${getCourseIcon(course.thumbnail)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-900 text-base sm:text-lg mb-1 group-hover:text-blue-600 transition-colors truncate">{course.title}</h4>
                <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 truncate">{course.instructor}</p>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{course.completedLessons} of {course.totalLessons} lessons</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
                <button className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <PlayCircle className="w-4 h-4" />
                  Continue
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
