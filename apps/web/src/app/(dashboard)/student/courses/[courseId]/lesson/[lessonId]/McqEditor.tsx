"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ChevronRight,
  Check, 
  Info, 
  Send, 
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { RichTextPreview } from '@/components/editors/RichTextEditor';
import { logger } from '@/lib/utils/logger';
import { LessonHeader } from '@/components/lesson/LessonHeader';

interface McqQuestionProps {
  questionId: string;
  userId: string;
  courseId: string;
  title: string;
  mcq: {
    question_text: string;
    rich_question_text?: any;
    options: string[];
    correct_answers: number[];
    explanation?: string;
  };
  navigation?: {
    prev: string | null;
    next: string | null;
  };
}

export default function McqEditor({ 
  questionId, 
  userId, 
  courseId, 
  title, 
  mcq,
  navigation
}: McqQuestionProps) {
  const router = useRouter();
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [viewingAttempt, setViewingAttempt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'question' | 'attempts'>('question');

  const containerRef = useRef<HTMLDivElement>(null);
  const workingAnswerBeforeViewRef = useRef<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth >= 30 && newWidth <= 70) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Load attempts when component mounts
  useEffect(() => {
    fetchAttempts();
  }, [questionId, userId]);

  const fetchAttempts = async () => {
    setLoadingAttempts(true);
    try {
      const res = await fetch(`/api/attempts/${questionId}`);
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      }
    } catch (err) {
      logger.error('Error fetching attempts:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    setIsLoading(true);
    try {
      // Convert letter ID back to index for database
      const selectedIndex = selectedAnswer.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.

      // Submit answer to database
      const res = await fetch('/api/mcq/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          userId,
          selectedOption: selectedIndex,
          correctAnswers: mcq.correct_answers
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsSubmitted(true);
        setShowResult(true);
        // Refresh attempts list after successful submission
        fetchAttempts();
      } else {
        alert('Failed to submit answer. Please try again.');
      }
    } catch (error) {
      logger.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedAnswer("");
    setIsSubmitted(false);
    setShowResult(false);
    setViewingAttempt(null);
    workingAnswerBeforeViewRef.current = null;
  };

  const handleViewAttempt = (attempt: any) => {
    workingAnswerBeforeViewRef.current = selectedAnswer;
    
    setViewingAttempt(attempt);
    const selectedOption = attempt.answer?.selectedOption;
    if (selectedOption !== undefined) {
      const optionLetter = String.fromCharCode(97 + selectedOption);
      setSelectedAnswer(optionLetter);
      setIsSubmitted(true);
      setShowResult(true);
    }
    setActiveTab('question');
  };

  const handleBackToNew = () => {
    setViewingAttempt(null);
    const restoredAnswer = workingAnswerBeforeViewRef.current !== null 
      ? workingAnswerBeforeViewRef.current 
      : "";
    
    setSelectedAnswer(restoredAnswer);
    setIsSubmitted(false);
    setShowResult(false);
    workingAnswerBeforeViewRef.current = null;
  };

  const reportProblem = () => {
    alert("Report problem functionality would be implemented here");
  };

  const mcqOptions = mcq.options.map((option, index) => ({
    id: String.fromCharCode(97 + index),
    text: option,
    isCorrect: mcq.correct_answers.includes(index)
  }));

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOptionLetter = (index: number) => String.fromCharCode(97 + index).toUpperCase();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <LessonHeader
        title={title}
        type="mcq"
        onBack={() => router.push(`/student/courses/${courseId}`)}
        onNext={() => navigation?.next && router.push(`/student/courses/${courseId}/lesson/${navigation.next}`)}
        onPrevious={() => navigation?.prev && router.push(`/student/courses/${courseId}/lesson/${navigation.prev}`)}
        hasNext={!!navigation?.next}
        hasPrevious={!!navigation?.prev}
      />

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Left Panel - Question */}
        <div
          className="overflow-auto border-r border-gray-200 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="p-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveTab('question')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  activeTab === 'question'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Question
              </button>
              <button
                onClick={() => setActiveTab('attempts')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  activeTab === 'attempts'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Submissions {attempts.length > 0 && `(${attempts.length})`}
              </button>
            </div>

            {activeTab === 'question' && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-gray-900 text-xl">Question</h2>
                  <button
                    onClick={reportProblem}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Report a problem"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Content */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                   {mcq.rich_question_text ? (
                        <RichTextPreview content={mcq.rich_question_text} />
                      ) : (
                        <p className="text-gray-900 leading-relaxed">{mcq.question_text}</p>
                      )}
                </div>

                {/* Explanation */}
                {mcq.explanation && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-green-900">
                          <span className="font-medium">Explanation:</span> {mcq.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-4">
                <h2 className="text-gray-900 text-xl">Your Submissions</h2>
                
                {loadingAttempts ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No submissions yet</p>
                    <p className="text-gray-400 text-xs mt-1">Submit your answer to see your attempts here!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((attempt) => {
                      const selectedOption = attempt.answer?.selectedOption;
                      const isViewing = viewingAttempt?.id === attempt.id;
                      return (
                        <div
                          key={attempt.id}
                          onClick={() => handleViewAttempt(attempt)}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            isViewing 
                              ? 'border-blue-600 bg-blue-50 shadow-md' 
                              : attempt.is_correct 
                                ? 'border-green-300 bg-green-50 hover:shadow-sm hover:border-green-400' 
                                : 'border-red-300 bg-red-50 hover:shadow-sm hover:border-red-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs border ${
                                  isViewing 
                                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                    : 'bg-white text-gray-600 border-gray-300'
                                }`}>
                                  Attempt #{attempt.attempt_number}
                                </span>
                                {attempt.is_correct ? (
                                  <span className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Correct
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-red-600 text-white rounded text-xs flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Incorrect
                                  </span>
                                )}
                                {isViewing && (
                                  <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                                    Viewing
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="text-xs">Submitted: {formatDateTime(attempt.submitted_at || attempt.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        <div
          className="hidden lg:block w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors relative group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Right Panel - Answer Options */}
        <div
          className="flex-1 lg:flex-none flex flex-col overflow-hidden bg-white"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Answer Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            {viewingAttempt ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs border border-blue-300">
                    Viewing Attempt #{viewingAttempt.attempt_number}
                  </span>
                  {mcqOptions.find(opt => opt.id === selectedAnswer)?.isCorrect ? (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Correct Answer
                    </span>
                  ) : (
                    <span className="text-red-600 text-sm flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Incorrect Answer
                    </span>
                  )}
                </div>
                <button
                  onClick={handleBackToNew}
                  className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Attempt
                </button>
              </div>
            ) : showResult ? (
              <div className="text-sm">
                {mcqOptions.find(opt => opt.id === selectedAnswer)?.isCorrect ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Correct! Well done.</span>
                  </span>
                ) : (
                  <div className="text-red-600">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-5 h-5" />
                      <span>Incorrect. Try again!</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">Select your answer from the options below</p>
            )}
          </div>

          {/* Answer Options */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="space-y-3">
              {mcqOptions.map((option) => {
                const isSelected = selectedAnswer === option.id;
                const isSelectedCorrect = mcqOptions.find(opt => opt.id === selectedAnswer)?.isCorrect;
                const showCorrect = showResult && option.isCorrect && isSelectedCorrect;
                const showIncorrect = showResult && isSelected && !option.isCorrect;

                return (
                  <button
                    key={option.id}
                    onClick={() => !isSubmitted && setSelectedAnswer(option.id)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      showCorrect
                        ? 'border-green-500 bg-green-50'
                        : showIncorrect
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    } ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        showCorrect
                          ? 'border-green-600 bg-green-600'
                          : showIncorrect
                          ? 'border-red-600 bg-red-600'
                          : isSelected
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {(isSelected || showCorrect) && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className={`flex-1 ${
                        showCorrect ? 'text-green-900 font-medium' : 'text-gray-900'
                      }`}>
                        {option.text}
                      </span>
                      {showCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                      {showIncorrect && (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={clearSelection}
                disabled={!selectedAnswer || viewingAttempt !== null}
                className="px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Clear selection
              </button>
              <div className="relative group">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer || isSubmitted || isLoading || viewingAttempt !== null}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Answer
                    </>
                  )}
                </button>
                {viewingAttempt !== null && (
                  <div className="absolute bottom-full mb-2 right-0 bg-gray-800 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Cannot submit while viewing an attempt
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
