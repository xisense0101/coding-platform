"use client"

import React, { useState, useEffect } from 'react';
import { Info, CheckCircle2, BookOpen } from 'lucide-react';
import { RichTextPreview } from '@/components/editors/RichTextEditor';
import { logger } from '@/lib/utils/logger';
import { LessonHeader } from '@/components/lesson/LessonHeader';

interface EssayQuestionProps {
  questionId: string;
  userId: string;
  courseId: string;
  title: string;
  essay: {
    prompt: string;
    rich_prompt?: any;
    min_words?: number;
    max_words?: number;
    time_limit_minutes?: number;
    rubric?: any;
  };
  onBack?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export default function EssayEditor({
  questionId,
  userId,
  courseId,
  title,
  essay,
  onBack,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}: EssayQuestionProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const reportProblem = () => {
    alert('Report problem functionality would be implemented here');
  };

  const handleMarkAsComplete = async () => {
    setIsMarking(true);
    try {
      // Submit as "completed" essay (empty text or specific flag)
      const res = await fetch('/api/student/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          userId,
          answer: { essayText: "COMPLETED_READING" }, // Or handle this differently in backend
          attemptType: 'essay'
        })
      });

      if (res.ok) {
        setIsCompleted(true);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      logger.error('Error marking as complete:', error);
      alert('Failed to mark as complete. Please try again.');
    } finally {
      setIsMarking(false);
    }
  };

  const renderContent = () => {
    if (essay.rich_prompt) {
      if (typeof essay.rich_prompt === 'string') {
        try {
          const parsed = JSON.parse(essay.rich_prompt);
          if (parsed && parsed.content) {
            return <RichTextPreview content={parsed.content} />;
          }
        } catch (e) {
          return <RichTextPreview content={essay.rich_prompt} />;
        }
      } else if (typeof essay.rich_prompt === 'object' && essay.rich_prompt.content) {
        return <RichTextPreview content={essay.rich_prompt.content} />;
      }
      return <RichTextPreview content={essay.rich_prompt} />;
    } else if (essay.prompt) {
      return <div className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">{essay.prompt}</div>;
    }
    return <div className="text-lg text-gray-500 italic">No content available</div>;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <LessonHeader
        title={title}
        type="essay"
        onBack={onBack}
        onNext={onNext}
        onPrevious={onPrevious}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        isCompleted={isCompleted}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="space-y-6">
            {/* Content Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl text-gray-900">Lesson</h2>
                  <p className="text-sm text-gray-500">Read carefully and understand the concepts</p>
                </div>
              </div>
              <button
                onClick={reportProblem}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Report a problem"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* Reading Content Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-8">
                {renderContent()}
              </div>
            </div>

            {/* Mark as Complete Button */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 mb-1">Finished Reading?</h3>
                  <p className="text-sm text-gray-500">
                    Mark this lesson as complete to track your progress
                  </p>
                </div>
                <button
                  onClick={handleMarkAsComplete}
                  disabled={isCompleted || isMarking}
                  className={`px-6 py-3 rounded-lg text-white shadow-sm transition-all flex items-center gap-2 ${
                    isCompleted
                      ? 'bg-green-600 cursor-default'
                      : isMarking
                      ? 'bg-blue-400 cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                  } disabled:opacity-75`}
                >
                  {isMarking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Marking...
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Mark as Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
