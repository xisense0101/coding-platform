import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, PenTool, BookOpen } from 'lucide-react';

interface LessonHeaderProps {
  title: string;
  type: 'mcq' | 'coding' | 'essay' | 'reading';
  onBack?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  isSubmitted?: boolean;
  isCompleted?: boolean;
}

export function LessonHeader({
  title,
  type,
  onBack,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  isSubmitted,
  isCompleted
}: LessonHeaderProps) {
  const getBadgeConfig = () => {
    switch (type) {
      case 'mcq':
        return {
          label: 'Quiz',
          className: 'bg-green-100 text-green-700',
          icon: null
        };
      case 'coding':
        return {
          label: 'Code',
          className: 'bg-purple-100 text-purple-700',
          icon: null
        };
      case 'essay':
        return {
          label: 'Essay',
          className: 'bg-orange-100 text-orange-700',
          icon: <PenTool className="w-3 h-3" />
        };
      case 'reading':
        return {
          label: 'Reading',
          className: 'bg-orange-100 text-orange-700',
          icon: <BookOpen className="w-3 h-3" />
        };
      default:
        return {
          label: 'Lesson',
          className: 'bg-gray-100 text-gray-700',
          icon: null
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to Course</span>
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <div>
              <h1 className="text-gray-900">{title}</h1>
              <p className="text-gray-500 text-xs">
                {type === 'mcq' ? 'Multiple Choice Question' : 
                 type === 'coding' ? 'Coding Challenge' : 
                 type === 'essay' ? 'Essay Question' : 'Lesson'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:hover:border-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:hover:border-gray-200"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {(isSubmitted || isCompleted) && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                {isCompleted ? 'Completed' : 'Submitted'}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 font-medium ${badge.className}`}>
              {badge.icon}
              {badge.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
