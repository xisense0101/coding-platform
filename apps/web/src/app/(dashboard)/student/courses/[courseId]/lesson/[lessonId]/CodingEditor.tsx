"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Check,
  Info,
  Send,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  ChevronDown,
  ChevronRight,
  Lock,
  ChevronUp
} from 'lucide-react';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { RichTextPreview } from '@/components/editors/RichTextEditor';
import { logger } from '@/lib/utils/logger';
import { formatDateTime } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { LessonHeader } from '@/components/lesson/LessonHeader';

interface CodingQuestionProps {
  questionId: string;
  userId: string;
  courseId: string;
  title?: string;
  coding: {
    problem_statement: string;
    rich_problem_statement?: any;
    boilerplate_code: Record<string, string> | null;
    test_cases: Array<any>;
    allowed_languages: string[];
    time_limit?: number;
    memory_limit?: number;
    head?: Record<string, string>;
    body_template?: Record<string, string>;
    tail?: Record<string, string>;
    [key: string]: any;
  };
  onBack?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export default function CodingEditor({
  questionId,
  userId,
  courseId,
  title = "Coding Challenge",
  coding,
  onBack,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}: CodingQuestionProps) {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState(
    (coding.allowed_languages && coding.allowed_languages[0]) || 'c'
  );
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(35);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const [activeTab, setActiveTab] = useState<'question' | 'attempts'>('question');
  const [bottomTab, setBottomTab] = useState<'test-cases' | 'custom-input' | 'console'>('test-cases');
  
  // Normalize language to lowercase for key lookup
  const languageKey = selectedLanguage.toLowerCase();
  
  // Get head, body, and tail for the selected language
  const head = coding.head?.[languageKey] || '';
  const tail = coding.tail?.[languageKey] || '';
  const initialBody =
    coding.body_template?.[languageKey] ||
    (coding.boilerplate_code && coding.boilerplate_code[languageKey]) ||
    '';

  const getStorageKey = (lang: string) => `coding-editor-${questionId}-${userId}-${lang.toLowerCase()}`;

  const getSavedCode = (lang: string) => {
    if (typeof window === 'undefined') return initialBody;
    const saved = localStorage.getItem(getStorageKey(lang));
    return saved !== null ? saved : initialBody;
  };

  const [body, setBody] = useState(() => getSavedCode(selectedLanguage));
  const [fullCode, setFullCode] = useState(`${head}\n${getSavedCode(selectedLanguage)}\n${tail}`);
  const [customInput, setCustomInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHeadCollapsed, setIsHeadCollapsed] = useState(true);
  const [isTailCollapsed, setIsTailCollapsed] = useState(true);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [viewingAttempt, setViewingAttempt] = useState<any>(null);
  const [testCaseResults, setTestCaseResults] = useState<any[]>([]);
  const [expandedTestCases, setExpandedTestCases] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const workingCodeBeforeViewRef = useRef<string | null>(null);
  const workingLanguageBeforeViewRef = useRef<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleVerticalMouseDown = (e: React.MouseEvent) => {
    setIsResizingVertical(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth >= 25 && newWidth <= 75) {
          setLeftPanelWidth(newWidth);
        }
      }

      if (isResizingVertical && rightPanelRef.current) {
        const panelRect = rightPanelRef.current.getBoundingClientRect();
        const newHeight = ((panelRect.bottom - e.clientY) / panelRect.height) * 100;
        if (newHeight >= 20 && newHeight <= 60) {
          setBottomPanelHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsResizingVertical(false);
    };

    if (isResizing || isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isResizingVertical]);

  useEffect(() => {
    const languageKey = selectedLanguage.toLowerCase();
    const newHead = coding.head?.[languageKey] || '';
    const newTail = coding.tail?.[languageKey] || '';
    const savedCode = getSavedCode(selectedLanguage);
    setBody(savedCode);
    setFullCode(`${newHead}\n${savedCode}\n${newTail}`);
  }, [selectedLanguage, coding.head, coding.tail, coding.body_template, coding.boilerplate_code]);

  useEffect(() => {
    if (typeof window !== 'undefined' && body) {
      localStorage.setItem(getStorageKey(selectedLanguage), body);
    }
  }, [body, selectedLanguage, questionId, userId]);

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

  const handleReset = () => {
    const languageKey = selectedLanguage.toLowerCase();
    const resetBody =
      coding.body_template?.[languageKey] ||
      (coding.boilerplate_code && coding.boilerplate_code[languageKey]) ||
      '';

    if (typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey(selectedLanguage));
    }

    setViewingAttempt(null);
    workingCodeBeforeViewRef.current = null;
    workingLanguageBeforeViewRef.current = null;

    setBody(resetBody);
    const newHead = coding.head?.[languageKey] || '';
    const newTail = coding.tail?.[languageKey] || '';
    setFullCode(`${newHead}\n${resetBody}\n${newTail}`);

    setConsoleOutput('Code reset to initial template.\n');
    setBottomTab('console');
  };

  const handleViewAttempt = (attempt: any) => {
    workingCodeBeforeViewRef.current = body;
    workingLanguageBeforeViewRef.current = selectedLanguage;

    setViewingAttempt(attempt);
    const attemptCode = attempt.answer?.code || '';
    const attemptLanguage = attempt.language || selectedLanguage;

    if (attemptLanguage.toLowerCase() !== selectedLanguage.toLowerCase()) {
      setSelectedLanguage(attemptLanguage);
    }

    setBody(attemptCode);
    const languageKey = attemptLanguage.toLowerCase();
    const newHead = coding.head?.[languageKey] || '';
    const newTail = coding.tail?.[languageKey] || '';
    setFullCode(`${newHead}\n${attemptCode}\n${newTail}`);

    setConsoleOutput(
      `Viewing Attempt #${attempt.attempt_number} (${attemptLanguage})\nSubmitted: ${new Date(
        attempt.submitted_at || attempt.created_at
      ).toLocaleString()}\n`
    );
    setBottomTab('console');
    setActiveTab('question');
  };

  const handleBackToCurrentCode = () => {
    setViewingAttempt(null);

    const restoredCode =
      workingCodeBeforeViewRef.current !== null
        ? workingCodeBeforeViewRef.current
        : getSavedCode(selectedLanguage);

    const restoredLanguage = workingLanguageBeforeViewRef.current || selectedLanguage;
    if (restoredLanguage !== selectedLanguage) {
      setSelectedLanguage(restoredLanguage);
    }

    setBody(restoredCode);
    const languageKey = restoredLanguage.toLowerCase();
    const newHead = coding.head?.[languageKey] || '';
    const newTail = coding.tail?.[languageKey] || '';
    setFullCode(`${newHead}\n${restoredCode}\n${newTail}`);

    workingCodeBeforeViewRef.current = null;
    workingLanguageBeforeViewRef.current = null;

    setConsoleOutput('Returned to your working code.\n');
  };

  const runWithCustomInput = async () => {
    setIsRunning(true);
    setConsoleOutput('Running with custom input...\n');
    setBottomTab('console');

    try {
      const res = await fetch('/api/coding/run-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fullCode,
          language: selectedLanguage,
          input: customInput
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error', details: res.statusText }));
        setConsoleOutput(`${errorData.details || errorData.error}\n`);
      } else {
        const data = await res.json();
        if (data.error) {
          setConsoleOutput(data.error);
        } else if (data.output !== undefined) {
          setConsoleOutput(data.output);
        } else {
          setConsoleOutput(JSON.stringify(data, null, 2));
        }
      }
    } catch (err: any) {
      setConsoleOutput(`${err?.message || String(err)}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const runCode = async () => {
    if (bottomTab === 'custom-input') {
      await runWithCustomInput();
      return;
    }

    setIsRunning(true);
    setConsoleOutput('Running test cases...\n');
    setTestCaseResults([]);

    try {
      const res = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          courseId,
          code: fullCode,
          language: selectedLanguage,
          testCases: coding.test_cases
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error', details: res.statusText }));
        setBottomTab('console');
        setConsoleOutput(`${errorData.details || errorData.error}\n`);
      } else {
        const data = await res.json();
        
        if (data.testCaseResults) {
          setTestCaseResults(data.testCaseResults);
          const passed = data.testCasesPassed || 0;
          const total = data.totalTestCases || 0;
          
          const hasErrors = data.testCaseResults.some((tc: any) => tc.error);
          
          if (hasErrors) {
            const errorTestCase = data.testCaseResults.find((tc: any) => tc.error);
            setBottomTab('console');
            setConsoleOutput(errorTestCase.error);
          } else {
            setBottomTab('test-cases');
            setConsoleOutput(
              `Execution completed!\n\nTest Cases: ${passed}/${total} passed\n`
            );
          }
        } else {
          setBottomTab('console');
          setConsoleOutput((prev) => prev + (data.output || JSON.stringify(data, null, 2)) + "\n");
        }
      }
    } catch (err: any) {
      setBottomTab('console');
      setConsoleOutput(`${err?.message || String(err)}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    setIsSubmitting(true);
    setConsoleOutput('Submitting solution...\n');
    setTestCaseResults([]);

    // First, run the code to get test case results
    let testCasesPassed = 0;
    let totalTestCases = 0;
    let isCorrect = false;

    try {
      const runRes = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          courseId,
          code: fullCode,
          language: selectedLanguage,
          testCases: coding.test_cases
        })
      });
      
      if (runRes.ok) {
        const runData = await runRes.json();
        if (runData.testCaseResults) {
          setTestCaseResults(runData.testCaseResults);
          testCasesPassed = runData.testCasesPassed || 0;
          totalTestCases = runData.totalTestCases || 0;
          isCorrect = testCasesPassed === totalTestCases && totalTestCases > 0;
          
          const hasErrors = runData.testCaseResults.some((tc: any) => tc.error);
          
          if (hasErrors) {
            const errorTestCase = runData.testCaseResults.find((tc: any) => tc.error);
            setBottomTab('console');
            setConsoleOutput(errorTestCase.error);
          } else {
            setBottomTab('test-cases');
          }
        }
      } else {
        setBottomTab('console');
        const errorData = await runRes.json().catch(() => ({ error: 'Unknown error' }));
        setConsoleOutput(`${errorData.details || errorData.error}`);
      }
    } catch (err: any) {
      logger.error('Error running test cases before submission:', err);
      setBottomTab('console');
      setConsoleOutput(`${err?.message || String(err)}`);
    }

    try {
      const res = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId,
          courseId,
          code: body,
          language: selectedLanguage,
          testCasesPassed,
          totalTestCases,
          isCorrect
        })
      });
      if (!res.ok) {
        const txt = await res.text();
        setConsoleOutput((prev) => prev + `Submission failed: ${res.status} ${txt}\n`);
      } else {
        fetchAttempts();
      }
    } catch (err: any) {
      setConsoleOutput((prev) => prev + `Unexpected error: ${err?.message || String(err)}\n`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportProblem = () => {
    alert('Report problem functionality would be implemented here');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <LessonHeader
        title={title}
        type="coding"
        onBack={handleBack}
        onNext={onNext}
        onPrevious={onPrevious}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
      />

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div
          className="overflow-y-auto border-r border-gray-200 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="p-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveTab('question')}
                className={`px-4 py-2 rounded-lg text-sm transition-all font-medium ${
                  activeTab === 'question'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Question
              </button>
              <button
                onClick={() => setActiveTab('attempts')}
                className={`px-4 py-2 rounded-lg text-sm transition-all font-medium ${
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
                  <h2 className="text-gray-900 text-xl font-bold">Problem Statement</h2>
                  <button
                    onClick={reportProblem}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Report a problem"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Problem Content */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="text-gray-900 leading-relaxed prose prose-sm max-w-none">
                    {coding.rich_problem_statement
                      ? <RichTextPreview content={coding.rich_problem_statement} />
                      : <div className="whitespace-pre-wrap">{coding.problem_statement}</div>
                    }
                  </div>
                </div>

                {/* Constraints */}
                <div className="space-y-2 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Time limit:</span>
                    <span className="text-gray-600">{coding.time_limit ?? 'N/A'} seconds</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Memory limit:</span>
                    <span className="text-gray-600">{coding.memory_limit ?? 'N/A'} MB</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-4">
                <h2 className="text-gray-900 text-xl font-bold">Your Submissions</h2>

                {loadingAttempts ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : attempts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No submissions yet</p>
                    <p className="text-gray-400 text-xs mt-1">Click Submit to send your first solution!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((attempt) => {
                      const testCasesPassed = attempt.test_cases_passed || 0;
                      const totalTestCases = attempt.total_test_cases || 0;
                      const isViewing = viewingAttempt?.id === attempt.id;
                      const allPassed = testCasesPassed === totalTestCases && totalTestCases > 0;

                      return (
                        <div
                          key={attempt.id}
                          onClick={() => handleViewAttempt(attempt)}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            isViewing
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : allPassed
                              ? 'border-green-300 bg-green-50 hover:shadow-sm hover:border-green-400'
                              : 'border-red-300 bg-red-50 hover:shadow-sm hover:border-red-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs border font-medium ${
                                    isViewing
                                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                                      : 'bg-white text-gray-600 border-gray-300'
                                  }`}
                                >
                                  Attempt #{attempt.attempt_number}
                                </span>
                                {attempt.language && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs border border-purple-300 font-medium">
                                    {attempt.language}
                                  </span>
                                )}
                                {allPassed ? (
                                  <span className="px-2 py-1 bg-green-600 text-white rounded text-xs flex items-center gap-1 font-medium">
                                    <CheckCircle2 className="w-3 h-3" />
                                    All Tests Passed
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-red-600 text-white rounded text-xs flex items-center gap-1 font-medium">
                                    <XCircle className="w-3 h-3" />
                                    {testCasesPassed}/{totalTestCases} Passed
                                  </span>
                                )}
                                {isViewing && (
                                  <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">Viewing</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="text-xs">
                                  Submitted: {formatDateTime(attempt.submitted_at || attempt.created_at)}
                                </span>
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

        {/* Right Panel - Code Editor */}
        <div
          ref={rightPanelRef}
          className="flex-1 lg:flex-none flex flex-col overflow-hidden bg-white"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={viewingAttempt !== null}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(coding.allowed_languages || []).map((lang: string) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              {viewingAttempt && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs border border-blue-300 font-medium">
                    Viewing Attempt #{viewingAttempt.attempt_number}
                  </span>
                  <button
                    onClick={handleBackToCurrentCode}
                    className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-colors font-medium flex items-center"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Back to Current
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                disabled={viewingAttempt !== null}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset to initial template"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={runCode}
                disabled={isRunning || isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'Running...' : 'Run'}
              </button>
              <button
                onClick={submitCode}
                disabled={isRunning || isSubmitting || viewingAttempt !== null || bottomTab === 'custom-input'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                title={bottomTab === 'custom-input' ? "Cannot submit with custom input" : "Submit solution"}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Code Editor Area */}
          <div className="flex-1 relative" style={{ height: `${100 - bottomPanelHeight}%` }}>
            <div className="absolute inset-0 bg-white flex flex-col overflow-auto">
              {/* Head Section */}
              {head && (
                <div className="border-b border-gray-300">
                  <button
                    onClick={() => setIsHeadCollapsed(!isHeadCollapsed)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isHeadCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span className="text-xs font-semibold text-gray-600">HEAD (Read-only)</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {isHeadCollapsed ? 'Click to expand' : 'Click to collapse'}
                    </span>
                  </button>
                  {!isHeadCollapsed && (
                    <div className="border-t border-gray-200">
                      <CodeEditor
                        value={head}
                        onChange={() => {}}
                        language={selectedLanguage}
                        disabled={true}
                        height={150}
                        showLanguageSelector={false}
                        showActionButtons={false}
                        theme="light"
                        className="bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Body Section (Editable) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                  <span className="text-xs font-semibold text-blue-700">BODY (Your Code)</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    value={body}
                    onChange={(val) => {
                      setBody(val);
                      setFullCode(`${head}\n${val}\n${tail}`);
                    }}
                    language={selectedLanguage}
                    disabled={isRunning || isSubmitting}
                    height="100%"
                    showLanguageSelector={false}
                    showActionButtons={false}
                    theme="light"
                    className="bg-white h-full"
                  />
                </div>
              </div>

              {/* Tail Section */}
              {tail && (
                <div className="border-t border-gray-300">
                  <button
                    onClick={() => setIsTailCollapsed(!isTailCollapsed)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isTailCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span className="text-xs font-semibold text-gray-600">TAIL (Read-only)</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {isTailCollapsed ? 'Click to expand' : 'Click to collapse'}
                    </span>
                  </button>
                  {!isTailCollapsed && (
                    <div className="border-t border-gray-200">
                      <CodeEditor
                        value={tail}
                        onChange={() => {}}
                        language={selectedLanguage}
                        disabled={true}
                        height={150}
                        showLanguageSelector={false}
                        showActionButtons={false}
                        theme="light"
                        className="bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vertical Resizer */}
          <div
            className="h-1 bg-gray-200 hover:bg-blue-400 cursor-row-resize transition-colors relative group"
            onMouseDown={handleVerticalMouseDown}
          >
            <div className="absolute inset-x-0 -top-1 -bottom-1" />
          </div>

          {/* Bottom Panel */}
          <div className="border-t border-gray-200 bg-white" style={{ height: `${bottomPanelHeight}%` }}>
            <div className="flex flex-col h-full">
              {/* Bottom Tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => setBottomTab('test-cases')}
                  className={`px-4 py-2 text-sm transition-all font-medium ${
                    bottomTab === 'test-cases'
                      ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Test cases
                </button>
                <button
                  onClick={() => setBottomTab('custom-input')}
                  className={`px-4 py-2 text-sm transition-all font-medium ${
                    bottomTab === 'custom-input'
                      ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Custom input
                </button>
                <button
                  onClick={() => setBottomTab('console')}
                  className={`px-4 py-2 text-sm transition-all font-medium ${
                    bottomTab === 'console'
                      ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Console
                </button>
              </div>

              {/* Bottom Content */}
              <div className="flex-1 overflow-auto p-4">
                {bottomTab === 'test-cases' && (
                  <div className="space-y-3">
                    {Array.isArray(coding.test_cases) && coding.test_cases.length > 0 ? (
                      coding.test_cases.map((tc: any, i: number) => {
                        const result = testCaseResults.find((r) => r.testCaseIndex === i);
                        const isExpanded = expandedTestCases.has(i);
                        const hasResult = result !== undefined;

                        return (
                          <div
                            key={i}
                            className={`rounded-lg border-2 transition-all ${
                              hasResult
                                ? result.passed
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-red-500 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedTestCases);
                                if (isExpanded) {
                                  newExpanded.delete(i);
                                } else {
                                  newExpanded.add(i);
                                }
                                setExpandedTestCases(newExpanded);
                              }}
                              className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {hasResult ? (
                                  result.passed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                                )}
                                <span
                                  className={`text-sm font-semibold ${
                                    hasResult
                                      ? result.passed
                                        ? 'text-green-800'
                                        : 'text-red-800'
                                      : 'text-gray-800'
                                  }`}
                                >
                                  Test Case #{i + 1}
                                </span>
                                {tc.is_hidden && <Lock className="w-4 h-4 text-gray-500" />}
                              </div>
                              <div className="flex items-center gap-2">
                                {hasResult && (
                                  <span
                                    className={`text-xs font-medium ${
                                      result.passed ? 'text-green-700' : 'text-red-700'
                                    }`}
                                  >
                                    {result.passed ? 'Passed' : 'Failed'}
                                  </span>
                                )}
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="border-t border-gray-300 p-4 bg-white space-y-3">
                                {tc.is_hidden ? (
                                  <div className="flex items-center gap-2 text-gray-600 p-3 bg-gray-100 rounded">
                                    <Lock className="w-4 h-4" />
                                    <span className="text-sm">This test case is hidden</span>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <div className="text-xs font-semibold text-gray-600 mb-1">Input:</div>
                                      <div className="bg-gray-50 p-2 rounded border text-sm font-mono whitespace-pre-wrap">
                                        {tc.input || '(empty)'}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold text-gray-600 mb-1">
                                        Expected Output:
                                      </div>
                                      <div className="bg-gray-50 p-2 rounded border text-sm font-mono whitespace-pre-wrap">
                                        {tc.expected_output || tc.expectedOutput || '(empty)'}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {hasResult && !tc.is_hidden && (
                                  <>
                                    <div>
                                      <div className="text-xs font-semibold text-gray-600 mb-1">Your Output:</div>
                                      <div
                                        className={`p-2 rounded border text-sm font-mono whitespace-pre-wrap ${
                                          result.passed
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-red-50 border-red-300'
                                        }`}
                                      >
                                        {result.actualOutput || '(empty)'}
                                      </div>
                                    </div>

                                    {(result.executionTime || result.memory) && (
                                      <div className="flex gap-4 text-xs text-gray-600">
                                        {result.executionTime && <span>Time: {result.executionTime}s</span>}
                                        {result.memory && <span>Memory: {result.memory} KB</span>}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-gray-500">No test cases provided.</div>
                    )}
                  </div>
                )}

                {bottomTab === 'custom-input' && (
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter your custom input here..."
                    className="w-full h-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}

                {bottomTab === 'console' && (
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap h-full overflow-auto">
                    {consoleOutput || 'Console output will appear here...'}
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
