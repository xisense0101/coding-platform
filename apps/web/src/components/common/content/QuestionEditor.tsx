import React from 'react';
import { 
  Eye, EyeOff, Trash2, GripVertical, CheckCircle2, Code2, Plus, BookOpen, FileText 
} from 'lucide-react';
import { Question, TestCase, PROGRAMMING_LANGUAGES } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RichTextEditor } from '@/components/editors/RichTextEditor';
import { CodeEditor } from '@/components/editors/CodeEditor';
import { cn } from '@/lib/utils';

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  readOnly?: boolean;
}

export function QuestionEditor({
  question,
  onUpdate,
  onDelete,
  isExpanded,
  onToggleExpand,
  readOnly = false
}: QuestionEditorProps) {

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'mcq': return <CheckCircle2 className="w-4 h-4" />;
      case 'coding': return <Code2 className="w-4 h-4" />;
      case 'essay': return <BookOpen className="w-4 h-4" />;
      case 'reading': return <BookOpen className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'mcq': return 'bg-green-100 text-green-700 border-green-300';
      case 'coding': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'essay': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'reading': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const addTestCase = () => {
    const newTestCase: TestCase = {
      id: Date.now(),
      input: "",
      expectedOutput: "",
      isHidden: true,
      weight: 1
    };
    onUpdate({
      testCases: [...(question.testCases || []), newTestCase]
    });
  };

  return (
    <Card className="border-gray-200 overflow-hidden">
      {/* Question Header */}
      <div
        className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <Badge variant="outline" className={cn("flex items-center gap-1", getQuestionTypeBadge(question.type))}>
              {getQuestionTypeIcon(question.type)}
              {question.type.toUpperCase()}
            </Badge>
            <Input
              value={question.title}
              onChange={(e) => {
                e.stopPropagation();
                onUpdate({ title: e.target.value });
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-8 bg-transparent border-transparent hover:border-gray-300 focus:bg-white"
              placeholder="Question Title"
              disabled={readOnly}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={question.points}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpdate({ points: parseInt(e.target.value) || 0 });
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-16 h-8 text-center"
                placeholder="pts"
                disabled={readOnly}
              />
              <span className="text-xs text-gray-500">pts</span>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ isVisible: !question.isVisible });
              }}
              className={cn(
                "h-8 w-8 p-0",
                question.isVisible ? "text-green-600 bg-green-50" : "text-gray-400"
              )}
              disabled={readOnly}
            >
              {question.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            
            {!readOnly && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Question Content (Expandable) */}
      {isExpanded && (
        <CardContent className="p-6 space-y-6">
          <div>
            <Label className="mb-2 block">Question Content</Label>
            <RichTextEditor
              value={question.content}
              onChange={(val) => onUpdate({ content: val })}
              placeholder="Enter your question here..."
              height={160}
              toolbar="full"
              disabled={readOnly}
            />
          </div>

          {/* MCQ Options */}
          {question.type === 'mcq' && (
            <div className="space-y-3">
              <Label>Answer Options</Label>
              <div className="space-y-2">
                {(question.options || ["", "", "", ""]).map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(question.options || ["", "", "", ""])];
                          newOptions[idx] = e.target.value;
                          onUpdate({ options: newOptions });
                        }}
                        placeholder={`Option ${idx + 1}`}
                        disabled={readOnly}
                      />
                    </div>
                    <Button
                      variant={question.correctAnswer === idx ? "default" : "outline"}
                      className={cn(
                        "w-32",
                        question.correctAnswer === idx ? "bg-green-600 hover:bg-green-700" : ""
                      )}
                      onClick={() => onUpdate({ correctAnswer: idx })}
                      disabled={readOnly}
                    >
                      {question.correctAnswer === idx ? "✓ Correct" : "Mark Correct"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Essay/Reading Question - Just Content (already rendered above) */}
          {(question.type === 'essay' || question.type === 'reading') && (
            <div className="text-xs text-gray-500 italic">
              {question.type === 'essay' ? 'Students will write an essay response.' : 'Students will read this content.'}
            </div>
          )}

          {/* Coding Question */}
          {question.type === 'coding' && (
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Allowed Programming Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <Button
                      key={lang}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (readOnly) return;
                        const currentLangs = question.languages || ["JavaScript", "Python"];
                        const newLangs = currentLangs.includes(lang)
                          ? currentLangs.filter(l => l !== lang)
                          : [...currentLangs, lang];
                        onUpdate({ languages: newLangs });
                      }}
                      className={cn(
                        (question.languages || []).includes(lang)
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white"
                          : "text-gray-600"
                      )}
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Code Problem Setup */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="mb-4">
                  <Label className="text-sm font-medium">Code Problem Setup</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure the code template for each language. The final code will be: <strong>HEAD + BODY_TEMPLATE + TAIL</strong>
                  </p>
                </div>
                
                {/* Language tabs */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2">
                    {(question.languages || ["JavaScript", "Python"]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => onUpdate({ activeLanguage: lang.toLowerCase() })}
                        className={cn(
                          "px-3 py-1.5 rounded text-xs transition-colors font-medium",
                          (question.activeLanguage === lang.toLowerCase() || 
                           (!question.activeLanguage && lang === (question.languages || ["JavaScript"])[0]))
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  
                  {/* Display editors for active language */}
                  {(question.languages || ["JavaScript", "Python"]).map((lang) => {
                    const langLower = lang.toLowerCase();
                    const isActive = question.activeLanguage === langLower || 
                      (!question.activeLanguage && lang === (question.languages || ["JavaScript"])[0]);
                    
                    if (!isActive) return null;
                    
                    return (
                      <div key={lang} className="space-y-4">
                        {/* HEAD */}
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            HEAD - Prepended to student code (hidden)
                          </Label>
                          <CodeEditor
                            value={(question.head && typeof question.head === 'object' ? question.head[langLower] : '') || ''}
                            onChange={(val) => {
                              const newHead = { ...(question.head || {}) };
                              newHead[langLower] = val;
                              onUpdate({ head: newHead });
                            }}
                            language={langLower}
                            placeholder={`// Code that runs before student's solution\n// Example: imports, helpers, etc.`}
                            height={150}
                            className="rounded-md border border-gray-200"
                            disabled={readOnly}
                            showLanguageSelector={false}
                            showActionButtons={false}
                          />
                        </div>

                        {/* BODY TEMPLATE */}
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            BODY TEMPLATE - What students see
                          </Label>
                          <CodeEditor
                            value={(question.body_template && typeof question.body_template === 'object' ? question.body_template[langLower] : '') || (typeof question.code === 'string' ? question.code : '') || ''}
                            onChange={(val) => {
                              const newBodyTemplate = { ...(question.body_template || {}) };
                              newBodyTemplate[langLower] = val;
                              onUpdate({ 
                                body_template: newBodyTemplate,
                                // Also update legacy code field for backward compatibility if needed
                                code: val 
                              });
                            }}
                            language={langLower}
                            placeholder={lang === 'JavaScript' 
                              ? `function solution(input) {\n  // Write your code here\n  \n}`
                              : lang === 'Python'
                              ? `def solution(input):\n    # Write your code here\n    pass`
                              : `// Write your code here`
                            }
                            height={250}
                            className="rounded-md border border-gray-200"
                            disabled={readOnly}
                            showLanguageSelector={false}
                            showActionButtons={false}
                          />
                        </div>

                        {/* TAIL */}
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            TAIL - Appended to student code (hidden)
                          </Label>
                          <CodeEditor
                            value={(question.tail && typeof question.tail === 'object' ? question.tail[langLower] : '') || ''}
                            onChange={(val) => {
                              const newTail = { ...(question.tail || {}) };
                              newTail[langLower] = val;
                              onUpdate({ tail: newTail });
                            }}
                            language={langLower}
                            placeholder={`// Code that runs after student's solution\n// Example: test runner, output, etc.`}
                            height={150}
                            className="rounded-md border border-gray-200"
                            disabled={readOnly}
                            showLanguageSelector={false}
                            showActionButtons={false}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Test Cases */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Test Cases</Label>
                  {!readOnly && (
                    <Button onClick={addTestCase} size="sm" variant="outline" className="h-8">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Test Case
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {(question.testCases || []).map((tc, tcIdx) => (
                    <div key={tc.id || tcIdx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label className="text-xs text-gray-500 mb-1 block">Input</Label>
                          <Textarea
                            value={tc.input}
                            onChange={(e) => {
                              const newTestCases = [...(question.testCases || [])];
                              newTestCases[tcIdx] = { ...tc, input: e.target.value };
                              onUpdate({ testCases: newTestCases });
                            }}
                            rows={2}
                            className="font-mono text-xs bg-white"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500 mb-1 block">Expected Output</Label>
                          <Textarea
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const newTestCases = [...(question.testCases || [])];
                              newTestCases[tcIdx] = { ...tc, expectedOutput: e.target.value };
                              onUpdate({ testCases: newTestCases });
                            }}
                            rows={2}
                            className="font-mono text-xs bg-white"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={tc.isHidden}
                              onCheckedChange={(checked) => {
                                const newTestCases = [...(question.testCases || [])];
                                newTestCases[tcIdx] = { ...tc, isHidden: checked };
                                onUpdate({ testCases: newTestCases });
                              }}
                              disabled={readOnly}
                            />
                            <Label className="text-xs text-gray-600">Hidden</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Weight:</Label>
                            <Input
                              type="number"
                              min="0"
                              value={tc.weight || 1}
                              onChange={(e) => {
                                const newTestCases = [...(question.testCases || [])];
                                newTestCases[tcIdx] = { ...tc, weight: parseInt(e.target.value) || 1 };
                                onUpdate({ testCases: newTestCases });
                              }}
                              className="w-16 h-7 text-xs text-center"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                        {!readOnly && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newTestCases = (question.testCases || []).filter((_, i) => i !== tcIdx);
                              onUpdate({ testCases: newTestCases });
                            }}
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
