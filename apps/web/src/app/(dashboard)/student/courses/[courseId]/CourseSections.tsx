"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Code, 
  PenTool, 
  Lock, 
  Award,
  User
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: 'reading' | 'mcq' | 'coding' | 'essay';
  duration?: string;
  isCompleted: boolean;
  isLocked: boolean;
  points?: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  isCompleted: boolean;
  progress: number;
  order_index?: number;
}

interface CourseData {
  id: string;
  title: string;
  description?: string;
  totalProgress?: number;
  sections: Section[];
  teacher?: {
    full_name?: string;
    email?: string;
  };
  enrollment?: {
    progress_percentage?: number;
  };
}

interface CourseSectionsProps {
  courseData: CourseData;
  userId: string;
  completedQuestionIds?: string[];
}

export default function CourseSections({ 
  courseData, 
  userId,
  completedQuestionIds = []
}: CourseSectionsProps) {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // Transform database data to component format
  const processedCourse = useMemo(() => {
    const sections: Section[] = (courseData.sections || []).map((section: any) => {
      const questions = section.questions || [];
      const lessons: Lesson[] = questions.map((question: any, index: number) => {
        const isCompleted = completedQuestionIds.includes(question.id);
        // Simple locking: lock if previous question in section is not completed
        // const previousQuestion = index > 0 ? questions[index - 1] : null;
        // const isPreviousCompleted = previousQuestion ? completedQuestionIds.includes(previousQuestion.id) : true;
        
        return {
          id: question.id,
          title: question.title || `Question ${index + 1}`,
          type: question.type as 'reading' | 'mcq' | 'coding' | 'essay',
          duration: `${question.points || 5} min`,
          isCompleted,
          isLocked: false, // index > 0 && !isPreviousCompleted,
          points: question.points || 1
        };
      });

      // Calculate section progress
      const completedLessons = lessons.filter(l => l.isCompleted).length;
      const progress = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

      return {
        id: section.id,
        title: section.title,
        description: section.description,
        lessons,
        isCompleted: progress === 100,
        progress,
        order_index: section.order_index
      };
    });

    // Sort sections by order_index
    sections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    // Calculate total progress based on all lessons
    const totalLessons = sections.reduce((acc, section) => acc + section.lessons.length, 0);
    const totalCompleted = sections.reduce((acc, section) => acc + section.lessons.filter(l => l.isCompleted).length, 0);
    const calculatedTotalProgress = totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0;

    return {
      ...courseData,
      sections,
      totalProgress: calculatedTotalProgress
    };
  }, [courseData, completedQuestionIds]);

  useEffect(() => {
    if (processedCourse.sections.length > 0 && !selectedSection) {
      setSelectedSection(processedCourse.sections[0]);
    }
  }, [processedCourse.sections, selectedSection]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <FileText className="w-4 h-4" />;
      case 'mcq': return <CheckCircle2 className="w-4 h-4" />;
      case 'coding': return <Code className="w-4 h-4" />;
      case 'essay': return <PenTool className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'reading': return 'Reading';
      case 'mcq': return 'Quiz';
      case 'coding': return 'Code';
      case 'essay': return 'Essay';
      default: return 'Lesson';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reading': return 'from-blue-500 to-blue-600';
      case 'mcq': return 'from-green-500 to-green-600';
      case 'coding': return 'from-purple-500 to-purple-600';
      case 'essay': return 'from-orange-500 to-orange-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.isLocked) {
      alert("This lesson is locked. Please complete previous lessons.");
      return;
    }
    router.push(`/student/courses/${courseData.id}/lesson/${lesson.id}`);
  };

  const handleBackClick = () => {
    router.push('/student/dashboard');
  };

  const totalLessons = processedCourse.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const completedLessons = processedCourse.sections.reduce(
    (sum, section) => sum + section.lessons.filter(l => l.isCompleted).length, 
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-gray-900">{processedCourse.title}</h1>
                {processedCourse.teacher?.full_name && (
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {processedCourse.teacher.full_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-gray-500 text-xs">Progress</p>
                <p className="text-gray-900 text-sm">
                  {completedLessons}/{totalLessons} lessons
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <span className="text-sm">
                  {Math.round(processedCourse.totalProgress || 0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Section Sidebar */}
          <div className="col-span-4 space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-gray-900 text-sm mb-3">Course Sections</h2>
              <div className="space-y-2">
                {processedCourse.sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedSection?.id === section.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0 ${
                        selectedSection?.id === section.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm mb-1 truncate ${
                          selectedSection?.id === section.id
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}>
                          {section.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-gray-500">{section.lessons.length} lessons</span>
                          <span className={`${selectedSection?.id === section.id ? 'text-blue-600' : 'text-gray-600'}`}>
                            {Math.round(section.progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all" 
                            style={{ width: `${section.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lessons Content */}
          <div className="col-span-8">
            {selectedSection && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-gray-900 text-xl mb-1">{selectedSection.title}</h2>
                    {selectedSection.description && (
                      <p className="text-gray-600 text-sm">{selectedSection.description}</p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    selectedSection.isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedSection.lessons.filter(l => l.isCompleted).length}/{selectedSection.lessons.length} Complete
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedSection.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className={`bg-gray-50 rounded-lg p-4 border transition-all ${
                        lesson.isLocked
                          ? 'opacity-60 cursor-not-allowed border-gray-200'
                          : 'cursor-pointer hover:border-blue-200 hover:shadow-sm border-gray-200'
                      }`}
                      onClick={() => handleLessonClick(lesson)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 bg-gradient-to-br ${getTypeColor(lesson.type)} rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                            {getTypeIcon(lesson.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-gray-900 text-sm">{lesson.title}</h3>
                              <span className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200">
                                {getTypeLabel(lesson.type)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.duration}
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {lesson.points} pts
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          {lesson.isLocked ? (
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Lock className="w-4 h-4 text-gray-400" />
                            </div>
                          ) : lesson.isCompleted ? (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors group">
                              <Play className="w-4 h-4 text-blue-600 group-hover:text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedSection.lessons.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No lessons in this section yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
